import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.core.enums import WarehouseStatus


class WarehouseCreate(BaseModel):
    name: str
    address: str
    state: str


class WarehouseUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None


class WarehouseStatusUpdate(BaseModel):
    status: WarehouseStatus


class WarehouseResponse(BaseModel):
    id: uuid.UUID
    name: str
    address: str
    state: str
    status: WarehouseStatus

    model_config = ConfigDict(from_attributes=True)


class WarehouseDeleteResponse(BaseModel):
    id: uuid.UUID
    deleted_at: datetime

    model_config = ConfigDict(from_attributes=True)
