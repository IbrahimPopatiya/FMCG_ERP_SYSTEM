import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.post import Post
from app.models.product import Product
from app.schemas.post import PostCreate
from app.services.product import get_product


class ProductNotFoundError(Exception):
    """Raised when a post references a product that doesn't exist."""


class PostNotFoundError(Exception):
    """Raised when a post id doesn't match any post."""


class PostImageRequiredError(Exception):
    """Raised when a standalone post (no product_id) is created without an image."""


def _create_product_for_post(
    db: Session, data: PostCreate, product_name: str, price: Decimal, mrp: Decimal, quantity_in_box: int
) -> Product:
    # Posts no longer let the admin pick a product (see mockup "Create Post"
    # screen - no product selector) - a lightweight product is created behind
    # the scenes from the post's own fields so cart/checkout still has a real
    # product to reference.
    unique = uuid.uuid4().hex[:10].upper()
    product = Product(
        sku=f"POST-{unique}",
        name=product_name,
        unit="piece",
        units_per_box=quantity_in_box,
        mrp=mrp,
        selling_price=price,
        gst_rate=Decimal("0"),
        minimum_stock=0,
        image=data.image,
    )
    db.add(product)
    db.flush()
    return product


def create_post_for_product(db: Session, product: Product, created_by: uuid.UUID) -> Post:
    """Auto-creates a promoted post for a product an admin just added, so new
    products immediately surface at the top of the customer Home feed too."""
    post = Post(
        product_id=product.id,
        image=product.image,
        product_name=product.name,
        price=product.selling_price,
        mrp=product.mrp,
        quantity_in_box=product.units_per_box,
        created_by=created_by,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


def create_post(db: Session, data: PostCreate, created_by: uuid.UUID) -> Post:
    # Standalone posts (image only, from the admin "New post" screen - no
    # product link, no price/mrp/box quantity) get sane defaults so the
    # underlying product record and the Post row still satisfy their NOT NULL
    # columns without implying a real product name or price.
    price = data.price if data.price is not None else Decimal("0")
    mrp = data.mrp if data.mrp is not None else Decimal("0")
    quantity_in_box = data.quantity_in_box if data.quantity_in_box is not None else 1
    product_name = data.product_name if data.product_name else "Post"

    is_standalone = data.product_id is None

    if not is_standalone:
        if get_product(db, data.product_id) is None:
            raise ProductNotFoundError("Product not found")
        product_id = data.product_id
    else:
        # The admin "New post" screen only offers an image upload - a
        # standalone post without a product link needs one to be meaningful.
        if not data.image:
            raise PostImageRequiredError("Image is required")
        product_id = _create_product_for_post(db, data, product_name, price, mrp, quantity_in_box).id

    post = Post(
        product_id=product_id,
        image=data.image,
        product_name=product_name,
        price=price,
        mrp=mrp,
        quantity_in_box=quantity_in_box,
        created_by=created_by,
        is_standalone=is_standalone,
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


def list_all_posts(
    db: Session, page: int, page_size: int, search: str | None = None
) -> tuple[list[Post], int]:
    """Newest first, including inactive, paginated - for admin post management."""
    query = db.query(Post)
    if search:
        query = query.filter(Post.product_name.ilike(f"%{search}%"))
    query = query.order_by(Post.created_at.desc())
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_post(db: Session, post_id: uuid.UUID) -> Post | None:
    return db.query(Post).filter(Post.id == post_id).first()


def set_post_active(db: Session, post_id: uuid.UUID, is_active: bool) -> Post:
    post = get_post(db, post_id)
    if post is None:
        raise PostNotFoundError("Post not found")

    post.is_active = is_active
    db.commit()
    db.refresh(post)
    return post


def repost(db: Session, post_id: uuid.UUID) -> Post:
    """Bumps the post back to the top of the newest-first feed and reactivates it."""
    post = get_post(db, post_id)
    if post is None:
        raise PostNotFoundError("Post not found")

    post.created_at = datetime.now(timezone.utc)
    post.is_active = True
    db.commit()
    db.refresh(post)
    return post


def repost_many(db: Session, post_ids: list[uuid.UUID]) -> list[Post]:
    """Bulk repost - bumps each selected post back to the top of the feed and
    reactivates it, for the admin Posts screen's multi-select repost action."""
    posts = db.query(Post).filter(Post.id.in_(post_ids)).all()
    if len(posts) != len(set(post_ids)):
        raise PostNotFoundError("One or more posts not found")

    now = datetime.now(timezone.utc)
    for post in posts:
        post.created_at = now
        post.is_active = True
    db.commit()
    for post in posts:
        db.refresh(post)
    return posts
