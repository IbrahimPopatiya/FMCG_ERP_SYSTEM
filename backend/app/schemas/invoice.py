import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.core.enums import PaymentStatus, TallySyncStatus


class InvoiceResponse(BaseModel):
    id: uuid.UUID
    sales_order_id: uuid.UUID
    invoice_number: str
    invoice_date: datetime
    place_of_supply: str
    subtotal: Decimal
    discount: Decimal
    cgst: Decimal
    sgst: Decimal
    igst: Decimal
    round_off: Decimal
    total: Decimal
    payment_status: PaymentStatus
    tally_sync_status: TallySyncStatus

    model_config = ConfigDict(from_attributes=True)


class InvoiceListItem(BaseModel):
    """List/detail view - adds customer_id and order_number (joined from the
    sales order) since a bare Invoice row can't name who it's for."""

    id: uuid.UUID
    sales_order_id: uuid.UUID
    order_number: str
    customer_id: uuid.UUID
    invoice_number: str
    invoice_date: datetime
    place_of_supply: str
    subtotal: Decimal
    discount: Decimal
    cgst: Decimal
    sgst: Decimal
    igst: Decimal
    round_off: Decimal
    total: Decimal
    payment_status: PaymentStatus
    tally_sync_status: TallySyncStatus


class InvoiceCancelRequest(BaseModel):
    reason: str


class InvoiceCancelResponse(BaseModel):
    id: uuid.UUID
    status: Literal["cancelled"] = "cancelled"
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
