"""IndexNow client: push URL changes to Yandex/Bing and keep admin stats."""

import json
import logging
import os
import tempfile
from datetime import datetime, timezone
from typing import Iterable
from xml.etree import ElementTree

import httpx

logger = logging.getLogger(__name__)

INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow"

SITE_HOST = os.getenv("INDEXNOW_HOST", "stoneai.ru")
INDEXNOW_KEY = os.getenv("INDEXNOW_KEY", "stoneai2026indexnow")
INDEXNOW_KEY_LOCATION = os.getenv(
    "INDEXNOW_KEY_LOCATION",
    f"https://{SITE_HOST}/{INDEXNOW_KEY}.txt" if INDEXNOW_KEY else "",
)
INDEXNOW_HISTORY_PATH = os.getenv(
    "INDEXNOW_HISTORY_PATH",
    os.path.join(tempfile.gettempdir(), "stone_ai_indexnow_history.json"),
)

MAX_BATCH = 10000
MAX_HISTORY = 50


def _read_history() -> list[dict]:
    try:
        with open(INDEXNOW_HISTORY_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except FileNotFoundError:
        return []
    except Exception as e:
        logger.warning(f"IndexNow history read failed: {e}")
        return []


def _write_history(history: list[dict]) -> None:
    try:
        os.makedirs(os.path.dirname(INDEXNOW_HISTORY_PATH), exist_ok=True)
        with open(INDEXNOW_HISTORY_PATH, "w", encoding="utf-8") as f:
            json.dump(history[-MAX_HISTORY:], f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.warning(f"IndexNow history write failed: {e}")


def _record_submission(result: dict, urls: list[str], source: str) -> None:
    history = _read_history()
    history.append(
        {
            "ts": datetime.now(timezone.utc).isoformat(),
            "source": source,
            "ok": bool(result.get("ok")),
            "status": int(result.get("status") or 0),
            "count": int(result.get("count") or 0),
            "message": str(result.get("message") or ""),
            "sample_urls": urls[:20],
        }
    )
    _write_history(history)


def get_sitemap_urls() -> list[str]:
    sitemap_url = f"https://{SITE_HOST}/sitemap.xml"
    with httpx.Client(timeout=20, follow_redirects=True) as client:
        response = client.get(sitemap_url)
        response.raise_for_status()

    root = ElementTree.fromstring(response.content)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    return [
        loc.text
        for loc in root.findall("sm:url/sm:loc", ns)
        if loc.text and loc.text.startswith(f"https://{SITE_HOST}")
    ]


def submit_urls(urls: Iterable[str], source: str = "manual") -> dict:
    """Push URLs to IndexNow.

    Returns {ok, status, count, message}. Filters out URLs not on SITE_HOST.
    """
    if not INDEXNOW_KEY:
        return {"ok": False, "status": 0, "count": 0, "message": "INDEXNOW_KEY not configured"}

    prefix = f"https://{SITE_HOST}"
    url_list = [u for u in urls if isinstance(u, str) and u.startswith(prefix)]
    if not url_list:
        return {"ok": False, "status": 0, "count": 0, "message": "no valid URLs for host " + SITE_HOST}

    if len(url_list) > MAX_BATCH:
        url_list = url_list[:MAX_BATCH]

    payload = {
        "host": SITE_HOST,
        "key": INDEXNOW_KEY,
        "keyLocation": INDEXNOW_KEY_LOCATION,
        "urlList": url_list,
    }
    try:
        r = httpx.post(INDEXNOW_ENDPOINT, json=payload, timeout=15)
        ok = r.status_code in (200, 202)
        message = "ok" if ok else r.text[:300]
        if ok:
            logger.info(f"IndexNow submitted {len(url_list)} URLs (HTTP {r.status_code})")
        else:
            logger.warning(f"IndexNow {r.status_code}: {message}")
        result = {"ok": ok, "status": r.status_code, "count": len(url_list), "message": message}
        _record_submission(result, url_list, source)
        return result
    except Exception as e:
        logger.error(f"IndexNow request failed: {e}")
        result = {"ok": False, "status": 0, "count": len(url_list), "message": str(e)}
        _record_submission(result, url_list, source)
        return result


def submit_url(url: str) -> dict:
    """Submit a single URL convenience wrapper."""
    return submit_urls([url])


def submit_sitemap() -> dict:
    """Submit every URL currently present in sitemap.xml."""
    return submit_urls(get_sitemap_urls(), source="sitemap")


def get_stats() -> dict:
    history = _read_history()
    accepted = [item for item in history if item.get("ok")]
    failed = [item for item in history if not item.get("ok")]
    total_urls = sum(int(item.get("count") or 0) for item in accepted)

    sitemap_status = 0
    sitemap_count = 0
    sitemap_error = ""
    try:
        sitemap_count = len(get_sitemap_urls())
        sitemap_status = 200
    except Exception as e:
        sitemap_error = str(e)[:300]

    checks: dict[str, dict] = {}
    with httpx.Client(timeout=10, follow_redirects=True) as client:
        for key, url in {
            "indexnow_key": INDEXNOW_KEY_LOCATION,
            "bing_auth": f"https://{SITE_HOST}/BingSiteAuth.xml",
        }.items():
            try:
                response = client.get(url)
                checks[key] = {
                    "url": url,
                    "status": response.status_code,
                    "ok": response.status_code == 200,
                }
            except Exception as e:
                checks[key] = {"url": url, "status": 0, "ok": False, "error": str(e)[:200]}

    return {
        "site_host": SITE_HOST,
        "endpoint": INDEXNOW_ENDPOINT,
        "key_configured": bool(INDEXNOW_KEY),
        "key_location": INDEXNOW_KEY_LOCATION,
        "sitemap": {
            "url": f"https://{SITE_HOST}/sitemap.xml",
            "status": sitemap_status,
            "url_count": sitemap_count,
            "error": sitemap_error,
        },
        "checks": checks,
        "history": {
            "submissions": len(history),
            "accepted": len(accepted),
            "failed": len(failed),
            "total_urls": total_urls,
            "last_submission": history[-1] if history else None,
            "recent": list(reversed(history[-10:])),
        },
    }
