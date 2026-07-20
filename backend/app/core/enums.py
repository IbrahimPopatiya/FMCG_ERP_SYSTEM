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


class SupplierStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class VehicleStatus(str, Enum):
    AVAILABLE = "available"
    IN_USE = "in_use"
    MAINTENANCE = "maintenance"


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


class PurchaseStatus(str, Enum):
    DRAFT = "draft"
    RECEIVED = "received"
    CANCELLED = "cancelled"


class MovementType(str, Enum):
    PURCHASE_IN = "purchase_in"
    RESERVED = "reserved"
    UNRESERVED = "unreserved"
    SOLD_OUT = "sold_out"
    RETURNED_IN = "returned_in"
    DAMAGED = "damaged"
    EXPIRED = "expired"
    ADJUSTMENT = "adjustment"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"


class PaymentRecordStatus(str, Enum):
    PENDING = "pending"
    CLEARED = "cleared"
    BOUNCED = "bounced"


class ReturnStatus(str, Enum):
    REQUESTED = "requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class ReturnReason(str, Enum):
    DAMAGED = "damaged"
    EXPIRED = "expired"
    WRONG_ITEM = "wrong_item"
    NOT_NEEDED = "not_needed"


class CreditNoteStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
