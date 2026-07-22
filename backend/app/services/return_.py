import uuid
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.enums import CreditNoteStatus, MovementType, ReturnReason, ReturnStatus
from app.models.credit_note import CreditNote
from app.models.return_ import Return, ReturnItem
from app.schemas.return_ import ReturnCreate
from app.services import invoice as invoice_service
from app.services.inventory import record_movement
from app.services.sales_order import get_sales_order

_REASON_TO_MOVEMENT_TYPE = {
    ReturnReason.DAMAGED: MovementType.DAMAGED,
    ReturnReason.EXPIRED: MovementType.EXPIRED,
    ReturnReason.WRONG_ITEM: MovementType.RETURNED_IN,
    ReturnReason.NOT_NEEDED: MovementType.RETURNED_IN,
}


class InvoiceNotFoundError(Exception):
    """Raised when the invoice_id on a new return doesn't exist."""


class ReturnNotApprovableError(Exception):
    """Raised when approving a return that isn't requested."""


class ReturnNotRejectableError(Exception):
    """Raised when rejecting a return that isn't requested."""


class ReturnNotCompletableError(Exception):
    """Raised when completing a return that isn't approved."""


class ReturnItemNotInOriginalOrderError(Exception):
    """Raised when a returned product has no matching line on the original order."""


def create_return(db: Session, data: ReturnCreate, created_by: uuid.UUID) -> Return:
    invoice = invoice_service.get_invoice(db, data.invoice_id)
    if invoice is None:
        raise InvoiceNotFoundError("Invoice not found")

    items = [
        ReturnItem(product_id=item.product_id, quantity=item.quantity, reason=item.reason)
        for item in data.items
    ]

    ret = Return(
        invoice_id=data.invoice_id,
        warehouse_id=data.warehouse_id,
        reason=data.reason,
        remarks=data.remarks,
        photo=data.photo,
        status=ReturnStatus.REQUESTED,
        created_by=created_by,
        items=items,
    )
    db.add(ret)
    db.commit()
    db.refresh(ret)
    return ret


def get_return(db: Session, return_id: uuid.UUID) -> Return | None:
    return db.query(Return).filter(
        Return.id == return_id, Return.deleted_at.is_(None)
    ).first()


def approve_return(db: Session, return_id: uuid.UUID) -> Return | None:
    ret = get_return(db, return_id)
    if ret is None:
        return None

    if ret.status != ReturnStatus.REQUESTED:
        raise ReturnNotApprovableError("Only a requested return can be approved")

    ret.status = ReturnStatus.APPROVED
    db.commit()
    db.refresh(ret)
    return ret


def reject_return(db: Session, return_id: uuid.UUID, reason: str) -> Return | None:
    ret = get_return(db, return_id)
    if ret is None:
        return None

    if ret.status != ReturnStatus.REQUESTED:
        raise ReturnNotRejectableError("Only a requested return can be rejected")

    ret.status = ReturnStatus.REJECTED
    if not ret.remarks:
        ret.remarks = reason
    db.commit()
    db.refresh(ret)
    return ret


def complete_return(
    db: Session, return_id: uuid.UUID, completed_by: uuid.UUID
) -> tuple[Return, int, CreditNote] | None:
    ret = get_return(db, return_id)
    if ret is None:
        return None

    if ret.status != ReturnStatus.APPROVED:
        raise ReturnNotCompletableError("Only an approved return can be completed")

    invoice = invoice_service.get_invoice(db, ret.invoice_id)
    order = get_sales_order(db, invoice.sales_order_id)
    order_items = {item.product_id: item for item in order.items}

    total_amount = Decimal("0")
    for item in ret.items:
        order_item = order_items.get(item.product_id)
        if order_item is None:
            raise ReturnItemNotInOriginalOrderError(
                f"Product {item.product_id} was not part of the original order"
            )
        total_amount += order_item.price * item.quantity

        movement_type = _REASON_TO_MOVEMENT_TYPE[ReturnReason(item.reason)]
        record_movement(
            db,
            warehouse_id=ret.warehouse_id,
            product_id=item.product_id,
            movement_type=movement_type,
            quantity=int(item.quantity),
            reference_type="return",
            reference_id=ret.id,
            remarks=item.reason,
            user_id=completed_by,
        )

    credit_note = CreditNote(
        return_id=ret.id,
        customer_id=order.customer_id,
        amount=total_amount,
        status=CreditNoteStatus.PENDING,
    )
    db.add(credit_note)

    ret.status = ReturnStatus.COMPLETED
    db.commit()
    db.refresh(ret)
    db.refresh(credit_note)
    return ret, len(ret.items), credit_note
