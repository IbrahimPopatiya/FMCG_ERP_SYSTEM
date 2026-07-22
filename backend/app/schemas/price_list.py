import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


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
    discount_percent: Decimal = Field(ge=0, le=100)


class PriceListItemUpdate(BaseModel):
    discount_percent: Decimal = Field(ge=0, le=100)


class PriceListItemResponse(BaseModel):
    id: uuid.UUID
    price_list_id: uuid.UUID
    product_id: uuid.UUID
    discount_percent: Decimal

    model_config = ConfigDict(from_attributes=True)


class PriceListItemRemoveResponse(BaseModel):
    id: uuid.UUID
    removed: bool
