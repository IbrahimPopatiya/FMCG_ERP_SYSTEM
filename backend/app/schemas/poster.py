from pydantic import BaseModel


class PosterGenerateResponse(BaseModel):
    image: str
