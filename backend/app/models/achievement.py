"""Achievement system — badges, streaks, milestones."""

import uuid
from datetime import datetime
from sqlalchemy import BigInteger, String, Text, Integer, Float, Boolean, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    icon: Mapped[str] = mapped_column(String(10), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False)  # generation | social | streak | milestone
    condition: Mapped[dict] = mapped_column(JSON, nullable=False)  # {type, target, metric}
    reward_rub: Mapped[float] = mapped_column(Float, default=0)


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_tg_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    achievement_slug: Mapped[str] = mapped_column(String(50), nullable=False)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reward_claimed: Mapped[bool] = mapped_column(Boolean, default=False)
