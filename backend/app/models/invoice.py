from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin, SoftDeleteMixin


class Invoice(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "invoices"

    sales_order_id = Column(UUID(as_uuid=True), ForeignKey("sales_orders.id"), unique=True, nullable=False)
    invoice_number = Column(String(80), unique=True, nullable=False)
    invoice_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    place_of_supply = Column(String(100), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False, default=0)
    discount = Column(Numeric(12, 2), nullable=False, default=0)
    cgst = Column(Numeric(12, 2), nullable=False, default=0)
    sgst = Column(Numeric(12, 2), nullable=False, default=0)
    igst = Column(Numeric(12, 2), nullable=False, default=0)
    round_off = Column(Numeric(12, 2), nullable=False, default=0)
    total = Column(Numeric(12, 2), nullable=False, default=0)
    payment_status = Column(String(20), nullable=False, default="unpaid")  # unpaid, partial, paid
    tally_sync_status = Column(String(20), nullable=False, default="pending")  # pending, synced, failed
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
