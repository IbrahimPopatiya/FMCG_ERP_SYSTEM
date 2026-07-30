import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PostCreate(BaseModel):
    product_id: uuid.UUID | None = None
    image: str | None = None
    product_name: str
    price: Decimal
    mrp: Decimal
    quantity_in_box: int


class PostResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    image: str | None
    product_name: str
    price: Decimal
    mrp: Decimal
    quantity_in_box: int
    created_by: uuid.UUID
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
