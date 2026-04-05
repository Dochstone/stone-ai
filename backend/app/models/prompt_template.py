"""PromptTemplate + SavedPrompt + TemplateLike — curated prompt library for chat."""

import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, BigInteger, Boolean, DateTime, JSON, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PromptTemplate(Base):
    __tablename__ = "prompt_templates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    variables: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    is_system: Mapped[bool] = mapped_column(Boolean, default=True)
    default_model: Mapped[str | None] = mapped_column(String(50), nullable=True, default="gpt-4.1-mini")
    cost_rub: Mapped[float | None] = mapped_column(nullable=True, default=3.0)
    icon: Mapped[str | None] = mapped_column(String(10), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Marketplace fields
    author_tg_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    author_name: Mapped[str | None] = mapped_column(String(100), nullable=True)


class TemplateLike(Base):
    __tablename__ = "template_likes"
    __table_args__ = (UniqueConstraint("template_id", "user_tg_id", name="uq_template_like"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_tg_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class TemplateRating(Base):
    __tablename__ = "template_ratings"
    __table_args__ = (UniqueConstraint("template_id", "user_tg_id", name="uq_template_rating"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    template_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_tg_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    comment: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SavedPrompt(Base):
    __tablename__ = "saved_prompts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_tg_id: Mapped[int] = mapped_column(nullable=False, index=True)
    template_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    custom_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
