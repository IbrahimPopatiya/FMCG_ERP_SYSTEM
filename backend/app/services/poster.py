import base64
import io

from openai import OpenAI

from app.core.config import settings

POSTER_MODEL = "gpt-image-1"


class PosterGenerationError(Exception):
    """Raised when OpenAI fails to return a generated poster image."""


def generate_poster(image_bytes: bytes, mime_type: str, prompt: str) -> tuple[bytes, str]:
    """Sends the product image + a fully-built prompt to OpenAI's image
    model and returns the generated poster as (image_bytes, mime_type).
    Raises PosterGenerationError if OpenAI doesn't return an image."""
    if not settings.openai_api_key:
        raise PosterGenerationError("OPENAI_API_KEY is not configured")

    client = OpenAI(api_key=settings.openai_api_key)

    ext = mime_type.split("/")[-1] or "png"
    image_file = io.BytesIO(image_bytes)
    image_file.name = f"product.{ext}"

    try:
        response = client.images.edit(
            model=POSTER_MODEL,
            image=image_file,
            prompt=prompt,
        )
    except Exception as e:
        # Any OpenAI/network failure (bad key, quota, timeout, ...) must
        # surface as PosterGenerationError - an exception raised past this
        # point would skip CORSMiddleware entirely (Starlette only attaches
        # CORS headers to responses that go through normal exception
        # handling), which the browser reports as a misleading CORS error
        # instead of the real failure.
        raise PosterGenerationError(f"OpenAI request failed: {e}") from e

    data = response.data or []
    if data and data[0].b64_json:
        return base64.b64decode(data[0].b64_json), "image/png"

    raise PosterGenerationError("OpenAI did not return a generated image")
