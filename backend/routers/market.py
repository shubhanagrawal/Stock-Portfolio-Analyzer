from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta
from typing import List

from dependencies import get_db
from dependencies import get_current_user
from models.user import User
from services.market_service import get_prices, search_ticker

router = APIRouter()

@router.get("/prices/{ticker}")
async def fetch_prices(
    ticker: str,
    from_date: date = Query(default_factory=lambda: date.today() - timedelta(days=30)),
    to_date: date = Query(default_factory=date.today),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    df = await get_prices(db, ticker.upper(), from_date, to_date)
    if df.empty:
        return []
    
    # Return as list of dicts
    records = []
    for idx, row in df.iterrows():
        records.append({
            "date": idx.strftime('%Y-%m-%d'),
            "close": float(row['close'])
        })
    return records

@router.get("/search")
async def query_ticker(
    q: str,
    current_user: User = Depends(get_current_user)
):
    return await search_ticker(q)
