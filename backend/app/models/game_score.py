"""GameScore model — leaderboard for mini-games during generation wait."""

import uuid
from datetime import datetime
from sqlalchemy import BigInteger, String, Integer, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class GameScore(Base):
    __tablename__ = "game_scores"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_tg_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)
    game: Mapped[str] = mapped_column(String(20), nullable=False, default="snake")
    score: Mapped[int] = mapped_column(BigInteger, nullable=False)
    month: Mapped[str] = mapped_column(String(7), nullable=False)  # YYYY-MM
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
