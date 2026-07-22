import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.enums import OrderStatus, PaymentStatus
from app.db.mixins import generate_uuid7
from app.models.customer import Customer
from app.models.invoice import Invoice
from app.models.payment import Payment
from app.models.sales_order import SalesOrder
from app.services.sales_order import get_sales_order


class OrderNotInvoiceableError(Exception):
    """Raised when the order isn't approved/loaded yet, so it can't be invoiced."""


class InvoiceAlreadyExistsError(Exception):
    """Raised when the order already has an invoice (one order = one invoice)."""


class InvoiceNotCancellableError(Exception):
    """Raised when trying to cancel an invoice that already has payments recorded."""


def generate_invoice(db: Session, order_id: uuid.UUID) -> Invoice | None:
    order = get_sales_order(db, order_id)
    if order is None:
        return None

    if order.status not in (OrderStatus.APPROVED, OrderStatus.LOADED):
        raise OrderNotInvoiceableError("Order must be approved or loaded before invoicing")

    existing = db.query(Invoice).filter(
        Invoice.sales_order_id == order.id, Invoice.deleted_at.is_(None)
    ).first()
    if existing is not None:
        raise InvoiceAlreadyExistsError("This order already has an invoice")

    customer = db.query(Customer).filter(Customer.id == order.customer_id).first()

    invoice = Invoice(
        sales_order_id=order.id,
        invoice_number=f"INV-{generate_uuid7().hex[:12].upper()}",
        place_of_supply=customer.state,
        subtotal=order.subtotal,
        discount=order.discount,
        cgst=order.cgst,
        sgst=order.sgst,
        igst=order.igst,
        round_off=order.round_off,
        total=order.total,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


<<<<<<< HEAD
def list_invoices(
    db: Session, page: int, page_size: int
) -> tuple[list[tuple[Invoice, uuid.UUID, str]], int]:
    """Joins SalesOrder in so callers get customer_id/order_number alongside
    each invoice - a bare Invoice row can't name who it's for."""
    query = (
        db.query(Invoice, SalesOrder.customer_id, SalesOrder.order_number)
        .join(SalesOrder, SalesOrder.id == Invoice.sales_order_id)
        .filter(Invoice.deleted_at.is_(None))
        .order_by(Invoice.invoice_date.desc())
    )
    total = query.count()
    rows = query.offset((page - 1) * page_size).limit(page_size).all()
    return rows, total


def get_invoice_with_order(db: Session, invoice_id: uuid.UUID) -> tuple[Invoice, uuid.UUID, str] | None:
    row = (
        db.query(Invoice, SalesOrder.customer_id, SalesOrder.order_number)
        .join(SalesOrder, SalesOrder.id == Invoice.sales_order_id)
        .filter(Invoice.id == invoice_id, Invoice.deleted_at.is_(None))
        .first()
    )
    return row
=======
def list_invoices(db: Session) -> list[Invoice]:
    return db.query(Invoice).filter(Invoice.deleted_at.is_(None)).all()
>>>>>>> phase-1


def get_invoice(db: Session, invoice_id: uuid.UUID) -> Invoice | None:
    return db.query(Invoice).filter(
        Invoice.id == invoice_id, Invoice.deleted_at.is_(None)
    ).first()


def cancel_invoice(db: Session, invoice_id: uuid.UUID, reason: str) -> Invoice | None:
    invoice = get_invoice(db, invoice_id)
    if invoice is None:
        return None

    if invoice.payment_status != PaymentStatus.UNPAID:
        raise InvoiceNotCancellableError("Only unpaid invoices can be cancelled")

    invoice.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(invoice)
    return invoice


def recompute_payment_status(db: Session, invoice_id: uuid.UUID) -> str:
    """Recomputes payment_status from cleared payments - the single place
    this is derived, so Deliveries and Payments both call it instead of
    each rewriting the unpaid/partial/paid comparison."""
    invoice = get_invoice(db, invoice_id)

    amounts = db.query(Payment.total_amount).filter(
        Payment.invoice_id == invoice_id, Payment.status == "cleared"
    ).all()
    cleared_sum = sum((row[0] for row in amounts), start=Decimal("0"))

    if cleared_sum <= 0:
        invoice.payment_status = PaymentStatus.UNPAID
    elif cleared_sum >= invoice.total:
        invoice.payment_status = PaymentStatus.PAID
    else:
        invoice.payment_status = PaymentStatus.PARTIAL

    db.commit()
    db.refresh(invoice)
    return invoice.payment_status
