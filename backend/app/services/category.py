import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate


class ParentCategoryNotFoundError(Exception):
    """Raised when `parent_id` doesn't point to an existing, non-deleted category."""


def get_category(db: Session, category_id: uuid.UUID) -> Category | None:
    return db.query(Category).filter(
        Category.id == category_id, Category.deleted_at.is_(None)
    ).first()


def list_categories(db: Session) -> list[Category]:
    return db.query(Category).filter(Category.deleted_at.is_(None)).order_by(Category.name).all()


def _check_parent_exists(db: Session, parent_id: uuid.UUID | None) -> None:
    if parent_id is not None and get_category(db, parent_id) is None:
        raise ParentCategoryNotFoundError("Parent category not found")


def create_category(db: Session, data: CategoryCreate) -> Category:
    _check_parent_exists(db, data.parent_id)

    category = Category(name=data.name, parent_id=data.parent_id, image=data.image)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(db: Session, category_id: uuid.UUID, data: CategoryUpdate) -> Category | None:
    category = get_category(db, category_id)
    if category is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    if "parent_id" in updates:
        _check_parent_exists(db, updates["parent_id"])

    for field, value in updates.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category


def soft_delete_category(db: Session, category_id: uuid.UUID) -> Category | None:
    category = get_category(db, category_id)
    if category is None:
        return None

    category.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(category)
    return category
