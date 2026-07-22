import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.enums import DeliveryStatus, OrderStatus
from app.models.delivery import Delivery
from app.models.payment import Payment
from app.schemas.delivery import DeliveryCompleteRequest, DeliveryCreate
from app.services.invoice import get_invoice, recompute_payment_status
from app.services.sales_order import get_sales_order


class InvoiceNotFoundError(Exception):
    """Raised when the invoice_id on a new delivery doesn't exist."""


class DeliveryAlreadyExistsError(Exception):
    """Raised when the invoice already has a delivery (one invoice = one delivery)."""


class DeliveryNotStartableError(Exception):
    """Raised when starting a delivery that isn't pending."""


class DeliveryNotArrivableError(Exception):
    """Raised when marking arrival on a delivery that isn't out for delivery."""


class DeliveryNotCompletableError(Exception):
    """Raised when completing a delivery that isn't out for delivery."""


class DeliveryNotFailableError(Exception):
    """Raised when failing a delivery that isn't out for delivery."""


def create_delivery(db: Session, data: DeliveryCreate) -> Delivery:
    invoice = get_invoice(db, data.invoice_id)
    if invoice is None:
        raise InvoiceNotFoundError("Invoice not found")

    existing = db.query(Delivery).filter(Delivery.invoice_id == data.invoice_id).first()
    if existing is not None:
        raise DeliveryAlreadyExistsError("This invoice already has a delivery")

    delivery = Delivery(
        invoice_id=data.invoice_id,
        vehicle_id=data.vehicle_id,
        driver_id=data.driver_id,
        status=DeliveryStatus.PENDING,
    )
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return delivery


def list_deliveries(db: Session) -> list[Delivery]:
    return db.query(Delivery).all()


def get_delivery(db: Session, delivery_id: uuid.UUID) -> Delivery | None:
    return db.query(Delivery).filter(Delivery.id == delivery_id).first()


def start_delivery(db: Session, delivery_id: uuid.UUID, departure_time) -> Delivery | None:
    delivery = get_delivery(db, delivery_id)
    if delivery is None:
        return None

    if delivery.status != DeliveryStatus.PENDING:
        raise DeliveryNotStartableError("Only a pending delivery can be started")

    delivery.status = DeliveryStatus.OUT_FOR_DELIVERY
    delivery.departure_time = departure_time or datetime.now(timezone.utc)
    db.commit()
    db.refresh(delivery)
    return delivery


def mark_arrived(db: Session, delivery_id: uuid.UUID, latitude, longitude) -> Delivery | None:
    delivery = get_delivery(db, delivery_id)
    if delivery is None:
        return None

    if delivery.status != DeliveryStatus.OUT_FOR_DELIVERY:
        raise DeliveryNotArrivableError("Delivery must be out for delivery to mark arrival")

    delivery.arrival_time = datetime.now(timezone.utc)
    delivery.latitude = latitude
    delivery.longitude = longitude
    db.commit()
    db.refresh(delivery)
    return delivery


def complete_delivery(
    db: Session, delivery_id: uuid.UUID, data: DeliveryCompleteRequest
) -> tuple[Delivery, Payment, str] | None:
    delivery = get_delivery(db, delivery_id)
    if delivery is None:
        return None

    if delivery.status != DeliveryStatus.OUT_FOR_DELIVERY:
        raise DeliveryNotCompletableError("Delivery must be out for delivery to complete")

    delivery.status = DeliveryStatus.DELIVERED
    delivery.completion_time = datetime.now(timezone.utc)
    delivery.latitude = data.latitude
    delivery.longitude = data.longitude
    delivery.customer_signature = data.customer_signature
    delivery.remarks = data.remarks

    payment = Payment(
        invoice_id=delivery.invoice_id,
        driver_id=delivery.driver_id,
        cash_amount=data.cash_received,
        upi_amount=data.upi_received,
        total_amount=data.cash_received + data.upi_received,
        status="cleared",
    )
    db.add(payment)
    db.flush()

    invoice_payment_status = recompute_payment_status(db, delivery.invoice_id)

    invoice = get_invoice(db, delivery.invoice_id)
    order = get_sales_order(db, invoice.sales_order_id)
    order.status = OrderStatus.DELIVERED

    db.commit()
    db.refresh(delivery)
    db.refresh(payment)
    return delivery, payment, invoice_payment_status


def fail_delivery(db: Session, delivery_id: uuid.UUID, reason: str) -> Delivery | None:
    delivery = get_delivery(db, delivery_id)
    if delivery is None:
        return None

    if delivery.status != DeliveryStatus.OUT_FOR_DELIVERY:
        raise DeliveryNotFailableError("Delivery must be out for delivery to mark as failed")

    delivery.status = DeliveryStatus.FAILED
    delivery.remarks = reason
    db.commit()
    db.refresh(delivery)
    return delivery
