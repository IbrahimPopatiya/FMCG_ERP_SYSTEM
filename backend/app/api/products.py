import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import Principal, get_current_principal, get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import Page
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductStatusUpdate,
    ProductResponse,
    ProductCatalogResponse,
    ProductDeleteResponse,
)
from app.services import price_list as price_list_service
from app.services import product as product_service
from app.services.product import DuplicateProductError

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[ProductCatalogResponse])
def list_products(
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    """Catalog listing. A customer token sees their own price-list price;
    a staff token sees the base selling price."""
    price_list_id = principal.customer.price_list_id if principal.type == "customer" else None

    products = product_service.list_active_products(db)
    return [
        ProductCatalogResponse(
            id=p.id,
            sku=p.sku,
            name=p.name,
            unit=p.unit,
            packing=p.packing,
            mrp=p.mrp,
            effective_price=price_list_service.get_effective_price(
                db, price_list_id, p.id, p.selling_price
            ),
            gst_rate=p.gst_rate,
            image=p.image,
        )
        for p in products
    ]


@router.get("/manage", response_model=Page[ProductResponse])
def list_products_for_management(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Staff catalog management view - every product, any status, full fields, paginated."""
    items, total = product_service.list_all_products(db, page, page_size)
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return product_service.create_product(db, data)
    except DuplicateProductError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = product_service.get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        product = product_service.update_product(db, product_id, data)
    except DuplicateProductError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))

    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.patch("/{product_id}/status", response_model=ProductResponse)
def update_product_status(
    product_id: uuid.UUID,
    data: ProductStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = product_service.set_product_status(db, product_id, data.status)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.delete("/{product_id}", response_model=ProductDeleteResponse)
def delete_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = product_service.soft_delete_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product
