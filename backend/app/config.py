"""Stone AI — Configuration from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Telegram
    BOT_TOKEN: str = os.getenv("BOT_TOKEN", "")
    WEBAPP_URL: str = os.getenv("WEBAPP_URL", "https://stone-ai-1.vercel.app")

    # OpenRouter
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1/chat/completions"

    # Database (Railway gives postgresql://, we need postgresql+asyncpg://)
    _raw_db_url = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/stoneai"
    )
    DATABASE_URL: str = _raw_db_url.replace(
        "postgresql://", "postgresql+asyncpg://"
    ) if _raw_db_url and "asyncpg" not in _raw_db_url else _raw_db_url

    # CORS
    CORS_ORIGINS: list[str] = [
        "https://stone-ai-1.vercel.app",
        "https://stone-ai.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # Limits
    FREE_LITE_DAILY: int = 20
    FREE_PREMIUM_DAILY: int = 0
    PLUS_LITE_DAILY: int = -1  # unlimited
    PLUS_PREMIUM_DAILY: int = 10  # 10 premium/day for PLUS
    MAX_LITE_DAILY: int = -1   # unlimited
    MAX_PREMIUM_DAILY: int = 30  # 30 premium/day for MAX
    MAX_OPUS_DAILY: int = 5     # Opus only on MAX, 5/day

    # Stars Pricing
    PLUS_STARS: int = 699
    MAX_STARS: int = 1999
    DAY_PASS_STARS: int = 79
    WEEK_PASS_STARS: int = 299
    SINGLE_QUERY_STARS: int = 9

    # Day/Week Pass limits
    DAY_PASS_PREMIUM_LIMIT: int = 15
    WEEK_PASS_PREMIUM_LIMIT: int = 50


settings = Settings()
