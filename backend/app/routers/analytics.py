"""Analytics — page view tracking and admin statistics."""

import hashlib
import logging
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Request, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func, case, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.page_view import PageView
from app.routers.admin import require_web_admin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/analytics", tags=["analytics"])


class TrackRequest(BaseModel):
    path: str = Field(max_length=500)
    referrer: str | None = Field(default=None, max_length=500)
    duration_sec: float | None = None
    screen_width: int | None = None


@router.post("/track")
async def track_page_view(
    body: TrackRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Track a page view. No auth required — lightweight beacon."""
    # Hash IP for privacy
    client_ip = request.headers.get("X-Real-IP") or request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or request.client.host if request.client else ""
    ip_hash = hashlib.sha256(client_ip.encode()).hexdigest()[:16] if client_ip else None

    ua = (request.headers.get("User-Agent") or "")[:500]

    # Extract user_tg_id from auth header if present
    user_tg_id = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            from app.middleware.web_auth import decode_jwt
            payload = decode_jwt(auth_header[7:])
            user_tg_id = payload.get("tg_id") or payload.get("sub")
        except Exception:
            pass

    pv = PageView(
        path=body.path[:500],
        referrer=body.referrer[:500] if body.referrer else None,
        user_agent=ua,
        ip_hash=ip_hash,
        user_tg_id=user_tg_id,
        duration_sec=body.duration_sec,
        screen_width=body.screen_width,
    )
    db.add(pv)
    return {"ok": True}


@router.get("/stats")
async def get_stats(
    _admin: dict = Depends(require_web_admin),
    db: AsyncSession = Depends(get_db),
    days: int = Query(7, ge=1, le=90),
    sort_by: str = Query("views", regex="^(views|unique|avg_duration|path)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
):
    """Admin: get page view statistics."""
    cutoff = datetime.utcnow() - timedelta(days=days)

    # Total views
    total_views = await db.scalar(
        select(func.count()).select_from(PageView).where(PageView.created_at >= cutoff)
    ) or 0

    # Unique visitors (by ip_hash)
    unique_visitors = await db.scalar(
        select(func.count(func.distinct(PageView.ip_hash))).select_from(PageView).where(PageView.created_at >= cutoff)
    ) or 0

    # Avg duration
    avg_duration = await db.scalar(
        select(func.avg(PageView.duration_sec)).select_from(PageView).where(
            PageView.created_at >= cutoff,
            PageView.duration_sec.isnot(None),
            PageView.duration_sec > 0,
        )
    ) or 0

    # Views by day
    daily_result = await db.execute(
        select(
            cast(PageView.created_at, Date).label("day"),
            func.count().label("views"),
            func.count(func.distinct(PageView.ip_hash)).label("unique"),
        )
        .where(PageView.created_at >= cutoff)
        .group_by(cast(PageView.created_at, Date))
        .order_by(cast(PageView.created_at, Date))
    )
    daily = [{"date": str(r.day), "views": r.views, "unique": r.unique} for r in daily_result]

    # Top pages
    sort_col = {
        "views": func.count(),
        "unique": func.count(func.distinct(PageView.ip_hash)),
        "avg_duration": func.avg(PageView.duration_sec),
        "path": PageView.path,
    }[sort_by]

    pages_q = (
        select(
            PageView.path,
            func.count().label("views"),
            func.count(func.distinct(PageView.ip_hash)).label("unique"),
            func.avg(PageView.duration_sec).label("avg_duration"),
        )
        .where(PageView.created_at >= cutoff)
        .group_by(PageView.path)
    )
    if order == "desc":
        pages_q = pages_q.order_by(sort_col.desc() if hasattr(sort_col, 'desc') else func.count().desc())
    else:
        pages_q = pages_q.order_by(sort_col.asc() if hasattr(sort_col, 'asc') else func.count().asc())
    pages_q = pages_q.limit(50)

    pages_result = await db.execute(pages_q)
    pages = [
        {
            "path": r.path,
            "views": r.views,
            "unique": r.unique,
            "avg_duration": round(float(r.avg_duration or 0), 1),
        }
        for r in pages_result
    ]

    # Top referrers
    ref_result = await db.execute(
        select(
            PageView.referrer,
            func.count().label("views"),
        )
        .where(PageView.created_at >= cutoff, PageView.referrer.isnot(None), PageView.referrer != "")
        .group_by(PageView.referrer)
        .order_by(func.count().desc())
        .limit(20)
    )
    referrers = [{"referrer": r.referrer, "views": r.views} for r in ref_result]

    # Device breakdown
    mobile_count = await db.scalar(
        select(func.count()).select_from(PageView).where(
            PageView.created_at >= cutoff,
            PageView.screen_width.isnot(None),
            PageView.screen_width < 768,
        )
    ) or 0

    return {
        "period_days": days,
        "total_views": total_views,
        "unique_visitors": unique_visitors,
        "avg_duration_sec": round(float(avg_duration), 1),
        "mobile_percent": round(mobile_count / max(total_views, 1) * 100, 1),
        "daily": daily,
        "pages": pages,
        "referrers": referrers,
    }
