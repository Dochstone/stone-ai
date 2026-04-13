"""IndexNow client — push URL changes to Yandex/Bing for instant indexing.

Google ignores IndexNow. For Google use Search Console URL Inspection manually.
"""

import logging
import os
from typing import Iterable

import httpx

logger = logging.getLogger(__name__)

INDEXNOW_ENDPOINT = "https://api.indexnow.org/IndexNow"

SITE_HOST = os.getenv("INDEXNOW_HOST", "stoneai.ru")
INDEXNOW_KEY = os.getenv("INDEXNOW_KEY", "")
INDEXNOW_KEY_LOCATION = os.getenv(
    "INDEXNOW_KEY_LOCATION",
    f"https://{SITE_HOST}/{INDEXNOW_KEY}.txt" if INDEXNOW_KEY else "",
)

MAX_BATCH = 10000


def submit_urls(urls: Iterable[str]) -> dict:
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
        return {"ok": ok, "status": r.status_code, "count": len(url_list), "message": message}
    except Exception as e:
        logger.error(f"IndexNow request failed: {e}")
        return {"ok": False, "status": 0, "count": len(url_list), "message": str(e)}


def submit_url(url: str) -> dict:
    """Submit a single URL — convenience wrapper."""
    return submit_urls([url])
