"""add performance indexes on foreign keys, status columns, and search fields

Revision ID: e5f6a7b8c9d0
Revises: a1b2c3d4e5f6
Create Date: 2026-07-30 09:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f6a7b8c9d0'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# Foreign keys that get filtered/joined on in hot paths but have no index
# today (Postgres only auto-indexes primary keys and UNIQUE constraints).
FOREIGN_KEY_INDEXES = [
    ("ix_sales_order_items_sales_order_id", "sales_order_items", "sales_order_id"),
    ("ix_purchase_items_purchase_id", "purchase_items", "purchase_id"),
    ("ix_return_items_return_id", "return_items", "return_id"),
    ("ix_payments_invoice_id", "payments", "invoice_id"),
    ("ix_sales_orders_customer_id", "sales_orders", "customer_id"),
    ("ix_customers_route_id", "customers", "route_id"),
    ("ix_customers_price_list_id", "customers", "price_list_id"),
    ("ix_routes_salesman_id", "routes", "salesman_id"),
    ("ix_products_category_id", "products", "category_id"),
    ("ix_products_brand_id", "products", "brand_id"),
    ("ix_inventory_movements_warehouse_id", "inventory_movements", "warehouse_id"),
    ("ix_inventory_movements_product_id", "inventory_movements", "product_id"),
    ("ix_inventory_movements_reference_id", "inventory_movements", "reference_id"),
    ("ix_returns_invoice_id", "returns", "invoice_id"),
]

# Status-like columns filtered on almost every list/catalog query.
STATUS_INDEXES = [
    ("ix_products_status", "products", "status"),
    ("ix_sales_orders_status", "sales_orders", "status"),
    ("ix_invoices_payment_status", "invoices", "payment_status"),
    ("ix_deliveries_status", "deliveries", "status"),
    ("ix_purchases_status", "purchases", "status"),
    ("ix_returns_status", "returns", "status"),
    ("ix_credit_notes_status", "credit_notes", "status"),
    ("ix_payments_status", "payments", "status"),
    ("ix_customers_status", "customers", "status"),
]

# Soft-delete filter (`deleted_at IS NULL`) appears on almost every read
# query - a partial index only covering "not deleted" rows keeps it small
# and fast on the tables with the most rows.
SOFT_DELETE_PARTIAL_INDEXES = [
    ("ix_products_not_deleted", "products"),
    ("ix_customers_not_deleted", "customers"),
    ("ix_sales_orders_not_deleted", "sales_orders"),
]

# Free-text search columns (`ILIKE '%term%'`) can't use a normal index -
# they need a trigram (pg_trgm) GIN index instead.
TRIGRAM_INDEXES = [
    ("ix_products_name_trgm", "products", "name"),
    ("ix_products_sku_trgm", "products", "sku"),
    ("ix_customers_business_name_trgm", "customers", "business_name"),
    ("ix_customers_owner_name_trgm", "customers", "owner_name"),
    ("ix_customers_mobile_trgm", "customers", "mobile"),
    ("ix_customers_customer_code_trgm", "customers", "customer_code"),
]


def upgrade() -> None:
    """Upgrade schema."""
    for index_name, table, column in FOREIGN_KEY_INDEXES:
        op.create_index(index_name, table, [column])

    for index_name, table, column in STATUS_INDEXES:
        op.create_index(index_name, table, [column])

    for index_name, table in SOFT_DELETE_PARTIAL_INDEXES:
        op.create_index(
            index_name, table, ["deleted_at"], postgresql_where=sa.text("deleted_at IS NULL")
        )

    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    for index_name, table, column in TRIGRAM_INDEXES:
        op.execute(
            f"CREATE INDEX {index_name} ON {table} USING gin ({column} gin_trgm_ops)"
        )


def downgrade() -> None:
    """Downgrade schema."""
    for index_name, _, _ in TRIGRAM_INDEXES:
        op.execute(f"DROP INDEX IF EXISTS {index_name}")

    for index_name, table in SOFT_DELETE_PARTIAL_INDEXES:
        op.drop_index(index_name, table_name=table)

    for index_name, table, _ in STATUS_INDEXES:
        op.drop_index(index_name, table_name=table)

    for index_name, table, _ in FOREIGN_KEY_INDEXES:
        op.drop_index(index_name, table_name=table)
