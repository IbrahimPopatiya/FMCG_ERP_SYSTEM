import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import require_staff
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import Page
from app.schemas.payment import (
    PaymentCreate,
    PaymentResponse,
    PaymentListItem,
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


<<<<<<< HEAD
def _to_list_item(row: tuple) -> PaymentListItem:
    payment, invoice_number, customer_id, order_number = row
    return PaymentListItem(
        id=payment.id,
        invoice_id=payment.invoice_id,
        invoice_number=invoice_number,
        order_number=order_number,
        customer_id=customer_id,
        driver_id=payment.driver_id,
        payment_date=payment.payment_date,
        cash_amount=payment.cash_amount,
        upi_amount=payment.upi_amount,
        cheque_amount=payment.cheque_amount,
        total_amount=payment.total_amount,
        reference_number=payment.reference_number,
        status=payment.status,
    )


@router.get("", response_model=Page[PaymentListItem])
def list_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    rows, total = payment_service.list_payments(db, page, page_size)
    return Page(items=[_to_list_item(row) for row in rows], total=total, page=page, page_size=page_size)


@router.get("/{payment_id}", response_model=PaymentListItem)
def get_payment(
    payment_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    row = payment_service.get_payment_with_context(db, payment_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return _to_list_item(row)
=======
@router.get("", response_model=list[PaymentResponse])
def list_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    return payment_service.list_payments(db)
>>>>>>> phase-1


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
