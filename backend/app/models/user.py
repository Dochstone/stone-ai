"""User model — Telegram user with usage tracking."""

from datetime import datetime
from sqlalchemy import BigInteger, String, DateTime, Integer, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    tg_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True, nullable=False)
    username: Mapped[str | None] = mapped_column(String(64), nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    language: Mapped[str] = mapped_column(String(5), default="ru")

    # Daily counters (reset by cron at midnight)
    daily_lite_used: Mapped[int] = mapped_column(Integer, default=0)
    daily_premium_used: Mapped[int] = mapped_column(Integer, default=0)

    # Stats
    total_requests: Mapped[int] = mapped_column(Integer, default=0)
    total_tokens_used: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<User tg_id={self.tg_id} username={self.username}>"
