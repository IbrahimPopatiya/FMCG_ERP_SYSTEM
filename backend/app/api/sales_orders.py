import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import Principal, get_current_principal, require_staff
from app.db.session import get_db
from app.models.user import User
from app.schemas.sales_order import (
    SalesOrderCreate,
    SalesOrderUpdate,
    SalesOrderResponse,
    SalesOrderCancelResponse,
    SalesOrderApproveRequest,
    SalesOrderApproveResponse,
    SalesOrderLoadRequest,
    SalesOrderLoadResponse,
)
from app.services import sales_order as sales_order_service
from app.services.sales_order import (
    CustomerNotFoundError,
    ProductNotFoundError,
    NotAuthorizedForCustomerError,
    NoFulfillingWarehouseError,
    OrderNotEditableError,
    OrderNotApprovableError,
    OrderNotLoadableError,
    SalesOrderItemNotFoundError,
)

router = APIRouter(prefix="/orders", tags=["sales-orders"])


@router.post("", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    data: SalesOrderCreate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    try:
        return sales_order_service.create_sales_order(db, data, principal)
    except (CustomerNotFoundError, ProductNotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except NotAuthorizedForCustomerError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except NoFulfillingWarehouseError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get("", response_model=list[SalesOrderResponse])
def list_orders(
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    return sales_order_service.list_orders_for_principal(db, principal)


@router.get("/{order_id}", response_model=SalesOrderResponse)
def get_order(
    order_id: uuid.UUID,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    order = sales_order_service.get_owned_sales_order(db, order_id, principal)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.patch("/{order_id}", response_model=SalesOrderResponse)
def update_order(
    order_id: uuid.UUID,
    data: SalesOrderUpdate,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    try:
        order = sales_order_service.update_sales_order(db, order_id, data, principal)
    except ProductNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except NoFulfillingWarehouseError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except OrderNotEditableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("/{order_id}/approve", response_model=SalesOrderApproveResponse)
def approve_order(
    order_id: uuid.UUID,
    data: SalesOrderApproveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        order = sales_order_service.approve_sales_order(db, order_id, data.items, current_user.id)
    except SalesOrderItemNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except OrderNotApprovableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("/{order_id}/load", response_model=SalesOrderLoadResponse)
def load_order(
    order_id: uuid.UUID,
    data: SalesOrderLoadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        order = sales_order_service.load_sales_order(db, order_id, data.items, current_user.id)
    except SalesOrderItemNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except OrderNotLoadableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("/{order_id}/cancel", response_model=SalesOrderCancelResponse)
def cancel_order(
    order_id: uuid.UUID,
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    try:
        order = sales_order_service.cancel_sales_order(db, order_id, principal)
    except OrderNotEditableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order
