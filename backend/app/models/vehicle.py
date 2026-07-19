from sqlalchemy import Column, String, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin, SoftDeleteMixin


class Vehicle(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "vehicles"

    vehicle_number = Column(String(50), unique=True, nullable=False)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=True)
    capacity = Column(Numeric(12, 2), nullable=False, default=0)
    status = Column(String(20), nullable=False, default="available")  # available, in_use, maintenance
