from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin, SoftDeleteMixin


class Category(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    """Self-referencing via `parent_id`. A null parent means a top-level category."""

    __tablename__ = "categories"

    name = Column(String(150), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    image = Column(String(255), nullable=True)
