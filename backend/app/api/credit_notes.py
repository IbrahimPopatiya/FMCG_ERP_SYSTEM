import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_staff
from app.db.session import get_db
from app.models.user import User
from app.schemas.credit_note import CreditNoteResponse, CreditNoteStatusResponse
from app.services import credit_note as credit_note_service
from app.services.credit_note import NotAuthorizedForCreditNoteError, CreditNoteNotActionableError

router = APIRouter(prefix="/credit-notes", tags=["credit-notes"])


@router.get("", response_model=list[CreditNoteResponse])
def list_credit_notes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    return credit_note_service.list_credit_notes(db)


@router.post("/{credit_note_id}/approve", response_model=CreditNoteStatusResponse)
def approve_credit_note(
    credit_note_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        credit_note = credit_note_service.approve_credit_note(db, credit_note_id, current_user)
    except NotAuthorizedForCreditNoteError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except CreditNoteNotActionableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if credit_note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit note not found")
    return credit_note


@router.post("/{credit_note_id}/reject", response_model=CreditNoteStatusResponse)
def reject_credit_note(
    credit_note_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        credit_note = credit_note_service.reject_credit_note(db, credit_note_id, current_user)
    except NotAuthorizedForCreditNoteError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except CreditNoteNotActionableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if credit_note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit note not found")
    return credit_note
