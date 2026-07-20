"""add customer login and order_source

Revision ID: c3d8f1a6b2e7
Revises: b7c1e4f2a9d3
Create Date: 2026-07-20 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3d8f1a6b2e7'
down_revision: Union[str, Sequence[str], None] = 'b7c1e4f2a9d3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('customers', sa.Column('password_hash', sa.String(length=255), nullable=True))
    op.add_column(
        'customers',
        sa.Column('login_enabled', sa.Boolean(), nullable=False, server_default='true'),
    )
    op.create_index(
        'ix_customers_mobile_unique',
        'customers',
        ['mobile'],
        unique=True,
        postgresql_where=sa.text('deleted_at IS NULL'),
    )
    op.add_column(
        'sales_orders',
        sa.Column('order_source', sa.String(length=20), nullable=False, server_default='salesman'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('sales_orders', 'order_source')
    op.drop_index('ix_customers_mobile_unique', table_name='customers')
    op.drop_column('customers', 'login_enabled')
    op.drop_column('customers', 'password_hash')
