import boto3

from app.core.config import settings

_client = None


def _get_client():
    global _client
    if _client is None:
        _client = boto3.client(
            "s3",
            endpoint_url=settings.storage_endpoint_url,
            aws_access_key_id=settings.storage_access_key_id,
            aws_secret_access_key=settings.storage_secret_access_key,
            region_name=settings.storage_region,
        )
    return _client


def upload_file(file_bytes: bytes, relative_path: str, content_type: str) -> None:
    _get_client().put_object(
        Bucket=settings.storage_bucket_name,
        Key=relative_path,
        Body=file_bytes,
        ContentType=content_type,
    )


def build_file_url(relative_path: str) -> str:
    return f"{settings.storage_public_base_url.rstrip('/')}/{relative_path}"
