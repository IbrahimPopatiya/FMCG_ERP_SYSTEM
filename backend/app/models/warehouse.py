from sqlalchemy import Column, String, Text

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin, SoftDeleteMixin


class Warehouse(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "warehouses"

    name = Column(String(150), nullable=False)
    address = Column(Text, nullable=False)
    state = Column(String(100), nullable=False)  # used to decide CGST+SGST vs IGST
    status = Column(String(20), nullable=False, default="active")  # active, inactive
