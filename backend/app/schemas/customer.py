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


class CustomerResponse(BaseModel):
    id: uuid.UUID
    customer_code: str
    business_name: str
    status: CustomerStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
