import uuid
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import ProductStatus
from app.models.brand import Brand
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


class DuplicateProductError(Exception):
    """Raised when the generated sku collides with an existing product."""


def _next_sku(db: Session) -> str:
    """SKU-{n}, where n is one past the highest SKU number used so far
    (including soft-deleted products), so numbers never get reused even if
    rows were hard-deleted and left gaps."""
    skus = db.query(Product.sku).all()
    max_num = max((int(sku.split("-")[1]) for (sku,) in skus), default=0)
    return f"SKU-{max_num + 1}"


def get_product(db: Session, product_id: uuid.UUID) -> Product | None:
    return db.query(Product).filter(
        Product.id == product_id, Product.deleted_at.is_(None)
    ).first()


def list_active_products(db: Session) -> list[Product]:
    return (
        db.query(Product)
        .filter(Product.deleted_at.is_(None), Product.status == ProductStatus.ACTIVE)
        .order_by(Product.created_at.desc())
        .all()
    )


def list_active_products_feed(
    db: Session,
    page: int,
    page_size: int,
    search: str | None = None,
    category_id: uuid.UUID | None = None,
    sort: str = "popular",
    brand_id: uuid.UUID | None = None,
) -> tuple[list[Product], int]:
    """Paginated, filterable version of the customer catalog feed - same
    active-only scope as list_active_products, but with search/category/sort
    handled in SQL instead of fetching everything and filtering in the
    browser. `brand_id` powers the salesman Home screen's brand filter."""
    query = db.query(Product).filter(
        Product.deleted_at.is_(None), Product.status == ProductStatus.ACTIVE
    )
    if category_id is not None:
        query = query.filter(Product.category_id == category_id)
    if brand_id is not None:
        query = query.filter(Product.brand_id == brand_id)
    if search:
        like = f"%{search}%"
        query = query.filter((Product.name.ilike(like)) | (Product.sku.ilike(like)))

    if sort == "price_low":
        query = query.order_by(Product.selling_price.asc())
    elif sort == "price_high":
        query = query.order_by(Product.selling_price.desc())
    elif sort == "name":
        query = query.order_by(Product.name.asc())
    else:
        query = query.order_by(Product.created_at.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def list_all_products(
    db: Session, page: int, page_size: int, search: str | None = None, brand_id: uuid.UUID | None = None
) -> tuple[list[Product], int]:
    """Staff catalog management view - every non-deleted product, any status, paginated.
    `search` matches product name, SKU, or brand name (outer-joined so
    brandless products still show up when there's no search term).
    `brand_id` narrows the list to a single brand (see the admin products
    brand filter row)."""
    query = db.query(Product).outerjoin(Brand, Brand.id == Product.brand_id).filter(
        Product.deleted_at.is_(None)
    )
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(like)) | (Product.sku.ilike(like)) | (Brand.name.ilike(like))
        )
    if brand_id:
        query = query.filter(Product.brand_id == brand_id)
    query = query.order_by(Product.name)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def create_product(db: Session, data: ProductCreate, created_by: uuid.UUID) -> Product:
    product = Product(sku=_next_sku(db), **data.model_dump())
    db.add(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateProductError("A product with this sku already exists")
    db.refresh(product)

    # Every new product is auto-posted to the customer Home feed too - see
    # app/services/post.py:create_post_for_product.
    from app.services import post as post_service

    post_service.create_post_for_product(db, product, created_by)

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
        raise DuplicateProductError("A product with this sku already exists")
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
