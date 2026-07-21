import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.brand import (
    BrandCreate,
    BrandUpdate,
    BrandResponse,
    BrandDeleteResponse,
)
from app.services import brand as brand_service

router = APIRouter(prefix="/brands", tags=["brands"])


@router.get("", response_model=list[BrandResponse])
def list_brands(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return brand_service.list_brands(db)


@router.post("", response_model=BrandResponse, status_code=status.HTTP_201_CREATED)
def create_brand(
    data: BrandCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return brand_service.create_brand(db, data)


@router.patch("/{brand_id}", response_model=BrandResponse)
def update_brand(
    brand_id: uuid.UUID,
    data: BrandUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = brand_service.update_brand(db, brand_id, data)
    if brand is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    return brand


@router.delete("/{brand_id}", response_model=BrandDeleteResponse)
def delete_brand(
    brand_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    brand = brand_service.soft_delete_brand(db, brand_id)
    if brand is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    return brand
