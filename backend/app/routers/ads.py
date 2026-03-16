"""Ads endpoints — public banners, event tracking, admin CRUD."""

import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, update, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.ad import AdBanner, AdEvent

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["ads"])

# Admin Telegram IDs (can also be loaded from env/config)
ADMIN_TG_IDS: set[int] = set()

try:
    from app.config import get_settings
    _settings = get_settings()
    if hasattr(_settings, "admin_tg_ids") and _settings.admin_tg_ids:
        ADMIN_TG_IDS = {int(x) for x in _settings.admin_tg_ids.split(",")}
except Exception:
    pass


def _require_admin(tg_user: dict):
    """Check that the user is an admin. Raises 403 if not."""
    if not ADMIN_TG_IDS:
        # If no admins configured, allow no one (fail safe)
        raise HTTPException(status_code=403, detail="Admin access not configured")
    if tg_user["id"] not in ADMIN_TG_IDS:
        raise HTTPException(status_code=403, detail="Только для администраторов")


# ═══════════════════════════════════════════════════════════
# Public: Get banners for a placement
# ═══════════════════════════════════════════════════════════

@router.get("/ads")
async def get_ads(
    placement: str = Query(..., description="Banner placement: chat_bottom, home_banner, plans_banner"),
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get active banners for a given placement.

    Returns ads visible to the current user (based on tier_target).
    Ordered by priority DESC (highest first).
    """
    now = datetime.utcnow()

    query = (
        select(AdBanner)
        .where(
            AdBanner.placement == placement,
            AdBanner.is_active == True,
        )
        .order_by(AdBanner.priority.desc(), AdBanner.id.desc())
    )

    result = await db.execute(query)
    banners = result.scalars().all()

    # Filter by schedule and tier_target
    ads = []
    for b in banners:
        if b.start_at and b.start_at > now:
            continue
        if b.end_at and b.end_at < now:
            continue
        ads.append({
            "id": b.id,
            "title": b.title,
            "description": b.description,
            "image_url": b.image_url,
            "link_url": b.link_url,
            "placement": b.placement,
        })

    return {"ads": ads}


# ═══════════════════════════════════════════════════════════
# Public: Track ad events (view / click)
# ═══════════════════════════════════════════════════════════

@router.post("/ads/{banner_id}/view")
async def track_ad_view(
    banner_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record a banner impression."""
    event = AdEvent(
        banner_id=banner_id,
        user_tg_id=tg_user["id"],
        event_type="view",
    )
    db.add(event)

    # Increment denormalized counter
    await db.execute(
        update(AdBanner).where(AdBanner.id == banner_id).values(views=AdBanner.views + 1)
    )
    await db.flush()

    return {"ok": True}


@router.post("/ads/{banner_id}/click")
async def track_ad_click(
    banner_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record a banner click."""
    event = AdEvent(
        banner_id=banner_id,
        user_tg_id=tg_user["id"],
        event_type="click",
    )
    db.add(event)

    # Increment denormalized counter
    await db.execute(
        update(AdBanner).where(AdBanner.id == banner_id).values(clicks=AdBanner.clicks + 1)
    )
    await db.flush()

    return {"ok": True}


# ═══════════════════════════════════════════════════════════
# Admin: CRUD for banners
# ═══════════════════════════════════════════════════════════

class AdBannerCreate(BaseModel):
    title: str
    description: str | None = None
    image_url: str | None = None
    link_url: str
    placement: str = "chat_bottom"
    tier_target: str = "free"
    priority: int = 0
    start_at: str | None = None   # ISO 8601
    end_at: str | None = None     # ISO 8601


class AdBannerUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    image_url: str | None = None
    link_url: str | None = None
    placement: str | None = None
    tier_target: str | None = None
    is_active: bool | None = None
    priority: int | None = None
    start_at: str | None = None
    end_at: str | None = None


@router.get("/admin/ads")
async def admin_list_ads(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all banners with stats (admin only)."""
    _require_admin(tg_user)

    result = await db.execute(
        select(AdBanner).order_by(AdBanner.id.desc())
    )
    banners = result.scalars().all()

    return {
        "ads": [
            {
                "id": b.id,
                "title": b.title,
                "description": b.description,
                "image_url": b.image_url,
                "link_url": b.link_url,
                "placement": b.placement,
                "tier_target": b.tier_target,
                "is_active": b.is_active,
                "priority": b.priority,
                "views": b.views,
                "clicks": b.clicks,
                "ctr": round(b.clicks / b.views * 100, 2) if b.views > 0 else 0,
                "start_at": b.start_at.isoformat() if b.start_at else None,
                "end_at": b.end_at.isoformat() if b.end_at else None,
                "created_at": b.created_at.isoformat() if b.created_at else None,
            }
            for b in banners
        ]
    }


@router.post("/admin/ads")
async def admin_create_ad(
    req: AdBannerCreate,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new banner (admin only)."""
    _require_admin(tg_user)

    valid_placements = {"chat_bottom", "home_banner", "plans_banner"}
    if req.placement not in valid_placements:
        raise HTTPException(status_code=400, detail=f"Invalid placement. Use: {valid_placements}")

    banner = AdBanner(
        title=req.title,
        description=req.description,
        image_url=req.image_url,
        link_url=req.link_url,
        placement=req.placement,
        tier_target=req.tier_target,
        priority=req.priority,
        start_at=datetime.fromisoformat(req.start_at) if req.start_at else None,
        end_at=datetime.fromisoformat(req.end_at) if req.end_at else None,
    )
    db.add(banner)
    await db.flush()

    logger.info(f"Ad created: id={banner.id}, title={req.title}, placement={req.placement}")
    return {"id": banner.id, "status": "created"}


@router.put("/admin/ads/{ad_id}")
async def admin_update_ad(
    ad_id: int,
    req: AdBannerUpdate,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a banner (admin only)."""
    _require_admin(tg_user)

    result = await db.execute(select(AdBanner).where(AdBanner.id == ad_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    updates = req.model_dump(exclude_none=True)
    for field, value in updates.items():
        if field in ("start_at", "end_at") and value:
            value = datetime.fromisoformat(value)
        setattr(banner, field, value)

    await db.flush()
    logger.info(f"Ad updated: id={ad_id}, fields={list(updates.keys())}")
    return {"id": ad_id, "status": "updated"}


@router.delete("/admin/ads/{ad_id}")
async def admin_delete_ad(
    ad_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a banner (admin only). Soft-delete: sets is_active=False."""
    _require_admin(tg_user)

    result = await db.execute(select(AdBanner).where(AdBanner.id == ad_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")

    banner.is_active = False
    await db.flush()

    logger.info(f"Ad deactivated: id={ad_id}")
    return {"id": ad_id, "status": "deactivated"}


# ═══════════════════════════════════════════════════════════
# Admin: Ad stats
# ═══════════════════════════════════════════════════════════

@router.get("/admin/ads/stats")
async def admin_ads_stats(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get aggregated ad statistics (admin only)."""
    _require_admin(tg_user)

    # Total views/clicks across all banners
    result = await db.execute(
        select(
            func.sum(AdBanner.views).label("total_views"),
            func.sum(AdBanner.clicks).label("total_clicks"),
            func.count(AdBanner.id).label("total_banners"),
        ).where(AdBanner.is_active == True)
    )
    row = result.one()

    total_views = row.total_views or 0
    total_clicks = row.total_clicks or 0

    # Rewarded ad stats (users who got bonus today)
    rewarded_result = await db.execute(
        text("SELECT COUNT(*) FROM users WHERE rewarded_today > 0")
    )
    rewarded_users_today = rewarded_result.scalar() or 0

    return {
        "total_active_banners": row.total_banners or 0,
        "total_views": total_views,
        "total_clicks": total_clicks,
        "overall_ctr": round(total_clicks / total_views * 100, 2) if total_views > 0 else 0,
        "rewarded_users_today": rewarded_users_today,
    }


# ═══════════════════════════════════════════════════════════
# Admin: Daily reset (rewarded_today)
# ═══════════════════════════════════════════════════════════

@router.post("/admin/daily-reset")
async def admin_daily_reset(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Reset daily counters: rewarded_today, daily_lite_used, daily_premium_used.

    Should be called by a cron job at midnight UTC, or manually by admin.
    """
    _require_admin(tg_user)

    result = await db.execute(
        text("UPDATE users SET rewarded_today = 0, daily_lite_used = 0, daily_premium_used = 0 "
             "WHERE rewarded_today > 0 OR daily_lite_used > 0 OR daily_premium_used > 0")
    )
    await db.flush()

    logger.info(f"Daily reset completed by admin tg_id={tg_user['id']}")
    return {"status": "ok", "message": "Daily counters reset"}
