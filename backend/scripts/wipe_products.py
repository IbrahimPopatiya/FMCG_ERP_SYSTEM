from sqlalchemy import create_engine, text

from app.core.config import settings
from scripts.local_only import require_local_database

require_local_database()
engine = create_engine(settings.database_url)

with engine.begin() as conn:
    conn.execute(text("""
        TRUNCATE TABLE
            payments, invoices, deliveries, return_items, returns,
            sales_order_items, sales_orders, purchase_items, purchases,
            inventory_movements, inventory, saved_products, posts, price_list_items,
            products
        RESTART IDENTITY CASCADE
    """))

with engine.connect() as conn:
    print("products count now:", conn.execute(text("SELECT COUNT(*) FROM products")).scalar())
