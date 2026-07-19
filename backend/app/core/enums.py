"""Shared enum values, matching database_schema_docs.markdown Section 6.

Import these instead of typing status strings by hand - it stops typos like
"actve" from silently slipping through.
"""

from enum import Enum


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class UserRole(str, Enum):
    ADMIN = "admin"
    SALESMAN = "salesman"
    DRIVER = "driver"
    MANAGER = "manager"
    DISPATCHER = "dispatcher"
    CASHIER = "cashier"


class RouteStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class CustomerStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLOCKED = "blocked"
