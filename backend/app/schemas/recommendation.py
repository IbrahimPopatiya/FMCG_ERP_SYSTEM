import uuid

from pydantic import BaseModel


class FeedImpressionCreate(BaseModel):
    product_ids: list[uuid.UUID]
