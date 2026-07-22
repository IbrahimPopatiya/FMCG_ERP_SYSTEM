import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_staff
from app.db.session import get_db
from app.models.user import User
from app.schemas.delivery import (
    DeliveryCreate,
    DeliveryStartRequest,
    DeliveryArriveRequest,
    DeliveryCompleteRequest,
    DeliveryFailRequest,
    DeliveryResponse,
    DeliveryArriveResponse,
    DeliveryCompleteResponse,
    DeliveryFailResponse,
)
from app.services import delivery as delivery_service
from app.services.delivery import (
    InvoiceNotFoundError,
    DeliveryAlreadyExistsError,
    DeliveryNotStartableError,
    DeliveryNotArrivableError,
    DeliveryNotCompletableError,
    DeliveryNotFailableError,
)

router = APIRouter(prefix="/deliveries", tags=["deliveries"])


@router.post("", response_model=DeliveryResponse, status_code=status.HTTP_201_CREATED)
def create_delivery(
    data: DeliveryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        return delivery_service.create_delivery(db, data)
    except InvoiceNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except DeliveryAlreadyExistsError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/{delivery_id}/start", response_model=DeliveryResponse)
def start_delivery(
    delivery_id: uuid.UUID,
    data: DeliveryStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        delivery = delivery_service.start_delivery(db, delivery_id, data.departure_time)
    except DeliveryNotStartableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if delivery is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
    return delivery


@router.post("/{delivery_id}/arrive", response_model=DeliveryArriveResponse)
def mark_arrived(
    delivery_id: uuid.UUID,
    data: DeliveryArriveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        delivery = delivery_service.mark_arrived(db, delivery_id, data.latitude, data.longitude)
    except DeliveryNotArrivableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if delivery is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
    return delivery


@router.post("/{delivery_id}/complete", response_model=DeliveryCompleteResponse)
def complete_delivery(
    delivery_id: uuid.UUID,
    data: DeliveryCompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        result = delivery_service.complete_delivery(db, delivery_id, data)
    except DeliveryNotCompletableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")

    delivery, payment, invoice_payment_status = result
    return DeliveryCompleteResponse(
        id=delivery.id,
        completion_time=delivery.completion_time,
        payment_id=payment.id,
        invoice_payment_status=invoice_payment_status,
    )


@router.post("/{delivery_id}/fail", response_model=DeliveryFailResponse)
def fail_delivery(
    delivery_id: uuid.UUID,
    data: DeliveryFailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        delivery = delivery_service.fail_delivery(db, delivery_id, data.reason)
    except DeliveryNotFailableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if delivery is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
    return delivery
