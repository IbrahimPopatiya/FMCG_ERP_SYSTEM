"""Seeds the 50 real product catalog photos in final_docs/products-images/
as actual products - uploading each image to Supabase Storage (same path
create_product's callers use) and creating a Product that points at it.

This is destructive: Step 1 deletes every product NOT in the PRODUCTS list
below (and every row elsewhere that points at one of those products - posts,
price list entries, purchase/return/order line items, saved products,
inventory) so the catalog ends up with exactly these 50. Never point this at
anything but your local dev database.

Run with:
    cd backend
    source venv/bin/activate
    python -m scripts.seed_real_products

Skip the confirmation prompt with:
    python -m scripts.seed_real_products --yes
"""

import sys
from decimal import Decimal
from pathlib import Path

from sqlalchemy import text

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
from app.services.file_upload import save_file

IMAGES_DIR = Path(__file__).resolve().parent.parent.parent / "final_docs" / "products-images"

CANDY = "Candy & Toffees"
CHOCOLATE = "Chocolates"
WAFER = "Wafers & Biscuits"
SNACKS = "Namkeen & Snacks"

# Per-category defaults for the wholesale pack being sold (a jar/box/tub is
# the sellable unit here, not the individual toffee inside it) - kept flat
# and simple rather than guessing at every jar's exact printed price. No GST
# is tracked for this catalog - every product is created at 0%.
CATEGORY_DEFAULTS = {
    CANDY: {"mrp": "150.00", "selling_price": "135.00", "units_per_box": 6},
    CHOCOLATE: {"mrp": "250.00", "selling_price": "225.00", "units_per_box": 6},
    WAFER: {"mrp": "120.00", "selling_price": "108.00", "units_per_box": 12},
    SNACKS: {"mrp": "180.00", "selling_price": "162.00", "units_per_box": 6},
}

# Tables (besides `products` itself) that hold a product_id - deleted for
# the products being removed, before the products themselves are deleted.
DEPENDENT_TABLES = [
    "saved_products",
    "posts",
    "price_list_items",
    "purchase_items",
    "return_items",
    "sales_order_items",
    "inventory_movements",
    "inventory",
]

# (image filename, product name, brand, category)
PRODUCTS = [
    ("WhatsApp Image 2026-08-01 at 14.13.50 (1).jpeg", "Super Jelly Labubu Candy Jar", "Zaid Traders", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.13.50.jpeg", "Zara Ros Paan Candy Jar", "Zaid Traders", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.13.53.jpeg", "Joy Gum Mouth Freshener Jar", "Zaid Traders", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.13.54 (1).jpeg", "Khatti Mithi Imli Chutney Candy Jar", "iFly", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.13.54 (2).jpeg", "Italy Creamy Wafer", "iFly", WAFER),
    ("WhatsApp Image 2026-08-01 at 14.13.54.jpeg", "Mint Polo Peppermint Candy Jar", "Talespin", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.13.55 (1).jpeg", "Bapi Da Khajana Toy Candy Jar", "iFly", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.13.55.jpeg", "Madhuri Nut Bars (Groundnut, Till, Coconut)", "Madhuri", SNACKS),
    ("WhatsApp Image 2026-08-01 at 14.13.56 (1).jpeg", "Choco Range Orange Cream Cocoa", "Dazzy", CHOCOLATE),
    ("WhatsApp Image 2026-08-01 at 14.13.56 (2).jpeg", "Double Straw Berry Candy", "Dazzy", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.13.56.jpeg", "Double Cokonat Candy", "Dazzy", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.13.56 (3).jpeg", "Double Mango Centerfills Candy", "Dazzy", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.13.57 (1).jpeg", "Double Kaccha Aam Candy", "Dazzy", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.13.57.jpeg", "Double Paan Banarasi Candy", "Dazzy", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.13.58 (1).jpeg", "D'Love Chocolate Gift Box", "Darry", CHOCOLATE),
    ("WhatsApp Image 2026-08-01 at 14.13.58.jpeg", "Stacy Finest Chocolate Minis Jar", "Stacy", CHOCOLATE),
    ("WhatsApp Image 2026-08-01 at 14.13.59 (1).jpeg", "King Kong Hello Cholo Chocolate Box", "Dazzy", CHOCOLATE),
    ("WhatsApp Image 2026-08-01 at 14.13.59.jpeg", "Dr. Teddy Chocolate Box", "Dazzy", CHOCOLATE),
    ("WhatsApp Image 2026-08-01 at 14.14.00.jpeg", "D'Love Cream Fills Chocolate Tub", "Darry", CHOCOLATE),
    ("WhatsApp Image 2026-08-01 at 14.14.02 (1).jpeg", "D-Bon Fruity Assorted Candy Jars", "Dazzy", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.14.02.jpeg", "D-Bon Fruity Malai Debon Candy Jar", "Dazzy", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.14.03.jpeg", "D-Bon Fruity Paan Debon Candy Jar", "Dazzy", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.14.05 (1).jpeg", "D'Love Gold Coated Chocolate Tub", "Dazzy", CHOCOLATE),
    ("WhatsApp Image 2026-08-01 at 14.14.05 (2).jpeg", "3 Stix Wafer Sticks (Milk/Kri-Kat/Choco)", "Dazzy", WAFER),
    ("WhatsApp Image 2026-08-01 at 14.14.05.jpeg", "Soffiti Frutose Mix Fruits Candy Jar", "Dazzy", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.14.06.jpeg", "Kri-Kat Creme Stix Chokolater Roll", "Dazzy", WAFER),
    ("WhatsApp Image 2026-08-01 at 14.14.07 (1).jpeg", "Dairy Kiss Black & White Chocolate Bar Box", "Dazzy", CHOCOLATE),
    ("WhatsApp Image 2026-08-01 at 14.14.07 (2).jpeg", "Big Rolle Chocolate & Coconut Fills", "Dazzy", WAFER),
    ("WhatsApp Image 2026-08-01 at 14.14.07.jpeg", "Gold Chocolatee Truffles Jar", "Dazzy", CHOCOLATE),
    ("WhatsApp Image 2026-08-01 at 14.14.08.jpeg", "Malai Kulfi Candy (Coconut/Pista/Elaichi/Kesar)", "Dazzy", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.14.10 (1).jpeg", "De Gold Milk Mithai (Coconut/Rose/Pista)", "Dazzy", CHOCOLATE),
    ("WhatsApp Image 2026-08-01 at 14.14.10.jpeg", "D-Bon Fruity Nimbu Pani Debon Candy Jar", "Dazzy", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.14.11 (1).jpeg", "Stacy Smooth & Rich Chocolate Tub", "Stacy", CHOCOLATE),
    ("WhatsApp Image 2026-08-01 at 14.14.11 (2).jpeg", "D-Bon Fruity Cola Debon Candy Jar", "Dazzy", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.14.11.jpeg", "Pan Rolle Wafer Stick with Paan Filling", "Dazzy", WAFER),
    ("WhatsApp Image 2026-08-01 at 14.14.12 (1).jpeg", "Breakos Chocolate Wafer Tub", "Neo", WAFER),
    ("WhatsApp Image 2026-08-01 at 14.14.12 (2).jpeg", "Kachaa Aam Raw Mango Candy Jar", "Neo", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.14.12 (3).jpeg", "3 Pan Rolle Original Wafer Fills", "Dazzy", WAFER),
    ("WhatsApp Image 2026-08-01 at 14.14.12.jpeg", "Kachaa Aam Mist Center Filled Candy", "Neo", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.14.13 (1).jpeg", "Exotica Creamy Wafer (Choco/Orange/Pineapple/Strawberry)", "Neo", WAFER),
    ("WhatsApp Image 2026-08-01 at 14.14.13.jpeg", "Twinkle Star Choco Coated Wafer Tub", "Neo", WAFER),
    ("WhatsApp Image 2026-08-01 at 14.14.14 (1).jpeg", "Breakos Chocolate Crunch Box", "Neo", WAFER),
    ("WhatsApp Image 2026-08-01 at 14.14.14 (2).jpeg", "Choco Yorker Box", "Neo", CHOCOLATE),
    ("WhatsApp Image 2026-08-01 at 14.14.14 (3).jpeg", "Mania Creme Wafer (Choco/Pineapple/Orange/Strawberry)", "Neo", WAFER),
    ("WhatsApp Image 2026-08-01 at 14.14.14.jpeg", "Choco Arena Strawberry Center Filled Chocolate", "Neo", CHOCOLATE),
    ("WhatsApp Image 2026-08-01 at 14.14.15 (1).jpeg", "Breakos Strawberry Cream Wafer Box", "Neo", WAFER),
    ("WhatsApp Image 2026-08-01 at 14.14.15 (2).jpeg", "4 Buddies Coated Balls Jar", "Neo", CANDY),
    ("WhatsApp Image 2026-08-01 at 14.14.15 (3).jpeg", "Hi Panda Coated Biscuit Balls Jar", "Neo", WAFER),
    ("WhatsApp Image 2026-08-01 at 14.14.15.jpeg", "Kidz Joy Choco Egg with Toy Box", "Neo", CHOCOLATE),
    ("WhatsApp Image 2026-08-01 at 14.14.16.jpeg", "Hi Panda Choco Scoops Jar", "Neo", CHOCOLATE),
]


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


def wipe_other_products(db, keep_names: set[str]) -> None:
    stale_ids = [
        row[0]
        for row in db.query(Product.id).filter(Product.name.notin_(keep_names)).all()
    ]
    if not stale_ids:
        print("  No other products to remove.")
        return

    for table in DEPENDENT_TABLES:
        result = db.execute(
            text(f"DELETE FROM {table} WHERE product_id = ANY(:ids)"), {"ids": stale_ids}
        )
        log(f"{table}: removed {result.rowcount} row(s)")

    result = db.execute(text("DELETE FROM products WHERE id = ANY(:ids)"), {"ids": stale_ids})
    log(f"products: removed {result.rowcount} row(s)")
    db.commit()


def main() -> None:
    if not IMAGES_DIR.is_dir():
        print(f"Image folder not found: {IMAGES_DIR}")
        sys.exit(1)

    print(f"Target database: {settings.database_url}")
    print("This will DELETE every product not in the 50-item list below (and anything")
    print("referencing them - posts, price list entries, order/purchase/return lines,")
    print("saved products, inventory), then seed exactly these 50.")
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

        print("Step 1/3: Removing every product outside the 50-item list...")
        wipe_other_products(db, {name for _, name, _, _ in PRODUCTS})

        categories: dict = {}
        brands: dict = {}

        print(f"Step 2/3: Uploading {len(PRODUCTS)} product images to Supabase Storage...")
        created = 0
        for filename, name, brand_name, category_name in PRODUCTS:
            if db.query(Product).filter(Product.name == name, Product.deleted_at.is_(None)).first():
                log(f"SKIP (already seeded): {name}")
                continue

            path = IMAGES_DIR / filename
            if not path.is_file():
                log(f"SKIP (file not found): {filename}")
                continue

            image_url = save_file(path.read_bytes(), filename, "products")
            category = get_or_create_category(db, category_name, categories)
            brand = get_or_create_brand(db, brand_name, brands)
            defaults = CATEGORY_DEFAULTS[category_name]

            product_service.create_product(
                db,
                ProductCreate(
                    name=name,
                    category_id=category.id,
                    brand_id=brand.id,
                    unit="piece",
                    units_per_box=defaults["units_per_box"],
                    loading_capacity=defaults["units_per_box"] * 10,
                    mrp=Decimal(defaults["mrp"]),
                    selling_price=Decimal(defaults["selling_price"]),
                    gst_rate=Decimal("0"),
                    minimum_stock=5,
                    image=image_url,
                ),
                admin.id,
            )
            created += 1
            log(f"{name} ({brand_name}, {category_name})")

        print(f"\nStep 3/3: Done. {created}/{len(PRODUCTS)} products created.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
