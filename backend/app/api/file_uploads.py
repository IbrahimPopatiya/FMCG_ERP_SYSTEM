from fastapi import APIRouter, Depends, UploadFile, File, Form

from app.core.deps import Principal, get_current_principal
from app.schemas.file_upload import FileUploadResponse
from app.services.file_upload import save_file

router = APIRouter(prefix="/files", tags=["files"])


@router.post("", response_model=FileUploadResponse, status_code=201)
async def upload_file(
    file: UploadFile = File(...),
    category: str = Form("misc"),
    principal: Principal = Depends(get_current_principal),
):
    contents = await file.read()
    file_url = save_file(contents, file.filename, category)
    return FileUploadResponse(file_url=file_url)
