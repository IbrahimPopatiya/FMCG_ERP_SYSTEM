import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.product import ProductCatalogResponse


class SavedProductCreate(BaseModel):
    product_id: uuid.UUID


class SavedProductResponse(BaseModel):
    id: uuid.UUID
    product: ProductCatalogResponse
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
