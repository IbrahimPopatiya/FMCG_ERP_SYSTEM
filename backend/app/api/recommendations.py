import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.deps import Principal, get_current_principal, require_customer
from app.db.session import get_db
from app.models.customer import Customer
from app.models.product import Product
from app.schemas.common import Page
from app.schemas.product import ProductCatalogResponse
from app.schemas.recommendation import FeedImpressionCreate
from app.services import price_list as price_list_service
from app.services import recommendation as recommendation_service

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def _to_catalog_response(db: Session, products: list[Product], price_list_id: uuid.UUID | None) -> list[ProductCatalogResponse]:
    prices = price_list_service.get_effective_prices(
        db, price_list_id, [(p.id, p.selling_price) for p in products]
    )
    return [
        ProductCatalogResponse(
            id=p.id,
            sku=p.sku,
            name=p.name,
            category_id=p.category_id,
            brand_id=p.brand_id,
            unit=p.unit,
            packing=p.packing,
            units_per_box=p.units_per_box,
            mrp=p.mrp,
            effective_price=prices[p.id],
            gst_rate=p.gst_rate,
            image=p.image,
        )
        for p in products
    ]


@router.get("/products/{product_id}/similar", response_model=list[ProductCatalogResponse])
def get_similar_products(
    product_id: uuid.UUID,
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    products = recommendation_service.get_similar_products(db, product_id, limit)
    price_list_id = principal.customer.price_list_id if principal.type == "customer" else None
    return _to_catalog_response(db, products, price_list_id)


@router.get("/for-me", response_model=Page[ProductCatalogResponse])
def get_for_me_feed(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db),
    customer: Customer = Depends(require_customer),
):
    """The customer's whole active catalog, personalized-ranked - not capped,
    so a customer can keep paging through every product."""
    products, total = recommendation_service.get_personalized_feed(db, customer.id, page, page_size)
    items = _to_catalog_response(db, products, customer.price_list_id)
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.post("/impressions", status_code=status.HTTP_204_NO_CONTENT)
def record_impressions(
    data: FeedImpressionCreate,
    db: Session = Depends(get_db),
    customer: Customer = Depends(require_customer),
):
    recommendation_service.record_impressions(db, customer.id, data.product_ids)
