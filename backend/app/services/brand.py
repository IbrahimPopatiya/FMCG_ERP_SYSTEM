import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.brand import Brand
from app.schemas.brand import BrandCreate, BrandUpdate


def get_brand(db: Session, brand_id: uuid.UUID) -> Brand | None:
    return db.query(Brand).filter(Brand.id == brand_id, Brand.deleted_at.is_(None)).first()


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
    brand = get_brand(db, brand_id)
    if brand is None:
        return None

    brand.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(brand)
    return brand
