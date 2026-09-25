import mimetypes
import os
import uuid
from datetime import datetime, timezone

import boto3

from app.core.config import settings

_s3 = boto3.client(
    "s3",
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    region_name=settings.aws_region,
)

# Keys are random and never reused, so browsers can cache a file forever.
CACHE_CONTROL = "public, max-age=31536000, immutable"


def public_url(key: str) -> str:
    if settings.cloudfront_domain:
        return f"https://{settings.cloudfront_domain}/{key}"
    return f"https://{settings.s3_bucket_name}.s3.{settings.aws_region}.amazonaws.com/{key}"


def save_file(
    file_bytes: bytes,
    original_filename: str,
    category: str,
    content_type: str | None = None,
) -> str:
    """Uploads the file to S3 under <category>/<year>/<random>.<ext> and returns
    its public URL - the same value stored in columns like
    customer_signature/image/photo.

    S3 stores whatever content-type it's given (binary/octet-stream if none),
    and browsers refuse to render an image served with the wrong type - so
    this always passes a real one, guessing from the filename when the
    browser didn't send one."""
    year = str(datetime.now(timezone.utc).year)
    ext = os.path.splitext(original_filename)[1]
    key = f"{category}/{year}/{uuid.uuid4().hex}{ext}"

    resolved_content_type = (
        content_type or mimetypes.guess_type(original_filename)[0] or "application/octet-stream"
    )

    _s3.put_object(
        Bucket=settings.s3_bucket_name,
        Key=key,
        Body=file_bytes,
        ContentType=resolved_content_type,
        CacheControl=CACHE_CONTROL,
    )

    return public_url(key)
