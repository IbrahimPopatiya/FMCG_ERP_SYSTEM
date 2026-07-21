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
    approved_qty: Decimal
    loaded_qty: Decimal
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


class SalesOrderApproveItem(BaseModel):
    item_id: uuid.UUID
    approved_qty: Decimal


class SalesOrderApproveRequest(BaseModel):
    items: list[SalesOrderApproveItem]


class SalesOrderApproveItemResponse(BaseModel):
    id: uuid.UUID
    ordered_qty: Decimal
    approved_qty: Decimal

    model_config = ConfigDict(from_attributes=True)


class SalesOrderApproveResponse(BaseModel):
    id: uuid.UUID
    status: OrderStatus
    items: list[SalesOrderApproveItemResponse]
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SalesOrderLoadItem(BaseModel):
    item_id: uuid.UUID
    loaded_qty: Decimal


class SalesOrderLoadRequest(BaseModel):
    items: list[SalesOrderLoadItem]


class SalesOrderLoadItemResponse(BaseModel):
    id: uuid.UUID
    approved_qty: Decimal
    loaded_qty: Decimal

    model_config = ConfigDict(from_attributes=True)


class SalesOrderLoadResponse(BaseModel):
    id: uuid.UUID
    status: OrderStatus
    items: list[SalesOrderLoadItemResponse]
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
