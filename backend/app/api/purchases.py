import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import Page
from app.schemas.purchase import (
    PurchaseCreate,
    PurchaseUpdate,
    PurchaseReceive,
    PurchaseResponse,
    PurchaseReceiveResponse,
    PurchaseCancelResponse,
)
from app.services import purchase as purchase_service
from app.services.purchase import (
    ProductNotFoundError,
    PurchaseNotEditableError,
    PurchaseNotReceivableError,
)

router = APIRouter(prefix="/purchases", tags=["purchases"])


@router.get("", response_model=Page[PurchaseResponse])
def list_purchases(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = purchase_service.list_purchases(db, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(
    purchase_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    purchase = purchase_service.get_purchase(db, purchase_id)
    if purchase is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase not found")
    return purchase


@router.post("", response_model=PurchaseResponse, status_code=status.HTTP_201_CREATED)
def create_purchase(
    data: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return purchase_service.create_purchase(db, data, current_user.id)
    except ProductNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{purchase_id}", response_model=PurchaseResponse)
def update_purchase(
    purchase_id: uuid.UUID,
    data: PurchaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        purchase = purchase_service.update_purchase(db, purchase_id, data, current_user.id)
    except (ProductNotFoundError,) as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PurchaseNotEditableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if purchase is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase not found")
    return purchase


@router.post("/{purchase_id}/receive", response_model=PurchaseReceiveResponse)
def receive_purchase(
    purchase_id: uuid.UUID,
    data: PurchaseReceive,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        purchase = purchase_service.receive_purchase(db, purchase_id, data, current_user.id)
    except ProductNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PurchaseNotReceivableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if purchase is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase not found")

    return PurchaseReceiveResponse(
        id=purchase.id,
        status=purchase.status,
        movements_created=len(data.items),
        updated_at=purchase.updated_at,
    )


@router.post("/{purchase_id}/cancel", response_model=PurchaseCancelResponse)
def cancel_purchase(
    purchase_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        purchase = purchase_service.cancel_purchase(db, purchase_id, current_user.id)
    except PurchaseNotEditableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if purchase is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase not found")
    return purchase
