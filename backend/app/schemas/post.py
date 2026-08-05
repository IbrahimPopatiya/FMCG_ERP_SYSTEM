import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class PostCreate(BaseModel):
    product_id: uuid.UUID | None = None
    image: str | None = None
    # Only required when linking a post to a real product (product_id set).
    # Standalone posts - image only, from the admin "New post" screen - skip
    # these, see app/services/post.py::create_post for the defaults used then.
    product_name: str | None = None
    price: Decimal | None = None
    mrp: Decimal | None = None
    quantity_in_box: int | None = None


class PostStatusUpdate(BaseModel):
    is_active: bool


class PostRepostMany(BaseModel):
    post_ids: list[uuid.UUID]


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
    is_standalone: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
