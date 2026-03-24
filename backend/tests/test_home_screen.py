"""Tests for Этап 5 — HomeScreen with 50 models and filters.

Verifies:
- Filter tabs present (All, Free, company names, categories)
- Model grid renders all models (not split lite/premium)
- Premium click → ModelDetailScreen (not chat)
- Lite click → chat
- Category badges for image/search/reason/code
- No old PromoBanner with "11 AI моделей"
- 50+ model subtitle
"""

from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
FRONTEND = ROOT / "frontend" / "src"


def _src():
    return (FRONTEND / "components" / "HomeScreen" / "HomeScreen.tsx").read_text(encoding="utf-8")


# ─── Filters ───

def test_filter_tabs_exist():
    src = _src()
    assert "FILTERS" in src
    for label in ["Все", "Free", "OpenAI", "Anthropic", "Google", "Картинки", "Поиск", "Reasoning"]:
        assert label in src, f"Filter label '{label}' missing"


def test_filter_horizontal_scroll():
    src = _src()
    assert "overflowX" in src
    assert "'auto'" in src or "auto" in src


def test_filter_by_company():
    src = _src()
    for company in ["OpenAI", "Anthropic", "Google", "Meta", "xAI", "DeepSeek"]:
        assert f"m.company === '{company}'" in src, f"Company filter for {company} missing"


def test_filter_by_category():
    src = _src()
    for cat in ["image", "search", "reason"]:
        assert f"m.category === '{cat}'" in src, f"Category filter for {cat} missing"


def test_apply_filter_function():
    src = _src()
    assert "function applyFilter" in src or "applyFilter" in src


# ─── Model grid ───

def test_single_unified_grid():
    """Should be one grid, not separate lite/premium sections."""
    src = _src()
    assert "filteredModels.map" in src
    # Old pattern: separate liteModels.map and premiumModels.map should not exist
    assert "liteModels.map" not in src
    assert "premiumModels.map" not in src


def test_model_count_display():
    src = _src()
    assert "filteredModels.length" in src
    assert "моделей" in src or "модели" in src


# ─── Click behavior ───

def test_premium_click_opens_model_detail():
    """Premium models should open ModelDetailScreen, not chat."""
    src = _src()
    assert "model_detail" in src
    assert "setSelectedModel" in src


def test_lite_click_opens_chat():
    src = _src()
    assert "setModelId" in src
    assert "'chat'" in src


# ─── Model card ───

def test_card_shows_price_or_free():
    src = _src()
    assert "FREE" in src
    assert "/M" in src


def test_card_category_badge():
    """Non-chat models should have a category badge."""
    src = _src()
    assert "catColor" in src or "catColors" in src
    assert "model.category" in src


# ─── Promo / Header ───

def test_subtitle_50_models():
    src = _src()
    assert "50+" in src


def test_no_old_promo_text():
    src = _src()
    assert "топ 11" not in src
    assert "11 AI" not in src
    assert "6 бесплатных модели" not in src


# ─── Ads integration ───

def test_rewarded_button_present():
    src = _src()
    assert "RewardedAdButton" in src


def test_ad_banner_at_bottom():
    """Ad banner should be at the bottom of the page, not in the middle."""
    src = _src()
    assert "AdBanner" in src
    assert "home_banner" in src
    # AdBanner should appear after the model grid
    grid_pos = src.index("filteredModels.map")
    banner_pos = src.rindex("AdBanner")
    assert banner_pos > grid_pos


def test_rewarded_hint_in_usage():
    """+5 за рекламу hint should be in usage card."""
    src = _src()
    assert "+5 за рекламу" in src


# ─── Payment methods ───

def test_payment_methods_strip():
    """Payment methods or pricing link should be present on HomeScreen."""
    src = _src()
    # Old per-token had Stars/TON/etc, new subscription may just link to plans
    assert "Stars" in src or "plans" in src or "pricing" in src or "PRO" in src


def test_payment_strip_navigates_to_plans():
    src = _src()
    assert "Пополнить баланс" in src or "plans" in src or "PRO" in src


# ─── Empty state ───

def test_empty_state():
    src = _src()
    assert "Нет моделей" in src
