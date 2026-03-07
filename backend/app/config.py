"""Stone AI — Configuration from environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Telegram
    bot_token: str = ""
    webapp_url: str = "https://stone-ai.vercel.app"

    # OpenRouter
    openrouter_api_key: str = ""

    # Database
    database_url: str = "sqlite+aiosqlite:///./stone_ai.db"

    # Security
    secret_key: str = "change-me"

    # TON (Phase 2)
    ton_wallet_address: str = ""
    tonapi_key: str = ""

    # CryptoBot (Phase 3)
    cryptobot_api_token: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()
