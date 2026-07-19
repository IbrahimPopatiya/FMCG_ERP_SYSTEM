from sqlalchemy import Column, String, Text, Integer, Numeric, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, generate_uuid7


class Inventory(Base, UUIDPKMixin):
    """Live stock summary - one row per product per warehouse.

    This is a fast summary that can always be rebuilt from InventoryMovement.
    """

    __tablename__ = "inventory"
    __table_args__ = (
        UniqueConstraint("warehouse_id", "product_id", name="uq_warehouse_product"),
    )

    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    physical_stock = Column(Integer, nullable=False, default=0)
    reserved_stock = Column(Integer, nullable=False, default=0)
    damaged_stock = Column(Integer, nullable=False, default=0)
    expiry_stock = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )


class InventoryMovement(Base):
    """The stock ledger. Every stock change writes one row here. Append-only:
    rows in this table are never updated or deleted.
    """

    __tablename__ = "inventory_movements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid7)
    warehouse_id = Column(UUID(as_uuid=True), ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    movement_type = Column(String(30), nullable=False)
    # purchase_in, reserved, unreserved, sold_out, returned_in, damaged, expired, adjustment, transfer_in, transfer_out
    quantity = Column(Numeric(12, 2), nullable=False)
    reference_type = Column(String(50), nullable=True)  # sales_order, invoice, purchase, return, adjustment
    reference_id = Column(UUID(as_uuid=True), nullable=True)
    balance_after = Column(Integer, nullable=True)
    remarks = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
