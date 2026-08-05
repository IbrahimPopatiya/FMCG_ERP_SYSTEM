"""drop igst columns from sales_orders, sales_order_items, purchases, purchase_items, invoices

Revision ID: e1f2a3b4c5d6
Revises: d5e6f7a8b9c0
Create Date: 2026-08-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1f2a3b4c5d6'
down_revision: Union[str, Sequence[str], None] = 'd5e6f7a8b9c0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLES = ['sales_orders', 'sales_order_items', 'purchases', 'purchase_items', 'invoices']


def upgrade() -> None:
    """Upgrade schema."""
    for table in TABLES:
        op.drop_column(table, 'igst')


def downgrade() -> None:
    """Downgrade schema."""
    for table in TABLES:
        op.add_column(table, sa.Column('igst', sa.Numeric(precision=12, scale=2), nullable=False, server_default='0'))
        op.alter_column(table, 'igst', server_default=None)
