import uuid

from sqlalchemy.orm import Session

from app.core.enums import CreditNoteStatus, UserRole
from app.models.credit_note import CreditNote
from app.models.customer import Customer
from app.models.route import Route
from app.models.user import User


class NotAuthorizedForCreditNoteError(Exception):
    """Raised when a staff member who isn't the route's salesman (or admin) acts on a credit note."""


class CreditNoteNotActionableError(Exception):
    """Raised when approving/rejecting a credit note that isn't pending."""


def list_credit_notes(db: Session, page: int, page_size: int) -> tuple[list[CreditNote], int]:
    query = db.query(CreditNote).order_by(CreditNote.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_credit_note(db: Session, credit_note_id: uuid.UUID) -> CreditNote | None:
    return db.query(CreditNote).filter(CreditNote.id == credit_note_id).first()


def _authorize(db: Session, credit_note: CreditNote, user: User) -> None:
    if user.role == UserRole.ADMIN:
        return

    customer = db.query(Customer).filter(Customer.id == credit_note.customer_id).first()
    route = None
    if customer and customer.route_id is not None:
        route = db.query(Route).filter(Route.id == customer.route_id).first()

    if route is None or route.salesman_id != user.id:
        raise NotAuthorizedForCreditNoteError(
            "Only the customer's route salesman or an admin may act on this credit note"
        )


def approve_credit_note(db: Session, credit_note_id: uuid.UUID, user: User) -> CreditNote | None:
    credit_note = get_credit_note(db, credit_note_id)
    if credit_note is None:
        return None

    _authorize(db, credit_note, user)

    if credit_note.status != CreditNoteStatus.PENDING:
        raise CreditNoteNotActionableError("Only a pending credit note can be approved")

    credit_note.status = CreditNoteStatus.APPROVED
    credit_note.approved_by = user.id
    db.commit()
    db.refresh(credit_note)
    return credit_note


def reject_credit_note(db: Session, credit_note_id: uuid.UUID, user: User) -> CreditNote | None:
    credit_note = get_credit_note(db, credit_note_id)
    if credit_note is None:
        return None

    _authorize(db, credit_note, user)

    if credit_note.status != CreditNoteStatus.PENDING:
        raise CreditNoteNotActionableError("Only a pending credit note can be rejected")

    credit_note.status = CreditNoteStatus.REJECTED
    credit_note.approved_by = user.id
    db.commit()
    db.refresh(credit_note)
    return credit_note
