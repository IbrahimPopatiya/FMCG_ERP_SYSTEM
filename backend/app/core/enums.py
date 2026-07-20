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
    
class ProductStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class WarehouseStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class OrderSource(str, Enum):
    SALESMAN = "salesman"
    CUSTOMER = "customer"


class OrderStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    LOADED = "loaded"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class PaymentStatus(str, Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    PAID = "paid"


class TallySyncStatus(str, Enum):
    PENDING = "pending"
    SYNCED = "synced"
    FAILED = "failed"


class DeliveryStatus(str, Enum):
    PENDING = "pending"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    FAILED = "failed"
