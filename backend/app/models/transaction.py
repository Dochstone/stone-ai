"""Transaction model — payment records for all methods."""

from datetime import datetime
from sqlalchemy import BigInteger, String, DateTime, Float, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_tg_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), nullable=False)  # "XTR" | "TON" | "USDT"
    amount_usd: Mapped[float] = mapped_column(Float, default=0.0)  # converted to USD

    product_type: Mapped[str] = mapped_column(String(20), nullable=False)  # "subscription" | "pass"
    product_id: Mapped[str] = mapped_column(String(64), nullable=False)  # plan id or pass type

    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | completed | failed
    tx_hash: Mapped[str | None] = mapped_column(String(256), nullable=True)
    provider_id: Mapped[str | None] = mapped_column(String(256), nullable=True)  # telegram payment id

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
