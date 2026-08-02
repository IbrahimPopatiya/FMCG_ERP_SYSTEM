from sqlalchemy import Column, DateTime, Integer, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin


class FeedImpression(Base, UUIDPKMixin, TimestampMixin):
    """Tracks which products a customer has already been shown in their
    personalized feed, so recommendations don't keep repeating - see
    app/services/recommendation.py."""

    __tablename__ = "feed_impressions"
    __table_args__ = (UniqueConstraint("customer_id", "product_id", name="uq_feed_impressions_customer_product"),)

    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    last_seen_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    seen_count = Column(Integer, nullable=False, default=1)
    dismissed_at = Column(DateTime(timezone=True), nullable=True)
