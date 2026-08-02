import uuid

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.saved_product import SavedProduct
from app.services.product import get_product


class ProductNotFoundError(Exception):
    """Raised when saving a product id that doesn't exist."""


def list_saved_products(db: Session, customer_id: uuid.UUID) -> list[SavedProduct]:
    """Newest-saved first - feeds the account "Saved Products" section."""
    return (
        db.query(SavedProduct)
        .filter(SavedProduct.customer_id == customer_id)
        .order_by(SavedProduct.created_at.desc())
        .all()
    )


def save_product(db: Session, customer_id: uuid.UUID, product_id: uuid.UUID) -> SavedProduct:
    """Bookmarking is idempotent - tapping save on an already-saved product
    just returns the existing row instead of erroring."""
    existing = (
        db.query(SavedProduct)
        .filter(SavedProduct.customer_id == customer_id, SavedProduct.product_id == product_id)
        .first()
    )
    if existing is not None:
        return existing

    if get_product(db, product_id) is None:
        raise ProductNotFoundError("Product not found")

    saved = SavedProduct(customer_id=customer_id, product_id=product_id)
    db.add(saved)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        return (
            db.query(SavedProduct)
            .filter(SavedProduct.customer_id == customer_id, SavedProduct.product_id == product_id)
            .first()
        )
    db.refresh(saved)
    return saved


def unsave_product(db: Session, customer_id: uuid.UUID, product_id: uuid.UUID) -> None:
    db.query(SavedProduct).filter(
        SavedProduct.customer_id == customer_id, SavedProduct.product_id == product_id
    ).delete()
    db.commit()
