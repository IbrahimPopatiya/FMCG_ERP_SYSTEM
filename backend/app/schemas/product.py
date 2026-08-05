import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.core.enums import ProductStatus


class ProductCreate(BaseModel):
    name: str
    category_id: Optional[uuid.UUID] = None
    brand_id: Optional[uuid.UUID] = None
    unit: str
    units_per_box: int = 1
    mrp: Decimal
    selling_price: Decimal
    gst_rate: Decimal = Decimal("0")
    minimum_stock: int
    image: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    brand_id: Optional[uuid.UUID] = None
    unit: Optional[str] = None
    units_per_box: Optional[int] = None
    mrp: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    gst_rate: Optional[Decimal] = None
    minimum_stock: Optional[int] = None
    image: Optional[str] = None


class ProductStatusUpdate(BaseModel):
    status: ProductStatus


class ProductResponse(BaseModel):
    id: uuid.UUID
    sku: str
    name: str
    category_id: Optional[uuid.UUID]
    brand_id: Optional[uuid.UUID]
    unit: str
    units_per_box: int
    mrp: Decimal
    selling_price: Decimal
    gst_rate: Decimal
    minimum_stock: int
    image: Optional[str]
    status: ProductStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductCatalogResponse(BaseModel):
    id: uuid.UUID
    sku: str
    name: str
    category_id: Optional[uuid.UUID]
    brand_id: Optional[uuid.UUID]
    unit: str
    units_per_box: int
    mrp: Decimal
    effective_price: Decimal
    gst_rate: Decimal
    image: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class ProductDeleteResponse(BaseModel):
    id: uuid.UUID
    deleted_at: datetime

    model_config = ConfigDict(from_attributes=True)
