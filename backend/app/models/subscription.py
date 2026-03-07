"""Subscription model — PLUS / MAX plans."""

from datetime import datetime
from sqlalchemy import BigInteger, String, DateTime, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_tg_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)

    plan: Mapped[str] = mapped_column(String(10), nullable=False)  # "plus" | "max"
    payment_method: Mapped[str] = mapped_column(String(10), nullable=False)  # "stars" | "ton" | "usdt"
    payment_id: Mapped[str | None] = mapped_column(String(256), nullable=True)  # tx hash or invoice id

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
