import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PriceListCreate(BaseModel):
    name: str
    description: Optional[str] = None


class PriceListUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class PriceListResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class PriceListDeleteResponse(BaseModel):
    id: uuid.UUID
    deleted_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PriceListItemCreate(BaseModel):
    product_id: uuid.UUID
    price: Decimal


class PriceListItemUpdate(BaseModel):
    price: Decimal


class PriceListItemResponse(BaseModel):
    id: uuid.UUID
    price_list_id: uuid.UUID
    product_id: uuid.UUID
    price: Decimal

    model_config = ConfigDict(from_attributes=True)


class PriceListItemRemoveResponse(BaseModel):
    id: uuid.UUID
    removed: bool
