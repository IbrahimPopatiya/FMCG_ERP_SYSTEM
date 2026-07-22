import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.price_list import PriceList, PriceListItem
from app.schemas.price_list import PriceListCreate, PriceListUpdate, PriceListItemCreate


class DuplicatePriceListItemError(Exception):
    """Raised when a product already has a price in this price list."""


def get_price_list(db: Session, price_list_id: uuid.UUID) -> PriceList | None:
    return db.query(PriceList).filter(
        PriceList.id == price_list_id, PriceList.deleted_at.is_(None)
    ).first()


def create_price_list(db: Session, data: PriceListCreate) -> PriceList:
    price_list = PriceList(name=data.name, description=data.description)
    db.add(price_list)
    db.commit()
    db.refresh(price_list)
    return price_list


def update_price_list(db: Session, price_list_id: uuid.UUID, data: PriceListUpdate) -> PriceList | None:
    price_list = get_price_list(db, price_list_id)
    if price_list is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(price_list, field, value)

    db.commit()
    db.refresh(price_list)
    return price_list


def soft_delete_price_list(db: Session, price_list_id: uuid.UUID) -> PriceList | None:
    price_list = get_price_list(db, price_list_id)
    if price_list is None:
        return None

    price_list.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(price_list)
    return price_list


def get_price_list_item(db: Session, price_list_id: uuid.UUID, item_id: uuid.UUID) -> PriceListItem | None:
    return db.query(PriceListItem).filter(
        PriceListItem.id == item_id, PriceListItem.price_list_id == price_list_id
    ).first()


def create_price_list_item(
    db: Session, price_list_id: uuid.UUID, data: PriceListItemCreate
) -> PriceListItem | None:
    if get_price_list(db, price_list_id) is None:
        return None

    item = PriceListItem(
        price_list_id=price_list_id,
        product_id=data.product_id,
        discount_percent=data.discount_percent,
    )
    db.add(item)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicatePriceListItemError("This product already has a price in this price list")
    db.refresh(item)
    return item


def update_price_list_item(
    db: Session, price_list_id: uuid.UUID, item_id: uuid.UUID, discount_percent
) -> PriceListItem | None:
    item = get_price_list_item(db, price_list_id, item_id)
    if item is None:
        return None

    item.discount_percent = discount_percent
    db.commit()
    db.refresh(item)
    return item


def remove_price_list_item(db: Session, price_list_id: uuid.UUID, item_id: uuid.UUID) -> bool:
    item = get_price_list_item(db, price_list_id, item_id)
    if item is None:
        return False

    db.delete(item)
    db.commit()
    return True


def get_effective_price(
    db: Session, price_list_id: uuid.UUID | None, product_id: uuid.UUID, base_price: Decimal
) -> Decimal:
    """Applies the price list's discount for this product to the base selling price.

    No discount row for this product (or no price list at all) means full price.
    """
    item = None
    if price_list_id is not None:
        item = db.query(PriceListItem).filter(
            PriceListItem.price_list_id == price_list_id,
            PriceListItem.product_id == product_id,
        ).first()

    if item is None:
        return base_price

    return base_price - (base_price * item.discount_percent / 100)
