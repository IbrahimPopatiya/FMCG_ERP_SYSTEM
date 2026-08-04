"""Clears the existing product catalog and everything that references it
(inventory, price-list items, feed posts, sales-order/purchase/return line
items) so a fresh catalog can be imported. Leaves users, customers, orders,
warehouses etc. untouched - only line items that pointed at a now-deleted
product are removed, the parent records (orders, purchases...) stay.

Never point this at anything but your local dev database.

Run with:
    cd backend
    source venv/bin/activate
    python -m scripts.clear_products --yes
"""

import argparse

from app.db.session import SessionLocal
import app.models  # noqa: F401 - registers all models on Base.metadata
from app.models.inventory import Inventory, InventoryMovement
from app.models.post import Post
from app.models.price_list import PriceListItem
from app.models.product import Product
from app.models.purchase import PurchaseItem
from app.models.return_ import ReturnItem
from app.models.sales_order import SalesOrderItem
from app.models.saved_product import SavedProduct

# Children before parent (Product) to satisfy foreign-key constraints.
WIPE_ORDER = [
    SavedProduct,
    ReturnItem,
    InventoryMovement,
    Inventory,
    SalesOrderItem,
    PurchaseItem,
    PriceListItem,
    Post,
    Product,
]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--yes", action="store_true", help="Skip the confirmation prompt")
    args = parser.parse_args()

    if not args.yes:
        confirm = input("This will delete ALL products and product-linked rows. Type 'yes' to continue: ")
        if confirm.strip().lower() != "yes":
            print("Aborted.")
            return

    db = SessionLocal()
    try:
        for model in WIPE_ORDER:
            deleted = db.query(model).delete()
            print(f"  {model.__tablename__}: removed {deleted} row(s)")
        db.commit()
        print("Product catalog cleared.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
