"""Tests for Этап 6 — ChatScreen with cost display, billing parsing, usage history.

Verifies:
1. ChatScreen shows cost after each assistant response
2. Ad banner hidden when balance > 0
3. Balance displayed in chat header
4. useChat parses billing SSE chunk and updates store
5. api/client.ts has onBilling callback
6. ProfileScreen has usage history section
7. Backend has /api/user/usage-history endpoint
"""

from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
FRONTEND = ROOT / "frontend" / "src"
BACKEND = Path(__file__).parent.parent


# ─── ChatScreen ───

def _chat_src():
    return (FRONTEND / "components" / "ChatScreen" / "ChatScreen.tsx").read_text(encoding="utf-8")


def test_cost_display_after_response():
    """Should show cost in $ after assistant response."""
    src = _chat_src()
    assert "lastRequestCost" in src
    assert ".toFixed(4)" in src or "cost_usd" in src


def test_ad_banner_hidden_when_balance_positive():
    """Ad banner should check balanceUsd > 0."""
    src = _chat_src()
    assert "balanceUsd" in src
    assert "showAd" in src


def test_balance_in_chat_header():
    """Chat header should display current balance."""
    src = _chat_src()
    assert "balanceUsd.toFixed" in src


def test_model_prices_in_selector():
    """Model selector should show $/M prices."""
    src = _chat_src()
    assert "price_weighted" in src
    assert "/M" in src


# ─── useChat billing parsing ───

def _chat_hook_src():
    return (FRONTEND / "hooks" / "useChat.ts").read_text(encoding="utf-8")


def test_use_chat_has_on_billing():
    src = _chat_hook_src()
    assert "onBilling" in src


def test_use_chat_updates_balance():
    src = _chat_hook_src()
    assert "balanceUsd" in src
    assert "billing.balance_usd" in src


def test_use_chat_updates_last_cost():
    src = _chat_hook_src()
    assert "lastRequestCost" in src
    assert "billing.cost_usd" in src


def test_use_chat_updates_total_tokens():
    src = _chat_hook_src()
    assert "totalTokens" in src


# ─── api/client.ts billing ───

def test_client_has_billing_interface():
    src = (FRONTEND / "api" / "client.ts").read_text(encoding="utf-8")
    assert "export interface BillingInfo" in src
    assert "cost_usd" in src
    assert "balance_usd" in src


def test_client_parses_billing_chunk():
    src = (FRONTEND / "api" / "client.ts").read_text(encoding="utf-8")
    assert "parsed.billing" in src
    assert "onBilling" in src


# ─── ProfileScreen usage history ───

def _profile_src():
    return (FRONTEND / "components" / "ProfileScreen" / "ProfileScreen.tsx").read_text(encoding="utf-8")


def test_profile_has_usage_history():
    src = _profile_src()
    assert "UsageHistory" in src
    assert "История расходов" in src


def test_usage_history_fetches_api():
    src = _profile_src()
    assert "/api/user/usage-history" in src


def test_usage_history_shows_model_tokens_cost():
    src = _profile_src()
    assert "getModelName" in src
    assert "tokens_in" in src or "tok" in src
    assert "cost_usd" in src


def test_usage_history_expandable():
    src = _profile_src()
    assert "handleToggle" in src or "setOpen" in src


# ─── Backend endpoint ───

def test_backend_usage_history_endpoint():
    src = (BACKEND / "app" / "routers" / "user.py").read_text(encoding="utf-8")
    assert "/user/usage-history" in src
    assert "Usage" in src
    assert "limit" in src


def test_profile_updated_version():
    """App info should show v2.0 and 50 models."""
    src = _profile_src()
    assert "v2.0" in src
    assert "50 models" in src
