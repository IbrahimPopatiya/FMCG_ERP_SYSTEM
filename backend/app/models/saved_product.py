from sqlalchemy import Column, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin


class SavedProduct(Base, UUIDPKMixin, TimestampMixin):
    """A product a customer bookmarked from the Home feed - shown in their
    account's Saved Products section."""

    __tablename__ = "saved_products"
    __table_args__ = (UniqueConstraint("customer_id", "product_id", name="uq_saved_product_customer_product"),)

    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)

    product = relationship("Product", lazy="joined")
