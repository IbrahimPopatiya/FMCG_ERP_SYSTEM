import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.core.enums import OrderSource, OrderStatus


class SalesOrderItemCreate(BaseModel):
    product_id: uuid.UUID
    ordered_qty: Decimal


class SalesOrderCreate(BaseModel):
    customer_id: Optional[uuid.UUID] = None
    remarks: Optional[str] = None
    expected_delivery: Optional[datetime] = None
    items: list[SalesOrderItemCreate]


class SalesOrderUpdate(BaseModel):
    remarks: Optional[str] = None
    items: Optional[list[SalesOrderItemCreate]] = None


class SalesOrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    ordered_qty: Decimal
    price: Decimal
    gst_rate: Decimal
    cgst: Decimal
    sgst: Decimal
    igst: Decimal
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class SalesOrderResponse(BaseModel):
    id: uuid.UUID
    order_number: str
    customer_id: uuid.UUID
    salesman_id: Optional[uuid.UUID]
    order_source: OrderSource
    status: OrderStatus
    remarks: Optional[str]
    expected_delivery: Optional[datetime]
    subtotal: Decimal
    discount: Decimal
    cgst: Decimal
    sgst: Decimal
    igst: Decimal
    round_off: Decimal
    total: Decimal
    items: list[SalesOrderItemResponse]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SalesOrderCancelResponse(BaseModel):
    id: uuid.UUID
    status: OrderStatus

    model_config = ConfigDict(from_attributes=True)
