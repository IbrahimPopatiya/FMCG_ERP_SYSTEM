import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user, require_role
from app.core.enums import UserRole
from app.db.session import get_db
from app.models.user import User
from app.schemas.route import (
    RouteCreate,
    RouteUpdate,
    RouteSalesmanUpdate,
    RouteResponse,
    RouteDeleteResponse,
)
from app.services import route as route_service

router = APIRouter(prefix="/routes", tags=["routes"])


@router.get("", response_model=list[RouteResponse])
def list_routes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return route_service.list_routes(db)


@router.post("", response_model=RouteResponse, status_code=status.HTTP_201_CREATED)
def create_route(
    data: RouteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER)),
):
    return route_service.create_route(db, data)


@router.patch("/{route_id}", response_model=RouteResponse)
def update_route(
    route_id: uuid.UUID,
    data: RouteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER)),
):
    route = route_service.update_route(db, route_id, data)
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    return route


@router.patch("/{route_id}/salesman", response_model=RouteResponse)
def assign_salesman(
    route_id: uuid.UUID,
    data: RouteSalesmanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER)),
):
    route = route_service.assign_salesman(db, route_id, data.salesman_id)
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    return route


@router.delete("/{route_id}", response_model=RouteDeleteResponse)
def delete_route(
    route_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER)),
):
    route = route_service.soft_delete_route(db, route_id)
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    return route
