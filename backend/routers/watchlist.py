from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List

from dependencies import get_db, get_current_user
from models.user import User
from models.watchlist import Watchlist
from services.market_service import get_current_price

router = APIRouter()

@router.get("")
async def get_watchlist(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Watchlist).where(Watchlist.user_id == current_user.id).order_by(Watchlist.added_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    watchlist = []
    for item in items:
        current_price = await get_current_price(db, item.ticker)
        watchlist.append({
            "id": str(item.id),
            "ticker": item.ticker,
            "current_price": current_price,
            "added_at": item.added_at.isoformat() if item.added_at else None
        })
    return {"watchlist": watchlist}

@router.post("", status_code=status.HTTP_201_CREATED)
async def add_to_watchlist(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ticker = data.get("ticker", "").upper()
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker is required")

    # Check if already exists
    existing = await db.execute(
        select(Watchlist).where(Watchlist.user_id == current_user.id, Watchlist.ticker == ticker)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"{ticker} already in watchlist")

    item = Watchlist(user_id=current_user.id, ticker=ticker)
    db.add(item)
    await db.commit()
    return {"message": f"{ticker} added to watchlist"}

@router.delete("/{ticker}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_from_watchlist(
    ticker: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Watchlist).where(Watchlist.user_id == current_user.id, Watchlist.ticker == ticker.upper())
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Ticker not in watchlist")
    await db.delete(item)
    await db.commit()
    return None
