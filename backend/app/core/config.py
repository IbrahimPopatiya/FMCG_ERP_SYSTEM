from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 60
    cors_extra_origins: str = ""

    # S3-compatible object storage - works with Supabase Storage, Cloudflare
    # R2, AWS S3, or GCS. Switching vendors means changing these values only.
    storage_endpoint_url: str
    storage_access_key_id: str
    storage_secret_access_key: str
    storage_bucket_name: str
    storage_region: str = "auto"
    storage_public_base_url: str

    @property
    def cors_extra_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_extra_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
