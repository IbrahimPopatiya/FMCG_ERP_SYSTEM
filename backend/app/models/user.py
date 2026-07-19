from sqlalchemy import Column, String

from app.db.session import Base
from app.db.mixins import UUIDPKMixin, TimestampMixin, SoftDeleteMixin


class User(Base, UUIDPKMixin, TimestampMixin, SoftDeleteMixin):
    """All staff. `role` decides whether someone is a salesman, driver, admin, etc."""

    __tablename__ = "users"

    full_name = Column(String(150), nullable=False)
    mobile = Column(String(20), unique=True, nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False)  # admin, salesman, driver, manager, dispatcher, cashier
    status = Column(String(20), nullable=False, default="active")  # active, inactive
