"""add posts table

Revision ID: a1b2c3d4e5f6
Revises: d4e9a2c7f1b3
Create Date: 2026-07-30 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'd4e9a2c7f1b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'posts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('product_id', sa.UUID(), nullable=False),
        sa.Column('image', sa.String(length=255), nullable=True),
        sa.Column('product_name', sa.String(length=200), nullable=False),
        sa.Column('price', sa.Numeric(12, 2), nullable=False),
        sa.Column('mrp', sa.Numeric(12, 2), nullable=False),
        sa.Column('quantity_in_box', sa.Integer(), nullable=False),
        sa.Column('created_by', sa.UUID(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.ForeignKeyConstraint(['created_by'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('posts')
