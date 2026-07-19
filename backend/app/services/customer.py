import uuid
from decimal import Decimal

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.enums import CustomerStatus
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


class DuplicateCustomerError(Exception):
    """Raised when customer_code is already used by another customer."""


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
    )
    db.add(customer)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateCustomerError("A customer with this customer_code already exists")
    db.refresh(customer)
    return customer


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
