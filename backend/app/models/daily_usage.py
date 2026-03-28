"""Daily usage tracking — per-user, per-day limits with rollover."""

from datetime import date, datetime
from sqlalchemy import Column, Integer, BigInteger, Date, DateTime, UniqueConstraint, Index
from app.database import Base


class DailyUsage(Base):
    __tablename__ = "daily_usage"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_tg_id = Column(BigInteger, nullable=False, index=True)
    date = Column(Date, nullable=False)

    # Usage counters for this day
    fast_used = Column(Integer, default=0, nullable=False)
    premium_used = Column(Integer, default=0, nullable=False)
    opus_used = Column(Integer, default=0, nullable=False)
    image_used = Column(Integer, default=0, nullable=False)
    video_used = Column(Integer, default=0, nullable=False)

    # Rollover credits carried INTO this day
    rollover_fast = Column(Integer, default=0, nullable=False)
    rollover_premium = Column(Integer, default=0, nullable=False)
    rollover_opus = Column(Integer, default=0, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("user_tg_id", "date", name="uq_daily_usage_user_date"),
        Index("ix_daily_usage_user_date", "user_tg_id", "date"),
    )
