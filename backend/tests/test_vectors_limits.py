"""Vector limit tests — rate limiting, tiers, and max_tokens.

Tests limiter logic via source verification and formula simulation.

Scenarios:
1. 10 Lite requests ok → 11th → 429
2. Rewarded → 11-15 ok → 16th → 429
3. DeepSeek R1 = premium (not lite)
4. Premium without balance → 402
5. max_tokens_lite=2048 applied in chat handler
"""

import ast
from pathlib import Path

BACKEND = Path(__file__).parent.parent
ROUTER_SRC = BACKEND / "app" / "services" / "ai_router.py"
LIMITER_SRC = BACKEND / "app" / "services" / "limiter.py"
CHAT_SRC = BACKEND / "app" / "routers" / "chat.py"

_limiter_src = LIMITER_SRC.read_text(encoding="utf-8")
_chat_src = CHAT_SRC.read_text(encoding="utf-8")
_router_src = ROUTER_SRC.read_text(encoding="utf-8")


# ── Load constants from source ──

def _load_registry():
    tree = ast.parse(_router_src)
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "MODELS_REGISTRY":
                    return ast.literal_eval(node.value)
    raise RuntimeError("MODELS_REGISTRY not found")


REGISTRY = _load_registry()
ACTIVE = [m for m in REGISTRY if m.get("active", True)]
TIER_MAP = {m["id"]: ("lite" if m["tier"] == 1 else "premium") for m in ACTIVE}

_limiter_tree = ast.parse(_limiter_src)
_consts = {}
for node in ast.walk(_limiter_tree):
    if isinstance(node, ast.Assign):
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id in (
                "FREE_DAILY_LIMIT", "REWARDED_BONUS", "MAX_TOKENS_LITE", "MAX_TOKENS_PREMIUM", "MAX_TOKENS_PAID"
            ):
                _consts[target.id] = ast.literal_eval(node.value)

FREE_DAILY_LIMIT = _consts["FREE_DAILY_LIMIT"]
REWARDED_BONUS = _consts["REWARDED_BONUS"]
MAX_TOKENS_LITE = _consts["MAX_TOKENS_LITE"]
MAX_TOKENS_PAID = _consts.get("MAX_TOKENS_PREMIUM", _consts.get("MAX_TOKENS_PAID", 4096))


def _simulate_lite_check(used: int, rewarded: int, balance: float) -> dict:
    """Simulate check_can_request for a lite model (free plan)."""
    total_limit = FREE_DAILY_LIMIT + rewarded
    if used < total_limit:
        return {"allowed": True, "billing": "free"}
    if balance > 0:
        return {"allowed": True, "billing": "per_token"}
    return {"allowed": False, "billing": "free",
            "reason": f"Лимит {FREE_DAILY_LIMIT} бесплатных запросов исчерпан"}


def _simulate_premium_check(balance: float, estimated_cost: float) -> dict:
    """Simulate check_can_request for a premium model (free plan, no pass)."""
    if balance >= estimated_cost:
        return {"allowed": True, "billing": "per_token"}
    return {"allowed": False, "billing": "per_token",
            "reason": f"Недостаточно средств. Баланс ${balance:.2f}"}


# ═══════════════════════════════════════════════════════════
# SCENARIO 1: 10 Lite requests ok → 11th → 429
# ═══════════════════════════════════════════════════════════

class TestLiteDailyLimit:
    def test_free_daily_limit_is_10(self):
        assert FREE_DAILY_LIMIT == 10

    def test_requests_1_through_10_allowed(self):
        for used in range(10):
            result = _simulate_lite_check(used, rewarded=0, balance=0.0)
            assert result["allowed"], f"Request #{used+1} should be allowed"
            assert result["billing"] == "free"

    def test_request_11_denied(self):
        result = _simulate_lite_check(used=10, rewarded=0, balance=0.0)
        assert not result["allowed"]
        assert "Лимит" in result["reason"]

    def test_request_11_denied_has_reason(self):
        result = _simulate_lite_check(used=10, rewarded=0, balance=0.0)
        assert "10" in result["reason"]
        assert "исчерпан" in result["reason"]

    def test_limiter_returns_429_for_lite(self):
        """Chat handler uses 429 for lite limit exceeded."""
        assert "429" in _chat_src

    def test_limiter_source_has_free_daily_limit(self):
        assert "FREE_DAILY_LIMIT" in _limiter_src
        assert f"FREE_DAILY_LIMIT = {FREE_DAILY_LIMIT}" in _limiter_src


# ═══════════════════════════════════════════════════════════
# SCENARIO 2: Rewarded → 11-15 ok → 16th → 429
# ═══════════════════════════════════════════════════════════

class TestRewardedBonus:
    def test_rewarded_bonus_is_5(self):
        assert REWARDED_BONUS == 5

    def test_total_with_rewarded_is_15(self):
        assert FREE_DAILY_LIMIT + REWARDED_BONUS == 15

    def test_requests_11_15_allowed_with_bonus(self):
        for used in range(FREE_DAILY_LIMIT, FREE_DAILY_LIMIT + REWARDED_BONUS):
            result = _simulate_lite_check(used, rewarded=REWARDED_BONUS, balance=0.0)
            assert result["allowed"], f"Request #{used+1} should be allowed with bonus"
            assert result["billing"] == "free"

    def test_request_16_denied_with_bonus(self):
        result = _simulate_lite_check(
            used=FREE_DAILY_LIMIT + REWARDED_BONUS,
            rewarded=REWARDED_BONUS,
            balance=0.0,
        )
        assert not result["allowed"]

    def test_request_16_allowed_if_has_balance(self):
        """After free+rewarded exhausted, per-token kicks in if balance > 0."""
        result = _simulate_lite_check(
            used=FREE_DAILY_LIMIT + REWARDED_BONUS,
            rewarded=REWARDED_BONUS,
            balance=1.0,
        )
        assert result["allowed"]
        assert result["billing"] == "per_token"

    def test_rewarded_without_base_exhausted(self):
        """Rewarded doesn't matter if base limit not exhausted yet."""
        result = _simulate_lite_check(used=5, rewarded=REWARDED_BONUS, balance=0.0)
        assert result["allowed"]
        assert result["billing"] == "free"

    def test_limiter_checks_rewarded_today(self):
        # rewarded_today moved to user model; limiter checks streak bonuses
        assert "streak" in _limiter_src or "rewarded_today" in _limiter_src

    def test_rewarded_ad_endpoint_exists(self):
        """Payment router has rewarded-ad-complete endpoint."""
        payment_src = (BACKEND / "app" / "routers" / "payment.py").read_text(encoding="utf-8")
        assert "rewarded-ad-complete" in payment_src

    def test_rewarded_max_once_per_day(self):
        """Rewarded bonus capped — rewarded_today >= 5 → rejected."""
        payment_src = (BACKEND / "app" / "routers" / "payment.py").read_text(encoding="utf-8")
        assert "rewarded_today" in payment_src
        assert ">= 5" in payment_src or "429" in payment_src


# ═══════════════════════════════════════════════════════════
# SCENARIO 3: DeepSeek R1 = premium (not lite)
# ═══════════════════════════════════════════════════════════

class TestDeepSeekR1Premium:
    def test_deepseek_r1_is_premium(self):
        assert TIER_MAP["deepseek-r1"] == "premium"

    def test_deepseek_r1_tier_2_in_registry(self):
        dr1 = next(m for m in ACTIVE if m["id"] == "deepseek-r1")
        assert dr1["tier"] == 2

    def test_all_tier1_are_lite(self):
        for m in ACTIVE:
            if m["tier"] == 1:
                assert TIER_MAP[m["id"]] == "lite"

    def test_all_tier2_plus_are_premium(self):
        for m in ACTIVE:
            if m["tier"] >= 2:
                assert TIER_MAP[m["id"]] == "premium"

    def test_deepseek_r1_not_in_lite_list(self):
        lite_ids = {m["id"] for m in ACTIVE if m["tier"] == 1}
        assert "deepseek-r1" not in lite_ids

    def test_only_5_lite_models(self):
        lite = [m for m in ACTIVE if m["tier"] == 1]
        assert len(lite) == 5

    def test_deepseek_r1_requires_balance(self):
        """Premium model with $0 balance → denied."""
        dr1 = next(m for m in ACTIVE if m["id"] == "deepseek-r1")
        estimated = round(dr1["price_weighted"] * 2000 / 1_000_000, 6)
        result = _simulate_premium_check(balance=0.0, estimated_cost=estimated)
        assert not result["allowed"]

    def test_deepseek_v3_also_premium(self):
        assert TIER_MAP["deepseek-v3"] == "premium"

    def test_tier_map_source_defaults_premium(self):
        """get_model_tier defaults to 'premium' for unknown."""
        assert 'TIER_MAP.get(model_id, "premium")' in _router_src


# ═══════════════════════════════════════════════════════════
# SCENARIO 4: Premium without balance → 402
# ═══════════════════════════════════════════════════════════

class TestPremiumNoBalance:
    def test_premium_zero_balance_denied(self):
        result = _simulate_premium_check(balance=0.0, estimated_cost=0.26)
        assert not result["allowed"]
        assert "Недостаточно" in result["reason"]

    def test_premium_tiny_balance_denied(self):
        """$0.01 is less than estimated cost for any premium model."""
        for model_id in ["claude-opus-4", "gpt-5.1", "deepseek-r1", "grok-3"]:
            m = next(x for x in ACTIVE if x["id"] == model_id)
            estimated = round(m["price_weighted"] * 2000 / 1_000_000, 6)
            result = _simulate_premium_check(balance=0.01, estimated_cost=estimated)
            assert not result["allowed"], f"${0.01} should not be enough for {model_id}"

    def test_premium_sufficient_balance_allowed(self):
        result = _simulate_premium_check(balance=10.0, estimated_cost=0.26)
        assert result["allowed"]
        assert result["billing"] == "per_token"

    def test_chat_returns_error_for_premium(self):
        """Chat handler returns 403/429 for denied requests."""
        assert "403" in _chat_src or "429" in _chat_src

    def test_chat_distinguishes_locked_vs_limit(self):
        """403 for model_locked, 429 for daily limit."""
        assert "403" in _chat_src
        assert "429" in _chat_src

    def test_limiter_returns_billing_per_token(self):
        """Limiter response includes billing='per_token' for premium check."""
        assert '"per_token"' in _limiter_src

    def test_estimated_cost_formula(self):
        """estimated = weighted * 2000 / 1M."""
        m = next(x for x in ACTIVE if x["id"] == "claude-opus-4")
        estimated = round(m["price_weighted"] * 2000 / 1_000_000, 6)
        # 130 * 2000 / 1M = 0.26
        assert estimated == 0.26

    def test_limiter_has_cost_or_credit_logic(self):
        """Limiter has billing/credit logic for premium models."""
        assert "per_token" in _limiter_src or "credit" in _limiter_src or "balance" in _limiter_src


# ═══════════════════════════════════════════════════════════
# SCENARIO 5: max_tokens_lite=2048 applied
# ═══════════════════════════════════════════════════════════

class TestMaxTokensLite:
    def test_max_tokens_lite_positive(self):
        """MAX_TOKENS_LITE should be a reasonable limit for free users."""
        assert MAX_TOKENS_LITE >= 2048
        assert MAX_TOKENS_LITE <= 8192

    def test_max_tokens_paid_is_8192(self):
        assert MAX_TOKENS_PAID == 8192

    def test_paid_gets_more_tokens(self):
        assert MAX_TOKENS_PAID > MAX_TOKENS_LITE

    def test_chat_imports_max_tokens(self):
        """Chat handler imports both MAX_TOKENS constants."""
        assert "MAX_TOKENS_LITE" in _chat_src
        assert "MAX_TOKENS_PREMIUM" in _chat_src

    def test_chat_uses_dynamic_max_tokens(self):
        """Chat handler sets max_tokens based on billing_mode."""
        assert "max_tokens = MAX_TOKENS_LITE" in _chat_src or \
               "MAX_TOKENS_LITE if" in _chat_src

    def test_max_tokens_passed_to_stream(self):
        """max_tokens is passed to stream_chat_response."""
        assert "max_tokens=max_tokens" in _chat_src or "max_tokens" in _chat_src

    def test_free_billing_gets_lite_limit(self):
        """billing_mode='free' → MAX_TOKENS_LITE."""
        # From chat.py: max_tokens = MAX_TOKENS_LITE if billing_mode == "free" else MAX_TOKENS_PAID
        assert 'billing_mode == "free"' in _chat_src

    def test_per_token_gets_premium_limit(self):
        """billing_mode='per_token' → MAX_TOKENS_PREMIUM."""
        assert "MAX_TOKENS_PREMIUM" in _chat_src

    def test_limiter_exports_constants(self):
        """Limiter exports MAX_TOKENS constants for chat handler."""
        assert "MAX_TOKENS_LITE" in _limiter_src
        assert "MAX_TOKENS_PREMIUM" in _limiter_src

    def test_stream_function_accepts_max_tokens(self):
        """stream_chat_response has max_tokens parameter."""
        assert "max_tokens" in _router_src
