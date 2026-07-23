import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, model_validator

from app.core.enums import PaymentRecordStatus


class PaymentCreate(BaseModel):
    invoice_id: uuid.UUID
    driver_id: Optional[uuid.UUID] = None
    cash_amount: Decimal = Decimal("0")
    upi_amount: Decimal = Decimal("0")
    cheque_amount: Decimal = Decimal("0")
    reference_number: Optional[str] = None

    @model_validator(mode="after")
    def at_least_one_amount(self):
        if self.cash_amount <= 0 and self.upi_amount <= 0 and self.cheque_amount <= 0:
            raise ValueError("At least one of cash_amount, upi_amount, cheque_amount must be greater than zero")
        return self


class PaymentResponse(BaseModel):
    id: uuid.UUID
    invoice_id: uuid.UUID
    total_amount: Decimal
    status: PaymentRecordStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentListItem(BaseModel):
    """List/detail view - adds invoice_number/customer_id/order_number
    (joined from Invoice + SalesOrder) since a bare Payment row only carries ids."""

    id: uuid.UUID
    invoice_id: uuid.UUID
    invoice_number: str
    order_number: str
    customer_id: uuid.UUID
    driver_id: Optional[uuid.UUID]
    payment_date: datetime
    cash_amount: Decimal
    upi_amount: Decimal
    cheque_amount: Decimal
    total_amount: Decimal
    reference_number: Optional[str]
    status: PaymentRecordStatus


class PaymentBounceRequest(BaseModel):
    reason: str


class PaymentStatusResponse(BaseModel):
    id: uuid.UUID
    status: PaymentRecordStatus
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
