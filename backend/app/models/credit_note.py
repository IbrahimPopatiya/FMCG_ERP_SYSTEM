from sqlalchemy import Column, String, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin


class CreditNote(Base, UUIDPKMixin, TimestampMixin):
    """Records the amount owed back to a customer once a return is completed
    and evaluated. One credit note per return."""

    __tablename__ = "credit_notes"

    return_id = Column(UUID(as_uuid=True), ForeignKey("returns.id"), unique=True, nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # pending, approved, rejected
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
