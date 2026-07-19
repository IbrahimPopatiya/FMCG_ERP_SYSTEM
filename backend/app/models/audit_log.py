from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, func
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from app.db.mixins import UUIDPKMixin


class AuditLog(Base, UUIDPKMixin):
    """A general who-did-what trail. Append-only: rows are never updated or deleted."""

    __tablename__ = "audit_log"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String(50), nullable=False)  # create, update, delete, approve, sync, login, etc.
    entity_type = Column(String(80), nullable=False)  # e.g. "invoices"
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
