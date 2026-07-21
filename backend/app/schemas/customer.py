import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.core.enums import CustomerStatus


class CustomerCreate(BaseModel):
    customer_code: str
    business_name: str
    owner_name: str
    mobile: str
    alternate_mobile: Optional[str] = None
    gst_number: Optional[str] = None
    address: str
    city: str
    state: str
    pincode: str
    credit_limit: Decimal
    payment_terms: int
    route_id: Optional[uuid.UUID] = None
    price_list_id: Optional[uuid.UUID] = None
    password: str


class CustomerUpdate(BaseModel):
    business_name: Optional[str] = None
    owner_name: Optional[str] = None
    mobile: Optional[str] = None
    alternate_mobile: Optional[str] = None
    gst_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    credit_limit: Optional[Decimal] = None
    payment_terms: Optional[int] = None
    route_id: Optional[uuid.UUID] = None
    price_list_id: Optional[uuid.UUID] = None
    login_enabled: Optional[bool] = None


class CustomerStatusUpdate(BaseModel):
    status: CustomerStatus


class CustomerLocationUpdate(BaseModel):
    latitude: Decimal
    longitude: Decimal


class CustomerLocationResponse(BaseModel):
    id: uuid.UUID
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerResponse(BaseModel):
    id: uuid.UUID
    customer_code: str
    business_name: str
    status: CustomerStatus
    login_enabled: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CustomerMeResponse(BaseModel):
    id: uuid.UUID
    customer_code: str
    business_name: str
    owner_name: str
    mobile: str
    alternate_mobile: Optional[str]
    gst_number: Optional[str]
    address: str
    city: str
    state: str
    pincode: str
    credit_limit: Decimal
    payment_terms: int
    status: CustomerStatus

    model_config = ConfigDict(from_attributes=True)


class CustomerDeleteResponse(BaseModel):
    id: uuid.UUID
    deleted_at: datetime

    model_config = ConfigDict(from_attributes=True)
