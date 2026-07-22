import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import require_staff, require_role
from app.core.enums import UserRole
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import Page
from app.schemas.invoice import (
    InvoiceResponse,
    InvoiceListItem,
    InvoiceCancelRequest,
    InvoiceCancelResponse,
)
from app.services import invoice as invoice_service
from app.services.invoice import (
    OrderNotInvoiceableError,
    InvoiceAlreadyExistsError,
    InvoiceNotCancellableError,
)

router = APIRouter(tags=["invoices"])


def _to_list_item(row: tuple) -> InvoiceListItem:
    invoice, customer_id, order_number = row
    return InvoiceListItem(
        id=invoice.id,
        sales_order_id=invoice.sales_order_id,
        order_number=order_number,
        customer_id=customer_id,
        invoice_number=invoice.invoice_number,
        invoice_date=invoice.invoice_date,
        place_of_supply=invoice.place_of_supply,
        subtotal=invoice.subtotal,
        discount=invoice.discount,
        cgst=invoice.cgst,
        sgst=invoice.sgst,
        igst=invoice.igst,
        round_off=invoice.round_off,
        total=invoice.total,
        payment_status=invoice.payment_status,
        tally_sync_status=invoice.tally_sync_status,
    )


@router.get("/invoices", response_model=Page[InvoiceListItem])
def list_invoices(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    rows, total = invoice_service.list_invoices(db, page, page_size)
    return Page(items=[_to_list_item(row) for row in rows], total=total, page=page, page_size=page_size)


@router.get("/invoices/{invoice_id}", response_model=InvoiceListItem)
def get_invoice(
    invoice_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    row = invoice_service.get_invoice_with_order(db, invoice_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return _to_list_item(row)


@router.post(
    "/orders/{order_id}/invoice", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED
)
def generate_invoice(
    order_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
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
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER)),
):
    try:
        invoice = invoice_service.cancel_invoice(db, invoice_id, data.reason)
    except InvoiceNotCancellableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if invoice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return InvoiceCancelResponse(id=invoice.id, updated_at=invoice.updated_at)
