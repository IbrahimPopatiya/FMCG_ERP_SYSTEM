from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.deps import Principal, get_current_principal, get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.post import PostCreate, PostResponse
from app.services import post as post_service
from app.services.post import ProductNotFoundError

router = APIRouter(prefix="/posts", tags=["posts"])


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    data: PostCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return post_service.create_post(db, data, current_user.id)
    except ProductNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("", response_model=list[PostResponse])
def list_posts(
    db: Session = Depends(get_db),
    principal: Principal = Depends(get_current_principal),
):
    """Newest first - used by both admin management and the customer Home feed."""
    return post_service.list_posts(db)
