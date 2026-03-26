import uuid
from sqlalchemy import Column, String, Numeric, Date, BigInteger, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from database import Base

class PriceCache(Base):
    __tablename__ = "price_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticker = Column(String(20), nullable=False)
    price_date = Column(Date, nullable=False)
    open_price = Column(Numeric(15, 4), nullable=True)
    high_price = Column(Numeric(15, 4), nullable=True)
    low_price = Column(Numeric(15, 4), nullable=True)
    close_price = Column(Numeric(15, 4), nullable=False)
    volume = Column(BigInteger, nullable=True)
    cached_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("ticker", "price_date", name="uix_ticker_price_date"),
    )
