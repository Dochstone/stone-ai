"""Tests for audit fixes — business logic, security, STRATEGY compliance.

Verifies fixes found during code review:
1. tier_target filtering in GET /api/ads (paid users don't see free-targeted ads)
2. Banner existence check in view/click endpoints
3. Rewarded ad has atomic with_for_update
4. deduct_balance is atomic with with_for_update
5. add_balance is atomic with with_for_update
6. Frontend AdBanner doesn't show for subscribers
"""

from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
BACKEND = Path(__file__).parent.parent


# ─── STRATEGY compliance: paid users don't see ads ───

def test_ads_filters_by_tier_target():
    """GET /api/ads should filter by tier_target — paid users shouldn't see free-only ads."""
    src = (BACKEND / "app" / "routers" / "ads.py").read_text(encoding="utf-8")
    assert "tier_target" in src
    assert "user_has_balance" in src
    assert 'b.tier_target == "free"' in src


def test_frontend_banner_hides_for_subscribers():
    """AdBanner should not show for plus/max subscribers."""
    src = (ROOT / "frontend" / "src" / "components" / "AdBanner" / "AdBanner.tsx").read_text(encoding="utf-8")
    assert "'plus'" in src
    assert "'max'" in src


# ─── Security: banner validation in event tracking ───

def test_view_validates_banner_exists():
    """track_ad_view should check banner exists before creating event."""
    src = (BACKEND / "app" / "routers" / "ads.py").read_text(encoding="utf-8")
    # Find the view function and check for 404
    view_section = src[src.index("track_ad_view"):src.index("track_ad_click")]
    assert "Banner not found" in view_section


def test_click_validates_banner_exists():
    """track_ad_click should check banner exists before creating event."""
    src = (BACKEND / "app" / "routers" / "ads.py").read_text(encoding="utf-8")
    click_section = src[src.index("track_ad_click"):src.index("AdBannerCreate")]
    assert "Banner not found" in click_section


# ─── Security: atomic balance operations ───

def test_deduct_balance_uses_for_update():
    """deduct_balance must use with_for_update() to prevent race conditions."""
    src = (BACKEND / "app" / "services" / "token_billing.py").read_text(encoding="utf-8")
    deduct_section = src[src.index("async def deduct_balance"):src.index("async def add_balance")]
    assert "with_for_update()" in deduct_section


def test_add_balance_uses_for_update():
    """add_balance must use with_for_update() to prevent race conditions."""
    src = (BACKEND / "app" / "services" / "token_billing.py").read_text(encoding="utf-8")
    add_section = src[src.index("async def add_balance"):]
    assert "with_for_update()" in add_section


def test_rewarded_ad_uses_for_update():
    """Rewarded ad endpoint must use with_for_update() to prevent double-claiming."""
    src = (BACKEND / "app" / "routers" / "payment.py").read_text(encoding="utf-8")
    rewarded_section = src[src.index("rewarded_ad_complete"):]
    assert "with_for_update()" in rewarded_section


def test_deduct_handles_insufficient_balance():
    """deduct_balance should deduct what it can when balance < amount (not reject)."""
    src = (BACKEND / "app" / "services" / "token_billing.py").read_text(encoding="utf-8")
    deduct_section = src[src.index("async def deduct_balance"):src.index("async def add_balance")]
    assert "actual_deduct = current" in deduct_section
    assert "user.balance_usd = 0" in deduct_section


# ─── Billing flow: deduct AFTER streaming ───

def test_chat_deducts_after_streaming():
    """chat.py should deduct balance AFTER streaming, not before."""
    src = (BACKEND / "app" / "routers" / "chat.py").read_text(encoding="utf-8")
    # deduct_balance should appear after stream_chat_response in the code
    stream_pos = src.index("stream_chat_response")
    deduct_pos = src.index("deduct_balance")
    assert deduct_pos > stream_pos, "deduct_balance should come after stream_chat_response"


def test_chat_skips_billing_on_error():
    """chat.py should NOT deduct balance if AI returned an error."""
    src = (BACKEND / "app" / "routers" / "chat.py").read_text(encoding="utf-8")
    assert "had_error" in src
    assert "not had_error" in src or "not using_byok and not had_error" in src
