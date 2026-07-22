import uuid

from sqlalchemy.orm import Session

from app.core.enums import PaymentRecordStatus
from app.models.payment import Payment
from app.schemas.payment import PaymentCreate
from app.services import invoice as invoice_service


class InvoiceNotFoundError(Exception):
    """Raised when the invoice_id on a new payment doesn't exist."""


class PaymentNotVerifiableError(Exception):
    """Raised when verifying a payment that isn't pending."""


class PaymentNotBounceableError(Exception):
    """Raised when bouncing a payment that isn't pending."""


def record_payment(db: Session, data: PaymentCreate, created_by: uuid.UUID) -> Payment:
    invoice = invoice_service.get_invoice(db, data.invoice_id)
    if invoice is None:
        raise InvoiceNotFoundError("Invoice not found")

    payment = Payment(
        invoice_id=data.invoice_id,
        driver_id=data.driver_id,
        cash_amount=data.cash_amount,
        upi_amount=data.upi_amount,
        cheque_amount=data.cheque_amount,
        total_amount=data.cash_amount + data.upi_amount + data.cheque_amount,
        reference_number=data.reference_number,
        status=PaymentRecordStatus.PENDING,
        created_by=created_by,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def list_payments(db: Session) -> list[Payment]:
    return db.query(Payment).all()


def get_payment(db: Session, payment_id: uuid.UUID) -> Payment | None:
    return db.query(Payment).filter(Payment.id == payment_id).first()


def verify_payment(db: Session, payment_id: uuid.UUID) -> Payment | None:
    payment = get_payment(db, payment_id)
    if payment is None:
        return None

    if payment.status != PaymentRecordStatus.PENDING:
        raise PaymentNotVerifiableError("Only a pending payment can be verified")

    payment.status = PaymentRecordStatus.CLEARED
    db.commit()
    db.refresh(payment)

    invoice_service.recompute_payment_status(db, payment.invoice_id)
    return payment


def bounce_payment(db: Session, payment_id: uuid.UUID, reason: str) -> Payment | None:
    payment = get_payment(db, payment_id)
    if payment is None:
        return None

    if payment.status != PaymentRecordStatus.PENDING:
        raise PaymentNotBounceableError("Only a pending payment can be bounced")

    payment.status = PaymentRecordStatus.BOUNCED
    db.commit()
    db.refresh(payment)
    return payment
