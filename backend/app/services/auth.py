from sqlalchemy.orm import Session

from app.core.deps import Principal
from app.core.security import verify_password
from app.models.customer import Customer
from app.models.user import User


def authenticate(db: Session, identifier: str, password: str) -> Principal | None:
    """Checks staff (by email, then mobile) first, then customers (by mobile)."""
    user = (
        db.query(User)
        .filter(
            (User.email == identifier) | (User.mobile == identifier),
            User.deleted_at.is_(None),
        )
        .first()
    )
    if user is not None:
        if not verify_password(password, user.password_hash):
            return None
        return Principal(type="user", user=user)

    customer = (
        db.query(Customer)
        .filter(
            Customer.mobile == identifier,
            Customer.deleted_at.is_(None),
            Customer.login_enabled.is_(True),
        )
        .first()
    )
    if customer is not None and customer.password_hash is not None:
        if not verify_password(password, customer.password_hash):
            return None
        return Principal(type="customer", customer=customer)

    return None
