import uuid
from typing import Optional

from sqlalchemy.orm import Session

from app.core.enums import MovementType
from app.models.inventory import Inventory, InventoryMovement
from app.schemas.inventory import InventoryAdjustmentCreate, InventoryTransferCreate

# Movement types that add to physical_stock (positive) or subtract (negative).
_PHYSICAL_STOCK_DELTA = {
    MovementType.PURCHASE_IN: 1,
    MovementType.SOLD_OUT: -1,
    MovementType.RETURNED_IN: 1,
    MovementType.ADJUSTMENT: 1,
    MovementType.TRANSFER_OUT: -1,
    MovementType.TRANSFER_IN: 1,
}


def _get_or_create_inventory(db: Session, warehouse_id: uuid.UUID, product_id: uuid.UUID) -> Inventory:
    inventory = db.query(Inventory).filter(
        Inventory.warehouse_id == warehouse_id, Inventory.product_id == product_id
    ).first()
    if inventory is None:
        inventory = Inventory(warehouse_id=warehouse_id, product_id=product_id)
        db.add(inventory)
        db.flush()
    return inventory


def record_movement(
    db: Session,
    warehouse_id: uuid.UUID,
    product_id: uuid.UUID,
    movement_type: MovementType,
    quantity: int,
    reference_type: Optional[str] = None,
    reference_id: Optional[uuid.UUID] = None,
    remarks: Optional[str] = None,
    user_id: Optional[uuid.UUID] = None,
) -> InventoryMovement:
    inventory = _get_or_create_inventory(db, warehouse_id, product_id)

    if movement_type in _PHYSICAL_STOCK_DELTA:
        inventory.physical_stock += _PHYSICAL_STOCK_DELTA[movement_type] * quantity
    if movement_type == MovementType.SOLD_OUT:
        inventory.reserved_stock -= quantity
    elif movement_type == MovementType.RESERVED:
        inventory.reserved_stock += quantity
    elif movement_type == MovementType.UNRESERVED:
        inventory.reserved_stock -= quantity
    elif movement_type == MovementType.DAMAGED:
        inventory.damaged_stock += quantity
    elif movement_type == MovementType.EXPIRED:
        inventory.expiry_stock += quantity

    movement = InventoryMovement(
        warehouse_id=warehouse_id,
        product_id=product_id,
        movement_type=movement_type.value,
        quantity=quantity,
        reference_type=reference_type,
        reference_id=reference_id,
        balance_after=inventory.physical_stock,
        remarks=remarks,
        created_by=user_id,
    )
    db.add(movement)
    db.commit()
    db.refresh(movement)
    return movement


def create_adjustment(
    db: Session, data: InventoryAdjustmentCreate, user_id: Optional[uuid.UUID] = None
) -> InventoryMovement:
    return record_movement(
        db,
        warehouse_id=data.warehouse_id,
        product_id=data.product_id,
        movement_type=MovementType.ADJUSTMENT,
        quantity=data.quantity,
        reference_type="adjustment",
        remarks=data.reason,
        user_id=user_id,
    )


def create_transfer(
    db: Session, data: InventoryTransferCreate, user_id: Optional[uuid.UUID] = None
) -> tuple[InventoryMovement, InventoryMovement]:
    transfer_out = record_movement(
        db,
        warehouse_id=data.from_warehouse_id,
        product_id=data.product_id,
        movement_type=MovementType.TRANSFER_OUT,
        quantity=data.quantity,
        reference_type="transfer",
        user_id=user_id,
    )
    transfer_in = record_movement(
        db,
        warehouse_id=data.to_warehouse_id,
        product_id=data.product_id,
        movement_type=MovementType.TRANSFER_IN,
        quantity=data.quantity,
        reference_type="transfer",
        reference_id=transfer_out.id,
        user_id=user_id,
    )
    return transfer_out, transfer_in


def list_inventory(
    db: Session,
    warehouse_id: Optional[uuid.UUID] = None,
    product_id: Optional[uuid.UUID] = None,
) -> list[Inventory]:
    query = db.query(Inventory)
    if warehouse_id is not None:
        query = query.filter(Inventory.warehouse_id == warehouse_id)
    if product_id is not None:
        query = query.filter(Inventory.product_id == product_id)
    return query.all()
