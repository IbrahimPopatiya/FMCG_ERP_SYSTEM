import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services import user as user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    return user_service.create_user(db, data)


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: uuid.UUID, data: UserUpdate, db: Session = Depends(get_db)):
    user = user_service.update_user(db, user_id, data)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
