from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.customer import CustomerCreate, CustomerResponse
from app.services import customer as customer_service
from app.services.customer import DuplicateCustomerError

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("", response_model=CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return customer_service.create_customer(db, data)
    except DuplicateCustomerError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
