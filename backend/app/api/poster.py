import mimetypes

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool

from app.core.deps import require_role
from app.core.enums import UserRole
from app.models.user import User
from app.schemas.poster import PosterGenerateResponse
from app.services.file_upload import save_file
from app.services.poster import PosterGenerationError, generate_poster

router = APIRouter(prefix="/poster", tags=["poster"])

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


@router.post("/generate", response_model=PosterGenerateResponse, status_code=status.HTTP_201_CREATED)
async def generate_poster_ad(
    image: UploadFile = File(...),
    prompt: str = Form(...),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    contents = await image.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large - maximum size is 10MB")

    mime_type = image.content_type or "image/jpeg"

    try:
        # Both the Gemini call and the Supabase upload are blocking network
        # calls - run them off the event loop so they don't stall every other
        # in-flight request while the ad generates.
        poster_bytes, poster_mime = await run_in_threadpool(generate_poster, contents, mime_type, prompt)
    except PosterGenerationError as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(e))

    ext = mimetypes.guess_extension(poster_mime) or ".png"
    try:
        poster_url = await run_in_threadpool(save_file, poster_bytes, f"poster{ext}", "poster-ai")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Couldn't save the generated ad: {e}")

    return PosterGenerateResponse(image=poster_url)
