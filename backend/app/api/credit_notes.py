import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import require_staff
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import Page
from app.schemas.credit_note import CreditNoteResponse, CreditNoteStatusResponse
from app.services import credit_note as credit_note_service
from app.services.credit_note import NotAuthorizedForCreditNoteError, CreditNoteNotActionableError

router = APIRouter(prefix="/credit-notes", tags=["credit-notes"])


@router.get("", response_model=Page[CreditNoteResponse])
def list_credit_notes(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    items, total = credit_note_service.list_credit_notes(db, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.get("/{credit_note_id}", response_model=CreditNoteResponse)
def get_credit_note(
    credit_note_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    credit_note = credit_note_service.get_credit_note(db, credit_note_id)
    if credit_note is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Credit note not found")
    return credit_note


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
