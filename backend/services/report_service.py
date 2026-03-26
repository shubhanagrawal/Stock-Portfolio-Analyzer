import pandas as pd
import io
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.transaction import Transaction
from services.portfolio_engine import PortfolioEngine

async def generate_csv_report(db: AsyncSession, user_id: str) -> str:
    # Fetch transactions
    query = select(Transaction).where(Transaction.user_id == user_id).order_by(Transaction.transaction_date)
    result = await db.execute(query)
    transactions = result.scalars().all()
    
    if not transactions:
        return ""
        
    engine = PortfolioEngine()
    risk = await engine.compute_risk(db, user_id)
    
    records = []
    # Build CSV Records
    # Format: Date, Ticker, Type, Quantity, Price, Value at date, Cumulative Return %, Portfolio Sharpe, Portfolio Volatility
    for t in transactions:
        val_at_date = float(t.quantity) * float(t.price)
        records.append({
            "Date": t.transaction_date.strftime('%Y-%m-%d'),
            "Ticker": t.ticker,
            "Type": t.transaction_type,
            "Quantity": float(t.quantity),
            "Price": float(t.price),
            "Value at date": val_at_date,
            "Cumulative Return %": "", # Could be complex to calc per transaction date, leaving blank or placeholder
            "Portfolio Sharpe": risk.get('sharpe_ratio', ''),
            "Portfolio Volatility": risk.get('volatility_annual', '')
        })
        
    df = pd.DataFrame(records)
    output = io.StringIO()
    df.to_csv(output, index=False)
    return output.getvalue()
