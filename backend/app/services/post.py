import uuid
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.post import Post
from app.models.product import Product
from app.schemas.post import PostCreate
from app.services.product import get_product


class ProductNotFoundError(Exception):
    """Raised when a post references a product that doesn't exist."""


def _create_product_for_post(db: Session, data: PostCreate) -> Product:
    # Posts no longer let the admin pick a product (see mockup "Create Post"
    # screen - no product selector) - a lightweight product is created behind
    # the scenes from the post's own fields so cart/checkout still has a real
    # product to reference.
    unique = uuid.uuid4().hex[:10].upper()
    product = Product(
        sku=f"POST-{unique}",
        barcode=f"POST-{unique}",
        name=data.product_name,
        unit="piece",
        packing=f"Box of {data.quantity_in_box}",
        mrp=data.mrp,
        selling_price=data.price,
        gst_rate=Decimal("0"),
        minimum_stock=0,
        image=data.image,
    )
    db.add(product)
    db.flush()
    return product


def create_post(db: Session, data: PostCreate, created_by: uuid.UUID) -> Post:
    if data.product_id is not None:
        if get_product(db, data.product_id) is None:
            raise ProductNotFoundError("Product not found")
        product_id = data.product_id
    else:
        product_id = _create_product_for_post(db, data).id

    post = Post(
        product_id=product_id,
        image=data.image,
        product_name=data.product_name,
        price=data.price,
        mrp=data.mrp,
        quantity_in_box=data.quantity_in_box,
        created_by=created_by,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def list_posts(db: Session) -> list[Post]:
    """Newest first - feeds the customer Home reel, newest post always on top."""
    return (
        db.query(Post)
        .filter(Post.is_active.is_(True))
        .order_by(Post.created_at.desc())
        .all()
    )
