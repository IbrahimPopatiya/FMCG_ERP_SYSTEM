from sqlalchemy import Column, String, Text, DateTime, Numeric, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin, SoftDeleteMixin


class Return(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "returns"

    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    reason = Column(String(30), nullable=False)  # damaged, expired, wrong_item, not_needed
    remarks = Column(Text, nullable=True)
    photo = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False, default="requested")
    # requested, approved, completed, rejected
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    items = relationship("ReturnItem", cascade="all, delete-orphan")


class ReturnItem(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "return_items"

    return_id = Column(UUID(as_uuid=True), ForeignKey("returns.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False, default=0)
    reason = Column(String(255), nullable=False)
