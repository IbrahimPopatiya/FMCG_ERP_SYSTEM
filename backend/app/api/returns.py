import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_staff
from app.db.session import get_db
from app.models.user import User
from app.schemas.return_ import (
    ReturnCreate,
    ReturnRejectRequest,
    ReturnResponse,
    ReturnStatusResponse,
    ReturnCompleteResponse,
)
from app.services import return_ as return_service
from app.services.return_ import (
    InvoiceNotFoundError,
    ReturnNotApprovableError,
    ReturnNotRejectableError,
    ReturnNotCompletableError,
    ReturnItemNotInOriginalOrderError,
)

router = APIRouter(prefix="/returns", tags=["returns"])


@router.get("", response_model=list[ReturnResponse])
def list_returns(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    return return_service.list_returns(db)


@router.post("", response_model=ReturnResponse, status_code=status.HTTP_201_CREATED)
def create_return(
    data: ReturnCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        return return_service.create_return(db, data, current_user.id)
    except InvoiceNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{return_id}/approve", response_model=ReturnStatusResponse)
def approve_return(
    return_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        ret = return_service.approve_return(db, return_id)
    except ReturnNotApprovableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if ret is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Return not found")
    return ret


@router.post("/{return_id}/reject", response_model=ReturnStatusResponse)
def reject_return(
    return_id: uuid.UUID,
    data: ReturnRejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        ret = return_service.reject_return(db, return_id, data.reason)
    except ReturnNotRejectableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if ret is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Return not found")
    return ret


@router.post("/{return_id}/complete", response_model=ReturnCompleteResponse)
def complete_return(
    return_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        result = return_service.complete_return(db, return_id, current_user.id)
    except ReturnNotCompletableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except ReturnItemNotInOriginalOrderError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Return not found")

    ret, movements_created, credit_note = result
    return ReturnCompleteResponse(
        id=ret.id,
        status=ret.status,
        movements_created=movements_created,
        credit_note_id=credit_note.id,
        updated_at=ret.updated_at,
    )
