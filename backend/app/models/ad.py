"""Ad models — banner management and event tracking."""

from datetime import datetime
from sqlalchemy import BigInteger, String, DateTime, Integer, Boolean, Text, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AdBanner(Base):
    __tablename__ = "ad_banners"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Content
    title: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str | None] = mapped_column(String(256), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    link_url: Mapped[str] = mapped_column(String(512), nullable=False)

    # Targeting
    placement: Mapped[str] = mapped_column(String(32), nullable=False)  # "chat_bottom" | "home_banner" | "plans_banner"
    tier_target: Mapped[str] = mapped_column(String(16), server_default=text("'free'"))  # "free" | "all" — show only to free users or everyone

    # State
    is_active: Mapped[bool] = mapped_column(Boolean, server_default=text("true"))
    priority: Mapped[int] = mapped_column(Integer, server_default=text("0"))  # higher = shown first

    # Stats (denormalized for quick access)
    views: Mapped[int] = mapped_column(Integer, server_default=text("0"))
    clicks: Mapped[int] = mapped_column(Integer, server_default=text("0"))

    # Scheduling
    start_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    end_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<AdBanner id={self.id} title={self.title} placement={self.placement}>"


class AdEvent(Base):
    __tablename__ = "ad_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    banner_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    user_tg_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(10), nullable=False)  # "view" | "click"
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
