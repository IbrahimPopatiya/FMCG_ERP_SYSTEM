from dataclasses import dataclass
from typing import Literal, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.enums import UserRole
from app.core.security import decode_access_token, decode_token
from app.db.session import get_db
from app.models.customer import Customer
from app.models.user import User

bearer_scheme = HTTPBearer()


@dataclass
class Principal:
    """Whoever is making the request - a staff user or a customer."""

    type: Literal["user", "customer"]
    user: Optional[User] = None
    customer: Optional[Customer] = None


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Reads the Authorization: Bearer <token> header, verifies it, and loads
    the matching user. Add this as a dependency on any route that should
    require login: `current_user: User = Depends(get_current_user)`.
    """
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise unauthorized

    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if user is None:
        raise unauthorized

    return user


def get_current_principal(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Principal:
    """Resolves the caller to either a staff user or a customer, from one
    token scheme. This is the single place that enforces who a token belongs
    to - routes shared between staff and customers (e.g. orders, catalog
    reads) branch on `principal.type`; staff-only routes use `require_staff`.
    """
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_token(credentials.credentials)
    if payload is None:
        raise unauthorized

    principal_id = payload["sub"]
    principal_type = payload.get("type", "user")

    if principal_type == "customer":
        customer = (
            db.query(Customer)
            .filter(
                Customer.id == principal_id,
                Customer.deleted_at.is_(None),
                Customer.login_enabled.is_(True),
            )
            .first()
        )
        if customer is None:
            raise unauthorized
        return Principal(type="customer", customer=customer)

    user = db.query(User).filter(User.id == principal_id, User.deleted_at.is_(None)).first()
    if user is None:
        raise unauthorized
    return Principal(type="user", user=user)


def require_staff(principal: Principal = Depends(get_current_principal)) -> User:
    """Use on routes only staff may call - rejects a customer token."""
    if principal.type != "user":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Staff access required"
        )
    return principal.user


def require_customer(principal: Principal = Depends(get_current_principal)) -> Customer:
    """Use on routes only a customer may call - rejects a staff token."""
    if principal.type != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Customer access required"
        )
    return principal.customer


def require_role(*roles: UserRole):
    """Use on routes only specific staff roles may call, e.g.
    `current_user: User = Depends(require_role(UserRole.ADMIN))`.
    Rejects a customer token, then rejects a staff token whose role isn't listed.
    """

    def dependency(current_user: User = Depends(require_staff)) -> User:
        if current_user.role not in {role.value for role in roles}:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="You do not have access to this resource"
            )
        return current_user

    return dependency
