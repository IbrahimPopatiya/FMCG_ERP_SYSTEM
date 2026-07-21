import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import require_staff
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import Page
from app.schemas.return_ import (
    ReturnCreate,
    ReturnRejectRequest,
    ReturnResponse,
    ReturnListItem,
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


def _to_list_item(row: tuple) -> ReturnListItem:
    ret, invoice_number, customer_id, order_number = row
    return ReturnListItem(
        id=ret.id,
        invoice_id=ret.invoice_id,
        invoice_number=invoice_number,
        order_number=order_number,
        customer_id=customer_id,
        warehouse_id=ret.warehouse_id,
        reason=ret.reason,
        remarks=ret.remarks,
        status=ret.status,
        items=ret.items,
        created_at=ret.created_at,
    )


@router.get("", response_model=Page[ReturnListItem])
def list_returns(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    rows, total = return_service.list_returns(db, page, page_size)
    return Page(items=[_to_list_item(row) for row in rows], total=total, page=page, page_size=page_size)


@router.get("/{return_id}", response_model=ReturnListItem)
def get_return(
    return_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    row = return_service.get_return_with_context(db, return_id)
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Return not found")
    return _to_list_item(row)


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
