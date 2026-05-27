"""Helpers for first-touch acquisition attribution."""

from __future__ import annotations

import re
from typing import Any


ATTRIBUTION_FIELDS = (
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "first_referrer",
    "first_landing_path",
    "first_landing_url",
)


def _clean(value: Any, max_len: int) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    text = re.sub(r"[^a-zA-Z0-9_.:/@+-]+", "-", text)
    return text[:max_len] or None


def parse_telegram_start_param(start_param: str | None) -> dict[str, str]:
    """Convert Telegram /start payload into UTM fields.

    Supported examples:
    - src_chatgpt -> utm_source=chatgpt
    - ref_ABCD1234 -> utm_source=referral, utm_campaign=ref_ABCD1234
    - any_campaign -> utm_source=any_campaign
    """
    raw = _clean(start_param, 128)
    if not raw or raw.startswith(("web_", "link_")):
        return {}

    if raw.startswith("src_"):
        source = _clean(raw[4:], 64)
        campaign = "telegram_start"
    elif raw.startswith("ref_"):
        source = "referral"
        campaign = _clean(raw, 128)
    else:
        source = _clean(raw, 64)
        campaign = "telegram_start"

    if not source:
        return {}

    return {
        "utm_source": source,
        "utm_medium": "telegram",
        "utm_campaign": campaign or "telegram_start",
        "utm_content": raw,
        "first_referrer": "https://t.me/stonetgbot",
        "first_landing_path": "/telegram/start",
        "first_landing_url": f"https://t.me/stonetgbot?start={raw}",
    }


def apply_user_acquisition(user: Any, attribution: dict[str, Any] | None) -> None:
    """Fill missing first-touch fields without overwriting existing attribution."""
    if not attribution:
        return

    limits = {
        "utm_source": 128,
        "utm_medium": 128,
        "utm_campaign": 128,
        "utm_content": 128,
        "utm_term": 128,
        "first_referrer": 512,
        "first_landing_path": 500,
        "first_landing_url": 700,
    }
    for field in ATTRIBUTION_FIELDS:
        value = _clean(attribution.get(field), limits[field])
        if value and not getattr(user, field, None):
            setattr(user, field, value)
