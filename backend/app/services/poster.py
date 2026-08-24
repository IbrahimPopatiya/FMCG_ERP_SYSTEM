from google import genai
from google.genai import types

from app.core.config import settings

POSTER_MODEL = "gemini-2.5-flash-image"


class PosterGenerationError(Exception):
    """Raised when Gemini fails to return a generated poster image."""


def generate_poster(image_bytes: bytes, mime_type: str, prompt: str) -> tuple[bytes, str]:
    """Sends the product image + a fully-built prompt to Gemini's image
    model and returns the generated poster as (image_bytes, mime_type).
    Raises PosterGenerationError if Gemini doesn't return an image."""
    if not settings.gemini_api_key:
        raise PosterGenerationError("GEMINI_API_KEY is not configured")

    client = genai.Client(api_key=settings.gemini_api_key)

    try:
        response = client.models.generate_content(
            model=POSTER_MODEL,
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            ],
        )
    except Exception as e:
        # Any Gemini/network failure (bad key, quota, timeout, ...) must
        # surface as PosterGenerationError - an exception raised past this
        # point would skip CORSMiddleware entirely (Starlette only attaches
        # CORS headers to responses that go through normal exception
        # handling), which the browser reports as a misleading CORS error
        # instead of the real failure.
        raise PosterGenerationError(f"Gemini request failed: {e}") from e

    candidates = response.candidates or []
    for candidate in candidates:
        parts = candidate.content.parts if candidate.content else []
        for part in parts:
            if part.inline_data and part.inline_data.data:
                return part.inline_data.data, part.inline_data.mime_type or "image/png"

    raise PosterGenerationError("Gemini did not return a generated image")
