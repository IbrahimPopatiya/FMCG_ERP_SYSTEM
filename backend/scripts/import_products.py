"""
One-off import of ~1682 products from final_docs/FINAL SHEET.xlsx into the
products table (and matching brands).

Sheet layout (Tally stock-summary export, not a clean product list):
  col 0: product name
  col 1: brand (mislabelled "Category" in the sheet - there's no real category)
  col 2: units per box
  col 3: selling price
  col 4: loading capacity (blank/0 for every row)
  col 5: mrp (blank/0 for every row)

Decisions confirmed with the user:
  - mrp: not present in the sheet -> inserted as 0 placeholder, to be
    corrected later.
  - brand: the sheet's "Category" column is actually brand -> mapped to
    brand_id. category_id is left null (no category data exists).
  - sku: generated per brand as "<BRAND_PREFIX>-001", "<BRAND_PREFIX>-002", ...
  - rows missing a name or missing a brand are dropped (blank/subtotal rows
    from the Tally export).

Run once: python scripts/import_products.py
"""
import re
import sys
from pathlib import Path

import openpyxl

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal
from app.models.brand import Brand
from app.models.product import Product

SHEET_PATH = Path(__file__).resolve().parent.parent.parent / "final_docs" / "FINAL SHEET.xlsx"


def brand_prefix(brand_name: str) -> str:
    prefix = re.sub(r"[^A-Z0-9]", "", brand_name.upper())
    return prefix or "BRAND"


def load_rows():
    wb = openpyxl.load_workbook(SHEET_PATH, read_only=True, data_only=True)
    ws = wb["ZAID GODOWN"]
    rows = list(ws.iter_rows(values_only=True))[8:]  # data starts at row 9 (index 8)

    products = []
    for row in rows:
        name, brand, units_per_box, selling_price, loading_capacity, mrp = row
        if not name or not brand:
            continue
        products.append(
            {
                "name": str(name).strip(),
                "brand": str(brand).strip(),
                "units_per_box": int(units_per_box) if units_per_box else 1,
                "selling_price": float(selling_price) if selling_price else 0,
                "loading_capacity": int(loading_capacity) if loading_capacity else 0,
                "mrp": float(mrp) if mrp else 0,
            }
        )
    return products


def main():
    rows = load_rows()
    print(f"Loaded {len(rows)} usable product rows from sheet")

    db = SessionLocal()
    try:
        brand_cache: dict[str, Brand] = {
            b.name: b for b in db.query(Brand).all()
        }
        sku_counters: dict[str, int] = {}

        created_brands = 0
        created_products = 0
        skipped_duplicates = 0

        for row in rows:
            brand_name = row["brand"]
            brand = brand_cache.get(brand_name)
            if brand is None:
                brand = Brand(name=brand_name)
                db.add(brand)
                db.flush()
                brand_cache[brand_name] = brand
                created_brands += 1

            prefix = brand_prefix(brand_name)
            sku_counters[prefix] = sku_counters.get(prefix, 0) + 1
            sku = f"{prefix}-{sku_counters[prefix]:03d}"

            exists = db.query(Product.id).filter(Product.sku == sku).first()
            if exists:
                skipped_duplicates += 1
                continue

            product = Product(
                sku=sku,
                name=row["name"],
                brand_id=brand.id,
                category_id=None,
                unit="piece",
                units_per_box=row["units_per_box"],
                loading_capacity=row["loading_capacity"],
                mrp=row["mrp"],
                selling_price=row["selling_price"],
                minimum_stock=0,
                status="active",
            )
            db.add(product)
            created_products += 1

        db.commit()
        print(f"Created {created_brands} new brands")
        print(f"Created {created_products} new products")
        if skipped_duplicates:
            print(f"Skipped {skipped_duplicates} duplicate SKUs (already existed)")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
