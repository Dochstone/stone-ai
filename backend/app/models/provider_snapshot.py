"""Provider balance snapshots — for daily reconciliation against our internal cost tracking."""

from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Index
from app.database import Base


class ProviderSnapshot(Base):
    """One row per (provider, snapshot_date).

    Used to verify that the sum of `provider_cost_usd` we record matches what
    the upstream provider actually billed us. If `actual_spend_usd` and
    `tracked_spend_usd` diverge, something is wrong (rate change, missed call,
    bug in cost model).
    """

    __tablename__ = "provider_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    provider = Column(String(32), nullable=False, index=True)  # "novita" | "openrouter" | "fal"
    snapshot_date = Column(Date, nullable=False, index=True)

    balance_usd = Column(Float, nullable=False)  # current balance reported by provider
    previous_balance_usd = Column(Float, nullable=True)  # last snapshot's balance (for delta)
    actual_spend_usd = Column(Float, nullable=True)  # previous - current (or pulled from usage API)
    tracked_spend_usd = Column(Float, nullable=True)  # sum we recorded in our DB for the period
    delta_usd = Column(Float, nullable=True)  # actual - tracked
    delta_pct = Column(Float, nullable=True)  # delta / tracked * 100

    source = Column(String(16), default="manual")  # "manual" | "auto"
    note = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_provider_snapshot_provider_date", "provider", "snapshot_date"),
    )
