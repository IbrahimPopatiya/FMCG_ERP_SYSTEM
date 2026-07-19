import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductStatusUpdate,
    ProductResponse,
    ProductDeleteResponse,
)
from app.services import product as product_service
from app.services.product import DuplicateProductError

router = APIRouter(prefix="/products", tags=["products"])


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return product_service.create_product(db, data)
    except DuplicateProductError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        product = product_service.update_product(db, product_id, data)
    except DuplicateProductError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.patch("/{product_id}/status", response_model=ProductResponse)
def update_product_status(
    product_id: uuid.UUID,
    data: ProductStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = product_service.set_product_status(db, product_id, data.status)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.delete("/{product_id}", response_model=ProductDeleteResponse)
def delete_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = product_service.soft_delete_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product
