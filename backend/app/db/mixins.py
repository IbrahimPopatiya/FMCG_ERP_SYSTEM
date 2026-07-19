import uuid

from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from uuid_extensions import uuid7


def generate_uuid7() -> uuid.UUID:
    return uuid7()


class UUIDPKMixin:
    """Gives a table a UUID v7 primary key column named `id`."""

    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid7)


class TimestampMixin:
    """Gives a table `created_at` / `updated_at` columns."""

    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class SoftDeleteMixin:
    """Gives a table a `deleted_at` column for soft deletes."""

    deleted_at = Column(DateTime(timezone=True), nullable=True)
