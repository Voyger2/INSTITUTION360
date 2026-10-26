from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./dev.db"
    secret_key: str = "change-me-to-a-long-random-string"
    access_token_expire_minutes: int = 720
    cors_origins: str = "http://localhost:3000"
    warning_days: int = 7
    overdue_days: int = 14
    seed_password: str = "demo-password-123"
    is_demo_data: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()
