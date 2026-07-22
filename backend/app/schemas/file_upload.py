from pydantic import BaseModel


class FileUploadResponse(BaseModel):
    file_url: str
