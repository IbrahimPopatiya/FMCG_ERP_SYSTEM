import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.supplier import (
    SupplierCreate,
    SupplierUpdate,
    SupplierStatusUpdate,
    SupplierResponse,
    SupplierDeleteResponse,
)
from app.services import supplier as supplier_service
from app.services.supplier import DuplicateSupplierError

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get("", response_model=list[SupplierResponse])
def list_suppliers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return supplier_service.list_suppliers(db)


@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return supplier_service.create_supplier(db, data)
    except DuplicateSupplierError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.patch("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: uuid.UUID,
    data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        supplier = supplier_service.update_supplier(db, supplier_id, data)
    except DuplicateSupplierError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier


@router.patch("/{supplier_id}/status", response_model=SupplierResponse)
def update_supplier_status(
    supplier_id: uuid.UUID,
    data: SupplierStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    supplier = supplier_service.set_supplier_status(db, supplier_id, data.status)
    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier


@router.delete("/{supplier_id}", response_model=SupplierDeleteResponse)
def delete_supplier(
    supplier_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    supplier = supplier_service.soft_delete_supplier(db, supplier_id)
    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier
