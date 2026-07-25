import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import Principal, get_current_principal, require_role
from app.core.enums import UserRole
from app.db.session import get_db
from app.models.sales_order import SalesOrder
from app.models.trip import LoadingTrip
from app.schemas.trip import (
    TripCreate,
    TripResponse,
    TripOrderResponse,
    TripStatusResponse,
    LoadableOrderResponse,
)
from app.services import trip as trip_service
from app.services.trip import (
    VehicleNotFoundError,
    DriverNotFoundError,
    OrderNotLoadableError,
    CapacityExceededError,
    TripNotStartableError,
    TripNotCompletableError,
)

router = APIRouter(prefix="/trips", tags=["trips"])

LOADING_SUPERVISOR_ROLES = (UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER)


def _to_response(db: Session, trip: LoadingTrip) -> TripResponse:
    order_ids = [o.sales_order_id for o in trip.orders]
    orders_by_id = {o.id: o for o in db.query(SalesOrder).filter(SalesOrder.id.in_(order_ids)).all()}
    trip_orders = [
        TripOrderResponse(
            sales_order_id=o.sales_order_id,
            order_number=orders_by_id[o.sales_order_id].order_number if o.sales_order_id in orders_by_id else "—",
            customer_id=orders_by_id[o.sales_order_id].customer_id if o.sales_order_id in orders_by_id else o.sales_order_id,
            order_status=orders_by_id[o.sales_order_id].status if o.sales_order_id in orders_by_id else "—",
            lc_value=o.lc_value,
        )
        for o in trip.orders
    ]
    return TripResponse(
        id=trip.id,
        trip_number=trip.trip_number,
        vehicle_id=trip.vehicle_id,
        driver_id=trip.driver_id,
        trip_date=trip.trip_date,
        status=trip.status,
        remark=trip.remark,
        total_lc=sum((o.lc_value for o in trip.orders), Decimal("0")),
        orders=trip_orders,
        created_at=trip.created_at,
    )


@router.get("/loadable-orders", response_model=list[LoadableOrderResponse])
def list_loadable_orders(
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*LOADING_SUPERVISOR_ROLES)),
):
    return [
        LoadableOrderResponse(
            id=order.id,
            order_number=order.order_number,
            customer_id=order.customer_id,
            lc_value=lc,
            created_at=order.created_at,
        )
        for order, lc in trip_service.list_loadable_orders(db)
    ]


@router.get("", response_model=list[TripResponse])
def list_trips(
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    if principal.type != "user":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Staff access required")
    trips = trip_service.list_trips_for_principal(db, principal)
    return [_to_response(db, t) for t in trips]


@router.get("/{trip_id}", response_model=TripResponse)
def get_trip(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_principal),
):
    trip = trip_service.get_trip(db, trip_id)
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return _to_response(db, trip)


@router.post("", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
def create_trip(
    data: TripCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*LOADING_SUPERVISOR_ROLES)),
):
    try:
        trip = trip_service.create_trip(db, data, current_user)
    except (VehicleNotFoundError, DriverNotFoundError) as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except OrderNotLoadableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except CapacityExceededError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    return _to_response(db, trip)


@router.post("/{trip_id}/start", response_model=TripStatusResponse)
def start_trip(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*LOADING_SUPERVISOR_ROLES)),
):
    try:
        trip = trip_service.start_trip(db, trip_id)
    except TripNotStartableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip


@router.post("/{trip_id}/complete", response_model=TripStatusResponse)
def complete_trip(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*LOADING_SUPERVISOR_ROLES)),
):
    try:
        trip = trip_service.complete_trip(db, trip_id)
    except TripNotCompletableError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip


@router.post("/{trip_id}/cancel", response_model=TripStatusResponse)
def cancel_trip(
    trip_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(*LOADING_SUPERVISOR_ROLES)),
):
    trip = trip_service.cancel_trip(db, trip_id)
    if trip is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found")
    return trip
