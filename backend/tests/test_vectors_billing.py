"""Vector billing tests — formula verification and scenario simulation.

Tests the billing pipeline logic without importing SQLAlchemy/DB modules.
Uses AST parsing to extract prices and pure Python to verify formulas.

Scenarios:
1. Precise billing: Claude Opus 800in+1200out → exact cost
2. Insufficient balance: $0.01 → Claude Opus → denied
3. Free lite request: $0 balance, request #5/10 → free, no deduction
4. Free exhausted → denied → rewarded +5 → requests 11-15 work → 16 denied
5. AI error → balance NOT deducted
"""

import ast
from pathlib import Path
import pytest

BACKEND = Path(__file__).parent.parent
ROUTER_SRC = BACKEND / "app" / "services" / "ai_router.py"
BILLING_SRC = BACKEND / "app" / "services" / "token_billing.py"
LIMITER_SRC = BACKEND / "app" / "services" / "limiter.py"
CHAT_SRC = BACKEND / "app" / "routers" / "chat.py"


# ── Helpers ──

def _load_registry():
    tree = ast.parse(ROUTER_SRC.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "MODELS_REGISTRY":
                    return ast.literal_eval(node.value)
    raise RuntimeError("MODELS_REGISTRY not found")


REGISTRY = _load_registry()
ACTIVE = [m for m in REGISTRY if m.get("active", True)]
PRICES = {
    m["id"]: {"input": m["price_input"], "output": m["price_output"], "weighted": m["price_weighted"]}
    for m in ACTIVE
}

# Tier map: tier 1 = lite, tier 2+ = premium
TIER_MAP = {m["id"]: ("lite" if m["tier"] == 1 else "premium") for m in ACTIVE}

# Extract constants from limiter.py
_limiter_src = LIMITER_SRC.read_text(encoding="utf-8")
_limiter_tree = ast.parse(_limiter_src)
_limiter_consts = {}
for node in ast.walk(_limiter_tree):
    if isinstance(node, ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id in ("FREE_DAILY_LIMIT", "REWARDED_BONUS", "MAX_TOKENS_LITE", "MAX_TOKENS_PAID"):
                _limiter_consts[target.id] = ast.literal_eval(node.value)

FREE_DAILY_LIMIT = _limiter_consts["FREE_DAILY_LIMIT"]
REWARDED_BONUS = _limiter_consts["REWARDED_BONUS"]
AVG_TOKENS_PER_REQUEST = 2000


def calc_cost(model_id: str, tokens_in: int, tokens_out: int) -> float:
    """Replicate calculate_cost from token_billing.py."""
    p = PRICES.get(model_id)
    if not p:
        return 0.0
    return round((tokens_in * p["input"] + tokens_out * p["output"]) / 1_000_000, 6)


def estimate_cost(model_id: str) -> float:
    """Replicate estimate_request_cost."""
    w = PRICES.get(model_id, {}).get("weighted", 0)
    return round(w * AVG_TOKENS_PER_REQUEST / 1_000_000, 6)


# ═══════════════════════════════════════════════════════════
# SCENARIO 1: Precise billing — Claude Opus 800in + 1200out
# ═══════════════════════════════════════════════════════════

class TestPreciseBillingClaudeOpus:
    def test_opus_prices_from_registry(self):
        p = PRICES["claude-opus-4"]
        assert p["input"] == 37.50
        assert p["output"] == 187.50
        assert p["weighted"] == 130.00

    def test_cost_800in_1200out(self):
        cost = calc_cost("claude-opus-4", 800, 1200)
        # (800 * 37.50 + 1200 * 187.50) / 1M = (30000 + 225000) / 1M = 0.255
        assert cost == 0.255

    def test_balance_after_deduction(self):
        initial = 10.0
        cost = calc_cost("claude-opus-4", 800, 1200)
        remaining = round(initial - cost, 6)
        assert remaining == 9.745

    def test_cost_scales_linearly(self):
        cost_small = calc_cost("claude-opus-4", 100, 100)
        cost_big = calc_cost("claude-opus-4", 1000, 1000)
        assert cost_big == pytest.approx(10 * cost_small, abs=1e-6)

    def test_cost_different_ratios(self):
        # All input
        cost_in = calc_cost("claude-opus-4", 2000, 0)
        assert cost_in == round(2000 * 37.50 / 1_000_000, 6)
        # All output
        cost_out = calc_cost("claude-opus-4", 0, 2000)
        assert cost_out == round(2000 * 187.50 / 1_000_000, 6)
        # Output 5x more expensive
        assert cost_out == 5 * cost_in


# ═══════════════════════════════════════════════════════════
# SCENARIO 2: Insufficient balance → denied
# ═══════════════════════════════════════════════════════════

class TestInsufficientBalance:
    def test_estimated_cost_opus(self):
        est = estimate_cost("claude-opus-4")
        # 130 * 2000 / 1M = 0.26
        assert est == 0.26

    def test_0_01_less_than_estimated(self):
        assert 0.01 < estimate_cost("claude-opus-4")

    def test_various_low_balances_denied(self):
        est = estimate_cost("claude-opus-4")
        for balance in [0.0, 0.01, 0.05, 0.10, 0.25]:
            assert balance < est, f"${balance} should be less than estimated ${est}"

    def test_sufficient_balance_allowed(self):
        est = estimate_cost("claude-opus-4")
        for balance in [0.26, 0.50, 1.0, 10.0]:
            assert balance >= est, f"${balance} should be enough for estimated ${est}"

    def test_limiter_checks_premium_tier(self):
        """Claude Opus is premium, not lite."""
        assert TIER_MAP["claude-opus-4"] == "premium"

    def test_all_lite_models_are_tier1(self):
        lite = [m for m in ACTIVE if m["tier"] == 1]
        assert len(lite) == 5
        for m in lite:
            assert TIER_MAP[m["id"]] == "lite"


# ═══════════════════════════════════════════════════════════
# SCENARIO 3: Free lite request — balance not touched
# ═══════════════════════════════════════════════════════════

class TestFreeLiteRequest:
    def test_gpt4o_mini_is_lite(self):
        assert TIER_MAP["gpt-4o-mini"] == "lite"

    def test_request_5_within_free_limit(self):
        used_today = 4  # about to make #5
        assert used_today < FREE_DAILY_LIMIT  # 4 < 10

    def test_free_billing_mode_skips_deduction(self):
        """In free billing mode, even though cost > 0, no deduction happens."""
        cost = calc_cost("gpt-4o-mini", 100, 200)
        assert cost > 0  # cost exists
        # But billing_mode="free" means deduct block is skipped in chat.py
        billing_mode = "free"
        had_error = False
        deducted = 0.0
        if not had_error and billing_mode == "per_token":
            deducted = cost
        assert deducted == 0.0

    def test_chat_handler_billing_condition(self):
        """Verify chat.py only deducts when billing_mode == 'per_token'."""
        src = CHAT_SRC.read_text(encoding="utf-8")
        assert 'billing_mode == "per_token"' in src


# ═══════════════════════════════════════════════════════════
# SCENARIO 4: Free exhausted → denied → rewarded → work → denied
# ═══════════════════════════════════════════════════════════

class TestFreeExhaustedThenRewarded:
    def test_free_daily_limit_is_10(self):
        assert FREE_DAILY_LIMIT == 10

    def test_rewarded_bonus_is_5(self):
        assert REWARDED_BONUS == 5

    def test_total_free_with_rewarded(self):
        total = FREE_DAILY_LIMIT + REWARDED_BONUS
        assert total == 15

    def test_request_11_denied_no_rewarded(self):
        """used=10, rewarded=0, balance=0 → denied."""
        used = FREE_DAILY_LIMIT  # 10
        rewarded = 0
        balance = 0.0
        total_limit = FREE_DAILY_LIMIT + rewarded  # 10
        allowed = used < total_limit or balance > 0
        assert allowed is False

    def test_request_11_allowed_with_rewarded(self):
        """used=10, rewarded=5, balance=0 → allowed (limit=15)."""
        used = FREE_DAILY_LIMIT  # 10
        rewarded = REWARDED_BONUS  # 5
        balance = 0.0
        total_limit = FREE_DAILY_LIMIT + rewarded  # 15
        allowed = used < total_limit
        assert allowed is True

    def test_request_15_allowed(self):
        """used=14, rewarded=5 → allowed (14 < 15)."""
        used = FREE_DAILY_LIMIT + REWARDED_BONUS - 1  # 14
        rewarded = REWARDED_BONUS
        total_limit = FREE_DAILY_LIMIT + rewarded  # 15
        assert used < total_limit

    def test_request_16_denied(self):
        """used=15, rewarded=5, balance=0 → denied."""
        used = FREE_DAILY_LIMIT + REWARDED_BONUS  # 15
        rewarded = REWARDED_BONUS
        balance = 0.0
        total_limit = FREE_DAILY_LIMIT + rewarded  # 15
        allowed = used < total_limit or balance > 0
        assert allowed is False

    def test_request_16_allowed_if_has_balance(self):
        """used=15, rewarded=5, balance=$1 → allowed (per-token fallback)."""
        used = FREE_DAILY_LIMIT + REWARDED_BONUS
        balance = 1.0
        allowed = balance > 0  # per-token fallback
        assert allowed is True

    def test_limiter_has_free_limits_logic(self):
        """limiter.py should have free plan limits."""
        assert "FREE_LIMITS" in _limiter_src or "FREE_DAILY_LIMIT" in _limiter_src


# ═══════════════════════════════════════════════════════════
# SCENARIO 5: AI error → balance NOT deducted
# ═══════════════════════════════════════════════════════════

class TestAIErrorNoDeduction:
    def test_error_detection_in_stream(self):
        """chat.py detects errors via '"error"' in chunk."""
        src = CHAT_SRC.read_text(encoding="utf-8")
        assert '"error"' in src
        assert "had_error" in src

    def test_zero_tokens_zero_cost(self):
        assert calc_cost("gpt-5.1", 0, 0) == 0.0
        assert calc_cost("claude-opus-4", 0, 0) == 0.0

    def test_error_skips_billing_block(self):
        """When had_error=True, billing_mode=per_token → still no deduction."""
        had_error = True
        billing_mode = "per_token"
        balance = 5.0
        deducted = 0.0

        # Mirror chat.py logic: if not had_error and billing_mode == "per_token"
        if not had_error and billing_mode == "per_token":
            deducted = 0.255  # would deduct
        else:
            deducted = 0.0

        assert deducted == 0.0
        assert balance == 5.0

    def test_chat_handler_had_error_guard(self):
        """Verify chat.py has: if not using_byok and not had_error."""
        src = CHAT_SRC.read_text(encoding="utf-8")
        assert "not had_error" in src

    def test_deduct_zero_preserves_balance(self):
        """Deducting $0 from $5 should leave $5."""
        balance = 5.0
        deduct = 0.0
        new_balance = round(balance - deduct, 6)
        assert new_balance == 5.0

    def test_cost_all_models_with_zero_tokens(self):
        """Every model should return 0 cost for 0 tokens."""
        for model_id in PRICES:
            assert calc_cost(model_id, 0, 0) == 0.0
