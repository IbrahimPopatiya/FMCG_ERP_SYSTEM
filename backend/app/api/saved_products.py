import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import require_customer
from app.db.session import get_db
from app.models.customer import Customer
from app.schemas.product import ProductCatalogResponse
from app.schemas.saved_product import SavedProductCreate, SavedProductResponse
from app.services import price_list as price_list_service
from app.services import saved_product as saved_product_service
from app.services.saved_product import ProductNotFoundError

router = APIRouter(prefix="/saved-products", tags=["saved-products"])


@router.get("", response_model=list[SavedProductResponse])
def list_saved_products(
    db: Session = Depends(get_db),
    customer: Customer = Depends(require_customer),
):
    saved = saved_product_service.list_saved_products(db, customer.id)
    prices = price_list_service.get_effective_prices(
        db, customer.price_list_id, [(s.product.id, s.product.selling_price) for s in saved]
    )
    return [
        SavedProductResponse(
            id=s.id,
            created_at=s.created_at,
            product=ProductCatalogResponse(
                id=s.product.id,
                sku=s.product.sku,
                name=s.product.name,
                category_id=s.product.category_id,
                brand_id=s.product.brand_id,
                unit=s.product.unit,
                units_per_box=s.product.units_per_box,
                loading_capacity=s.product.loading_capacity,
                mrp=s.product.mrp,
                effective_price=prices[s.product.id],
                image=s.product.image,
            ),
        )
        for s in saved
    ]


@router.post("", response_model=SavedProductResponse, status_code=status.HTTP_201_CREATED)
def save_product(
    data: SavedProductCreate,
    db: Session = Depends(get_db),
    customer: Customer = Depends(require_customer),
):
    try:
        saved = saved_product_service.save_product(db, customer.id, data.product_id)
    except ProductNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    prices = price_list_service.get_effective_prices(
        db, customer.price_list_id, [(saved.product.id, saved.product.selling_price)]
    )
    return SavedProductResponse(
        id=saved.id,
        created_at=saved.created_at,
        product=ProductCatalogResponse(
            id=saved.product.id,
            sku=saved.product.sku,
            name=saved.product.name,
            category_id=saved.product.category_id,
            brand_id=saved.product.brand_id,
            unit=saved.product.unit,
            units_per_box=saved.product.units_per_box,
            loading_capacity=saved.product.loading_capacity,
            mrp=saved.product.mrp,
            effective_price=prices[saved.product.id],
            image=saved.product.image,
        ),
    )


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def unsave_product(
    product_id: uuid.UUID,
    db: Session = Depends(get_db),
    customer: Customer = Depends(require_customer),
):
    saved_product_service.unsave_product(db, customer.id, product_id)
