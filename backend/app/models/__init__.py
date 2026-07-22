"""Import every model here so `Base.metadata` knows about all tables.

This file is imported by both `app/db/init_db.py` (for auto table creation)
and `alembic/env.py` (for migrations). If you add a new model file, add its
import here too, or the table will not be created.
"""

from app.models.user import User
from app.models.route import Route
from app.models.customer import Customer
from app.models.category import Category
from app.models.brand import Brand
from app.models.product import Product
from app.models.price_list import PriceList, PriceListItem
from app.models.warehouse import Warehouse
from app.models.supplier import Supplier
from app.models.vehicle import Vehicle
from app.models.inventory import Inventory, InventoryMovement
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.models.invoice import Invoice
from app.models.delivery import Delivery
from app.models.payment import Payment
from app.models.purchase import Purchase, PurchaseItem
from app.models.return_ import Return, ReturnItem
from app.models.credit_note import CreditNote
from app.models.audit_log import AuditLog

__all__ = [
    "User",
    "Route",
    "Customer",
    "Category",
    "Brand",
    "Product",
    "PriceList",
    "PriceListItem",
    "Warehouse",
    "Supplier",
    "Vehicle",
    "Inventory",
    "InventoryMovement",
    "SalesOrder",
    "SalesOrderItem",
    "Invoice",
    "Delivery",
    "Payment",
    "Purchase",
    "PurchaseItem",
    "Return",
    "ReturnItem",
    "CreditNote",
    "AuditLog",
]
