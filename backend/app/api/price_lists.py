import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.price_list import (
    PriceListCreate,
    PriceListUpdate,
    PriceListResponse,
    PriceListDeleteResponse,
    PriceListItemCreate,
    PriceListItemUpdate,
    PriceListItemResponse,
    PriceListItemRemoveResponse,
)
from app.services import price_list as price_list_service
from app.services.price_list import DuplicatePriceListItemError

router = APIRouter(prefix="/price-lists", tags=["price-lists"])


@router.get("", response_model=list[PriceListResponse])
def list_price_lists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return price_list_service.list_price_lists(db)


@router.post("", response_model=PriceListResponse, status_code=status.HTTP_201_CREATED)
def create_price_list(
    data: PriceListCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return price_list_service.create_price_list(db, data)


@router.patch("/{price_list_id}", response_model=PriceListResponse)
def update_price_list(
    price_list_id: uuid.UUID,
    data: PriceListUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    price_list = price_list_service.update_price_list(db, price_list_id, data)
    if price_list is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price list not found")
    return price_list


@router.delete("/{price_list_id}", response_model=PriceListDeleteResponse)
def delete_price_list(
    price_list_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    price_list = price_list_service.soft_delete_price_list(db, price_list_id)
    if price_list is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price list not found")
    return price_list


@router.post(
    "/{price_list_id}/items",
    response_model=PriceListItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_price_list_item(
    price_list_id: uuid.UUID,
    data: PriceListItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        item = price_list_service.create_price_list_item(db, price_list_id, data)
    except DuplicatePriceListItemError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price list not found")
    return item


@router.patch("/{price_list_id}/items/{item_id}", response_model=PriceListItemResponse)
def update_price_list_item(
    price_list_id: uuid.UUID,
    item_id: uuid.UUID,
    data: PriceListItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = price_list_service.update_price_list_item(db, price_list_id, item_id, data.discount_percent)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price list item not found")
    return item


@router.delete("/{price_list_id}/items/{item_id}", response_model=PriceListItemRemoveResponse)
def delete_price_list_item(
    price_list_id: uuid.UUID,
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    removed = price_list_service.remove_price_list_item(db, price_list_id, item_id)
    if not removed:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Price list item not found")
    return {"id": item_id, "removed": True}
