import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.core.enums import SupplierStatus


class SupplierCreate(BaseModel):
    supplier_code: str
    name: str
    gst_number: Optional[str] = None
    mobile: str
    address: str


class SupplierUpdate(BaseModel):
    supplier_code: Optional[str] = None
    name: Optional[str] = None
    gst_number: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None


class SupplierStatusUpdate(BaseModel):
    status: SupplierStatus


class SupplierResponse(BaseModel):
    id: uuid.UUID
    supplier_code: str
    name: str
    gst_number: Optional[str]
    mobile: str
    address: str
    status: SupplierStatus

    model_config = ConfigDict(from_attributes=True)


class SupplierDeleteResponse(BaseModel):
    id: uuid.UUID
    deleted_at: datetime

    model_config = ConfigDict(from_attributes=True)
