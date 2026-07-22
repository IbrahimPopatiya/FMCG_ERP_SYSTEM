import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.enums import WarehouseStatus
from app.models.warehouse import Warehouse
from app.schemas.warehouse import WarehouseCreate, WarehouseUpdate


def create_warehouse(db: Session, data: WarehouseCreate) -> Warehouse:
    warehouse = Warehouse(name=data.name, address=data.address, state=data.state)
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse


def list_warehouses(db: Session) -> list[Warehouse]:
    return (
        db.query(Warehouse)
        .filter(Warehouse.deleted_at.is_(None))
        .order_by(Warehouse.name)
        .all()
    )


def get_warehouse(db: Session, warehouse_id: uuid.UUID) -> Warehouse | None:
    return db.query(Warehouse).filter(
        Warehouse.id == warehouse_id, Warehouse.deleted_at.is_(None)
    ).first()


def update_warehouse(db: Session, warehouse_id: uuid.UUID, data: WarehouseUpdate) -> Warehouse | None:
    warehouse = get_warehouse(db, warehouse_id)
    if warehouse is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(warehouse, field, value)

    db.commit()
    db.refresh(warehouse)
    return warehouse


def set_warehouse_status(
    db: Session, warehouse_id: uuid.UUID, new_status: WarehouseStatus
) -> Warehouse | None:
    warehouse = get_warehouse(db, warehouse_id)
    if warehouse is None:
        return None

    warehouse.status = new_status
    db.commit()
    db.refresh(warehouse)
    return warehouse


def soft_delete_warehouse(db: Session, warehouse_id: uuid.UUID) -> Warehouse | None:
    warehouse = get_warehouse(db, warehouse_id)
    if warehouse is None:
        return None

    warehouse.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(warehouse)
    return warehouse
