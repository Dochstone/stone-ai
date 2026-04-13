"""Google Search Console API client — read-only metrics for the admin dashboard.

Requires a service account JSON at GSC_SA_KEY_PATH and the service account
added as a user on the GSC property (Search Console → Settings → Users).
"""

import logging
import os
import threading
import time
from datetime import date, timedelta
from typing import Any

logger = logging.getLogger(__name__)

GSC_SA_KEY_PATH = os.getenv("GSC_SA_KEY_PATH", "/var/www/stone-ai/backend/secrets/gsc-sa.json")
GSC_SITE_URL = os.getenv("GSC_SITE_URL", "https://stoneai.ru/")
GSC_CACHE_TTL = int(os.getenv("GSC_CACHE_TTL", "3600"))
GSC_DATA_LAG_DAYS = 3  # GSC data lags ~2-3 days

_cache: dict[str, tuple[float, Any]] = {}
_cache_lock = threading.Lock()


def _cached(key: str, fn, ttl: int = GSC_CACHE_TTL):
    now = time.time()
    with _cache_lock:
        entry = _cache.get(key)
        if entry and now - entry[0] < ttl:
            return entry[1]
    value = fn()
    with _cache_lock:
        _cache[key] = (now, value)
    return value


def _client():
    from google.oauth2 import service_account
    from googleapiclient.discovery import build

    creds = service_account.Credentials.from_service_account_file(
        GSC_SA_KEY_PATH,
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
    )
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def _date_range(days: int) -> tuple[str, str]:
    end = date.today() - timedelta(days=GSC_DATA_LAG_DAYS)
    start = end - timedelta(days=days - 1)
    return start.isoformat(), end.isoformat()


def is_configured() -> bool:
    return os.path.isfile(GSC_SA_KEY_PATH)


def list_sites() -> list[str]:
    sc = _client()
    res = sc.sites().list().execute()
    return [s["siteUrl"] for s in res.get("siteEntry", [])]


def get_overview(days: int = 28) -> dict:
    def _fetch():
        sc = _client()
        start, end = _date_range(days)
        body = {"startDate": start, "endDate": end, "dimensions": []}
        res = sc.searchanalytics().query(siteUrl=GSC_SITE_URL, body=body).execute()
        rows = res.get("rows", [])
        if not rows:
            totals = {"clicks": 0, "impressions": 0, "ctr": 0.0, "position": 0.0}
        else:
            r = rows[0]
            totals = {
                "clicks": int(r.get("clicks", 0)),
                "impressions": int(r.get("impressions", 0)),
                "ctr": round(r.get("ctr", 0.0) * 100, 2),
                "position": round(r.get("position", 0.0), 2),
            }
        return {
            "site": GSC_SITE_URL,
            "period": {"start": start, "end": end, "days": days},
            "totals": totals,
        }

    return _cached(f"overview:{days}", _fetch)


def get_top_queries(days: int = 28, limit: int = 25) -> list[dict]:
    def _fetch():
        sc = _client()
        start, end = _date_range(days)
        body = {
            "startDate": start,
            "endDate": end,
            "dimensions": ["query"],
            "rowLimit": limit,
            "orderBy": [{"field": "clicks", "descending": True}],
        }
        res = sc.searchanalytics().query(siteUrl=GSC_SITE_URL, body=body).execute()
        return [
            {
                "query": r["keys"][0],
                "clicks": int(r.get("clicks", 0)),
                "impressions": int(r.get("impressions", 0)),
                "ctr": round(r.get("ctr", 0.0) * 100, 2),
                "position": round(r.get("position", 0.0), 2),
            }
            for r in res.get("rows", [])
        ]

    return _cached(f"queries:{days}:{limit}", _fetch)


def get_top_pages(days: int = 28, limit: int = 25) -> list[dict]:
    def _fetch():
        sc = _client()
        start, end = _date_range(days)
        body = {
            "startDate": start,
            "endDate": end,
            "dimensions": ["page"],
            "rowLimit": limit,
            "orderBy": [{"field": "clicks", "descending": True}],
        }
        res = sc.searchanalytics().query(siteUrl=GSC_SITE_URL, body=body).execute()
        return [
            {
                "page": r["keys"][0],
                "clicks": int(r.get("clicks", 0)),
                "impressions": int(r.get("impressions", 0)),
                "ctr": round(r.get("ctr", 0.0) * 100, 2),
                "position": round(r.get("position", 0.0), 2),
            }
            for r in res.get("rows", [])
        ]

    return _cached(f"pages:{days}:{limit}", _fetch)


def get_daily(days: int = 28) -> list[dict]:
    """Daily clicks/impressions for charting."""
    def _fetch():
        sc = _client()
        start, end = _date_range(days)
        body = {
            "startDate": start,
            "endDate": end,
            "dimensions": ["date"],
            "rowLimit": 25000,
        }
        res = sc.searchanalytics().query(siteUrl=GSC_SITE_URL, body=body).execute()
        return [
            {
                "date": r["keys"][0],
                "clicks": int(r.get("clicks", 0)),
                "impressions": int(r.get("impressions", 0)),
                "position": round(r.get("position", 0.0), 2),
            }
            for r in res.get("rows", [])
        ]

    return _cached(f"daily:{days}", _fetch)


def inspect_url(url: str) -> dict:
    """Inspect a single URL — current index status (no submission)."""
    def _fetch():
        sc = _client()
        body = {
            "inspectionUrl": url,
            "siteUrl": GSC_SITE_URL,
            "languageCode": "ru",
        }
        res = sc.urlInspection().index().inspect(body=body).execute()
        ir = res.get("inspectionResult", {})
        idx = ir.get("indexStatusResult", {})
        return {
            "url": url,
            "verdict": idx.get("verdict"),
            "coverage_state": idx.get("coverageState"),
            "robots_txt_state": idx.get("robotsTxtState"),
            "indexing_state": idx.get("indexingState"),
            "page_fetch_state": idx.get("pageFetchState"),
            "last_crawl_time": idx.get("lastCrawlTime"),
            "google_canonical": idx.get("googleCanonical"),
            "user_canonical": idx.get("userCanonical"),
        }

    return _cached(f"inspect:{url}", _fetch, ttl=24 * 3600)


def clear_cache() -> int:
    with _cache_lock:
        n = len(_cache)
        _cache.clear()
    return n
