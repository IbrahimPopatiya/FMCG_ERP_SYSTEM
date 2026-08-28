"""
One-off backfill: create a Post for every product that doesn't have one yet.

Needed because the 1608 products from scripts/import_products.py were
inserted directly into the DB, bypassing the create_product service where
post_service.create_post_for_product() normally auto-fires.

Run once: python scripts/backfill_posts.py
"""
import sys
import uuid
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.db.session import SessionLocal
from app.models.post import Post
from app.models.product import Product
from app.models.user import User

ADMIN_EMAIL = "zaid@gmail.com"


def main():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if not admin:
            raise RuntimeError(f"No user found with email {ADMIN_EMAIL}")

        posted_product_ids = {row[0] for row in db.query(Post.product_id).all()}

        products = db.query(Product).filter(Product.deleted_at.is_(None)).all()
        missing = [p for p in products if p.id not in posted_product_ids]

        print(f"{len(products)} total products, {len(missing)} missing a post")

        created = 0
        for product in missing:
            post = Post(
                product_id=product.id,
                image=product.image,
                product_name=product.name,
                price=product.selling_price,
                mrp=product.mrp,
                quantity_in_box=product.units_per_box,
                created_by=admin.id,
            )
            db.add(post)
            created += 1

        db.commit()
        print(f"Created {created} posts")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
