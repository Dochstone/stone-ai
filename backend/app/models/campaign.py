"""Ad campaign generation model."""

from datetime import datetime
from sqlalchemy import String, DateTime, Integer, Float, BigInteger, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_tg_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    niche: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending, running, completed, failed
    step: Mapped[int] = mapped_column(Integer, default=0)  # current step 0-7
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # full campaign data
    total_keywords: Mapped[int] = mapped_column(Integer, default=0)
    total_ads: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
