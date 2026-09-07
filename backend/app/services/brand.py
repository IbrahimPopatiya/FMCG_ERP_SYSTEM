import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.brand import Brand
from app.models.product import Product
from app.schemas.brand import BrandCreate, BrandUpdate


def get_brand(db: Session, brand_id: uuid.UUID) -> Brand | None:
    return db.query(Brand).filter(Brand.id == brand_id, Brand.deleted_at.is_(None)).first()


def list_brands(db: Session) -> list[Brand]:
    return db.query(Brand).filter(Brand.deleted_at.is_(None)).order_by(Brand.name).all()


def create_brand(db: Session, data: BrandCreate) -> Brand:
    brand = Brand(name=data.name, logo=data.logo)
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand


def update_brand(db: Session, brand_id: uuid.UUID, data: BrandUpdate) -> Brand | None:
    brand = get_brand(db, brand_id)
    if brand is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(brand, field, value)

    db.commit()
    db.refresh(brand)
    return brand


def soft_delete_brand(db: Session, brand_id: uuid.UUID) -> Brand | None:
    """Deleting a brand takes every one of its products with it - a brand
    with no products left in the catalog isn't useful to keep around, and
    customers shouldn't be able to find orphaned products for a brand that
    no longer exists."""
    brand = get_brand(db, brand_id)
    if brand is None:
        return None

    from app.services import product as product_service

    product_ids = [
        product_id
        for (product_id,) in db.query(Product.id).filter(
            Product.brand_id == brand_id, Product.deleted_at.is_(None)
        )
    ]
    for product_id in product_ids:
        product_service.soft_delete_product(db, product_id)

    brand.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(brand)
    return brand
