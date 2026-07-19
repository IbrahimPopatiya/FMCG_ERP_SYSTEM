from sqlalchemy import Column, String, Text, Integer, Numeric, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin, SoftDeleteMixin


class Customer(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "customers"

    customer_code = Column(String(50), unique=True, nullable=False)
    business_name = Column(String(200), nullable=False)
    owner_name = Column(String(150), nullable=False)
    mobile = Column(String(20), nullable=False)
    alternate_mobile = Column(String(20), nullable=True)
    gst_number = Column(String(30), nullable=True)
    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(15), nullable=False)
    credit_limit = Column(Numeric(12, 2), nullable=False, default=0)
    payment_terms = Column(Integer, nullable=False, default=0)
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.id"), nullable=True)
    price_list_id = Column(UUID(as_uuid=True), ForeignKey("price_lists.id"), nullable=True)
    status = Column(String(20), nullable=False, default="active")  # active, inactive, blocked
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
