import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.deps import Principal, get_current_principal, get_current_user, require_staff
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import Page
from app.schemas.post import PostCreate, PostResponse, PostStatusUpdate
from app.services import post as post_service
from app.services.post import PostNotFoundError, ProductNotFoundError

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
    """Newest first, active only - feeds the customer Home reel."""
    return post_service.list_posts(db)


@router.get("/admin", response_model=Page[PostResponse])
def list_all_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """Newest first, including inactive, paginated - for the admin Posts
    management screen. `search` matches the post's product name."""
    items, total = post_service.list_all_posts(db, page, page_size, search)
    return Page(items=items, total=total, page=page, page_size=page_size)


@router.patch("/{post_id}/status", response_model=PostResponse)
def set_post_status(
    post_id: uuid.UUID,
    data: PostStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    try:
        return post_service.set_post_active(db, post_id, data.is_active)
    except PostNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{post_id}/repost", response_model=PostResponse)
def repost_post(
    post_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_staff),
):
    """Bumps the post back to the top of the customer feed and reactivates it."""
    try:
        return post_service.repost(db, post_id)
    except PostNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
