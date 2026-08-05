"""add loading_capacity to products

Revision ID: d5e6f7a8b9c0
Revises: c4d5e6f7a8b9
Create Date: 2026-08-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd5e6f7a8b9c0'
down_revision: Union[str, Sequence[str], None] = 'c4d5e6f7a8b9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'products',
        sa.Column('loading_capacity', sa.Integer(), nullable=False, server_default='0'),
    )
    op.alter_column('products', 'loading_capacity', server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('products', 'loading_capacity')
