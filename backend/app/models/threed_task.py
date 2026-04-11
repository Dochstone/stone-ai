"""ThreeDTask model — tracks async 3D generation jobs."""

from datetime import datetime
from sqlalchemy import BigInteger, String, Text, DateTime, Float, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ThreeDTask(Base):
    __tablename__ = "threed_tasks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    task_id: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    fal_request_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    user_tg_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)
    model_id: Mapped[str] = mapped_column(String(64), nullable=False)
    prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    model_url: Mapped[str | None] = mapped_column(Text, nullable=True)  # GLB file URL
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    provider_cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
