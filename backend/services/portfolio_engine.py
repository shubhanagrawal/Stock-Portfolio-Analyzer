import pandas as pd
import numpy as np
import math
import asyncio
from datetime import date, timedelta
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.transaction import Transaction
from services.market_service import get_prices, get_current_price
import logging
import yfinance as yf

logger = logging.getLogger(__name__)

# ── Sector cache (avoid repeated yfinance lookups) ──────────────────────────
_sector_cache: Dict[str, str] = {}

def _safe_float(val, default=0.0):
    """Sanitize a float for JSON: replace inf/nan with default."""
    if val is None:
        return default
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return round(f, 6)
    except (TypeError, ValueError):
        return default


async def _get_sector(ticker: str) -> str:
    """Get sector for a ticker from yfinance, with caching."""
    if ticker in _sector_cache:
        return _sector_cache[ticker]
    try:
        t = await asyncio.to_thread(lambda: yf.Ticker(ticker).info)
        sector = t.get('sector', 'Unknown')
        _sector_cache[ticker] = sector
        return sector
    except Exception:
        _sector_cache[ticker] = 'Unknown'
        return 'Unknown'


class PortfolioEngine:
    RISK_FREE_RATE = 0.06  # 6% annual, India
    TRADING_DAYS = 252

    # ── Helpers ──────────────────────────────────────────────────────────

    async def _get_holdings(self, db: AsyncSession, user_id: str) -> dict:
        """Returns {ticker: {quantity, total_cost}} for active holdings."""
        query = select(Transaction).where(Transaction.user_id == user_id).order_by(Transaction.transaction_date)
        result = await db.execute(query)
        transactions = result.scalars().all()

        holdings = {}
        for t in transactions:
            ticker = t.ticker
            if ticker not in holdings:
                holdings[ticker] = {"quantity": 0.0, "total_cost": 0.0}
            qty = float(t.quantity)
            price = float(t.price)
            if t.transaction_type == 'BUY':
                holdings[ticker]["quantity"] += qty
                holdings[ticker]["total_cost"] += qty * price
            elif t.transaction_type == 'SELL':
                holdings[ticker]["quantity"] -= qty
                if holdings[ticker]["quantity"] < 0:
                    holdings[ticker]["quantity"] = 0
        return {k: v for k, v in holdings.items() if v["quantity"] > 1e-6}

    async def _build_portfolio_timeseries(self, db, user_id, from_date, to_date):
        query = select(Transaction).where(Transaction.user_id == user_id).order_by(Transaction.transaction_date)
        result = await db.execute(query)
        transactions = result.scalars().all()

        if not transactions:
            return pd.Series(dtype=float)

        tickers = list(set([t.ticker for t in transactions]))

        price_dfs = []
        for ticker in tickers:
            df = await get_prices(db, ticker, from_date, to_date)
            if not df.empty:
                df = df.rename(columns={'close': ticker})
                price_dfs.append(df)

        if not price_dfs:
            return pd.Series(dtype=float)

        prices = pd.concat(price_dfs, axis=1).ffill().fillna(0)
        holdings_matrix = pd.DataFrame(0.0, index=prices.index, columns=tickers)

        for t in transactions:
            t_date = pd.Timestamp(t.transaction_date)
            if t_date > pd.Timestamp(to_date):
                continue
            qty = float(t.quantity) if t.transaction_type == 'BUY' else -float(t.quantity)
            if t_date < pd.Timestamp(from_date):
                holdings_matrix.loc[:, t.ticker] += qty
            else:
                valid_dates = holdings_matrix.index[holdings_matrix.index >= t_date]
                if not valid_dates.empty:
                    holdings_matrix.loc[valid_dates, t.ticker] += qty

        holdings_matrix = holdings_matrix.clip(lower=0)
        portfolio_val = (holdings_matrix * prices).sum(axis=1)
        return portfolio_val

    async def _build_per_ticker_returns(self, db, user_id, from_date, to_date) -> pd.DataFrame:
        """Returns DataFrame where each column = ticker daily returns."""
        query = select(Transaction).where(Transaction.user_id == user_id)
        result = await db.execute(query)
        transactions = result.scalars().all()
        tickers = list(set([t.ticker for t in transactions]))

        dfs = {}
        for ticker in tickers:
            df = await get_prices(db, ticker, from_date, to_date)
            if not df.empty:
                dfs[ticker] = df['close']

        if not dfs:
            return pd.DataFrame()

        prices = pd.DataFrame(dfs).ffill().dropna()
        returns = prices.pct_change().dropna()
        # Filter extreme returns
        returns = returns[(returns.abs() < 1.0).all(axis=1)]
        return returns

    # ── Core Endpoints ───────────────────────────────────────────────────

    async def compute_summary(self, db: AsyncSession, user_id: str) -> dict:
        holdings = await self._get_holdings(db, user_id)

        if not holdings:
            return {
                "total_invested": 0.0, "current_value": 0.0,
                "profit_loss": 0.0, "return_pct": 0.0, "holdings": []
            }

        total_invested = 0.0
        current_value = 0.0
        holdings_out = []

        for ticker, data in holdings.items():
            qty = data["quantity"]
            avg_price = data["total_cost"] / qty if qty > 0 else 0.0
            total_invested += data["total_cost"]

            current_price = await get_current_price(db, ticker)
            val = qty * current_price
            current_value += val
            ret_pct = ((current_price - avg_price) / avg_price) if avg_price > 0 else 0.0

            holdings_out.append({
                "ticker": ticker,
                "quantity": _safe_float(qty),
                "avg_buy_price": _safe_float(avg_price),
                "current_price": _safe_float(current_price),
                "value": _safe_float(val),
                "return_pct": _safe_float(ret_pct)
            })

        profit_loss = current_value - total_invested
        return_pct = (profit_loss / total_invested) if total_invested > 0 else 0.0

        return {
            "total_invested": _safe_float(total_invested),
            "current_value": _safe_float(current_value),
            "profit_loss": _safe_float(profit_loss),
            "return_pct": _safe_float(return_pct),
            "holdings": holdings_out
        }

    async def compute_performance(self, db: AsyncSession, user_id: str, from_date: date, to_date: date) -> dict:
        port_vals = await self._build_portfolio_timeseries(db, user_id, from_date, to_date)
        if port_vals.empty:
            return {"portfolio": [], "benchmark": [], "alpha": None, "correlation": None}

        bench_df = await get_prices(db, "^NSEI", from_date, to_date)
        bench_vals = bench_df['close'] if not bench_df.empty else pd.Series(100.0, index=port_vals.index)

        df = pd.DataFrame({'portfolio': port_vals, 'benchmark': bench_vals}).dropna()
        if df.empty or df['portfolio'].iloc[0] == 0 or df['benchmark'].iloc[0] == 0:
            return {"portfolio": [], "benchmark": [], "alpha": None, "correlation": None}

        p_start, b_start = df['portfolio'].iloc[0], df['benchmark'].iloc[0]
        df['port_norm'] = (df['portfolio'] / p_start) * 100
        df['bench_norm'] = (df['benchmark'] / b_start) * 100
        df['port_ret'] = df['portfolio'].pct_change().fillna(0)
        df['bench_ret'] = df['benchmark'].pct_change().fillna(0)
        df['port_cum'] = (1 + df['port_ret']).cumprod() - 1
        df['bench_cum'] = (1 + df['bench_ret']).cumprod() - 1
        rolling_max = df['portfolio'].cummax()
        df['drawdown'] = (df['portfolio'] - rolling_max) / rolling_max

        alpha = df['port_cum'].iloc[-1] - df['bench_cum'].iloc[-1]
        corr = df['port_ret'].corr(df['bench_ret'])
        if pd.isna(corr):
            corr = 0.0

        p_list, b_list = [], []
        for idx, row in df.iterrows():
            ds = idx.strftime('%Y-%m-%d')
            p_list.append({"date": ds, "value": _safe_float(row['port_norm']),
                           "daily_return": _safe_float(row['port_ret']),
                           "cumulative_return": _safe_float(row['port_cum']),
                           "drawdown": _safe_float(row['drawdown'])})
            b_list.append({"date": ds, "value": _safe_float(row['bench_norm']),
                           "daily_return": _safe_float(row['bench_ret']),
                           "cumulative_return": _safe_float(row['bench_cum'])})

        return {"portfolio": p_list, "benchmark": b_list,
                "alpha": _safe_float(alpha), "correlation": _safe_float(corr)}

    async def compute_risk(self, db: AsyncSession, user_id: str) -> dict:
        summary = await self.compute_summary(db, user_id)
        if summary['total_invested'] == 0:
            return {
                "sharpe_ratio": None, "sortino_ratio": None, "beta": None,
                "var_95": None, "volatility_annual": None, "max_drawdown": None,
                "max_drawdown_period": {"start": None, "end": None},
                "concentration": [], "alerts": []
            }

        end = date.today()
        start = end - timedelta(days=365)
        port_vals = await self._build_portfolio_timeseries(db, user_id, start, end)

        # Trim leading zeros
        nonzero = port_vals[port_vals > 0]
        if not nonzero.empty:
            port_vals = port_vals.loc[nonzero.index[0]:]

        sharpe = sortino = beta = var_95 = volatility_annual = max_drawdown = None
        max_dd_period = {"start": None, "end": None}

        if len(port_vals) >= 5:
            daily_returns = port_vals.pct_change().dropna()
            daily_returns = daily_returns[daily_returns.abs() < 1.0]

            if len(daily_returns) >= 5:
                mean_ret = daily_returns.mean()
                std_ret = daily_returns.std()

                # Sharpe
                if std_ret > 0:
                    sharpe = (mean_ret - self.RISK_FREE_RATE / self.TRADING_DAYS) / std_ret * math.sqrt(self.TRADING_DAYS)
                    volatility_annual = std_ret * math.sqrt(self.TRADING_DAYS)
                else:
                    sharpe = 0.0
                    volatility_annual = 0.0

                # Sortino — only downside deviation
                downside = daily_returns[daily_returns < 0]
                downside_std = downside.std() if len(downside) > 1 else 0.0
                if downside_std > 0:
                    sortino = (mean_ret - self.RISK_FREE_RATE / self.TRADING_DAYS) / downside_std * math.sqrt(self.TRADING_DAYS)
                else:
                    sortino = 0.0

                # VaR 95% (historical)
                var_95 = float(np.percentile(daily_returns, 5))

                # Beta vs NIFTY 50
                bench_df = await get_prices(db, "^NSEI", start, end)
                if not bench_df.empty:
                    bench_ret = bench_df['close'].pct_change().dropna()
                    aligned = pd.DataFrame({'port': daily_returns, 'bench': bench_ret}).dropna()
                    if len(aligned) > 5:
                        cov = aligned['port'].cov(aligned['bench'])
                        var_bench = aligned['bench'].var()
                        beta = cov / var_bench if var_bench > 0 else 0.0

            # Max Drawdown
            rolling_max = port_vals.cummax()
            drawdowns = (port_vals - rolling_max) / rolling_max
            max_drawdown = drawdowns.min()
            if max_drawdown < 0:
                end_idx = drawdowns.idxmin()
                start_idx = port_vals.loc[:end_idx].idxmax()
                max_dd_period = {"start": start_idx.strftime('%Y-%m-%d'), "end": end_idx.strftime('%Y-%m-%d')}

        # Concentration
        total_val = summary['current_value']
        concentration = []
        for h in summary['holdings']:
            w = h['value'] / total_val if total_val > 0 else 0
            concentration.append({"ticker": h['ticker'], "weight_pct": _safe_float(w * 100)})

        # Alerts
        alerts = []
        if concentration:
            max_conc = max(concentration, key=lambda x: x['weight_pct'])
            if max_conc['weight_pct'] > 40:
                alerts.append({"type": "Overexposed",
                               "message": f"{max_conc['ticker']} is {max_conc['weight_pct']:.0f}% of portfolio",
                               "severity": "high"})
        if volatility_annual is not None and volatility_annual > 0.30:
            alerts.append({"type": "High Volatility",
                           "message": f"Portfolio annualized volatility is {volatility_annual:.0%}",
                           "severity": "medium"})
        if sharpe is not None and sharpe < 0.5:
            alerts.append({"type": "Poor Risk-Adjusted Return",
                           "message": f"Sharpe ratio is {sharpe:.2f}", "severity": "low"})

        return {
            "sharpe_ratio": _safe_float(sharpe) if sharpe is not None else None,
            "sortino_ratio": _safe_float(sortino) if sortino is not None else None,
            "beta": _safe_float(beta) if beta is not None else None,
            "var_95": _safe_float(var_95) if var_95 is not None else None,
            "volatility_annual": _safe_float(volatility_annual) if volatility_annual is not None else None,
            "max_drawdown": _safe_float(max_drawdown) if max_drawdown is not None else None,
            "max_drawdown_period": max_dd_period,
            "concentration": concentration,
            "alerts": alerts
        }

    # ── NEW: Correlation Matrix ──────────────────────────────────────────

    async def compute_correlation(self, db: AsyncSession, user_id: str) -> dict:
        end = date.today()
        start = end - timedelta(days=180)
        returns = await self._build_per_ticker_returns(db, user_id, start, end)

        if returns.empty or returns.shape[1] < 2:
            return {"tickers": [], "matrix": []}

        corr = returns.corr()
        tickers = list(corr.columns)
        matrix = []
        for i, t1 in enumerate(tickers):
            row = []
            for j, t2 in enumerate(tickers):
                row.append(_safe_float(corr.iloc[i, j]))
            matrix.append(row)

        return {"tickers": tickers, "matrix": matrix}

    # ── NEW: Sector Allocation ───────────────────────────────────────────

    async def compute_sectors(self, db: AsyncSession, user_id: str) -> dict:
        summary = await self.compute_summary(db, user_id)
        if not summary['holdings']:
            return {"sectors": []}

        sector_values: Dict[str, float] = {}
        for h in summary['holdings']:
            sector = await _get_sector(h['ticker'])
            sector_values[sector] = sector_values.get(sector, 0) + h['value']

        total = sum(sector_values.values())
        sectors = [
            {"sector": s, "value": _safe_float(v), "weight_pct": _safe_float((v / total) * 100 if total > 0 else 0)}
            for s, v in sorted(sector_values.items(), key=lambda x: -x[1])
        ]
        return {"sectors": sectors}

    # ── NEW: Rolling Metrics ─────────────────────────────────────────────

    async def compute_rolling(self, db: AsyncSession, user_id: str, window: int = 30) -> dict:
        end = date.today()
        start = end - timedelta(days=365)
        port_vals = await self._build_portfolio_timeseries(db, user_id, start, end)

        nonzero = port_vals[port_vals > 0]
        if nonzero.empty or len(nonzero) < window + 5:
            return {"dates": [], "rolling_volatility": [], "rolling_sharpe": []}

        port_vals = port_vals.loc[nonzero.index[0]:]
        daily_ret = port_vals.pct_change().dropna()
        daily_ret = daily_ret[daily_ret.abs() < 1.0]

        roll_std = daily_ret.rolling(window).std() * math.sqrt(self.TRADING_DAYS)
        roll_mean = daily_ret.rolling(window).mean()
        roll_sharpe = (roll_mean - self.RISK_FREE_RATE / self.TRADING_DAYS) / (daily_ret.rolling(window).std()) * math.sqrt(self.TRADING_DAYS)

        df = pd.DataFrame({
            'volatility': roll_std,
            'sharpe': roll_sharpe
        }).dropna()

        return {
            "dates": [idx.strftime('%Y-%m-%d') for idx in df.index],
            "rolling_volatility": [_safe_float(v) for v in df['volatility']],
            "rolling_sharpe": [_safe_float(v) for v in df['sharpe']]
        }

    # ── NEW: Return Heatmap Data ─────────────────────────────────────────

    async def compute_heatmap(self, db: AsyncSession, user_id: str) -> dict:
        end = date.today()
        start = end - timedelta(days=365)
        port_vals = await self._build_portfolio_timeseries(db, user_id, start, end)

        nonzero = port_vals[port_vals > 0]
        if nonzero.empty:
            return {"data": []}

        port_vals = port_vals.loc[nonzero.index[0]:]
        daily_ret = port_vals.pct_change().dropna()

        data = []
        for idx, val in daily_ret.items():
            data.append({
                "date": idx.strftime('%Y-%m-%d'),
                "return": _safe_float(val),
                "month": idx.strftime('%Y-%m'),
                "day": idx.day,
                "weekday": idx.weekday()
            })
        return {"data": data}
