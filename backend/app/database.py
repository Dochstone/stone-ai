"""Stone AI — Database setup with SQLAlchemy async."""

import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=False,
    # SQLite needs this, PostgreSQL doesn't
    **({"connect_args": {"check_same_thread": False}} if "sqlite" in settings.database_url else {}),
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    """Dependency: get database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def migrate_users_table():
    """Add missing Stone AI columns to existing users table.

    Safe to run multiple times — uses IF NOT EXISTS.
    """
    new_columns = [
        ("language", "VARCHAR(5) DEFAULT 'ru'"),
        ("daily_lite_used", "INTEGER DEFAULT 0"),
        ("daily_premium_used", "INTEGER DEFAULT 0"),
        ("total_requests", "INTEGER DEFAULT 0"),
        ("total_tokens_used", "INTEGER DEFAULT 0"),
        ("balance_usd", "NUMERIC(12,6) DEFAULT 0"),
        ("rewarded_today", "INTEGER DEFAULT 0"),
        ("email", "VARCHAR(256) UNIQUE"),
        ("password_hash", "VARCHAR(256)"),
        ("auth_provider", "VARCHAR(16) DEFAULT 'telegram'"),
        # Free Plan: streaks & granular usage tracking
        ("login_streak", "INTEGER DEFAULT 0"),
        ("last_login_date", "DATE"),
        ("streak_bonus_fast", "INTEGER DEFAULT 0"),
        ("streak_bonus_images", "INTEGER DEFAULT 0"),
        ("streak_bonus_video", "INTEGER DEFAULT 0"),
        ("daily_fast_used", "INTEGER DEFAULT 0"),
        ("daily_premium_used_new", "INTEGER DEFAULT 0"),
        ("daily_image_used", "INTEGER DEFAULT 0"),
        ("weekly_video_used", "INTEGER DEFAULT 0"),
        # Anti-abuse
        ("last_ip", "VARCHAR(45)"),
        ("fingerprint", "VARCHAR(64)"),
        # Subscription tier
        ("subscription_tier", "VARCHAR(20) DEFAULT 'free'"),
        ("credits_balance", "INTEGER DEFAULT 0"),
        ("credits_reset_date", "TIMESTAMP"),
        ("subscription_started", "TIMESTAMP"),
        ("monthly_fast_used", "INTEGER DEFAULT 0"),
        ("monthly_premium_used", "INTEGER DEFAULT 0"),
        ("monthly_images_used", "INTEGER DEFAULT 0"),
        ("monthly_videos_used", "INTEGER DEFAULT 0"),
        ("monthly_3d_used", "INTEGER DEFAULT 0"),
        ("monthly_audio_used", "INTEGER DEFAULT 0"),
        ("opus_requests_used", "INTEGER DEFAULT 0"),
        # Banning
        ("is_banned", "BOOLEAN DEFAULT false"),
        ("ban_reason", "VARCHAR(256)"),
    ]

    async with engine.begin() as conn:
        for col_name, col_def in new_columns:
            try:
                await conn.execute(text(
                    f"ALTER TABLE users ADD COLUMN IF NOT EXISTS {col_name} {col_def}"
                ))
                logger.info(f"Column users.{col_name} ensured")
            except Exception as e:
                logger.warning(f"Could not add column {col_name}: {e}")


async def migrate_credits_to_usd():
    """One-time migration: convert existing credits to USD balance.

    1 credit ~ $0.011 (credits cost $1.10 per 100).
    Only runs for users with credits > 0 and balance_usd = 0.
    """
    async with engine.begin() as conn:
        try:
            await conn.execute(text(
                "UPDATE users SET balance_usd = credits * 0.011 "
                "WHERE credits > 0 AND (balance_usd IS NULL OR balance_usd = 0)"
            ))
            logger.info("Credits-to-USD migration complete")
        except Exception as e:
            logger.warning(f"Credits-to-USD migration skipped: {e}")


async def init_db():
    """Create tables that don't exist yet + migrate existing ones."""
    async with engine.begin() as conn:
        # Create any missing tables (subscriptions, passes, usage, transactions)
        await conn.run_sync(Base.metadata.create_all)

    # Add missing columns to users table
    await migrate_users_table()

    # Add share_token to chat_sessions
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN share_token VARCHAR(32) UNIQUE"))
        except Exception:
            pass  # already exists

    # Convert old credits to USD balance (one-time, idempotent)
    await migrate_credits_to_usd()

    # Add missing columns to prompt_templates (added in wizard update)
    async with engine.begin() as conn:
        for col, defn in [
            ("default_model", "VARCHAR(50) DEFAULT 'gpt-4.1-mini'"),
            ("cost_rub", "FLOAT DEFAULT 3.0"),
            ("icon", "VARCHAR(10)"),
        ]:
            try:
                await conn.execute(text(f"ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS {col} {defn}"))
            except Exception:
                pass

    logger.info("Database initialization complete")
