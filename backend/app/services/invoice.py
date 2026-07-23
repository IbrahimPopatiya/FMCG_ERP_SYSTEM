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


def list_dues_for_customer(
    db: Session, customer_id: uuid.UUID
) -> tuple[list[tuple[Invoice, uuid.UUID, str, Decimal]], Decimal]:
    """Every unpaid/partial invoice for a customer, plus the total balance
    still owed across all of them - `Invoice.payment_status` says paid or
    not, but not how much remains, so this recomputes each invoice's balance
    from its cleared payments (same logic as recompute_payment_status)."""
    rows = (
        db.query(Invoice, SalesOrder.id, SalesOrder.order_number)
        .join(SalesOrder, SalesOrder.id == Invoice.sales_order_id)
        .filter(
            SalesOrder.customer_id == customer_id,
            Invoice.payment_status != PaymentStatus.PAID,
            Invoice.deleted_at.is_(None),
        )
        .order_by(Invoice.invoice_date.desc())
        .all()
    )

    results = []
    total_due = Decimal("0")
    for invoice, order_id, order_number in rows:
        cleared = db.query(Payment.total_amount).filter(
            Payment.invoice_id == invoice.id, Payment.status == "cleared"
        ).all()
        cleared_sum = sum((row[0] for row in cleared), start=Decimal("0"))
        balance = invoice.total - cleared_sum
        total_due += balance
        results.append((invoice, order_id, order_number, balance))

    return results, total_due


def get_customer_ledger(db: Session, customer_id: uuid.UUID, credit_limit: Decimal) -> dict:
    """Combines every invoice (debit) and cleared payment (credit) for a
    customer into one chronological running balance - there's no separate
    ledger/transactions table, so this is assembled from the same two
    sources the rest of billing already uses."""
    invoice_rows = (
        db.query(Invoice, SalesOrder.order_number, SalesOrder.order_date)
        .join(SalesOrder, SalesOrder.id == Invoice.sales_order_id)
        .filter(SalesOrder.customer_id == customer_id, Invoice.deleted_at.is_(None))
        .all()
    )
    payment_rows = (
        db.query(Payment, Invoice.invoice_number)
        .join(Invoice, Invoice.id == Payment.invoice_id)
        .join(SalesOrder, SalesOrder.id == Invoice.sales_order_id)
        .filter(SalesOrder.customer_id == customer_id, Payment.status == "cleared")
        .all()
    )

    events = []
    for invoice, order_number, _order_date in invoice_rows:
        events.append(
            {
                "date": invoice.invoice_date,
                "type": "order",
                "reference": order_number,
                "description": f"Order {order_number}",
                "amount": invoice.total,
            }
        )
    for payment, invoice_number in payment_rows:
        if payment.cash_amount > 0:
            method = "Cash"
        elif payment.upi_amount > 0:
            method = "UPI"
        elif payment.cheque_amount > 0:
            method = "Cheque"
        else:
            method = "Payment"
        events.append(
            {
                "date": payment.payment_date,
                "type": "payment",
                "reference": payment.reference_number or invoice_number,
                "description": f"Payment received ({method})",
                "amount": payment.total_amount,
            }
        )

    events.sort(key=lambda e: e["date"])

    balance = Decimal("0")
    transactions = []
    for event in events:
        balance += event["amount"] if event["type"] == "order" else -event["amount"]
        transactions.append({**event, "balance": balance})
    transactions.reverse()  # newest first, matching the invoice/dues list convention

    _dues_rows, total_due = list_dues_for_customer(db, customer_id)
    last_order_date = max((d for _, _, d in invoice_rows), default=None)
    total_invoiced = sum((i.total for i, _, _ in invoice_rows), start=Decimal("0"))
    total_payments = sum((p.total_amount for p, _ in payment_rows), start=Decimal("0"))

    return {
        "credit_limit": credit_limit,
        "available_credit": max(Decimal("0"), credit_limit - balance),
        "current_balance": balance,
        "total_invoiced": total_invoiced,
        "total_payments": total_payments,
        "outstanding_invoices": len(_dues_rows),
        "last_order_date": last_order_date,
        "transactions": transactions,
    }


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
