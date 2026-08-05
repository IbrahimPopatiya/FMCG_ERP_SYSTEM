import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, model_validator


class PurchaseItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: Decimal
    purchase_price: Decimal


class PurchaseCreate(BaseModel):
    supplier_id: uuid.UUID
    warehouse_id: uuid.UUID
    purchase_date: Optional[datetime] = None
    items: list[PurchaseItemCreate]


class PurchaseItemUpdate(BaseModel):
    product_id: uuid.UUID
    quantity: Decimal
    purchase_price: Decimal


class PurchaseUpdate(BaseModel):
    supplier_id: Optional[uuid.UUID] = None
    warehouse_id: Optional[uuid.UUID] = None
    purchase_date: Optional[datetime] = None
    items: Optional[list[PurchaseItemUpdate]] = None


class PurchaseReceiveItem(BaseModel):
    item_id: uuid.UUID
    received_qty: Decimal


class PurchaseReceive(BaseModel):
    items: list[PurchaseReceiveItem]


class PurchaseCancel(BaseModel):
    reason: str


class PurchaseItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str = "Product"
    quantity: Decimal
    purchase_price: Decimal
    gst_rate: Decimal
    cgst: Decimal
    sgst: Decimal
    total: Decimal

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def inject_product_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
        product = getattr(data, "product", None)
        return {
            "id": data.id,
            "product_id": data.product_id,
            "product_name": product.name if product is not None else "Product",
            "quantity": data.quantity,
            "purchase_price": data.purchase_price,
            "gst_rate": data.gst_rate,
            "cgst": data.cgst,
            "sgst": data.sgst,
            "total": data.total,
        }


class PurchaseResponse(BaseModel):
    id: uuid.UUID
    supplier_id: uuid.UUID
    warehouse_id: uuid.UUID
    purchase_number: str
    purchase_date: datetime
    status: str
    subtotal: Decimal
    cgst: Decimal
    sgst: Decimal
    round_off: Decimal
    total: Decimal
    items: list[PurchaseItemResponse]

    model_config = ConfigDict(from_attributes=True)


class PurchaseReceiveResponse(BaseModel):
    id: uuid.UUID
    status: str
    movements_created: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PurchaseCancelResponse(BaseModel):
    id: uuid.UUID
    status: str

    model_config = ConfigDict(from_attributes=True)
