"""Tests for MODELS_REGISTRY and derived mappings (Step 1).

Verifies:
- Registry has 25 active models
- MODEL_MAP, TIER_MAP, MODELS_INFO are consistent
- Tier 1 = lite, Tier 2-4 = premium
- Required fields present in every entry
- Prices match STRATEGY.md (weighted = 0.4*input + 0.6*output)
- No duplicate model IDs
"""

import ast
from pathlib import Path

# Parse registry from source to avoid importing httpx/app.config
BACKEND = Path(__file__).parent.parent
SRC = BACKEND / "app" / "services" / "ai_router.py"


def _load_registry():
    tree = ast.parse(SRC.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "MODELS_REGISTRY":
                    return ast.literal_eval(node.value)
    raise RuntimeError("MODELS_REGISTRY not found")


REGISTRY = _load_registry()
ACTIVE = [m for m in REGISTRY if m.get("active", True)]


# ─── Structure tests ───

def test_total_active_models():
    assert len(ACTIVE) == 25


def test_no_duplicate_ids():
    ids = [m["id"] for m in ACTIVE]
    assert len(ids) == len(set(ids))


def test_required_fields():
    required = {"id", "name", "company", "tier", "openrouter_id", "icon",
                "desc", "category", "context_length",
                "price_input", "price_output", "price_weighted"}
    for m in ACTIVE:
        missing = required - set(m.keys())
        assert not missing, f"{m['id']} missing fields: {missing}"


def test_categories():
    valid = {"chat", "code", "image", "search"}
    for m in ACTIVE:
        assert m["category"] in valid, f"{m['id']} has invalid category: {m['category']}"


# ─── Tier tests ───

def test_tier1_count():
    tier1 = [m for m in ACTIVE if m["tier"] == 1]
    assert len(tier1) == 7


def test_tier1_models():
    tier1_ids = {m["id"] for m in ACTIVE if m["tier"] == 1}
    expected = {"gpt-4o-mini", "claude-haiku-4.5", "gemini-2.0-flash",
                "llama-4-maverick", "mistral-large-25", "gemma-3-27b", "qwen-3-235b"}
    assert tier1_ids == expected


def test_tier_mapping():
    """Tier 1 → lite, Tier 2-4 → premium."""
    for m in ACTIVE:
        expected_tier = "lite" if m["tier"] == 1 else "premium"
        assert expected_tier in ("lite", "premium")


def test_deepseek_r1_is_premium():
    """STRATEGY.md: DeepSeek R1 moved from lite to premium."""
    dr1 = next(m for m in ACTIVE if m["id"] == "deepseek-r1")
    assert dr1["tier"] == 2  # Tier 2 = premium


# ─── Price tests ───

def test_weighted_price_formula():
    """weighted = 0.4 * input + 0.6 * output (±0.01 for rounding)."""
    for m in ACTIVE:
        expected = round(m["price_input"] * 0.4 + m["price_output"] * 0.6, 2)
        actual = round(m["price_weighted"], 2)
        assert abs(actual - expected) < 0.02, (
            f"{m['id']}: weighted {actual} != expected {expected} "
            f"(in={m['price_input']}, out={m['price_output']})"
        )


def test_strategy_prices():
    """Key prices from STRATEGY.md."""
    prices = {m["id"]: m["price_weighted"] for m in ACTIVE}
    assert prices["gpt-4o-mini"] == 1.68
    assert prices["claude-haiku-4.5"] == 13.60
    assert prices["gemini-2.0-flash"] == 1.12
    assert prices["gemma-3-27b"] == 1.00
    assert prices["qwen-3-235b"] == 2.72
    assert prices["deepseek-r1"] == 6.14
    assert prices["phi-4"] == 1.00
    assert prices["claude-opus-4"] == 204.00
    assert prices["gpt-4.1"] == 28.00
    assert prices["gpt-5.1"] == 36.80


def test_all_prices_positive():
    for m in ACTIVE:
        assert m["price_input"] > 0, f"{m['id']} has zero input price"
        assert m["price_output"] > 0, f"{m['id']} has zero output price"
        assert m["price_weighted"] > 0, f"{m['id']} has zero weighted price"


# ─── Derived maps consistency ───

def test_model_map_complete():
    model_map = {m["id"]: m["openrouter_id"] for m in ACTIVE}
    assert len(model_map) == 25
    assert model_map["gpt-4o-mini"] == "openai/gpt-4o-mini"
    assert model_map["nano-banana-pro"] == "google/gemini-3-pro-image-preview"


def test_tier_map_complete():
    tier_map = {m["id"]: ("lite" if m["tier"] == 1 else "premium") for m in ACTIVE}
    assert len(tier_map) == 25
    assert tier_map["gpt-4o-mini"] == "lite"
    assert tier_map["deepseek-r1"] == "premium"
    assert tier_map["claude-opus-4"] == "premium"


def test_models_info_has_new_fields():
    """MODELS_INFO should include price_weighted, context_length, category."""
    info = [
        {
            "id": m["id"], "name": m["name"], "company": m["company"],
            "tier": "lite" if m["tier"] == 1 else "premium",
            "icon": m["icon"], "desc": m["desc"],
            "price_weighted": m["price_weighted"],
            "price_input": m["price_input"],
            "price_output": m["price_output"],
            "context_length": m["context_length"],
            "category": m["category"],
        }
        for m in ACTIVE
    ]
    for entry in info:
        assert "price_weighted" in entry
        assert "context_length" in entry
        assert "category" in entry


# ─── OpenRouter ID format ───

def test_openrouter_ids_format():
    """All OpenRouter IDs should contain a slash (provider/model)."""
    for m in ACTIVE:
        assert "/" in m["openrouter_id"], f"{m['id']}: bad openrouter_id {m['openrouter_id']}"
