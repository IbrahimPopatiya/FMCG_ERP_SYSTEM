import uuid
from datetime import datetime, timezone

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import VehicleStatus
from app.models.vehicle import Vehicle
from app.schemas.vehicle import VehicleCreate, VehicleUpdate


class DuplicateVehicleError(Exception):
    """Raised when vehicle_number is already used by another vehicle."""


def list_vehicles(db: Session) -> list[Vehicle]:
    return (
        db.query(Vehicle)
        .filter(Vehicle.deleted_at.is_(None))
        .order_by(Vehicle.vehicle_number)
        .all()
    )


def get_vehicle(db: Session, vehicle_id: uuid.UUID) -> Vehicle | None:
    return db.query(Vehicle).filter(
        Vehicle.id == vehicle_id, Vehicle.deleted_at.is_(None)
    ).first()


def create_vehicle(db: Session, data: VehicleCreate) -> Vehicle:
    vehicle = Vehicle(**data.model_dump())
    db.add(vehicle)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateVehicleError("A vehicle with this vehicle_number already exists")
    db.refresh(vehicle)
    return vehicle


def update_vehicle(db: Session, vehicle_id: uuid.UUID, data: VehicleUpdate) -> Vehicle | None:
    vehicle = get_vehicle(db, vehicle_id)
    if vehicle is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(vehicle, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateVehicleError("A vehicle with this vehicle_number already exists")
    db.refresh(vehicle)
    return vehicle


def assign_driver(db: Session, vehicle_id: uuid.UUID, driver_id: uuid.UUID) -> Vehicle | None:
    vehicle = get_vehicle(db, vehicle_id)
    if vehicle is None:
        return None

    vehicle.driver_id = driver_id
    db.commit()
    db.refresh(vehicle)
    return vehicle


def set_vehicle_status(db: Session, vehicle_id: uuid.UUID, new_status: VehicleStatus) -> Vehicle | None:
    vehicle = get_vehicle(db, vehicle_id)
    if vehicle is None:
        return None

    vehicle.status = new_status
    db.commit()
    db.refresh(vehicle)
    return vehicle


def soft_delete_vehicle(db: Session, vehicle_id: uuid.UUID) -> Vehicle | None:
    vehicle = get_vehicle(db, vehicle_id)
    if vehicle is None:
        return None

    vehicle.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(vehicle)
    return vehicle
