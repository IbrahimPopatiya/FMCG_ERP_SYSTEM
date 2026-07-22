import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import Principal, get_current_principal, require_role
from app.core.enums import UserRole
from app.db.session import get_db
from app.models.user import User
from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryDeleteResponse,
)
from app.services import category as category_service
from app.services.category import ParentCategoryNotFoundError

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    # Both staff and customers browse categories (storefront catalog needs
    # this list) - only create/update/delete stay admin-only below.
    return category_service.list_categories(db)


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    try:
        return category_service.create_category(db, data)
    except ParentCategoryNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    try:
        category = category_service.update_category(db, category_id, data)
    except ParentCategoryNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


@router.delete("/{category_id}", response_model=CategoryDeleteResponse)
def delete_category(
    category_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    category = category_service.soft_delete_category(db, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category
