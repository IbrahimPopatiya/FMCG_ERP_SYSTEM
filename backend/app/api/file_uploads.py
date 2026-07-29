from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form

from app.core.deps import Principal, get_current_principal
from app.schemas.file_upload import FileUploadResponse
from app.services.file_upload import save_file

router = APIRouter(prefix="/files", tags=["files"])

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


@router.post("", response_model=FileUploadResponse, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form("misc"),
    principal: Principal = Depends(get_current_principal),
):
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=413, detail="File too large - maximum size is 10MB")
    file_url = save_file(contents, file.filename, category)
    return FileUploadResponse(file_url=file_url)
