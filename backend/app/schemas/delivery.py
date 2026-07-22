import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict

from app.core.enums import DeliveryStatus, PaymentStatus


class DeliveryCreate(BaseModel):
    invoice_id: uuid.UUID
    vehicle_id: Optional[uuid.UUID] = None
    driver_id: Optional[uuid.UUID] = None


class DeliveryStartRequest(BaseModel):
    departure_time: Optional[datetime] = None


class DeliveryArriveRequest(BaseModel):
    latitude: Decimal
    longitude: Decimal


class DeliveryCompleteRequest(BaseModel):
    status: Literal["delivered"]
    latitude: Decimal
    longitude: Decimal
    customer_signature: Optional[str] = None
    remarks: Optional[str] = None
    cash_received: Decimal = Decimal("0")
    upi_received: Decimal = Decimal("0")


class DeliveryFailRequest(BaseModel):
    reason: str


class DeliveryResponse(BaseModel):
    id: uuid.UUID
    invoice_id: uuid.UUID
    vehicle_id: Optional[uuid.UUID]
    driver_id: Optional[uuid.UUID]
    status: DeliveryStatus
    departure_time: Optional[datetime]
    arrival_time: Optional[datetime]
    completion_time: Optional[datetime]
    latitude: Optional[Decimal]
    longitude: Optional[Decimal]
    customer_signature: Optional[str]
    remarks: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class DeliveryArriveResponse(BaseModel):
    id: uuid.UUID
    arrival_time: datetime
    latitude: Decimal
    longitude: Decimal

    model_config = ConfigDict(from_attributes=True)


class DeliveryCompleteResponse(BaseModel):
    id: uuid.UUID
    status: Literal["delivered"] = "delivered"
    completion_time: datetime
    payment_id: uuid.UUID
    invoice_payment_status: PaymentStatus


class DeliveryFailResponse(BaseModel):
    id: uuid.UUID
    status: Literal["failed"] = "failed"
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
