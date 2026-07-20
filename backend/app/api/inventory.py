import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.inventory import (
    InventoryAdjustmentCreate,
    InventoryAdjustmentResponse,
    InventoryTransferCreate,
    InventoryTransferResponse,
    InventoryResponse,
)
from app.services import inventory as inventory_service

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.post("/adjustments", response_model=InventoryAdjustmentResponse, status_code=201)
def create_adjustment(
    data: InventoryAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    movement = inventory_service.create_adjustment(db, data, user_id=current_user.id)
    return InventoryAdjustmentResponse(
        movement_id=movement.id,
        warehouse_id=movement.warehouse_id,
        product_id=movement.product_id,
        movement_type=movement.movement_type,
        quantity=movement.quantity,
        balance_after=movement.balance_after,
        created_at=movement.created_at,
    )


@router.post("/transfers", response_model=InventoryTransferResponse, status_code=201)
def create_transfer(
    data: InventoryTransferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    transfer_out, transfer_in = inventory_service.create_transfer(db, data, user_id=current_user.id)
    return InventoryTransferResponse(
        transfer_out_movement_id=transfer_out.id,
        transfer_in_movement_id=transfer_in.id,
        product_id=data.product_id,
        quantity=data.quantity,
        created_at=transfer_in.created_at,
    )


@router.get("", response_model=list[InventoryResponse])
def get_inventory(
    warehouse_id: Optional[uuid.UUID] = Query(default=None),
    product_id: Optional[uuid.UUID] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = inventory_service.list_inventory(db, warehouse_id, product_id)
    return [
        InventoryResponse(
            warehouse_id=row.warehouse_id,
            product_id=row.product_id,
            physical_stock=row.physical_stock,
            reserved_stock=row.reserved_stock,
            damaged_stock=row.damaged_stock,
            expiry_stock=row.expiry_stock,
            sellable_stock=row.physical_stock - row.reserved_stock - row.damaged_stock - row.expiry_stock,
        )
        for row in rows
    ]
