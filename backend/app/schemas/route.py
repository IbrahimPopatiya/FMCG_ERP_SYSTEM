import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.core.enums import RouteStatus


class RouteCreate(BaseModel):
    name: str
    salesman_id: Optional[uuid.UUID] = None


class RouteUpdate(BaseModel):
    name: Optional[str] = None


class RouteSalesmanUpdate(BaseModel):
    salesman_id: uuid.UUID


class RouteResponse(BaseModel):
    id: uuid.UUID
    name: str
    salesman_id: Optional[uuid.UUID]
    status: RouteStatus

    model_config = ConfigDict(from_attributes=True)


class RouteDeleteResponse(BaseModel):
    id: uuid.UUID
    deleted_at: datetime

    model_config = ConfigDict(from_attributes=True)
