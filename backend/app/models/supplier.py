from sqlalchemy import Column, String, Text

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin, SoftDeleteMixin


class Supplier(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "suppliers"

    supplier_code = Column(String(50), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    gst_number = Column(String(30), nullable=True)
    mobile = Column(String(20), nullable=False)
    address = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="active")  # active, inactive
