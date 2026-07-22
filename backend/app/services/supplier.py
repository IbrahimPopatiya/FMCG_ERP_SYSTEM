import uuid
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import SupplierStatus
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate


class DuplicateSupplierError(Exception):
    """Raised when supplier_code is already used by another supplier."""


def list_suppliers(db: Session) -> list[Supplier]:
    return db.query(Supplier).filter(Supplier.deleted_at.is_(None)).all()


def get_supplier(db: Session, supplier_id: uuid.UUID) -> Supplier | None:
    return db.query(Supplier).filter(
        Supplier.id == supplier_id, Supplier.deleted_at.is_(None)
    ).first()


def create_supplier(db: Session, data: SupplierCreate) -> Supplier:
    supplier = Supplier(**data.model_dump())
    db.add(supplier)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateSupplierError("A supplier with this supplier_code already exists")
    db.refresh(supplier)
    return supplier


def update_supplier(db: Session, supplier_id: uuid.UUID, data: SupplierUpdate) -> Supplier | None:
    supplier = get_supplier(db, supplier_id)
    if supplier is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(supplier, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateSupplierError("A supplier with this supplier_code already exists")
    db.refresh(supplier)
    return supplier


def set_supplier_status(db: Session, supplier_id: uuid.UUID, new_status: SupplierStatus) -> Supplier | None:
    supplier = get_supplier(db, supplier_id)
    if supplier is None:
        return None

    supplier.status = new_status
    db.commit()
    db.refresh(supplier)
    return supplier


def soft_delete_supplier(db: Session, supplier_id: uuid.UUID) -> Supplier | None:
    supplier = get_supplier(db, supplier_id)
    if supplier is None:
        return None

    supplier.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(supplier)
    return supplier
