"""Backfills the `embedding` column on existing products.

New/edited products are embedded automatically by
app/services/product.py:create_product / update_product. This script only
needs to run once after the embedding migration lands, to fill in products
that already existed before that.

Run with:
    cd backend
    source venv/bin/activate
    python -m scripts.generate_embeddings

Use --force to re-embed every active product, not just ones missing an
embedding (e.g. after switching EMBEDDING_MODEL_NAME).
"""

import argparse

from app.db.session import SessionLocal
from app.models.product import Product
from app.services import embedding as embedding_service

BATCH_SIZE = 50


def main(force: bool) -> None:
    db = SessionLocal()
    try:
        query = db.query(Product).filter(Product.deleted_at.is_(None))
        if not force:
            query = query.filter(Product.embedding.is_(None))
        products = query.all()

        print(f"Embedding {len(products)} product(s)...")
        for i, product in enumerate(products, start=1):
            embedding_service.embed_product(db, product)
            if i % BATCH_SIZE == 0:
                db.commit()
                print(f"  {i}/{len(products)} committed")
        db.commit()
        print("Done.")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force", action="store_true", help="Re-embed every active product, not just missing ones")
    args = parser.parse_args()
    main(force=args.force)
