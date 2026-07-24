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


class DuplicateCustomerError(Exception):
    """Raised when customer_code is already used by another customer."""


def create_customer(db: Session, data: CustomerCreate, current_user: User) -> Customer:
    is_private = current_user.role == UserRole.SALESMAN
    customer = Customer(
        customer_code=data.customer_code,
        business_name=data.business_name,
        owner_name=data.owner_name,
        mobile=data.mobile,
        alternate_mobile=data.alternate_mobile,
        gst_number=data.gst_number,
        pan_number=data.pan_number,
        address=data.address,
        city=data.city,
        state=data.state,
        pincode=data.pincode,
        credit_limit=data.credit_limit,
        payment_terms=data.payment_terms,
        route_id=data.route_id,
        price_list_id=data.price_list_id,
        category=data.category,
        shop_photo_url=data.shop_photo_url,
        gst_document_url=data.gst_document_url,
        pan_document_url=data.pan_document_url,
        latitude=data.latitude,
        longitude=data.longitude,
        password_hash=hash_password(data.password) if data.password else None,
        login_enabled=bool(data.password),
        created_by_user_id=current_user.id,
        is_private=is_private,
    )
    db.add(customer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateCustomerError("A customer with this customer_code already exists")
    db.refresh(customer)
    return customer


def _visible_customer_ids_for_salesman(db: Session, salesman_id: uuid.UUID) -> list[uuid.UUID]:
    """A salesman may only see customers assigned to them by admin (via
    their route) or customers they created themselves (private customers).
    See the "PRIVATE CUSTOMER FEATURE" business rule in
    final_docs/design-prompt/salesman_workflow.md."""
    route_ids = [r.id for r in db.query(Route.id).filter(Route.salesman_id == salesman_id).all()]
    query = db.query(Customer.id).filter(Customer.deleted_at.is_(None))
    if route_ids:
        query = query.filter(
            (Customer.route_id.in_(route_ids)) | (Customer.created_by_user_id == salesman_id)
        )
    else:
        query = query.filter(Customer.created_by_user_id == salesman_id)
    return [row[0] for row in query.all()]


def list_customers(
    db: Session,
    page: int,
    page_size: int,
    search: str | None = None,
    current_user: User | None = None,
) -> tuple[list[Customer], int]:
    query = db.query(Customer).filter(Customer.deleted_at.is_(None))

    if current_user is not None and current_user.role == UserRole.SALESMAN:
        visible_ids = _visible_customer_ids_for_salesman(db, current_user.id)
        if not visible_ids:
            return [], 0
        query = query.filter(Customer.id.in_(visible_ids))

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


def can_view_customer(db: Session, customer: Customer, current_user: User) -> bool:
    if current_user.role != UserRole.SALESMAN:
        return True
    if customer.created_by_user_id == current_user.id:
        return True
    if customer.route_id is None:
        return False
    route = db.query(Route).filter(Route.id == customer.route_id).first()
    return route is not None and route.salesman_id == current_user.id


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


def soft_delete_customer(db: Session, customer_id: uuid.UUID) -> Customer | None:
    customer = get_customer(db, customer_id)
    if customer is None:
        return None

    customer.deleted_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(customer)
    return customer
