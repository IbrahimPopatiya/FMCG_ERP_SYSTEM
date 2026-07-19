from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin, SoftDeleteMixin


class Purchase(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "purchases"

    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    purchase_number = Column(String(80), unique=True, nullable=False)
    purchase_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    status = Column(String(20), nullable=False, default="draft")  # draft, received, cancelled
    subtotal = Column(Numeric(12, 2), nullable=False, default=0)
    cgst = Column(Numeric(12, 2), nullable=False, default=0)
    sgst = Column(Numeric(12, 2), nullable=False, default=0)
    igst = Column(Numeric(12, 2), nullable=False, default=0)
    round_off = Column(Numeric(12, 2), nullable=False, default=0)
    total = Column(Numeric(12, 2), nullable=False, default=0)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class PurchaseItem(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "purchase_items"

    purchase_id = Column(UUID(as_uuid=True), ForeignKey("purchases.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    quantity = Column(Numeric(12, 2), nullable=False, default=0)
    purchase_price = Column(Numeric(12, 2), nullable=False, default=0)
    gst_rate = Column(Numeric(5, 2), nullable=False, default=0)
    cgst = Column(Numeric(12, 2), nullable=False, default=0)
    sgst = Column(Numeric(12, 2), nullable=False, default=0)
    igst = Column(Numeric(12, 2), nullable=False, default=0)
    total = Column(Numeric(12, 2), nullable=False, default=0)
