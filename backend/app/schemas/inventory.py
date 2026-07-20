import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.core.enums import MovementType


class InventoryAdjustmentCreate(BaseModel):
    warehouse_id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    reason: str


class InventoryAdjustmentResponse(BaseModel):
    movement_id: uuid.UUID
    warehouse_id: uuid.UUID
    product_id: uuid.UUID
    movement_type: MovementType
    quantity: int
    balance_after: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InventoryTransferCreate(BaseModel):
    from_warehouse_id: uuid.UUID
    to_warehouse_id: uuid.UUID
    product_id: uuid.UUID
    quantity: int


class InventoryTransferResponse(BaseModel):
    transfer_out_movement_id: uuid.UUID
    transfer_in_movement_id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    created_at: datetime


class InventoryResponse(BaseModel):
    warehouse_id: uuid.UUID
    product_id: uuid.UUID
    physical_stock: int
    reserved_stock: int
    damaged_stock: int
    expiry_stock: int
    sellable_stock: int

    model_config = ConfigDict(from_attributes=True)
