from sqlalchemy import Column, String

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin, SoftDeleteMixin


class Brand(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "brands"

    name = Column(String(150), nullable=False)
    logo = Column(String(255), nullable=True)
