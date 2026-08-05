import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import CustomerStatus, UserRole
from app.core.security import hash_password
from app.models.customer import Customer
from app.models.route import Route
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.schemas.route import RouteCreate
from app.services import route as route_service


class DuplicateCustomerError(Exception):
    """Raised when customer_code is already used by another customer."""


class SalesmanNotFoundError(Exception):
    """Raised when salesman_id doesn't point to an active salesman user."""


def create_customer(db: Session, data: CustomerCreate) -> Customer:
    customer = Customer(
        customer_code=data.customer_code,
        business_name=data.business_name,
        owner_name=data.owner_name,
        mobile=data.mobile,
        alternate_mobile=data.alternate_mobile,
        gst_number=data.gst_number,
        address=data.address,
        city=data.city,
        state=data.state,
        pincode=data.pincode,
        credit_limit=data.credit_limit,
        payment_terms=data.payment_terms,
        route_id=data.route_id,
        price_list_id=data.price_list_id,
        password_hash=hash_password(data.password),
    )
    db.add(customer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateCustomerError("A customer with this customer_code already exists")
    db.refresh(customer)
    return customer


def list_customers(
    db: Session,
    page: int,
    page_size: int,
    search: str | None = None,
    route_id: uuid.UUID | None = None,
) -> tuple[list[Customer], int]:
    query = db.query(Customer).filter(Customer.deleted_at.is_(None))
    if route_id:
        query = query.filter(Customer.route_id == route_id)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Customer.business_name.ilike(like))
            | (Customer.owner_name.ilike(like))
            | (Customer.mobile.ilike(like))
            | (Customer.customer_code.ilike(like))
        )
    query = query.order_by(Customer.business_name)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_customer(db: Session, customer_id: uuid.UUID) -> Customer | None:
    return (
        db.query(Customer)
        .filter(Customer.id == customer_id, Customer.deleted_at.is_(None))
        .first()
    )


def update_customer(db: Session, customer_id: uuid.UUID, data: CustomerUpdate) -> Customer | None:
    customer = get_customer(db, customer_id)
    if customer is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(customer, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateCustomerError("A customer with this mobile already exists")
    db.refresh(customer)
    return customer


def set_customer_status(
    db: Session, customer_id: uuid.UUID, new_status: CustomerStatus
) -> Customer | None:
    customer = get_customer(db, customer_id)
    if customer is None:
        return None

    customer.status = new_status
    db.commit()
    db.refresh(customer)
    return customer


def update_customer_location(
    db: Session, customer_id: uuid.UUID, latitude: Decimal, longitude: Decimal
) -> Customer | None:
    customer = get_customer(db, customer_id)
    if customer is None:
        return None

    customer.latitude = latitude
    customer.longitude = longitude
    db.commit()
    db.refresh(customer)
    return customer


def assign_salesman_to_customer(
    db: Session, customer_id: uuid.UUID, salesman_id: uuid.UUID
) -> Customer | None:
    """Puts the customer on the given salesman's route, creating that route
    if the salesman doesn't have one yet - a salesman's route is what scopes
    which customers they can see/order for (see sales_order.py)."""
    customer = get_customer(db, customer_id)
    if customer is None:
        return None

    salesman = db.query(User).filter(
        User.id == salesman_id, User.role == UserRole.SALESMAN, User.deleted_at.is_(None)
    ).first()
    if salesman is None:
        raise SalesmanNotFoundError("Salesman not found")

    route = db.query(Route).filter(
        Route.salesman_id == salesman_id, Route.deleted_at.is_(None)
    ).first()
    if route is None:
        route = route_service.create_route(
            db, RouteCreate(name=f"{salesman.full_name}'s Route", salesman_id=salesman.id)
        )

    customer.route_id = route.id
    db.commit()
    db.refresh(customer)
    return customer


def soft_delete_customer(db: Session, customer_id: uuid.UUID) -> Customer | None:
    customer = get_customer(db, customer_id)
    if customer is None:
        return None

    customer.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(customer)
    return customer
