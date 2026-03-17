"""User model — Telegram user with CRM data and AI usage tracking.

Matches the existing 'users' table in Railway PostgreSQL.
Existing CRM columns: telegram_id, username, first_name, joined_at,
                      is_active, referrer_id, referral_code, referral_balance, balance
New Stone AI columns:  language, daily_lite_used, daily_premium_used,
                      total_requests, total_tokens_used
"""

from datetime import datetime
from sqlalchemy import BigInteger, String, DateTime, Integer, Float, Boolean, func, text, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # ─── Existing CRM columns (match DB exactly) ───
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True, nullable=False)
    username: Mapped[str | None] = mapped_column(String(64), nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    joined_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    referrer_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    referral_code: Mapped[str | None] = mapped_column(String(16), nullable=True)
    referral_balance: Mapped[float] = mapped_column(Float, server_default=text("0"))
    balance: Mapped[float] = mapped_column(Float, server_default=text("0"))

    # ─── New Stone AI columns (will be added via migration) ───
    language: Mapped[str | None] = mapped_column(String(5), nullable=True, server_default=text("'ru'"))

    # ─── BYOK: Bring Your Own Key ───
    byok_openrouter_key: Mapped[str | None] = mapped_column(String(256), nullable=True)
    byok_enabled: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))

    # ─── Web auth ───
    email: Mapped[str | None] = mapped_column(String(256), unique=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(256), nullable=True)
    auth_provider: Mapped[str | None] = mapped_column(String(16), nullable=True, server_default=text("'telegram'"))  # telegram | email

    # ─── Billing ───
    credits: Mapped[int] = mapped_column(Integer, server_default=text("0"))  # legacy, kept for migration
    balance_usd: Mapped[float] = mapped_column(Numeric(12, 6), server_default=text("0"))  # per-token balance in USD
    total_deposited_usd: Mapped[float] = mapped_column(Numeric(12, 2), server_default=text("0"))
    rewarded_today: Mapped[int] = mapped_column(Integer, server_default=text("0"))  # rewarded ad bonus requests today
    daily_lite_used: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    daily_premium_used: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    total_requests: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    total_tokens_used: Mapped[int] = mapped_column(Integer, server_default=text("0"))

    def __repr__(self):
        return f"<User telegram_id={self.telegram_id} username={self.username}>"
