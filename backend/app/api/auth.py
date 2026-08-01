import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.logging import get_logger, log_event
from app.core.security import create_access_token
from app.db.session import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth import authenticate

router = APIRouter(prefix="/auth", tags=["auth"])
logger = get_logger(__name__)


def _redact_identifier(identifier: str) -> str:
    """Keep enough to debug login issues without dumping full credentials."""
    value = identifier.strip()
    if len(value) <= 4:
        return "***"
    return f"{value[:2]}***{value[-2:]}"


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    principal = authenticate(db, data.identifier, data.password)
    if principal is None:
        log_event(
            logger,
            "auth.login_failed",
            level=logging.WARNING,
            identifier=_redact_identifier(data.identifier),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    principal_id = principal.user.id if principal.type == "user" else principal.customer.id
    token = create_access_token(principal_id, principal_type=principal.type)
    log_event(
        logger,
        "auth.login_succeeded",
        principal_type=principal.type,
        principal_id=str(principal_id),
    )
    return TokenResponse(access_token=token, principal_type=principal.type)
