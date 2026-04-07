"""Violation log — tracks blocked content attempts."""

from datetime import datetime
from sqlalchemy import BigInteger, String, DateTime, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Violation(Base):
    __tablename__ = "violations"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_tg_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)
    username: Mapped[str | None] = mapped_column(String(64), nullable=True)
    email: Mapped[str | None] = mapped_column(String(256), nullable=True)
    module: Mapped[str] = mapped_column(String(32), nullable=False)  # chat, image, video, agent, etc.
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    blocked_reason: Mapped[str] = mapped_column(String(256), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
