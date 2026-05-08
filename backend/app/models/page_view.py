"""Page view tracking for analytics."""

from datetime import datetime
from sqlalchemy import String, DateTime, Integer, Float, BigInteger, func, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PageView(Base):
    __tablename__ = "page_views"
    __table_args__ = (
        Index("ix_page_views_created", "created_at"),
        Index("ix_page_views_path", "path"),
        Index("ix_page_views_ref_code", "ref_code"),
        Index("ix_page_views_ref_created", "ref_code", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    path: Mapped[str] = mapped_column(String(500), nullable=False)
    referrer: Mapped[str | None] = mapped_column(String(500), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)  # hashed IP for privacy
    user_tg_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    duration_sec: Mapped[float | None] = mapped_column(Float, nullable=True)  # time on page
    screen_width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    country: Mapped[str | None] = mapped_column(String(5), nullable=True)
    ref_code: Mapped[str | None] = mapped_column(String(32), nullable=True)
    utm_source: Mapped[str | None] = mapped_column(String(64), nullable=True)
    utm_medium: Mapped[str | None] = mapped_column(String(64), nullable=True)
    utm_campaign: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
