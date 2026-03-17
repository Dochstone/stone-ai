"""Tests for bot handlers.py.

Verifies:
- Updated model counts and descriptions
- Correct free tier limits (10+5)
- Per-token billing text (not subscription-based)
- Updated contact info
"""

from pathlib import Path

BACKEND = Path(__file__).parent.parent
HANDLERS_SRC = BACKEND / "app" / "bot" / "handlers.py"


def _src():
    return HANDLERS_SRC.read_text(encoding="utf-8")


def test_model_count_50_plus():
    """Should mention 50+ models."""
    src = _src()
    assert "50+" in src or "50 " in src
    assert "11 AI" not in src


def test_5_free_models():
    """Should mention 5 free models."""
    src = _src()
    assert "5 моделей бесплатно" in src or "5 моделей" in src


def test_10_requests_per_day():
    """Free tier: 10 requests/day (+5 for ads), not 20."""
    src = _src()
    assert "10 запросов" in src
    assert "20 запросов в день" not in src


def test_per_token_billing_text():
    """Plans should describe per-token billing, not subscriptions."""
    src = _src()
    assert "Per-token" in src or "per-token" in src or "токены" in src or "токенов" in src


def test_lite_models_list():
    """Help text should list Lite models."""
    src = _src()
    assert "Claude Haiku" in src
    assert "Gemini Flash" in src


def test_premium_models_list():
    """Help text should mention premium models."""
    src = _src()
    assert "GPT-5.1" in src
    assert "Claude Opus" in src


def test_no_old_contacts():
    """Should not contain @art_stone."""
    src = _src()
    assert "@art_stone" not in src


def test_support_link():
    """Should contain support link."""
    src = _src()
    assert "stoneaisupport" in src


def test_exception_fallback_updated():
    """Exception fallback should show 10 req/day, not 20."""
    src = _src()
    assert "20 запросов/день" not in src


def test_inline_buttons():
    """Start message should have all 4 inline buttons."""
    src = _src()
    assert "Открыть приложение" in src
    assert "Модели и цены" in src
    assert "Пополнить баланс" in src
    assert "Поддержка @stoneaisupport" in src
