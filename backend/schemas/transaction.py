from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from datetime import date
from uuid import UUID

class TransactionBase(BaseModel):
    ticker: str = Field(..., max_length=20)
    transaction_type: Literal['BUY', 'SELL']
    quantity: float = Field(..., gt=0)
    price: float = Field(..., gt=0)
    transaction_date: date
    notes: Optional[str] = None
    
    @validator('ticker')
    def uppercase_ticker(cls, v):
        return v.upper()

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    ticker: Optional[str] = Field(None, max_length=20)
    transaction_type: Optional[Literal['BUY', 'SELL']] = None
    quantity: Optional[float] = Field(None, gt=0)
    price: Optional[float] = Field(None, gt=0)
    transaction_date: Optional[date] = None
    notes: Optional[str] = None
    
    @validator('ticker')
    def uppercase_ticker(cls, v):
        if v:
            return v.upper()
        return v

class TransactionOut(TransactionBase):
    id: UUID
    user_id: UUID

    class Config:
        from_attributes = True
