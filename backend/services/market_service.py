import asyncio
import logging
import yfinance as yf
import pandas as pd
from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from models.price_cache import PriceCache

logger = logging.getLogger(__name__)

def _fetch_history(ticker: str, start: str, end: str) -> pd.DataFrame:
    """Synchronous yfinance fetch — runs in a thread."""
    try:
        t = yf.Ticker(ticker)
        df = t.history(start=start, end=end, auto_adjust=True)
        return df
    except Exception as e:
        logger.error(f"yfinance Ticker.history failed for {ticker}: {e}")
        return pd.DataFrame()

async def get_prices(db: AsyncSession, ticker: str, from_date: date, to_date: date) -> pd.DataFrame:
    # 1. Query cached prices
    query = select(
        PriceCache.price_date,
        PriceCache.close_price
    ).where(
        and_(
            PriceCache.ticker == ticker,
            PriceCache.price_date >= from_date,
            PriceCache.price_date <= to_date
        )
    ).order_by(PriceCache.price_date)
    result = await db.execute(query)
    cached_rows = result.all()  # list of Row tuples, NOT ORM objects

    cached_dates = {row.price_date for row in cached_rows}
    all_dates = [from_date + timedelta(days=x) for x in range((to_date - from_date).days + 1)]
    business_dates = [d for d in all_dates if d.weekday() < 5]
    missing_dates = [d for d in business_dates if d not in cached_dates]

    if missing_dates:
        fetch_start = min(missing_dates).strftime('%Y-%m-%d')
        fetch_end = (max(missing_dates) + timedelta(days=2)).strftime('%Y-%m-%d')
        try:
            logger.info(f"Fetching missing data for {ticker} from {fetch_start} to {fetch_end}")
            df = await asyncio.to_thread(_fetch_history, ticker, fetch_start, fetch_end)
            if not df.empty:
                rows_to_insert = []
                for idx, row in df.iterrows():
                    d = idx.date() if hasattr(idx, 'date') else idx
                    if d not in cached_dates:
                        try:
                            rows_to_insert.append({
                                "ticker": ticker,
                                "price_date": d,
                                "open_price": float(row.get('Open', 0)) if pd.notna(row.get('Open')) else None,
                                "high_price": float(row.get('High', 0)) if pd.notna(row.get('High')) else None,
                                "low_price": float(row.get('Low', 0)) if pd.notna(row.get('Low')) else None,
                                "close_price": float(row['Close']),
                                "volume": int(row.get('Volume', 0)) if pd.notna(row.get('Volume')) else None,
                            })
                        except Exception as e:
                            logger.error(f"Error parsing row for {ticker} on {d}: {e}")

                if rows_to_insert:
                    # Use ON CONFLICT DO NOTHING to avoid duplicate key errors
                    stmt = pg_insert(PriceCache).values(rows_to_insert)
                    stmt = stmt.on_conflict_do_nothing(constraint='uix_ticker_price_date')
                    await db.execute(stmt)
                    await db.commit()
        except Exception as e:
            logger.error(f"Failed fetching {ticker} from yfinance: {e}")
            await db.rollback()

        # Re-query from cache to get fresh data (avoids expired ORM objects)
        result = await db.execute(
            select(PriceCache.price_date, PriceCache.close_price).where(
                and_(
                    PriceCache.ticker == ticker,
                    PriceCache.price_date >= from_date,
                    PriceCache.price_date <= to_date
                )
            ).order_by(PriceCache.price_date)
        )
        cached_rows = result.all()

    # Build DataFrame from plain tuples (no ORM lazy loading issues)
    if not cached_rows:
        return pd.DataFrame(columns=['date', 'close'])

    df_data = [{'date': pd.Timestamp(row.price_date), 'close': float(row.close_price)} for row in cached_rows]
    df = pd.DataFrame(df_data)
    df = df.sort_values('date').set_index('date')
    return df

async def get_current_price(db: AsyncSession, ticker: str) -> float:
    end_date = date.today()
    start_date = end_date - timedelta(days=7)
    df = await get_prices(db, ticker, start_date, end_date)
    if not df.empty:
        return float(df.iloc[-1]['close'])
    return 0.0

async def search_ticker(query: str):
    try:
        t = await asyncio.to_thread(yf.Ticker, query)
        info = await asyncio.to_thread(lambda: t.info)
        return [{"ticker": query, "name": info.get("shortName", query), "exchange": info.get("exchange", "Unknown")}]
    except Exception:
        return []
