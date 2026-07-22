import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_staff
from app.db.session import get_db
from app.models.user import User
from app.schemas.invoice import InvoiceResponse, InvoiceCancelRequest, InvoiceCancelResponse
from app.services import invoice as invoice_service
from app.services.invoice import (
    OrderNotInvoiceableError,
    InvoiceAlreadyExistsError,
    InvoiceNotCancellableError,
)

router = APIRouter(tags=["invoices"])


@router.get("/invoices", response_model=list[InvoiceResponse])
def list_invoices(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    return invoice_service.list_invoices(db)


@router.post(
    "/orders/{order_id}/invoice", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED
)
def generate_invoice(
    order_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        invoice = invoice_service.generate_invoice(db, order_id)
    except OrderNotInvoiceableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except InvoiceAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if invoice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return invoice


@router.post("/invoices/{invoice_id}/cancel", response_model=InvoiceCancelResponse)
def cancel_invoice(
    invoice_id: uuid.UUID,
    data: InvoiceCancelRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        invoice = invoice_service.cancel_invoice(db, invoice_id, data.reason)
    except InvoiceNotCancellableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if invoice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return InvoiceCancelResponse(id=invoice.id, updated_at=invoice.updated_at)
