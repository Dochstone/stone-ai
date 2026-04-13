"""Admin SEO endpoints — IndexNow push + GSC dashboard."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.routers.admin import require_web_admin
from app.services import gsc_service, indexnow_service

router = APIRouter(prefix="/api/admin/seo", tags=["admin-seo"])
logger = logging.getLogger(__name__)


class IndexNowRequest(BaseModel):
    urls: list[str] = Field(..., min_length=1, max_length=10000)


@router.post("/indexnow")
def push_indexnow(body: IndexNowRequest, _admin: dict = Depends(require_web_admin)) -> dict:
    """Submit a batch of URLs to IndexNow (Yandex/Bing). Admin-only."""
    result = indexnow_service.submit_urls(body.urls)
    if not result["ok"] and result["status"] == 0 and result["count"] == 0:
        raise HTTPException(400, result["message"])
    return result


@router.get("/overview")
def gsc_overview(
    days: int = Query(28, ge=1, le=90),
    _admin: dict = Depends(require_web_admin),
) -> dict:
    if not gsc_service.is_configured():
        raise HTTPException(503, "GSC service account not configured")
    try:
        return gsc_service.get_overview(days=days)
    except Exception as e:
        logger.exception("GSC overview failed")
        raise HTTPException(502, f"GSC error: {e}")


@router.get("/queries")
def gsc_queries(
    days: int = Query(28, ge=1, le=90),
    limit: int = Query(25, ge=1, le=200),
    _admin: dict = Depends(require_web_admin),
) -> list[dict]:
    if not gsc_service.is_configured():
        raise HTTPException(503, "GSC service account not configured")
    try:
        return gsc_service.get_top_queries(days=days, limit=limit)
    except Exception as e:
        logger.exception("GSC queries failed")
        raise HTTPException(502, f"GSC error: {e}")


@router.get("/pages")
def gsc_pages(
    days: int = Query(28, ge=1, le=90),
    limit: int = Query(25, ge=1, le=200),
    _admin: dict = Depends(require_web_admin),
) -> list[dict]:
    if not gsc_service.is_configured():
        raise HTTPException(503, "GSC service account not configured")
    try:
        return gsc_service.get_top_pages(days=days, limit=limit)
    except Exception as e:
        logger.exception("GSC pages failed")
        raise HTTPException(502, f"GSC error: {e}")


@router.get("/daily")
def gsc_daily(
    days: int = Query(28, ge=1, le=90),
    _admin: dict = Depends(require_web_admin),
) -> list[dict]:
    if not gsc_service.is_configured():
        raise HTTPException(503, "GSC service account not configured")
    try:
        return gsc_service.get_daily(days=days)
    except Exception as e:
        logger.exception("GSC daily failed")
        raise HTTPException(502, f"GSC error: {e}")


@router.get("/inspect")
def gsc_inspect(
    url: str = Query(..., description="Full URL on the property"),
    _admin: dict = Depends(require_web_admin),
) -> dict:
    if not gsc_service.is_configured():
        raise HTTPException(503, "GSC service account not configured")
    try:
        return gsc_service.inspect_url(url)
    except Exception as e:
        logger.exception("GSC inspect failed")
        raise HTTPException(502, f"GSC error: {e}")


@router.post("/cache/clear")
def gsc_cache_clear(_admin: dict = Depends(require_web_admin)) -> dict:
    return {"cleared": gsc_service.clear_cache()}
