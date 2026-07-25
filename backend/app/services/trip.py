import uuid
from decimal import Decimal

from sqlalchemy.orm import Session, joinedload

from app.core.deps import Principal
from app.core.enums import OrderStatus, TripStatus, UserRole
from app.db.mixins import generate_uuid7
from app.models.sales_order import SalesOrder
from app.models.trip import LoadingTrip, LoadingTripOrder
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.trip import TripCreate


class VehicleNotFoundError(Exception):
    pass


class DriverNotFoundError(Exception):
    pass


class OrderNotLoadableError(Exception):
    """Raised when a selected order isn't approved, or is already on an active trip."""


class CapacityExceededError(Exception):
    """Raised when the selected orders' total LC exceeds the vehicle's remaining capacity."""


class TripNotStartableError(Exception):
    pass


class TripNotCompletableError(Exception):
    """Raised when completing a trip whose orders haven't all been loaded yet."""


ACTIVE_TRIP_STATUSES = (TripStatus.PENDING, TripStatus.LOADING)


def order_lc(order: SalesOrder) -> Decimal:
    """Loading Capacity for one order: sum of ordered quantities across its
    items. There's no per-product weight/volume in the schema, so this is a
    simple, documented proxy - not a real weight or volume figure - used only
    to size orders against a vehicle's numeric `capacity` field."""
    return sum((item.ordered_qty for item in order.items), Decimal("0"))


def _vehicle_committed_lc(db: Session, vehicle_id: uuid.UUID, exclude_trip_id: uuid.UUID | None = None) -> Decimal:
    query = (
        db.query(LoadingTrip)
        .filter(
            LoadingTrip.vehicle_id == vehicle_id,
            LoadingTrip.deleted_at.is_(None),
            LoadingTrip.status.in_([s.value for s in ACTIVE_TRIP_STATUSES]),
        )
    )
    if exclude_trip_id is not None:
        query = query.filter(LoadingTrip.id != exclude_trip_id)

    total = Decimal("0")
    for trip in query.all():
        total += sum((o.lc_value for o in trip.orders), Decimal("0"))
    return total


def list_loadable_orders(db: Session) -> list[tuple[SalesOrder, Decimal]]:
    """Approved orders not already sitting on an active (pending/loading) trip."""
    assigned_order_ids = {
        o.sales_order_id
        for trip in db.query(LoadingTrip)
        .filter(
            LoadingTrip.deleted_at.is_(None),
            LoadingTrip.status.in_([s.value for s in ACTIVE_TRIP_STATUSES]),
        )
        .options(joinedload(LoadingTrip.orders))
        .all()
        for o in trip.orders
    }
    orders = (
        db.query(SalesOrder)
        .options(joinedload(SalesOrder.items))
        .filter(SalesOrder.deleted_at.is_(None), SalesOrder.status == OrderStatus.APPROVED)
        .order_by(SalesOrder.created_at.desc())
        .all()
    )
    return [(o, order_lc(o)) for o in orders if o.id not in assigned_order_ids]


def create_trip(db: Session, data: TripCreate, current_user: User) -> LoadingTrip:
    vehicle = db.query(Vehicle).filter(Vehicle.id == data.vehicle_id, Vehicle.deleted_at.is_(None)).first()
    if vehicle is None:
        raise VehicleNotFoundError("Vehicle not found")

    driver = (
        db.query(User)
        .filter(User.id == data.driver_id, User.deleted_at.is_(None), User.role == UserRole.DRIVER)
        .first()
    )
    if driver is None:
        raise DriverNotFoundError("Driver not found")

    orders = (
        db.query(SalesOrder)
        .options(joinedload(SalesOrder.items))
        .filter(SalesOrder.id.in_(data.order_ids), SalesOrder.deleted_at.is_(None))
        .all()
    )
    if len(orders) != len(set(data.order_ids)):
        raise OrderNotLoadableError("One or more selected orders were not found")

    loadable_ids = {o.id for o, _ in list_loadable_orders(db)}
    for order in orders:
        if order.id not in loadable_ids:
            raise OrderNotLoadableError(
                f"Order {order.order_number} is not approved or is already on another active trip"
            )

    lc_by_order = {o.id: order_lc(o) for o in orders}
    total_lc = sum(lc_by_order.values(), Decimal("0"))
    committed = _vehicle_committed_lc(db, data.vehicle_id)
    if committed + total_lc > vehicle.capacity:
        raise CapacityExceededError(
            f"Selected orders total {total_lc} LC, but {vehicle.vehicle_number} only has "
            f"{vehicle.capacity - committed} LC available"
        )

    trip = LoadingTrip(
        trip_number=f"TRIP-{generate_uuid7().hex[:8].upper()}",
        vehicle_id=data.vehicle_id,
        driver_id=data.driver_id,
        trip_date=data.trip_date,
        remark=data.remark,
        created_by=current_user.id,
    )
    db.add(trip)
    db.flush()

    for order in orders:
        db.add(LoadingTripOrder(trip_id=trip.id, sales_order_id=order.id, lc_value=lc_by_order[order.id]))

    db.commit()
    db.refresh(trip)
    return trip


def list_trips_for_principal(db: Session, principal: Principal) -> list[LoadingTrip]:
    query = (
        db.query(LoadingTrip)
        .options(joinedload(LoadingTrip.orders))
        .filter(LoadingTrip.deleted_at.is_(None))
        .order_by(LoadingTrip.created_at.desc())
    )
    if principal.user.role == UserRole.DRIVER:
        query = query.filter(LoadingTrip.driver_id == principal.user.id)
    return query.all()


def get_trip(db: Session, trip_id: uuid.UUID) -> LoadingTrip | None:
    return (
        db.query(LoadingTrip)
        .options(joinedload(LoadingTrip.orders))
        .filter(LoadingTrip.id == trip_id, LoadingTrip.deleted_at.is_(None))
        .first()
    )


def _order_numbers_by_id(db: Session, order_ids: list[uuid.UUID]) -> dict[uuid.UUID, tuple[str, uuid.UUID, str]]:
    rows = db.query(SalesOrder).filter(SalesOrder.id.in_(order_ids)).all()
    return {o.id: (o.order_number, o.customer_id, o.status) for o in rows}


def start_trip(db: Session, trip_id: uuid.UUID) -> LoadingTrip | None:
    trip = get_trip(db, trip_id)
    if trip is None:
        return None
    if trip.status != TripStatus.PENDING:
        raise TripNotStartableError("Only a pending trip can start loading")
    trip.status = TripStatus.LOADING
    db.commit()
    db.refresh(trip)
    return trip


def complete_trip(db: Session, trip_id: uuid.UUID) -> LoadingTrip | None:
    trip = get_trip(db, trip_id)
    if trip is None:
        return None
    if trip.status != TripStatus.LOADING:
        raise TripNotCompletableError("Only a trip that's currently loading can be completed")

    order_ids = [o.sales_order_id for o in trip.orders]
    statuses = _order_numbers_by_id(db, order_ids)
    unloaded = [num for num, _, status in statuses.values() if status != OrderStatus.LOADED]
    if unloaded:
        raise TripNotCompletableError(
            f"All orders must be marked loaded first — still pending: {', '.join(unloaded)}"
        )

    trip.status = TripStatus.OUT_FOR_DELIVERY
    db.commit()
    db.refresh(trip)
    return trip


def cancel_trip(db: Session, trip_id: uuid.UUID) -> LoadingTrip | None:
    trip = get_trip(db, trip_id)
    if trip is None:
        return None
    trip.status = TripStatus.CANCELLED
    db.commit()
    db.refresh(trip)
    return trip
