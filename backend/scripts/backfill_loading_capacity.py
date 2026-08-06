"""One-off backfill: randomize loading_capacity to 1-10 for every existing
product. The seed scripts previously wrote large values (units_per_box * 10,
or 0), so rows created before this change need a direct data fix.

Run from backend/: python scripts/backfill_loading_capacity.py
"""
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal
from app.models.product import Product


def main():
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        for product in products:
            product.loading_capacity = random.randint(1, 10)
        db.commit()
        print(f"Updated loading_capacity for {len(products)} products (range 1-10).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
