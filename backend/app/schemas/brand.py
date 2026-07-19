import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class BrandCreate(BaseModel):
    name: str
    logo: Optional[str] = None


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    logo: Optional[str] = None


class BrandResponse(BaseModel):
    id: uuid.UUID
    name: str
    logo: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class BrandDeleteResponse(BaseModel):
    id: uuid.UUID
    deleted_at: datetime

    model_config = ConfigDict(from_attributes=True)
