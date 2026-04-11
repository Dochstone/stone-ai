"""Usage & Pass models — tracking requests and temporary access."""

from datetime import datetime
from sqlalchemy import BigInteger, String, DateTime, Integer, Float, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Usage(Base):
    __tablename__ = "usage"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_tg_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)
    model_id: Mapped[str] = mapped_column(String(64), nullable=False)
    tier: Mapped[str] = mapped_column(String(10), nullable=False)  # "lite" | "premium"

    tokens_in: Mapped[int] = mapped_column(Integer, default=0)
    tokens_out: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    provider_cost_usd: Mapped[float] = mapped_column(Float, default=0.0)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Pass(Base):
    __tablename__ = "passes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_tg_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)

    pass_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "day" | "week" | "single"
    payment_method: Mapped[str] = mapped_column(String(10), nullable=False)
    payment_id: Mapped[str | None] = mapped_column(String(256), nullable=True)

    requests_left: Mapped[int] = mapped_column(Integer, default=0)  # for single/day/week limits
    is_active: Mapped[bool] = mapped_column(default=True)
    activated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
