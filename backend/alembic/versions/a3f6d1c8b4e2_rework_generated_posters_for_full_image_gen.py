"""rework generated posters for full image gen

Revision ID: a3f6d1c8b4e2
Revises: e1f2a3b4c5d6
Create Date: 2026-08-25 00:00:00.000000

Recreated stub: the original migration file was never committed to git, but
its revision id was already stamped on the production database (the poster
AI feature is a stateless image-generation service with no DB-backed model,
so there is no schema change to reapply here).
"""
from typing import Sequence, Union


# revision identifiers, used by Alembic.
revision: str = 'a3f6d1c8b4e2'
down_revision: Union[str, Sequence[str], None] = 'e1f2a3b4c5d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
