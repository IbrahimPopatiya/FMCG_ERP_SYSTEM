"""Seeds all 455 product photos in final_docs/products-455/ as testing
products - uploading each image to Supabase Storage (same path
create_product's callers use) and creating a Product with generic
auto-generated name/category/brand/price data, since these images weren't
individually identified.

This does NOT wipe existing products - it only adds these 455 (skipping any
that were already seeded by filename-derived name). Never point this at
anything but your local dev database.

Run with:
    cd backend
    source venv/bin/activate
    python -m scripts.seed_455_products

Skip the confirmation prompt with:
    python -m scripts.seed_455_products --yes
"""

import random
import sys
from decimal import Decimal
from pathlib import Path

from app.core.config import settings
from app.core.enums import UserRole
from app.db.session import SessionLocal
import app.models  # noqa: F401 - registers all models on Base.metadata
from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product
from app.models.user import User
from app.schemas.brand import BrandCreate
from app.schemas.category import CategoryCreate
from app.schemas.product import ProductCreate
from app.services import brand as brand_service
from app.services import category as category_service
from app.services import product as product_service
from app.services.product import DuplicateProductError
from app.services.file_upload import save_file

IMAGES_DIR = Path(__file__).resolve().parent.parent.parent / "final_docs" / "products-455"

CATEGORY_NAMES = [
    "Beverages", "Snacks", "Biscuits", "Dairy", "Staples", "Edible Oils",
    "Household", "Personal Care", "Confectionery", "Instant Food",
]

BRAND_NAMES = [
    "Zaid Traders", "iFly", "Talespin", "Dazzy", "Darry", "Stacy", "Neo",
    "Madhuri", "Generic FMCG Co", "Test Brand",
]

UNITS = ["piece", "packet", "box", "jar", "bottle", "pack"]


def log(message: str) -> None:
    print(f"  {message}")


def get_or_create_category(db, name: str, cache: dict) -> Category:
    if name in cache:
        return cache[name]
    existing = db.query(Category).filter(Category.name == name, Category.deleted_at.is_(None)).first()
    category = existing or category_service.create_category(db, CategoryCreate(name=name))
    cache[name] = category
    return category


def get_or_create_brand(db, name: str, cache: dict) -> Brand:
    if name in cache:
        return cache[name]
    existing = db.query(Brand).filter(Brand.name == name, Brand.deleted_at.is_(None)).first()
    brand = existing or brand_service.create_brand(db, BrandCreate(name=name))
    cache[name] = brand
    return brand


def random_prices() -> tuple[Decimal, Decimal, Decimal]:
    mrp = Decimal(random.randrange(10, 500))
    discount = Decimal(random.randrange(5, 20))
    selling_price = (mrp * (Decimal("100") - discount) / Decimal("100")).quantize(Decimal("1"))
    gst_rate = Decimal(random.choice(["0", "5", "12", "18"]))
    return mrp, selling_price, gst_rate


def main() -> None:
    if not IMAGES_DIR.is_dir():
        print(f"Image folder not found: {IMAGES_DIR}")
        sys.exit(1)

    image_files = sorted(IMAGES_DIR.glob("product_*.*"))
    if not image_files:
        print(f"No product images found in {IMAGES_DIR}")
        sys.exit(1)

    if "test" in settings.database_url or "prod" in settings.database_url:
        print(f"Refusing to run against {settings.database_url!r} - point this at your local dev DB only.")
        sys.exit(1)

    print(f"Target database: {settings.database_url}")
    print(f"This will create up to {len(image_files)} test products from images in {IMAGES_DIR}.")
    if "--yes" not in sys.argv:
        confirm = input("Type 'yes' to continue: ")
        if confirm.strip().lower() != "yes":
            print("Aborted.")
            sys.exit(1)

    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if admin is None:
            print("No admin user found - run scripts.seed_dummy_data first (or create an admin user).")
            sys.exit(1)

        categories: dict = {}
        brands: dict = {}
        created = 0

        for index, path in enumerate(image_files, start=1):
            name = f"Test Product {index:04d}"
            if db.query(Product).filter(Product.name == name, Product.deleted_at.is_(None)).first():
                log(f"SKIP (already seeded): {name}")
                continue

            category_name = random.choice(CATEGORY_NAMES)
            brand_name = random.choice(BRAND_NAMES)
            category = get_or_create_category(db, category_name, categories)
            brand = get_or_create_brand(db, brand_name, brands)
            mrp, selling_price, gst_rate = random_prices()

            image_url = save_file(path.read_bytes(), path.name, "products")

            product_data = ProductCreate(
                name=name,
                category_id=category.id,
                brand_id=brand.id,
                unit=random.choice(UNITS),
                units_per_box=random.choice([1, 6, 12, 24]),
                loading_capacity=random.randint(1, 20),
                mrp=mrp,
                selling_price=selling_price,
                gst_rate=gst_rate,
                minimum_stock=random.randint(5, 50),
                image=image_url,
            )
            # _next_sku derives the number from a row count, which can
            # collide with an existing gap left by earlier wipes/deletes -
            # retrying re-derives a fresh count each time until it lands on
            # a free SKU.
            for attempt in range(10):
                try:
                    product_service.create_product(db, product_data, admin.id)
                    break
                except DuplicateProductError:
                    if attempt == 9:
                        raise
            created += 1
            if created % 25 == 0:
                log(f"{created}/{len(image_files)} created...")

        print(f"\nDone. {created}/{len(image_files)} products created.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
