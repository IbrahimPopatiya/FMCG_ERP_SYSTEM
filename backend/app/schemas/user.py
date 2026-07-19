import uuid
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    full_name: str
    mobile: str
    email: EmailStr
    password: str
    role: str  # admin, salesman, driver, manager, dispatcher, cashier


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None


class UserResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    mobile: str
    email: EmailStr
    role: str
    status: str

    class Config:
        from_attributes = True
