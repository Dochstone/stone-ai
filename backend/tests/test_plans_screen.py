"""Tests for Этап 4 — PlansScreen with USD balance and per-token pricing.

Verifies:
- UserState uses balanceUsd/modelPrices (not credits/creditCosts)
- PlansScreen shows $ balance, not credits
- usePayment sends usd_amount directly (no credits conversion)
- useUser maps backend balance_usd/model_prices correctly
- No credits references remain in frontend
- Calculator and model price list present
"""

from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
FRONTEND = ROOT / "frontend" / "src"


# ─── useStore: UserState interface ───

def test_user_state_has_balance_usd():
    src = (FRONTEND / "store" / "useStore.ts").read_text(encoding="utf-8")
    assert "balanceUsd: number" in src
    assert "modelPrices: Record<string, ModelPrice>" in src
    assert "lastRequestCost: number | null" in src
    assert "totalTokens: number" in src


def test_user_state_no_credits():
    """UserState should not have credits or creditCosts fields."""
    src = (FRONTEND / "store" / "useStore.ts").read_text(encoding="utf-8")
    # Find the UserState interface
    start = src.index("export interface UserState")
    end = src.index("}", start) + 1
    interface_block = src[start:end]
    assert "credits:" not in interface_block
    assert "creditCosts:" not in interface_block


def test_model_price_interface():
    src = (FRONTEND / "store" / "useStore.ts").read_text(encoding="utf-8")
    assert "export interface ModelPrice" in src
    assert "input: number" in src
    assert "output: number" in src
    assert "weighted: number" in src


def test_default_plan_per_token():
    src = (FRONTEND / "store" / "useStore.ts").read_text(encoding="utf-8")
    assert "plan: 'per_token'" in src


def test_default_lite_limit_10():
    src = (FRONTEND / "store" / "useStore.ts").read_text(encoding="utf-8")
    assert "liteLimitDay: 10" in src


# ─── useUser: mapping backend → store ───

def test_user_maps_balance_usd():
    src = (FRONTEND / "hooks" / "useUser.ts").read_text(encoding="utf-8")
    assert "balanceUsd: userData.balance_usd" in src
    assert "modelPrices" in src


def test_user_maps_model_prices():
    src = (FRONTEND / "hooks" / "useUser.ts").read_text(encoding="utf-8")
    assert "input_per_m" in src
    assert "output_per_m" in src
    assert "weighted_per_m" in src


def test_user_fallback_no_credits():
    src = (FRONTEND / "hooks" / "useUser.ts").read_text(encoding="utf-8")
    error_idx = src.index("Failed to init user")
    fallback = src[error_idx:error_idx + 500]
    assert "balanceUsd:" in fallback
    assert "credits:" not in fallback


# ─── usePayment: USD direct top-up ───

def test_payment_sends_usd_amount():
    src = (FRONTEND / "hooks" / "usePayment.ts").read_text(encoding="utf-8")
    assert "usd_amount" in src
    assert "buyWithStars" in src


def test_payment_no_credits_conversion():
    """usePayment should not convert USD to credits."""
    src = (FRONTEND / "hooks" / "usePayment.ts").read_text(encoding="utf-8")
    assert "CREDIT_PRICE" not in src
    assert "creditsToReceive" not in src
    assert "credits_for_usd" not in src


# ─── PlansScreen ───

def test_plans_screen_shows_dollar_balance():
    src = (FRONTEND / "components" / "PlansScreen" / "PlansScreen.tsx").read_text(encoding="utf-8")
    assert "balanceUsd" in src
    assert "ТВОЙ БАЛАНС" in src
    assert "$.toFixed" in src or "balanceUsd.toFixed" in src


def test_plans_screen_no_credits():
    src = (FRONTEND / "components" / "PlansScreen" / "PlansScreen.tsx").read_text(encoding="utf-8")
    assert "CREDIT_PRICE_STANDARD" not in src
    assert "CREDIT_PRICE_VIP" not in src
    assert "creditsToReceive" not in src
    assert "VIP_THRESHOLD" not in src


def test_plans_screen_has_model_prices():
    """Should show model prices in $/M tokens."""
    src = (FRONTEND / "components" / "PlansScreen" / "PlansScreen.tsx").read_text(encoding="utf-8")
    assert "СТОИМОСТЬ МОДЕЛЕЙ" in src or "$/1M" in src
    assert "price_weighted" in src or "modelPrices" in src


def test_plans_screen_has_calculator():
    src = (FRONTEND / "components" / "PlansScreen" / "PlansScreen.tsx").read_text(encoding="utf-8")
    assert "КАЛЬКУЛЯТОР" in src
    assert "calcModel" in src
    assert "calcRequests" in src
    assert "calcCost" in src


def test_plans_screen_has_filters():
    """Model list should have All/Lite/Premium filters."""
    src = (FRONTEND / "components" / "PlansScreen" / "PlansScreen.tsx").read_text(encoding="utf-8")
    assert "modelFilter" in src
    assert "'all'" in src
    assert "'lite'" in src
    assert "'premium'" in src


def test_plans_screen_faq_per_token():
    """FAQ should mention per-token billing, not credits."""
    src = (FRONTEND / "components" / "PlansScreen" / "PlansScreen.tsx").read_text(encoding="utf-8")
    assert "токен" in src.lower()
    assert "1000 токенов" in src or "токены" in src


def test_plans_quick_amounts():
    """Quick amounts should be $1, $5, $10, $25 (not $5, $10, $25, $50)."""
    src = (FRONTEND / "components" / "PlansScreen" / "PlansScreen.tsx").read_text(encoding="utf-8")
    assert "QUICK_AMOUNTS = [1, 5, 10, 25]" in src


# ─── HomeScreen: no credits ───

def test_home_screen_shows_balance_usd():
    src = (FRONTEND / "components" / "HomeScreen" / "HomeScreen.tsx").read_text(encoding="utf-8")
    assert "balanceUsd" in src
    assert "Баланс" in src


def test_home_screen_no_credits():
    src = (FRONTEND / "components" / "HomeScreen" / "HomeScreen.tsx").read_text(encoding="utf-8")
    assert "user.credits" not in src
    assert "creditCost" not in src
    assert "canAfford" not in src


def test_home_model_card_shows_price():
    """ModelCard should show $/M price, not credit cost."""
    src = (FRONTEND / "components" / "HomeScreen" / "HomeScreen.tsx").read_text(encoding="utf-8")
    assert "priceWeighted" in src
    assert "/M" in src
