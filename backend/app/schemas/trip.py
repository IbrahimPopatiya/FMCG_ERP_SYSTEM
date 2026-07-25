import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.core.enums import TripStatus


class TripCreate(BaseModel):
    vehicle_id: uuid.UUID
    driver_id: uuid.UUID
    trip_date: Optional[datetime] = None
    order_ids: list[uuid.UUID]
    remark: Optional[str] = None


class TripOrderResponse(BaseModel):
    sales_order_id: uuid.UUID
    order_number: str
    customer_id: uuid.UUID
    order_status: str
    lc_value: Decimal

    model_config = ConfigDict(from_attributes=True)


class TripResponse(BaseModel):
    id: uuid.UUID
    trip_number: str
    vehicle_id: uuid.UUID
    driver_id: uuid.UUID
    trip_date: datetime
    status: TripStatus
    remark: Optional[str]
    total_lc: Decimal
    orders: list[TripOrderResponse]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TripStatusResponse(BaseModel):
    id: uuid.UUID
    status: TripStatus
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoadableOrderResponse(BaseModel):
    """An approved order not yet on an active trip - the pool the Loading
    Supervisor picks from on the Orders (LC) screen."""

    id: uuid.UUID
    order_number: str
    customer_id: uuid.UUID
    lc_value: Decimal
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
