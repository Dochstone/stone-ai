"""Generation model — stores all user-generated content (images, video, audio, 3D, text)."""

import uuid
from datetime import datetime
from sqlalchemy import BigInteger, String, Text, Boolean, Float, DateTime, JSON, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Generation(Base):
    __tablename__ = "generations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_tg_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)
    project_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # image | video | audio | 3d | text
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    result_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    result_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, default=False)
    cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    provider_cost: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
