"""Tests for Этап 6 — ChatScreen with balance in header, stats card, billing parsing.

Verifies:
1. Balance in header (small text, clickable)
2. NO per-message cost display (removed)
3. Balance stats card on click: last request, session total, top-up button
4. Low balance warning when < $0.50
5. Ad banner hidden when balance > 0
6. useChat parses billing SSE chunk, updates balanceUsd + sessionCostUsd
7. ProfileScreen has usage history
8. Backend has /api/user/usage-history
"""

from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
FRONTEND = ROOT / "frontend" / "src"
BACKEND = Path(__file__).parent.parent


def _chat_src():
    return (FRONTEND / "components" / "ChatScreen" / "ChatScreen.tsx").read_text(encoding="utf-8")


# ─── Balance in header ───

def test_balance_in_header():
    src = _chat_src()
    assert "balanceUsd.toFixed" in src


def test_balance_clickable():
    """Clicking balance opens stats card."""
    src = _chat_src()
    assert "showBalanceCard" in src
    assert "setShowBalanceCard" in src


# ─── No per-message cost ───

def test_no_per_message_cost():
    """Should NOT show cost after every assistant message."""
    src = _chat_src()
    # The old pattern was a div with lastRequestCost shown inline after each message
    assert "isLastAssistant && user.lastRequestCost" not in src


# ─── Balance stats card ───

def test_stats_card_shows_last_request():
    src = _chat_src()
    assert "Последний запрос" in src
    assert "lastRequestCost" in src
    assert "lastRequestTokens" in src


def test_stats_card_shows_session_total():
    src = _chat_src()
    assert "За сессию" in src
    assert "sessionCostUsd" in src


def test_stats_card_has_topup_button():
    src = _chat_src()
    assert "Пополнить баланс" in src
    assert "setScreen('plans')" in src or "'plans'" in src


# ─── Low balance warning ───

def test_low_balance_warning():
    src = _chat_src()
    assert "LOW_BALANCE_THRESHOLD" in src or "0.50" in src
    assert "lowBalance" in src


def test_low_balance_threshold_is_050():
    src = _chat_src()
    assert "0.50" in src or "0.5" in src


# ─── Ad banner ───

def test_ad_banner_hidden_when_balance_positive():
    src = _chat_src()
    assert "showAd" in src
    assert "balanceUsd <= 0" in src


# ─── useChat billing ───

def _chat_hook_src():
    return (FRONTEND / "hooks" / "useChat.ts").read_text(encoding="utf-8")


def test_use_chat_updates_session_cost():
    src = _chat_hook_src()
    assert "sessionCostUsd" in src


def test_use_chat_updates_last_tokens():
    src = _chat_hook_src()
    assert "lastRequestTokens" in src


def test_use_chat_updates_balance():
    src = _chat_hook_src()
    assert "balanceUsd: billing.balance_usd" in src


# ─── Store: new fields ───

def test_store_has_session_cost():
    src = (FRONTEND / "store" / "useStore.ts").read_text(encoding="utf-8")
    assert "sessionCostUsd: number" in src
    assert "lastRequestTokens: number | null" in src


# ─── ProfileScreen usage history ───

def test_profile_has_usage_history():
    src = (FRONTEND / "components" / "ProfileScreen" / "ProfileScreen.tsx").read_text(encoding="utf-8")
    assert "UsageHistory" in src
    assert "История расходов" in src


def test_profile_usage_fetches_api():
    src = (FRONTEND / "components" / "ProfileScreen" / "ProfileScreen.tsx").read_text(encoding="utf-8")
    assert "/api/user/usage-history" in src


# ─── Backend endpoint ───

def test_backend_usage_history_endpoint():
    src = (BACKEND / "app" / "routers" / "user.py").read_text(encoding="utf-8")
    assert "/user/usage-history" in src


# ─── client.ts billing ───

def test_client_has_billing_interface():
    src = (FRONTEND / "api" / "client.ts").read_text(encoding="utf-8")
    assert "export interface BillingInfo" in src
    assert "onBilling" in src
