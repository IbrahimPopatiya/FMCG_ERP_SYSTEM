from sqlalchemy import Column, String, DateTime, Numeric, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin


class Payment(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "payments"

    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    payment_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    cash_amount = Column(Numeric(12, 2), nullable=False, default=0)
    upi_amount = Column(Numeric(12, 2), nullable=False, default=0)
    cheque_amount = Column(Numeric(12, 2), nullable=False, default=0)
    total_amount = Column(Numeric(12, 2), nullable=False, default=0)
    reference_number = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending, cleared, bounced
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
