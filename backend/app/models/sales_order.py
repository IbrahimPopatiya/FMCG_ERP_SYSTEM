from sqlalchemy import Column, String, Text, DateTime, Numeric, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin, SoftDeleteMixin


class SalesOrder(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "sales_orders"

    order_number = Column(String(80), unique=True, nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    salesman_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    order_date = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    status = Column(String(20), nullable=False, default="pending")
    # pending, approved, loaded, delivered, cancelled
    order_source = Column(String(20), nullable=False, default="salesman")  # salesman, customer
    remarks = Column(Text, nullable=True)
    expected_delivery = Column(DateTime(timezone=True), nullable=True)
    subtotal = Column(Numeric(12, 2), nullable=False, default=0)
    discount = Column(Numeric(12, 2), nullable=False, default=0)
    cgst = Column(Numeric(12, 2), nullable=False, default=0)
    sgst = Column(Numeric(12, 2), nullable=False, default=0)
    igst = Column(Numeric(12, 2), nullable=False, default=0)
    round_off = Column(Numeric(12, 2), nullable=False, default=0)
    total = Column(Numeric(12, 2), nullable=False, default=0)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    updated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    items = relationship("SalesOrderItem", cascade="all, delete-orphan")


class SalesOrderItem(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "sales_order_items"

    sales_order_id = Column(UUID(as_uuid=True), ForeignKey("sales_orders.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    ordered_qty = Column(Numeric(12, 2), nullable=False, default=0)
    approved_qty = Column(Numeric(12, 2), nullable=False, default=0)
    loaded_qty = Column(Numeric(12, 2), nullable=False, default=0)
    price = Column(Numeric(12, 2), nullable=False, default=0)
    discount = Column(Numeric(12, 2), nullable=False, default=0)
    gst_rate = Column(Numeric(5, 2), nullable=False, default=0)
    cgst = Column(Numeric(12, 2), nullable=False, default=0)
    sgst = Column(Numeric(12, 2), nullable=False, default=0)
    igst = Column(Numeric(12, 2), nullable=False, default=0)
    line_total = Column(Numeric(12, 2), nullable=False, default=0)
