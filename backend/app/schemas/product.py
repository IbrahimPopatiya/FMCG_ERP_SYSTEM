import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.core.enums import ProductStatus


class ProductCreate(BaseModel):
    sku: str
    barcode: str
    name: str
    category_id: Optional[uuid.UUID] = None
    brand_id: Optional[uuid.UUID] = None
    unit: str
    packing: str
    mrp: Decimal
    selling_price: Decimal
    gst_rate: Decimal
    minimum_stock: int
    image: Optional[str] = None


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    barcode: Optional[str] = None
    name: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    brand_id: Optional[uuid.UUID] = None
    unit: Optional[str] = None
    packing: Optional[str] = None
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
    barcode: str
    name: str
    category_id: Optional[uuid.UUID]
    brand_id: Optional[uuid.UUID]
    unit: str
    packing: str
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
    packing: str
    mrp: Decimal
    effective_price: Decimal
    gst_rate: Decimal
    image: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class ProductDeleteResponse(BaseModel):
    id: uuid.UUID
    deleted_at: datetime

    model_config = ConfigDict(from_attributes=True)
