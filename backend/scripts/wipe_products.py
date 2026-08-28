from sqlalchemy import create_engine, text

url = open(".env").read().split("DATABASE_URL=")[1].splitlines()[0]
engine = create_engine(url)

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
