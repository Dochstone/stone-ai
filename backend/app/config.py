"""Stone AI - Configuration from environment variables."""

from pydantic_settings import BaseSettings
from pydantic import field_validator
from functools import lru_cache


class Settings(BaseSettings):
    # Telegram
    bot_token: str = ""
    webapp_url: str = "https://stone-ai-1.vercel.app"

    # OpenRouter
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1/chat/completions"

    # Database (Railway provides DATABASE_URL automatically)
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/stoneai"

    # Security
    secret_key: str = "change-me"

    # CORS
    cors_origins: list[str] = [
        "https://stone-ai-1.vercel.app",
        "https://stone-ai.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # === Limits ===
    free_lite_daily: int = 20
    free_premium_daily: int = 0
    plus_lite_daily: int = -1    # unlimited
    plus_premium_daily: int = 10
    max_lite_daily: int = -1     # unlimited
    max_premium_daily: int = 30  # 30 premium/day
    max_opus_daily: int = 5      # Opus only on MAX

    # === Stars Pricing ===
    plus_stars: int = 699
    max_stars: int = 1999
    day_pass_stars: int = 79
    week_pass_stars: int = 299
    single_query_stars: int = 9

    # === Pass Limits ===
    day_pass_premium_limit: int = 15
    week_pass_premium_limit: int = 50

    # TON (Phase 2)
    ton_wallet_address: str = ""
    tonapi_key: str = ""

    # CryptoBot (Phase 3)
    cryptobot_api_token: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    @field_validator("database_url", mode="before")
    @classmethod
    def fix_db_url_for_asyncpg(cls, v: str) -> str:
        """Railway gives postgresql://, SQLAlchemy async needs postgresql+asyncpg://"""
        if v and "asyncpg" not in v:
            return v.replace("postgresql://", "postgresql+asyncpg://")
        return v


@lru_cache()
def get_settings() -> Settings:
    return Settings()
