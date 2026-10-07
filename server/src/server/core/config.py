from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "MausamMitra"
    app_version: str = "0.1.0"
    demo_mode: bool = True
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    # Vite/uvicorn dev servers pick a free port when the preferred one is taken, so a
    # static allowlist silently breaks the whole app. When enabled, any http(s) origin
    # that resolves to localhost/127.0.0.1/[::1] is accepted as well.
    cors_allow_local_dev: bool = True
    database_url: str = "sqlite+aiosqlite:///./mausammitra.db"
    openweather_api_key: str = ""
    imd_api_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
