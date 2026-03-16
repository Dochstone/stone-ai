"""Tests for ads system (Этап 3).

Verifies:
- AdBanner and AdEvent models exist with correct fields
- Ads router has all required endpoints
- Admin endpoints require authentication
- Config has admin_tg_ids and adsgram_block_id
- Ads router is registered in main.py
"""

import ast
from pathlib import Path

BACKEND = Path(__file__).parent.parent


# ─── Model tests ───

def test_ad_banner_model_fields():
    """AdBanner should have all required fields."""
    src = (BACKEND / "app" / "models" / "ad.py").read_text(encoding="utf-8")
    required = [
        "title", "description", "image_url", "link_url",
        "placement", "tier_target", "is_active", "priority",
        "views", "clicks", "start_at", "end_at",
        "created_at", "updated_at",
    ]
    for field in required:
        assert f"{field}:" in src or f"{field} :" in src, f"AdBanner missing field: {field}"


def test_ad_event_model_fields():
    """AdEvent should have banner_id, user_tg_id, event_type."""
    src = (BACKEND / "app" / "models" / "ad.py").read_text(encoding="utf-8")
    assert "banner_id" in src
    assert "user_tg_id" in src
    assert "event_type" in src


def test_models_init_exports():
    """__init__.py should export AdBanner and AdEvent."""
    src = (BACKEND / "app" / "models" / "__init__.py").read_text(encoding="utf-8")
    assert "AdBanner" in src
    assert "AdEvent" in src


# ─── Router tests ───

def _ads_src():
    return (BACKEND / "app" / "routers" / "ads.py").read_text(encoding="utf-8")


def test_public_get_ads_endpoint():
    """Should have GET /api/ads for public banner retrieval."""
    src = _ads_src()
    assert '"/ads"' in src or "'/ads'" in src
    assert "get_ads" in src


def test_ad_view_endpoint():
    """Should have POST /api/ads/{banner_id}/view."""
    src = _ads_src()
    assert "/{banner_id}/view" in src
    assert "track_ad_view" in src


def test_ad_click_endpoint():
    """Should have POST /api/ads/{banner_id}/click."""
    src = _ads_src()
    assert "/{banner_id}/click" in src
    assert "track_ad_click" in src


def test_admin_list_ads_endpoint():
    """Should have GET /api/admin/ads."""
    src = _ads_src()
    assert '"/admin/ads"' in src or "'/admin/ads'" in src
    assert "admin_list_ads" in src


def test_admin_create_ad_endpoint():
    """Should have POST /api/admin/ads."""
    src = _ads_src()
    assert "admin_create_ad" in src


def test_admin_update_ad_endpoint():
    """Should have PUT /api/admin/ads/{ad_id}."""
    src = _ads_src()
    assert "/{ad_id}" in src
    assert "admin_update_ad" in src


def test_admin_delete_ad_endpoint():
    """Should have DELETE /api/admin/ads/{ad_id}."""
    src = _ads_src()
    assert "admin_delete_ad" in src


def test_admin_stats_endpoint():
    """Should have GET /api/admin/ads/stats."""
    src = _ads_src()
    assert "/admin/ads/stats" in src
    assert "admin_ads_stats" in src


def test_admin_daily_reset_endpoint():
    """Should have POST /api/admin/daily-reset."""
    src = _ads_src()
    assert "/admin/daily-reset" in src
    assert "admin_daily_reset" in src


def test_admin_auth_required():
    """All admin endpoints should call _require_admin."""
    src = _ads_src()
    # Count admin functions vs _require_admin calls
    admin_funcs = src.count("async def admin_")
    require_calls = src.count("_require_admin(tg_user)")
    assert require_calls >= admin_funcs, (
        f"Not all admin endpoints check admin auth: "
        f"{admin_funcs} admin funcs, {require_calls} require_admin calls"
    )


def test_valid_placements_enforced():
    """Admin create should validate placement values."""
    src = _ads_src()
    assert "chat_bottom" in src
    assert "home_banner" in src
    assert "plans_banner" in src


# ─── Config tests ───

def test_config_has_admin_tg_ids():
    src = (BACKEND / "app" / "config.py").read_text(encoding="utf-8")
    assert "admin_tg_ids" in src
    assert "ADMIN_TG_IDS" in src


def test_config_has_adsgram_block_id():
    src = (BACKEND / "app" / "config.py").read_text(encoding="utf-8")
    assert "adsgram_block_id" in src
    assert "ADSGRAM_BLOCK_ID" in src


# ─── Integration: main.py ───

def test_ads_router_registered():
    src = (BACKEND / "app" / "main.py").read_text(encoding="utf-8")
    assert "ads.router" in src
    assert "from app.routers import" in src and "ads" in src


# ─── Denormalized counters ───

def test_view_increments_counter():
    """track_ad_view should increment AdBanner.views."""
    src = _ads_src()
    assert "AdBanner.views + 1" in src


def test_click_increments_counter():
    """track_ad_click should increment AdBanner.clicks."""
    src = _ads_src()
    assert "AdBanner.clicks + 1" in src


def test_ctr_calculation():
    """Admin list should calculate CTR."""
    src = _ads_src()
    assert "ctr" in src
    assert "clicks / b.views" in src or "b.clicks / b.views" in src
