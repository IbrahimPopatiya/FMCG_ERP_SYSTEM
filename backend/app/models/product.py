from sqlalchemy import Column, String, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin, SoftDeleteMixin


class Product(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "products"

    sku = Column(String(80), unique=True, nullable=False)
    barcode = Column(String(80), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"), nullable=True)
    unit = Column(String(50), nullable=False)
    packing = Column(String(50), nullable=False)
    mrp = Column(Numeric(12, 2), nullable=False)
    selling_price = Column(Numeric(12, 2), nullable=False)
    gst_rate = Column(Numeric(5, 2), nullable=False)
    minimum_stock = Column(Integer, nullable=False, default=0)
    image = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False, default="active")  # active, inactive
