from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    access_token_expire_minutes: int = 60
    upload_dir: str = "uploads"
    cors_extra_origins: str = ""

    @property
    def cors_extra_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_extra_origins.split(",") if origin.strip()]

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
