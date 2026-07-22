import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_staff
from app.db.session import get_db
from app.models.user import User
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    PaymentBounceRequest,
    PaymentStatusResponse,
)
from app.services import payment as payment_service
from app.services.payment import (
    InvoiceNotFoundError,
    PaymentNotVerifiableError,
    PaymentNotBounceableError,
)

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("", response_model=list[PaymentResponse])
def list_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    return payment_service.list_payments(db)


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def record_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        return payment_service.record_payment(db, data, current_user.id)
    except InvoiceNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{payment_id}/verify", response_model=PaymentStatusResponse)
def verify_payment(
    payment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        payment = payment_service.verify_payment(db, payment_id)
    except PaymentNotVerifiableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return payment


@router.post("/{payment_id}/bounce", response_model=PaymentStatusResponse)
def bounce_payment(
    payment_id: uuid.UUID,
    data: PaymentBounceRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        payment = payment_service.bounce_payment(db, payment_id, data.reason)
    except PaymentNotBounceableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return payment
