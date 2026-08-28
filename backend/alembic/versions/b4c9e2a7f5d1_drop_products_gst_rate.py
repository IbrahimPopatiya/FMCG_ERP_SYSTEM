"""drop gst_rate from products

Revision ID: b4c9e2a7f5d1
Revises: a3f6d1c8b4e2
Create Date: 2026-08-28 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b4c9e2a7f5d1'
down_revision: Union[str, Sequence[str], None] = 'a3f6d1c8b4e2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_column('products', 'gst_rate')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('products', sa.Column('gst_rate', sa.Numeric(precision=5, scale=2), nullable=False, server_default='0'))
    op.alter_column('products', 'gst_rate', server_default=None)
