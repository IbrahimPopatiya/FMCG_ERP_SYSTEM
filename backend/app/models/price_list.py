from sqlalchemy import Column, String, Text, Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin, SoftDeleteMixin


class PriceList(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "price_lists"

    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)


class PriceListItem(Base, UUIDPKMixin, TimestampMixin):
    """The price of one product within one price list."""

    __tablename__ = "price_list_items"
    __table_args__ = (
        UniqueConstraint("price_list_id", "product_id", name="uq_price_list_product"),
    )

    price_list_id = Column(UUID(as_uuid=True), ForeignKey("price_lists.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    discount_percent = Column(Numeric(5, 2), nullable=False, default=0)
