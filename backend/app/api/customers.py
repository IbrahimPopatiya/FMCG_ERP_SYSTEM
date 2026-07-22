import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_customer
from app.db.session import get_db
from app.models.customer import Customer
from app.models.user import User
from app.schemas.common import Page
from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerStatusUpdate,
    CustomerLocationUpdate,
    CustomerLocationResponse,
    CustomerResponse,
    CustomerMeResponse,
    CustomerDeleteResponse,
    CustomerDuesResponse,
    CustomerLedgerResponse,
    DueInvoiceItem,
)
from app.services import customer as customer_service
from app.services import invoice as invoice_service
from app.services.customer import DuplicateCustomerError

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("/me", response_model=CustomerMeResponse)
def get_current_customer_profile(current_customer: Customer = Depends(require_customer)):
    return current_customer


@router.get("/me/dues", response_model=CustomerDuesResponse)
def get_current_customer_dues(
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(require_customer),
):
    rows, total_due = invoice_service.list_dues_for_customer(db, current_customer.id)
    return CustomerDuesResponse(
        total_due=total_due,
        invoices=[
            DueInvoiceItem(
                invoice_id=invoice.id,
                invoice_number=invoice.invoice_number,
                order_id=order_id,
                order_number=order_number,
                invoice_date=invoice.invoice_date,
                total=invoice.total,
                balance=balance,
                payment_status=invoice.payment_status,
            )
            for invoice, order_id, order_number, balance in rows
        ],
    )


@router.get("/me/ledger", response_model=CustomerLedgerResponse)
def get_current_customer_ledger(
    db: Session = Depends(get_db),
    current_customer: Customer = Depends(require_customer),
):
    return invoice_service.get_customer_ledger(db, current_customer.id, current_customer.credit_limit)


@router.get("", response_model=Page[CustomerMeResponse])
def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    items, total = customer_service.list_customers(db, page, page_size, search)
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/{customer_id}", response_model=CustomerMeResponse)
def get_customer(
    customer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = customer_service.get_customer(db, customer_id)
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return customer_service.create_customer(db, data)
    except DuplicateCustomerError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.patch("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: uuid.UUID,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        customer = customer_service.update_customer(db, customer_id, data)
    except DuplicateCustomerError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.patch("/{customer_id}/status", response_model=CustomerResponse)
def update_customer_status(
    customer_id: uuid.UUID,
    data: CustomerStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = customer_service.set_customer_status(db, customer_id, data.status)
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.patch("/{customer_id}/location", response_model=CustomerLocationResponse)
def update_customer_location(
    customer_id: uuid.UUID,
    data: CustomerLocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = customer_service.update_customer_location(
        db, customer_id, data.latitude, data.longitude
    )
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.delete("/{customer_id}", response_model=CustomerDeleteResponse)
def delete_customer(
    customer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = customer_service.soft_delete_customer(db, customer_id)
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer
