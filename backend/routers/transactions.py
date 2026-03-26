from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import date, datetime
from uuid import UUID
import csv
import io

from dependencies import get_db
from dependencies import get_current_user
from models.user import User
from models.transaction import Transaction
from schemas.transaction import TransactionCreate, TransactionUpdate, TransactionOut

router = APIRouter()

@router.post("", response_model=TransactionOut, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    txn: TransactionCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # If SELL, verify holding quantity
    if txn.transaction_type == 'SELL':
        query = select(Transaction).where(
            Transaction.user_id == current_user.id,
            Transaction.ticker == txn.ticker
        )
        result = await db.execute(query)
        existing = result.scalars().all()
        
        held_qty = sum([float(t.quantity) if t.transaction_type == 'BUY' else -float(t.quantity) for t in existing])
        if held_qty < txn.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient holdings for SELL. Current held: {held_qty}")

    db_txn = Transaction(**txn.model_dump(), user_id=current_user.id)
    db.add(db_txn)
    await db.commit()
    await db.refresh(db_txn)
    return db_txn

@router.get("", response_model=dict)
async def list_transactions(
    ticker: Optional[str] = None,
    type: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Transaction).where(Transaction.user_id == current_user.id)
    
    if ticker:
        query = query.where(Transaction.ticker == ticker.upper())
    if type:
        query = query.where(Transaction.transaction_type == type.upper())
    if from_date:
        query = query.where(Transaction.transaction_date >= from_date)
    if to_date:
        query = query.where(Transaction.transaction_date <= to_date)
        
    query = query.order_by(Transaction.transaction_date.desc())
    result = await db.execute(query)
    txns = result.scalars().all()
    
    return {
        "transactions": [
            {
                "id": str(t.id),
                "user_id": str(t.user_id),
                "ticker": t.ticker,
                "transaction_type": t.transaction_type,
                "quantity": float(t.quantity),
                "price": float(t.price),
                "transaction_date": t.transaction_date.isoformat(),
                "notes": t.notes,
            }
            for t in txns
        ],
        "total": len(txns)
    }

@router.put("/{id}", response_model=TransactionOut)
async def update_transaction(
    id: UUID,
    txn_update: TransactionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Transaction).where(Transaction.id == id, Transaction.user_id == current_user.id)
    result = await db.execute(query)
    db_txn = result.scalar_one_or_none()
    
    if not db_txn:
        raise HTTPException(status_code=404, detail="Transaction not found or not owned by user")
        
    update_data = txn_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_txn, key, value)
        
    await db.commit()
    await db.refresh(db_txn)
    return db_txn

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Transaction).where(Transaction.id == id, Transaction.user_id == current_user.id)
    result = await db.execute(query)
    db_txn = result.scalar_one_or_none()
    
    if not db_txn:
        raise HTTPException(status_code=404, detail="Transaction not found or not owned by user")
        
    await db.delete(db_txn)
    await db.commit()
    return None

@router.post("/import", status_code=status.HTTP_201_CREATED)
async def import_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Import transactions from CSV. Expected columns: date, ticker, type, quantity, price"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    content = await file.read()
    text = content.decode('utf-8')
    reader = csv.DictReader(io.StringIO(text))

    created = 0
    errors = []

    for i, row in enumerate(reader, start=2):
        try:
            # Normalize column names (lowercase, strip)
            row = {k.strip().lower(): v.strip() for k, v in row.items()}

            ticker = row.get('ticker', row.get('symbol', '')).upper()
            txn_type = row.get('type', row.get('transaction_type', '')).upper()
            if txn_type not in ('BUY', 'SELL'):
                errors.append(f"Row {i}: Invalid type '{txn_type}'")
                continue

            qty = float(row.get('quantity', row.get('qty', 0)))
            price = float(row.get('price', 0))

            # Parse date flexibly
            date_str = row.get('date', row.get('transaction_date', ''))
            for fmt in ('%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%m/%d/%Y'):
                try:
                    txn_date = datetime.strptime(date_str, fmt).date()
                    break
                except ValueError:
                    continue
            else:
                errors.append(f"Row {i}: Cannot parse date '{date_str}'")
                continue

            if qty <= 0 or price <= 0:
                errors.append(f"Row {i}: Quantity and price must be positive")
                continue

            db_txn = Transaction(
                ticker=ticker, transaction_type=txn_type,
                quantity=qty, price=price, transaction_date=txn_date,
                notes=row.get('notes', None),
                user_id=current_user.id
            )
            db.add(db_txn)
            created += 1

        except Exception as e:
            errors.append(f"Row {i}: {str(e)}")

    if created > 0:
        await db.commit()

    return {"imported": created, "errors": errors}
