import uuid
from decimal import Decimal

from sqlalchemy.orm import Session

from app.core.deps import Principal
from app.core.enums import MovementType, OrderSource, OrderStatus
from app.db.mixins import generate_uuid7
from app.models.customer import Customer
from app.models.product import Product
from app.models.route import Route
from app.models.sales_order import SalesOrder, SalesOrderItem
from app.models.warehouse import Warehouse
from app.schemas.sales_order import SalesOrderCreate, SalesOrderUpdate
from app.services.inventory import record_movement
from app.services.price_list import get_effective_price


class CustomerNotFoundError(Exception):
    """Raised when the customer_id on a staff-placed order doesn't exist."""


class ProductNotFoundError(Exception):
    """Raised when an order line references a product that doesn't exist."""


class NotAuthorizedForCustomerError(Exception):
    """Raised when a salesman tries to act on a customer outside their route."""


class NoFulfillingWarehouseError(Exception):
    """Raised when there's no active warehouse to compute GST against."""


class OrderNotEditableError(Exception):
    """Raised when editing/cancelling an order that isn't still pending."""


class OrderNotApprovableError(Exception):
    """Raised when approving an order that isn't pending."""


class OrderNotLoadableError(Exception):
    """Raised when loading an order that isn't approved."""


class SalesOrderItemNotFoundError(Exception):
    """Raised when an approve/load request references an item not on the order."""


def _resolve_customer_and_source(
    db: Session, data: SalesOrderCreate, principal: Principal
) -> tuple[Customer, str, uuid.UUID | None]:
    if principal.type == "customer":
        return principal.customer, OrderSource.CUSTOMER, None

    if data.customer_id is None:
        raise CustomerNotFoundError("customer_id is required when a salesman places an order")

    customer = db.query(Customer).filter(
        Customer.id == data.customer_id, Customer.deleted_at.is_(None)
    ).first()
    if customer is None:
        raise CustomerNotFoundError("Customer not found")

    route = None
    if customer.route_id is not None:
        route = db.query(Route).filter(Route.id == customer.route_id).first()

    if route is None or route.salesman_id != principal.user.id:
        raise NotAuthorizedForCustomerError(
            "You may only place orders for customers on your own route"
        )

    return customer, OrderSource.SALESMAN, principal.user.id


def _get_fulfilling_warehouse(db: Session) -> Warehouse:
    warehouse = db.query(Warehouse).filter(
        Warehouse.deleted_at.is_(None), Warehouse.status == "active"
    ).first()
    if warehouse is None:
        raise NoFulfillingWarehouseError("No active warehouse configured to fulfill orders")
    return warehouse


def _price_items(
    db: Session, customer: Customer, warehouse: Warehouse, items_data
) -> tuple[list[SalesOrderItem], Decimal, Decimal, Decimal, Decimal, Decimal]:
    interstate = customer.state != warehouse.state

    order_items = []
    subtotal = Decimal("0")
    cgst_total = Decimal("0")
    sgst_total = Decimal("0")
    igst_total = Decimal("0")

    for item_data in items_data:
        product = db.query(Product).filter(
            Product.id == item_data.product_id, Product.deleted_at.is_(None)
        ).first()
        if product is None:
            raise ProductNotFoundError(f"Product {item_data.product_id} not found")

        price = get_effective_price(db, customer.price_list_id, product.id, product.selling_price)
        line_amount = price * item_data.ordered_qty
        gst_amount = line_amount * product.gst_rate / 100

        cgst = sgst = igst = Decimal("0")
        if interstate:
            igst = gst_amount
        else:
            cgst = gst_amount / 2
            sgst = gst_amount / 2

        line_total = line_amount + gst_amount

        order_items.append(
            SalesOrderItem(
                product_id=product.id,
                ordered_qty=item_data.ordered_qty,
                price=price,
                gst_rate=product.gst_rate,
                cgst=cgst,
                sgst=sgst,
                igst=igst,
                line_total=line_total,
            )
        )
        subtotal += line_amount
        cgst_total += cgst
        sgst_total += sgst
        igst_total += igst

    return order_items, subtotal, cgst_total, sgst_total, igst_total


def create_sales_order(db: Session, data: SalesOrderCreate, principal: Principal) -> SalesOrder:
    customer, order_source, salesman_id = _resolve_customer_and_source(db, data, principal)
    warehouse = _get_fulfilling_warehouse(db)

    order_items, subtotal, cgst, sgst, igst = _price_items(db, customer, warehouse, data.items)
    total = subtotal + cgst + sgst + igst

    order = SalesOrder(
        order_number=f"SO-{generate_uuid7().hex[:12].upper()}",
        customer_id=customer.id,
        salesman_id=salesman_id,
        order_source=order_source,
        status=OrderStatus.PENDING,
        remarks=data.remarks,
        expected_delivery=data.expected_delivery,
        subtotal=subtotal,
        cgst=cgst,
        sgst=sgst,
        igst=igst,
        total=total,
        items=order_items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def get_sales_order(db: Session, order_id: uuid.UUID) -> SalesOrder | None:
    return db.query(SalesOrder).filter(
        SalesOrder.id == order_id, SalesOrder.deleted_at.is_(None)
    ).first()


def _authorize_order_access(db: Session, order: SalesOrder, principal: Principal) -> bool:
    if principal.type == "customer":
        return order.customer_id == principal.customer.id

    customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
    route = None
    if customer and customer.route_id is not None:
        route = db.query(Route).filter(Route.id == customer.route_id).first()
    return route is not None and route.salesman_id == principal.user.id


def get_owned_sales_order(db: Session, order_id: uuid.UUID, principal: Principal) -> SalesOrder | None:
    """Returns the order only if the principal is allowed to see it - None otherwise
    (callers should turn that into a 404, never a 403, to avoid leaking existence)."""
    order = get_sales_order(db, order_id)
    if order is None or not _authorize_order_access(db, order, principal):
        return None
    return order


def update_sales_order(
    db: Session, order_id: uuid.UUID, data: SalesOrderUpdate, principal: Principal
) -> SalesOrder | None:
    order = get_owned_sales_order(db, order_id, principal)
    if order is None:
        return None

    if order.status != OrderStatus.PENDING:
        raise OrderNotEditableError("Only pending orders can be edited")

    if data.remarks is not None:
        order.remarks = data.remarks

    if data.items is not None:
        customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
        warehouse = _get_fulfilling_warehouse(db)
        order_items, subtotal, cgst, sgst, igst = _price_items(db, customer, warehouse, data.items)
        order.items = order_items
        order.subtotal = subtotal
        order.cgst = cgst
        order.sgst = sgst
        order.igst = igst
        order.total = subtotal + cgst + sgst + igst

    db.commit()
    db.refresh(order)
    return order


def cancel_sales_order(db: Session, order_id: uuid.UUID, principal: Principal) -> SalesOrder | None:
    order = get_owned_sales_order(db, order_id, principal)
    if order is None:
        return None

    if order.status != OrderStatus.PENDING:
        raise OrderNotEditableError("Only pending orders can be cancelled")

    order.status = OrderStatus.CANCELLED
    db.commit()
    db.refresh(order)
    return order


def approve_sales_order(
    db: Session, order_id: uuid.UUID, items_data, approved_by: uuid.UUID
) -> SalesOrder | None:
    order = get_sales_order(db, order_id)
    if order is None:
        return None

    if order.status != OrderStatus.PENDING:
        raise OrderNotApprovableError("Only a pending order can be approved")

    warehouse = _get_fulfilling_warehouse(db)
    item_map = {item.id: item for item in order.items}

    for req in items_data:
        item = item_map.get(req.item_id)
        if item is None:
            raise SalesOrderItemNotFoundError(f"Order item {req.item_id} not found on this order")

        item.approved_qty = req.approved_qty
        record_movement(
            db,
            warehouse_id=warehouse.id,
            product_id=item.product_id,
            movement_type=MovementType.RESERVED,
            quantity=int(req.approved_qty),
            reference_type="sales_order",
            reference_id=order.id,
            user_id=approved_by,
        )

    order.status = OrderStatus.APPROVED
    db.commit()
    db.refresh(order)
    return order


def load_sales_order(
    db: Session, order_id: uuid.UUID, items_data, loaded_by: uuid.UUID
) -> SalesOrder | None:
    order = get_sales_order(db, order_id)
    if order is None:
        return None

    if order.status != OrderStatus.APPROVED:
        raise OrderNotLoadableError("Only an approved order can be loaded")

    warehouse = _get_fulfilling_warehouse(db)
    item_map = {item.id: item for item in order.items}

    for req in items_data:
        item = item_map.get(req.item_id)
        if item is None:
            raise SalesOrderItemNotFoundError(f"Order item {req.item_id} not found on this order")

        item.loaded_qty = req.loaded_qty
        record_movement(
            db,
            warehouse_id=warehouse.id,
            product_id=item.product_id,
            movement_type=MovementType.SOLD_OUT,
            quantity=int(req.loaded_qty),
            reference_type="sales_order",
            reference_id=order.id,
            user_id=loaded_by,
        )

    order.status = OrderStatus.LOADED
    db.commit()
    db.refresh(order)
    return order


def list_orders_for_principal(db: Session, principal: Principal) -> list[SalesOrder]:
    query = db.query(SalesOrder).filter(SalesOrder.deleted_at.is_(None))
    if principal.type == "customer":
        return query.filter(SalesOrder.customer_id == principal.customer.id).all()

    routes = db.query(Route).filter(Route.salesman_id == principal.user.id).all()
    route_ids = [r.id for r in routes]
    customer_ids = [
        c.id for c in db.query(Customer).filter(Customer.route_id.in_(route_ids)).all()
    ] if route_ids else []
    return query.filter(SalesOrder.customer_id.in_(customer_ids)).all() if customer_ids else []
