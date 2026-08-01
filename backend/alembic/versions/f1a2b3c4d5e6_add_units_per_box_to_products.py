"""add units_per_box to products

Revision ID: f1a2b3c4d5e6
Revises: e5f6a7b8c9d0
Create Date: 2026-08-01 10:00:00.000000

"""
import re
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, Sequence[str], None] = 'e5f6a7b8c9d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _extract_units_per_box(packing: str) -> int:
    """Best-effort parse of an existing product's packing text into a piece
    count, for backfilling this column on rows that predate it. Handles both
    packing formats seen in this app: "12 x 500ml" (leading count) and
    "Box of 18" (post-created products). Falls back to 1 (i.e. "not sold in
    boxes, treat as single units") when nothing parseable is found - staff
    can correct this afterward via the product edit form."""
    packing = (packing or "").strip()

    leading_digit_match = re.match(r"^(\d+)", packing)
    if leading_digit_match:
        return int(leading_digit_match.group(1))

    box_of_match = re.search(r"box\s+of\s+(\d+)", packing, re.IGNORECASE)
    if box_of_match:
        return int(box_of_match.group(1))

    return 1


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        "products",
        sa.Column("units_per_box", sa.Integer(), nullable=False, server_default="1"),
    )

    connection = op.get_bind()
    rows = connection.execute(sa.text("SELECT id, packing FROM products")).fetchall()
    for row in rows:
        units = _extract_units_per_box(row.packing)
        if units != 1:
            connection.execute(
                sa.text("UPDATE products SET units_per_box = :units WHERE id = :id"),
                {"units": units, "id": row.id},
            )

    # Drop the server-side default now that existing rows are backfilled -
    # new rows go through the application, which always sets this explicitly.
    op.alter_column("products", "units_per_box", server_default=None)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("products", "units_per_box")
