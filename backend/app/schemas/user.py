import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr

from app.core.enums import UserRole, UserStatus


class UserCreate(BaseModel):
    full_name: str
    mobile: str
    email: EmailStr
    password: str
    role: UserRole


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None


class UserStatusUpdate(BaseModel):
    status: UserStatus


class UserResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    mobile: str
    email: EmailStr
    role: UserRole
    status: UserStatus

    model_config = ConfigDict(from_attributes=True)


class UserDeleteResponse(BaseModel):
    id: uuid.UUID
    deleted_at: datetime

    model_config = ConfigDict(from_attributes=True)
