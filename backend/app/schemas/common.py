from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """Standard pagination envelope for any list endpoint that supports it."""

    items: list[T]
    total: int
    page: int
    page_size: int
