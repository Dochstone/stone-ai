"""Custom chat bot model — user-created AI bots with custom instructions."""

from datetime import datetime
from sqlalchemy import BigInteger, String, DateTime, Integer, Text, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class CustomBot(Base):
    __tablename__ = "custom_bots"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_tg_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(500), default="")
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    model_id: Mapped[str] = mapped_column(String(64), default="gpt-4o-mini")
    avatar_emoji: Mapped[str] = mapped_column(String(10), default="🤖")
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
