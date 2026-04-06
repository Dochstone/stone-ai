"""Stone AI — Configuration from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()

# ─── Global constants ───
USD_TO_RUB = 95.0  # Exchange rate for all price conversions


class Settings:
    """Application settings loaded from environment variables."""

    def __init__(self):
        # Telegram
        self.bot_token = os.getenv("BOT_TOKEN", "")
        self.webapp_url = os.getenv("WEBAPP_URL", "https://stone-ai-1.vercel.app")

        # OpenRouter
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.openrouter_base_url = "https://openrouter.ai/api/v1/chat/completions"

        # Database (Railway gives postgresql://, we need postgresql+asyncpg://)
        raw_db_url = os.getenv(
            "DATABASE_URL",
            "postgresql+asyncpg://postgres:postgres@localhost:5432/stoneai"
        )
        if raw_db_url and "asyncpg" not in raw_db_url:
            self.database_url = raw_db_url.replace(
                "postgresql://", "postgresql+asyncpg://"
            )
        else:
            self.database_url = raw_db_url

        # Security
        self.secret_key = os.getenv("SECRET_KEY", "change-me")

        # CORS
        self.cors_origins = [
            "https://stone-ai-1.vercel.app",
            "https://stone-ai.vercel.app",
            "http://localhost:5173",
            "http://localhost:3000",
        ]

        # === Limits ===
        self.free_lite_daily = 20
        self.free_premium_daily = 0
        self.plus_lite_daily = -1    # unlimited
        self.plus_premium_daily = 10
        self.max_lite_daily = -1     # unlimited
        self.max_premium_daily = 30
        self.max_opus_daily = 5

        # === Stars Pricing ===
        self.plus_stars = 699
        self.max_stars = 1999
        self.day_pass_stars = 79
        self.week_pass_stars = 299
        self.single_query_stars = 9

        # === Pass Limits ===
        self.day_pass_premium_limit = 15
        self.week_pass_premium_limit = 50

        # TON (Phase 2)
        self.ton_wallet_address = os.getenv("TON_WALLET_ADDRESS", "")
        self.tonapi_key = os.getenv("TONAPI_KEY", "")

        # Kling AI (direct API)
        self.kling_access_key = os.getenv("KLING_ACCESS_KEY", "")
        self.kling_secret_key = os.getenv("KLING_SECRET_KEY", "")

        # Lava.ru (Cards RU + SBP)
        self.lava_secret_key = os.getenv("LAVA_SECRET_KEY", "")
        self.lava_shop_id = os.getenv("LAVA_SHOP_ID", "")
        self.lava_webhook_key = os.getenv("LAVA_WEBHOOK_KEY", "")

        # Heleket (Crypto: USDT, BTC, ETH, TON, SOL, etc.)
        self.heleket_api_key = os.getenv("HELEKET_API_KEY", "")
        self.heleket_merchant = os.getenv("HELEKET_MERCHANT", "")

        # Platega.io (Cards RU + SBP)
        self.platega_merchant_id = os.getenv("PLATEGA_MERCHANT_ID", "")
        self.platega_secret = os.getenv("PLATEGA_SECRET", "")

        # CryptoBot (Phase 3)
        self.cryptobot_api_token = os.getenv("CRYPTOBOT_API_TOKEN", "")

        # fal.ai (Video + 3D generation)
        self.fal_api_key = os.getenv("FAL_API_KEY", "")

        # OpenAI (Whisper STT)
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")

        # Admin
        self.admin_tg_ids = os.getenv("ADMIN_TG_IDS", "")  # comma-separated Telegram IDs

        # OAuth
        self.google_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
        self.google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
        self.google_redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "https://stoneai.ru/auth/google/callback")
        self.yandex_client_id = os.getenv("YANDEX_CLIENT_ID", "")
        self.yandex_client_secret = os.getenv("YANDEX_CLIENT_SECRET", "")

        # Ads
        self.adsgram_block_id = os.getenv("ADSGRAM_BLOCK_ID", "")  # Adsgram rewarded video block ID


def get_settings() -> Settings:
    """Get application settings (singleton)."""
    return _settings


_settings = Settings()
