import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.core.enums import CreditNoteStatus


class CreditNoteResponse(BaseModel):
    id: uuid.UUID
    return_id: uuid.UUID
    customer_id: uuid.UUID
    amount: Decimal
    status: CreditNoteStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CreditNoteStatusResponse(BaseModel):
    id: uuid.UUID
    status: CreditNoteStatus
    approved_by: Optional[uuid.UUID]
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
