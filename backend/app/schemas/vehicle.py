import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.core.enums import VehicleStatus


class VehicleCreate(BaseModel):
    vehicle_number: str
    driver_id: Optional[uuid.UUID] = None
    warehouse_id: Optional[uuid.UUID] = None
    capacity: Decimal


class VehicleUpdate(BaseModel):
    vehicle_number: Optional[str] = None
    driver_id: Optional[uuid.UUID] = None
    warehouse_id: Optional[uuid.UUID] = None
    capacity: Optional[Decimal] = None


class VehicleDriverUpdate(BaseModel):
    driver_id: uuid.UUID


class VehicleStatusUpdate(BaseModel):
    status: VehicleStatus


class VehicleResponse(BaseModel):
    id: uuid.UUID
    vehicle_number: str
    driver_id: Optional[uuid.UUID]
    warehouse_id: Optional[uuid.UUID]
    capacity: Decimal
    status: VehicleStatus

    model_config = ConfigDict(from_attributes=True)


class VehicleDeleteResponse(BaseModel):
    id: uuid.UUID
    deleted_at: datetime

    model_config = ConfigDict(from_attributes=True)
