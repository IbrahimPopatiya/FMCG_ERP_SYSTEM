from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product

_model = None


def get_model():
    """Lazily loads the embedding model once per process - importing
    sentence-transformers at module load time would slow down every backend
    start (including tests) even when embeddings are never used."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer(settings.embedding_model_name)
    return _model


def embed_text(text: str) -> list[float]:
    return get_model().encode(text).tolist()


def build_product_text(db: Session, product: Product) -> str:
    parts = [product.name, product.packing]

    if product.category_id is not None:
        category = db.query(Category).filter(Category.id == product.category_id).first()
        if category is not None:
            parts.append(category.name)

    if product.brand_id is not None:
        brand = db.query(Brand).filter(Brand.id == product.brand_id).first()
        if brand is not None:
            parts.append(brand.name)

    return " ".join(part for part in parts if part)


def embed_product(db: Session, product: Product) -> None:
    """Computes and sets `product.embedding` in place. Does not commit -
    callers already manage their own transaction boundary."""
    text = build_product_text(db, product)
    product.embedding = embed_text(text)
