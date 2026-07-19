from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin, SoftDeleteMixin


class Route(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "routes"

    name = Column(String(150), nullable=False)
    salesman_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    status = Column(String(20), nullable=False, default="active")  # active, inactive
