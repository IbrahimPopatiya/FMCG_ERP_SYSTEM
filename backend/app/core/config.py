from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    # Pytest only — always local. Independent of database_url so the app can
    # point at Supabase while the suite stays on localhost.
    test_database_url: str = "postgresql://postgres@localhost:5432/dms_test_db"
    secret_key: str
    access_token_expire_minutes: int = 60
    cors_extra_origins: str = ""
    supabase_url: str
    supabase_service_role_key: str
    supabase_storage_bucket: str = "fmcg_products"

    # Logging — stdout only (not DB). Use ENVIRONMENT=production on deploy
    # so LOG_FORMAT=auto switches to JSON for log drains.
    environment: str = "development"
    log_level: str = "INFO"
    # auto | json | text — auto picks json in production, text otherwise
    log_format: str = "auto"

    @property
    def cors_extra_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_extra_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
