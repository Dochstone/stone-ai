"""Verification codes — email registration and password reset, persisted in DB."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Index
from app.database import Base


class VerificationCode(Base):
    __tablename__ = "verification_codes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, index=True)
    code = Column(String(10), nullable=False)
    code_type = Column(String(20), nullable=False)  # "register" or "reset"
    password_hash = Column(String(255), nullable=True)  # only for register
    attempts = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_vcode_email_type", "email", "code_type"),
    )
