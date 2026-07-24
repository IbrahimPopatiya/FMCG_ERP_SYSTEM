"""add customer ownership, category and document fields

Revision ID: e5a1c9d3f7b8
Revises: d4e9a2c7f1b3
Create Date: 2026-07-23 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5a1c9d3f7b8'
down_revision: Union[str, Sequence[str], None] = 'd4e9a2c7f1b3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('customers', sa.Column('created_by_user_id', sa.UUID(), nullable=True))
    op.add_column('customers', sa.Column('is_private', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('customers', sa.Column('category', sa.String(length=20), nullable=False, server_default='retail'))
    op.add_column('customers', sa.Column('pan_number', sa.String(length=20), nullable=True))
    op.add_column('customers', sa.Column('shop_photo_url', sa.String(length=500), nullable=True))
    op.add_column('customers', sa.Column('gst_document_url', sa.String(length=500), nullable=True))
    op.add_column('customers', sa.Column('pan_document_url', sa.String(length=500), nullable=True))
    op.create_foreign_key(
        'fk_customers_created_by_user_id', 'customers', 'users', ['created_by_user_id'], ['id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_customers_created_by_user_id', 'customers', type_='foreignkey')
    op.drop_column('customers', 'pan_document_url')
    op.drop_column('customers', 'gst_document_url')
    op.drop_column('customers', 'shop_photo_url')
    op.drop_column('customers', 'pan_number')
    op.drop_column('customers', 'category')
    op.drop_column('customers', 'is_private')
    op.drop_column('customers', 'created_by_user_id')
