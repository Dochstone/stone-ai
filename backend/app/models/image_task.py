"""Image generation tasks — async submit/poll pattern."""

from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, Float, DateTime, Text
from app.database import Base


class ImageTask(Base):
    __tablename__ = "image_tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_tg_id = Column(BigInteger, nullable=False, index=True)
    model_id = Column(String(64), nullable=False)
    prompt = Column(Text, nullable=False)
    status = Column(String(20), default="pending", nullable=False)  # pending, generating, completed, failed
    image_url = Column(Text, nullable=True)  # final URL (disk or base64)
    error = Column(String(500), nullable=True)
    cost_usd = Column(Float, default=0)
    provider_cost_usd = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
