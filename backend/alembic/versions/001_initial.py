"""initial

Revision ID: 001_initial
Revises: 
Create Date: 2024-02-14 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # We enable pgcrypto to ensure gen_random_uuid() is available
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    
    op.create_table('price_cache',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('ticker', sa.String(length=20), nullable=False),
        sa.Column('price_date', sa.Date(), nullable=False),
        sa.Column('open_price', sa.Numeric(precision=15, scale=4), nullable=True),
        sa.Column('high_price', sa.Numeric(precision=15, scale=4), nullable=True),
        sa.Column('low_price', sa.Numeric(precision=15, scale=4), nullable=True),
        sa.Column('close_price', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('volume', sa.BigInteger(), nullable=True),
        sa.Column('cached_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('ticker', 'price_date', name='uix_ticker_price_date')
    )

    op.create_table('transactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('ticker', sa.String(length=20), nullable=False),
        sa.Column('transaction_type', sa.String(length=4), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('price', sa.Numeric(precision=15, scale=4), nullable=False),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint("price > 0", name='check_price_positive'),
        sa.CheckConstraint("quantity > 0", name='check_quantity_positive'),
        sa.CheckConstraint("transaction_type IN ('BUY', 'SELL')", name='check_transaction_type'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transactions_date'), 'transactions', ['transaction_date'], unique=False)
    op.create_index(op.f('ix_transactions_ticker'), 'transactions', ['ticker'], unique=False)
    op.create_index(op.f('ix_transactions_user_id'), 'transactions', ['user_id'], unique=False)

def downgrade() -> None:
    op.drop_index(op.f('ix_transactions_user_id'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_ticker'), table_name='transactions')
    op.drop_index(op.f('ix_transactions_date'), table_name='transactions')
    op.drop_table('transactions')
    op.drop_table('price_cache')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
