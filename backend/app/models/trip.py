from sqlalchemy import Column, String, Text, DateTime, Numeric, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin, SoftDeleteMixin


class LoadingTrip(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    """One vehicle+driver assignment carrying one or more sales orders,
    for the Loading Supervisor workflow (final_docs/design-prompt/
    Loading_Supervisor_Implementation_Prompt.md). Distinct from Delivery,
    which tracks a single invoice's drop-off - a trip is the loading-dock
    grouping that happens before that."""

    __tablename__ = "loading_trips"

    trip_number = Column(String(80), unique=True, nullable=False)
    vehicle_id = Column(UUID(as_uuid=True), ForeignKey("vehicles.id"), nullable=False)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    trip_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    status = Column(String(20), nullable=False, default="pending")
    # pending, loading, out_for_delivery, delivered, cancelled
    remark = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    orders = relationship("LoadingTripOrder", cascade="all, delete-orphan")


class LoadingTripOrder(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "loading_trip_orders"

    trip_id = Column(UUID(as_uuid=True), ForeignKey("loading_trips.id"), nullable=False)
    sales_order_id = Column(UUID(as_uuid=True), ForeignKey("sales_orders.id"), nullable=False)
    # Snapshot of the order's loading-capacity value at assignment time (sum
    # of ordered_qty across its items - see Loading Capacity note in
    # app/services/trip.py) so it doesn't drift if the order is edited later.
    lc_value = Column(Numeric(12, 2), nullable=False, default=0)
