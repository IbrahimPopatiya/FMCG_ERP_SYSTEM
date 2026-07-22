import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.route import Route
from app.schemas.route import RouteCreate, RouteUpdate


def create_route(db: Session, data: RouteCreate) -> Route:
    route = Route(name=data.name, salesman_id=data.salesman_id)
    db.add(route)
    db.commit()
    db.refresh(route)
    return route


def get_route(db: Session, route_id: uuid.UUID) -> Route | None:
    return db.query(Route).filter(Route.id == route_id, Route.deleted_at.is_(None)).first()


def update_route(db: Session, route_id: uuid.UUID, data: RouteUpdate) -> Route | None:
    route = get_route(db, route_id)
    if route is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(route, field, value)

    db.commit()
    db.refresh(route)
    return route


def assign_salesman(db: Session, route_id: uuid.UUID, salesman_id: uuid.UUID) -> Route | None:
    route = get_route(db, route_id)
    if route is None:
        return None

    route.salesman_id = salesman_id
    db.commit()
    db.refresh(route)
    return route


def soft_delete_route(db: Session, route_id: uuid.UUID) -> Route | None:
    route = get_route(db, route_id)
    if route is None:
        return None

    route.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(route)
    return route
