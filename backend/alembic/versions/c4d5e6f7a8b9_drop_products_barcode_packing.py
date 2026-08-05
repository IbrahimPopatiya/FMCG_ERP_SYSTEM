"""drop products.barcode and products.packing

Revision ID: c4d5e6f7a8b9
Revises: b2c3d4e5f6a7
Create Date: 2026-08-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4d5e6f7a8b9'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column('products', 'barcode')
    op.drop_column('products', 'packing')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('products', sa.Column('packing', sa.String(length=50), nullable=False, server_default=''))
    op.add_column('products', sa.Column('barcode', sa.String(length=80), nullable=False, server_default=''))
    op.alter_column('products', 'packing', server_default=None)
    op.alter_column('products', 'barcode', server_default=None)
