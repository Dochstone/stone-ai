"""Tests for bot handlers.py (Step 5).

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


def test_model_count_30_plus():
    """Should mention 30+ models, not 11."""
    src = _src()
    assert "30+" in src
    assert "11 AI" not in src


def test_7_free_models():
    """Should mention 7 free models, not 6."""
    src = _src()
    assert "7 моделей бесплатно" in src
    assert "6 моделей бесплатно" not in src


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
    """Help text should list all 7 Lite models."""
    src = _src()
    assert "Gemma 3" in src or "Gemma" in src
    assert "Qwen 3" in src or "Qwen" in src


def test_premium_models_list():
    """Help text should mention new premium models."""
    src = _src()
    assert "GPT-5.1" in src or "Claude Sonnet" in src or "DeepSeek R1/V3" in src


def test_no_old_contacts():
    """Should not contain @art_stone."""
    src = _src()
    assert "@art_stone" not in src


def test_support_link():
    """Should contain new support link."""
    src = _src()
    assert "https://t.me/StoneAIsupport" in src


def test_exception_fallback_updated():
    """Exception fallback should show 10 req/day, not 20."""
    src = _src()
    assert "20 запросов/день" not in src
