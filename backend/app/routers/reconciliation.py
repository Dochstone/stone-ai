"""Provider spend reconciliation — verify our DB tracking matches what providers actually billed."""

import logging
from datetime import date, datetime, timedelta

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models.provider_snapshot import ProviderSnapshot
from app.models.video_task import VideoTask
from app.models.image_task import ImageTask
from app.models.usage import Usage
from app.routers.admin import require_web_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin/reconciliation", tags=["admin", "reconciliation"])

ALLOWED_PROVIDERS = {"novita", "openrouter", "fal"}


class ManualSnapshotRequest(BaseModel):
    provider: str  # "novita" | "fal"
    balance_usd: float
    note: str | None = None


async def _tracked_spend_for_period(
    db: AsyncSession, provider: str, since: datetime, until: datetime
) -> float:
    """Sum provider_cost_usd from our DB for the given period and provider."""
    if provider == "novita":
        # Video tasks routed through novita have prefix novita: in fal_request_id
        result = await db.execute(
            select(func.coalesce(func.sum(VideoTask.provider_cost_usd), 0.0))
            .where(VideoTask.created_at >= since)
            .where(VideoTask.created_at < until)
            .where(VideoTask.fal_request_id.like("novita:%"))
            .where(VideoTask.status == "completed")
        )
        return float(result.scalar() or 0.0)

    if provider == "fal":
        result = await db.execute(
            select(func.coalesce(func.sum(VideoTask.provider_cost_usd), 0.0))
            .where(VideoTask.created_at >= since)
            .where(VideoTask.created_at < until)
            .where(~VideoTask.fal_request_id.like("novita:%"))
            .where(~VideoTask.fal_request_id.like("kling:%"))
            .where(~VideoTask.fal_request_id.like("vertex:%"))
            .where(VideoTask.status == "completed")
        )
        return float(result.scalar() or 0.0)

    if provider == "openrouter":
        # All chat usage goes through OpenRouter
        result = await db.execute(
            select(func.coalesce(func.sum(Usage.provider_cost_usd), 0.0))
            .where(Usage.created_at >= since)
            .where(Usage.created_at < until)
        )
        chat_cost = float(result.scalar() or 0.0)
        # Plus image generations through OpenRouter
        img = await db.execute(
            select(func.coalesce(func.sum(ImageTask.provider_cost_usd), 0.0))
            .where(ImageTask.created_at >= since)
            .where(ImageTask.created_at < until)
            .where(ImageTask.status == "completed")
        )
        image_cost = float(img.scalar() or 0.0)
        return chat_cost + image_cost

    return 0.0


@router.post("/snapshot/manual")
async def manual_snapshot(
    req: ManualSnapshotRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Admin enters current provider balance. System computes delta vs our tracked spend."""
    await require_web_admin(request)

    provider = req.provider.lower().strip()
    if provider not in ALLOWED_PROVIDERS:
        raise HTTPException(400, f"Unknown provider. Allowed: {', '.join(ALLOWED_PROVIDERS)}")

    today = date.today()

    # Find previous snapshot to compute delta
    prev_q = await db.execute(
        select(ProviderSnapshot)
        .where(ProviderSnapshot.provider == provider)
        .order_by(ProviderSnapshot.snapshot_date.desc(), ProviderSnapshot.id.desc())
        .limit(1)
    )
    prev = prev_q.scalar_one_or_none()

    actual_spend = None
    tracked_spend = None
    delta = None
    delta_pct = None

    if prev:
        # Spend = previous balance minus current balance
        actual_spend = round(prev.balance_usd - req.balance_usd, 4)
        # Period to sum tracked: from previous snapshot date to today
        since = datetime.combine(prev.snapshot_date, datetime.min.time())
        until = datetime.combine(today, datetime.min.time()) + timedelta(days=1)
        tracked_spend = round(await _tracked_spend_for_period(db, provider, since, until), 4)
        delta = round(actual_spend - tracked_spend, 4)
        if tracked_spend > 0:
            delta_pct = round(delta / tracked_spend * 100.0, 2)

    snap = ProviderSnapshot(
        provider=provider,
        snapshot_date=today,
        balance_usd=req.balance_usd,
        previous_balance_usd=prev.balance_usd if prev else None,
        actual_spend_usd=actual_spend,
        tracked_spend_usd=tracked_spend,
        delta_usd=delta,
        delta_pct=delta_pct,
        source="manual",
        note=req.note,
    )
    db.add(snap)
    await db.commit()

    return {
        "id": snap.id,
        "provider": provider,
        "snapshot_date": today.isoformat(),
        "balance_usd": req.balance_usd,
        "actual_spend_usd": actual_spend,
        "tracked_spend_usd": tracked_spend,
        "delta_usd": delta,
        "delta_pct": delta_pct,
    }


@router.post("/snapshot/openrouter")
async def auto_openrouter_snapshot(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Pull OpenRouter usage automatically via their API."""
    await require_web_admin(request)

    settings = get_settings()
    api_key = getattr(settings, "openrouter_api_key", None)
    if not api_key:
        raise HTTPException(500, "OPENROUTER_API_KEY not configured")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://openrouter.ai/api/v1/key",
                headers={"Authorization": f"Bearer {api_key}"},
            )
            if resp.status_code != 200:
                raise HTTPException(502, f"OpenRouter API: {resp.status_code} {resp.text[:200]}")
            data = resp.json().get("data", {})
            usage_total = float(data.get("usage", 0.0))
            limit = data.get("limit")
            balance_proxy = -usage_total if limit is None else float(limit) - usage_total
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(502, f"OpenRouter request failed: {e}")

    today = date.today()

    prev_q = await db.execute(
        select(ProviderSnapshot)
        .where(ProviderSnapshot.provider == "openrouter")
        .order_by(ProviderSnapshot.snapshot_date.desc(), ProviderSnapshot.id.desc())
        .limit(1)
    )
    prev = prev_q.scalar_one_or_none()

    actual_spend = None
    tracked_spend = None
    delta = None
    delta_pct = None

    if prev:
        actual_spend = round(prev.balance_usd - balance_proxy, 4)
        since = datetime.combine(prev.snapshot_date, datetime.min.time())
        until = datetime.combine(today, datetime.min.time()) + timedelta(days=1)
        tracked_spend = round(await _tracked_spend_for_period(db, "openrouter", since, until), 4)
        delta = round(actual_spend - tracked_spend, 4)
        if tracked_spend > 0:
            delta_pct = round(delta / tracked_spend * 100.0, 2)

    snap = ProviderSnapshot(
        provider="openrouter",
        snapshot_date=today,
        balance_usd=balance_proxy,
        previous_balance_usd=prev.balance_usd if prev else None,
        actual_spend_usd=actual_spend,
        tracked_spend_usd=tracked_spend,
        delta_usd=delta,
        delta_pct=delta_pct,
        source="auto",
        note=f"OpenRouter usage_total={usage_total}",
    )
    db.add(snap)
    await db.commit()

    return {
        "id": snap.id,
        "provider": "openrouter",
        "balance_usd": balance_proxy,
        "actual_spend_usd": actual_spend,
        "tracked_spend_usd": tracked_spend,
        "delta_usd": delta,
        "delta_pct": delta_pct,
    }


@router.get("")
async def list_snapshots(
    request: Request,
    db: AsyncSession = Depends(get_db),
    provider: str | None = None,
    limit: int = 50,
):
    """Show recent reconciliation snapshots, newest first."""
    await require_web_admin(request)

    q = select(ProviderSnapshot).order_by(
        ProviderSnapshot.snapshot_date.desc(), ProviderSnapshot.id.desc()
    ).limit(min(limit, 200))
    if provider:
        q = q.where(ProviderSnapshot.provider == provider.lower())

    result = await db.execute(q)
    snaps = result.scalars().all()

    return {
        "snapshots": [
            {
                "id": s.id,
                "provider": s.provider,
                "snapshot_date": s.snapshot_date.isoformat(),
                "balance_usd": s.balance_usd,
                "actual_spend_usd": s.actual_spend_usd,
                "tracked_spend_usd": s.tracked_spend_usd,
                "delta_usd": s.delta_usd,
                "delta_pct": s.delta_pct,
                "source": s.source,
                "note": s.note,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in snaps
        ]
    }
