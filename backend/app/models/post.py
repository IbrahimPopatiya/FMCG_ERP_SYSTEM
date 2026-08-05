from sqlalchemy import Boolean, Column, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin


class Post(Base, UUIDPKMixin, TimestampMixin):
    """A promoted-listing feed item an admin creates for a product - shown at
    the front of the customer Home reel feed, newest first (see prd.md /
    UI_UX_REQUIREMENTS.md mockup screen "Create Post")."""

    __tablename__ = "posts"

    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    image = Column(String(255), nullable=True)
    product_name = Column(String(200), nullable=False)
    price = Column(Numeric(12, 2), nullable=False)
    mrp = Column(Numeric(12, 2), nullable=False)
    quantity_in_box = Column(Integer, nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)
    # True for a plain image-upload post made from the admin "New post"
    # screen (no product link) - the customer Home feed hides the name/box
    # caption for these, since there's no real product name/quantity behind
    # them. False for posts tied to a real product (auto-created when a
    # product is added, or explicitly reposted).
    is_standalone = Column(Boolean, nullable=False, default=False)
