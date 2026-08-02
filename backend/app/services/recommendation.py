import uuid

import numpy as np
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.core.enums import OrderStatus, ProductStatus
from app.models.feed_impression import FeedImpression
from app.models.product import Product
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.services.product import list_active_products_feed

# How many of a customer's most recent order lines to base their "taste"
# on - recent purchases only, not their entire lifetime history.
RECENT_ORDER_ITEMS_LIMIT = 50


def get_similar_products(db: Session, product_id: uuid.UUID, limit: int = 10) -> list[Product]:
    target = (
        db.query(Product)
        .filter(Product.id == product_id, Product.embedding.isnot(None))
        .first()
    )
    if target is None:
        return []

    return (
        db.query(Product)
        .filter(
            Product.id != product_id,
            Product.deleted_at.is_(None),
            Product.status == ProductStatus.ACTIVE,
            Product.embedding.isnot(None),
        )
        .order_by(Product.embedding.cosine_distance(target.embedding))
        .limit(limit)
        .all()
    )


def _customer_taste_vector(db: Session, customer_id: uuid.UUID) -> list[float] | None:
    """Average embedding of a customer's recently ordered products - the
    closest thing to "what this customer likes" we can get without a
    dedicated ML model. Returns None if they have no purchase history yet
    (or none of those products have embeddings), so callers can fall back to
    a non-personalized ordering instead."""
    # Not .distinct() - dedup happens below in Python, since Postgres won't
    # allow SELECT DISTINCT combined with ORDER BY a column outside the
    # select list (order_date here).
    recent_rows = (
        db.query(SalesOrderItem.product_id)
        .join(SalesOrder, SalesOrder.id == SalesOrderItem.sales_order_id)
        .filter(
            SalesOrder.customer_id == customer_id,
            SalesOrder.status != OrderStatus.CANCELLED,
        )
        .order_by(SalesOrder.order_date.desc())
        .limit(RECENT_ORDER_ITEMS_LIMIT)
        .all()
    )
    if not recent_rows:
        return None

    recent_product_ids = list(dict.fromkeys(row[0] for row in recent_rows))
    embeddings = [
        p.embedding
        for p in db.query(Product).filter(
            Product.id.in_(recent_product_ids),
            Product.embedding.isnot(None),
        )
    ]
    if not embeddings:
        return None

    return np.mean(np.array(embeddings), axis=0).tolist()


def get_personalized_feed(
    db: Session, customer_id: uuid.UUID, page: int = 1, page_size: int = 12
) -> tuple[list[Product], int]:
    """The customer's whole active catalog, ranked by similarity to their
    taste vector - not capped, so a customer can keep paging/scrolling
    through every product. Ordering is by distance (+ id as a tiebreak) only,
    not live seen-state, so it stays stable across pages of the same scroll
    session - reordering mid-scroll by seen-state would shift item positions
    between page fetches and cause products to be skipped or repeated."""
    taste_vector = _customer_taste_vector(db, customer_id)
    if taste_vector is None:
        # Cold start - no purchase history to personalize from yet.
        return list_active_products_feed(db, page, page_size, sort="popular")

    query = (
        db.query(Product)
        .outerjoin(
            FeedImpression,
            (FeedImpression.product_id == Product.id) & (FeedImpression.customer_id == customer_id),
        )
        .filter(
            Product.deleted_at.is_(None),
            Product.status == ProductStatus.ACTIVE,
            Product.embedding.isnot(None),
            (FeedImpression.id.is_(None)) | (FeedImpression.dismissed_at.is_(None)),
        )
    )
    total = query.count()
    items = (
        query.order_by(Product.embedding.cosine_distance(taste_vector), Product.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def record_impressions(db: Session, customer_id: uuid.UUID, product_ids: list[uuid.UUID]) -> None:
    if not product_ids:
        return

    stmt = pg_insert(FeedImpression).values(
        [
            {"customer_id": customer_id, "product_id": product_id, "last_seen_at": func.now(), "seen_count": 1}
            for product_id in product_ids
        ]
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["customer_id", "product_id"],
        set_={
            "last_seen_at": func.now(),
            "seen_count": FeedImpression.seen_count + 1,
        },
    )
    db.execute(stmt)
    db.commit()
