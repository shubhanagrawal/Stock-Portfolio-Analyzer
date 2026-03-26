import uuid
from sqlalchemy import Column, String, Numeric, Date, Text, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    ticker = Column(String(20), index=True, nullable=False)
    transaction_type = Column(String(4), nullable=False) # 'BUY' or 'SELL'
    quantity = Column(Numeric(15, 4), nullable=False)
    price = Column(Numeric(15, 4), nullable=False)
    transaction_date = Column(Date, index=True, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("transaction_type IN ('BUY', 'SELL')", name="check_transaction_type"),
        CheckConstraint("quantity > 0", name="check_quantity_positive"),
        CheckConstraint("price > 0", name="check_price_positive"),
    )
