"""add discount_percent to price_list_items

Revision ID: b7c1e4f2a9d3
Revises: f27d82d9eadf
Create Date: 2026-07-20 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7c1e4f2a9d3'
down_revision: Union[str, Sequence[str], None] = 'f27d82d9eadf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'price_list_items',
        sa.Column('discount_percent', sa.Numeric(5, 2), nullable=False, server_default='0'),
    )
    op.create_check_constraint(
        'ck_price_list_items_discount_percent_range',
        'price_list_items',
        'discount_percent >= 0 AND discount_percent <= 100',
    )
    op.drop_column('price_list_items', 'price')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column(
        'price_list_items',
        sa.Column('price', sa.Numeric(12, 2), nullable=False, server_default='0'),
    )
    op.drop_constraint('ck_price_list_items_discount_percent_range', 'price_list_items', type_='check')
    op.drop_column('price_list_items', 'discount_percent')
