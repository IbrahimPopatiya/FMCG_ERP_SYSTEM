import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.warehouse import (
    WarehouseCreate,
    WarehouseUpdate,
    WarehouseStatusUpdate,
    WarehouseResponse,
    WarehouseDeleteResponse,
)
from app.services import warehouse as warehouse_service

router = APIRouter(prefix="/warehouses", tags=["warehouses"])


@router.get("", response_model=list[WarehouseResponse])
<<<<<<< HEAD
def list_warehouses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
=======
def list_warehouses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
>>>>>>> phase-1
    return warehouse_service.list_warehouses(db)


@router.post("", response_model=WarehouseResponse, status_code=status.HTTP_201_CREATED)
def create_warehouse(
    data: WarehouseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return warehouse_service.create_warehouse(db, data)


@router.patch("/{warehouse_id}", response_model=WarehouseResponse)
def update_warehouse(
    warehouse_id: uuid.UUID,
    data: WarehouseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    warehouse = warehouse_service.update_warehouse(db, warehouse_id, data)
    if warehouse is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
    return warehouse


@router.patch("/{warehouse_id}/status", response_model=WarehouseResponse)
def update_warehouse_status(
    warehouse_id: uuid.UUID,
    data: WarehouseStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    warehouse = warehouse_service.set_warehouse_status(db, warehouse_id, data.status)
    if warehouse is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
    return warehouse


@router.delete("/{warehouse_id}", response_model=WarehouseDeleteResponse)
def delete_warehouse(
    warehouse_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    warehouse = warehouse_service.soft_delete_warehouse(db, warehouse_id)
    if warehouse is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Warehouse not found")
    return warehouse
