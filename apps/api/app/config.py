from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Postgres
    postgres_user: str = "formula"
    postgres_password: str = "formula"
    postgres_db: str = "formula"
    postgres_host: str = "postgres"
    postgres_port: int = 5432
    # Полный URL имеет приоритет; иначе собирается из POSTGRES_*
    database_url: str = ""

    # Redis
    redis_url: str = "redis://redis:6379/0"

    # CORS (список через запятую)
    api_cors_origins: str = "http://localhost:3000"

    # Провайдер данных
    data_provider: str = "jolpica"
    provider_rate_per_sec: float = 4.0
    provider_rate_burst: int = 8
    schedule_ttl_hours: int = 12

    # Realtime (Фаза 3): Centrifugo HTTP API для публикации тайминга
    centrifugo_api_url: str = ""  # напр. http://centrifugo:8000/api
    centrifugo_api_key: str = ""
    live_demo: bool = False  # публиковать демо-тайминг, пока нет реального потока OpenF1

    @property
    def sqlalchemy_url(self) -> str:
        if self.database_url:
            return self.database_url
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.api_cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
