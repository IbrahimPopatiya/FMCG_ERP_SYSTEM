import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.core.enums import ReturnReason, ReturnStatus


class ReturnItemCreate(BaseModel):
    product_id: uuid.UUID
    quantity: Decimal
    reason: ReturnReason


class ReturnCreate(BaseModel):
    invoice_id: uuid.UUID
    warehouse_id: uuid.UUID
    reason: ReturnReason
    remarks: Optional[str] = None
    photo: Optional[str] = None
    items: list[ReturnItemCreate]


class ReturnRejectRequest(BaseModel):
    reason: str


class ReturnItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: Decimal
    reason: str

    model_config = ConfigDict(from_attributes=True)


class ReturnResponse(BaseModel):
    id: uuid.UUID
    invoice_id: uuid.UUID
    status: ReturnStatus
    items: list[ReturnItemResponse]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReturnStatusResponse(BaseModel):
    id: uuid.UUID
    status: ReturnStatus
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReturnCompleteResponse(BaseModel):
    id: uuid.UUID
    status: ReturnStatus
    movements_created: int
    credit_note_id: uuid.UUID
    updated_at: datetime
