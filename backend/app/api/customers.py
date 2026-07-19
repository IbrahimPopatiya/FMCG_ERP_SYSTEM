import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerStatusUpdate,
    CustomerLocationUpdate,
    CustomerLocationResponse,
    CustomerResponse,
    CustomerDeleteResponse,
)
from app.services import customer as customer_service
from app.services.customer import DuplicateCustomerError

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return customer_service.create_customer(db, data)
    except DuplicateCustomerError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.patch("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: uuid.UUID,
    data: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        customer = customer_service.update_customer(db, customer_id, data)
    except DuplicateCustomerError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.patch("/{customer_id}/status", response_model=CustomerResponse)
def update_customer_status(
    customer_id: uuid.UUID,
    data: CustomerStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = customer_service.set_customer_status(db, customer_id, data.status)
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.patch("/{customer_id}/location", response_model=CustomerLocationResponse)
def update_customer_location(
    customer_id: uuid.UUID,
    data: CustomerLocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = customer_service.update_customer_location(
        db, customer_id, data.latitude, data.longitude
    )
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.delete("/{customer_id}", response_model=CustomerDeleteResponse)
def delete_customer(
    customer_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    customer = customer_service.soft_delete_customer(db, customer_id)
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer
