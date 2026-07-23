import uuid
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import ProductStatus
from app.models.brand import Brand
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class DuplicateProductError(Exception):
    """Raised when sku or barcode is already used by another product."""


def get_product(db: Session, product_id: uuid.UUID) -> Product | None:
    return db.query(Product).filter(
        Product.id == product_id, Product.deleted_at.is_(None)
    ).first()


def list_active_products(db: Session) -> list[Product]:
    return db.query(Product).filter(
        Product.deleted_at.is_(None), Product.status == ProductStatus.ACTIVE
    ).all()


def list_all_products(
    db: Session, page: int, page_size: int, search: str | None = None
) -> tuple[list[Product], int]:
    """Staff catalog management view - every non-deleted product, any status, paginated.
    `search` matches product name, SKU, or brand name (outer-joined so
    brandless products still show up when there's no search term)."""
    query = db.query(Product).outerjoin(Brand, Brand.id == Product.brand_id).filter(
        Product.deleted_at.is_(None)
    )
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(like)) | (Product.sku.ilike(like)) | (Brand.name.ilike(like))
        )
    query = query.order_by(Product.name)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def create_product(db: Session, data: ProductCreate) -> Product:
    product = Product(**data.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateProductError("A product with this sku or barcode already exists")
    db.refresh(product)
    return product


def update_product(db: Session, product_id: uuid.UUID, data: ProductUpdate) -> Product | None:
    product = get_product(db, product_id)
    if product is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(product, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateProductError("A product with this sku or barcode already exists")
    db.refresh(product)
    return product


def set_product_status(db: Session, product_id: uuid.UUID, new_status: ProductStatus) -> Product | None:
    product = get_product(db, product_id)
    if product is None:
        return None

    product.status = new_status
    db.commit()
    db.refresh(product)
    return product


def soft_delete_product(db: Session, product_id: uuid.UUID) -> Product | None:
    product = get_product(db, product_id)
    if product is None:
        return None

    product.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(product)
    return product
