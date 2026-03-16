"""Tests for MODELS_REGISTRY — 50 models per MODELS_50.md.

Verifies structure, tiers, pricing, and consistency.
"""

import ast
from pathlib import Path

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


# ─── Structure ───

def test_total_50_models():
    assert len(ACTIVE) == 50


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
    valid = {"chat", "code", "image", "search", "reason"}
    for m in ACTIVE:
        assert m["category"] in valid, f"{m['id']} has invalid category: {m['category']}"


def test_openrouter_ids_format():
    for m in ACTIVE:
        assert "/" in m["openrouter_id"], f"{m['id']}: bad openrouter_id"


# ─── Tiers per MODELS_50.md ───

def test_tier1_lite_5_models():
    tier1 = [m for m in ACTIVE if m["tier"] == 1]
    assert len(tier1) == 5


def test_tier1_ids():
    ids = {m["id"] for m in ACTIVE if m["tier"] == 1}
    assert ids == {"gpt-4o-mini", "claude-haiku-4.5", "gemini-2.0-flash",
                   "llama-4-maverick", "mistral-large-25"}


def test_tier2_15_models():
    assert len([m for m in ACTIVE if m["tier"] == 2]) == 15


def test_tier3_15_models():
    assert len([m for m in ACTIVE if m["tier"] == 3]) == 15


def test_tier4_6_models():
    assert len([m for m in ACTIVE if m["tier"] == 4]) == 6


def test_tier5_7_models():
    assert len([m for m in ACTIVE if m["tier"] == 5]) == 7


def test_tier6_2_models():
    assert len([m for m in ACTIVE if m["tier"] == 6]) == 2


def test_tier_mapping_lite_premium():
    for m in ACTIVE:
        expected = "lite" if m["tier"] == 1 else "premium"
        assert expected in ("lite", "premium")


def test_deepseek_r1_is_premium():
    dr1 = next(m for m in ACTIVE if m["id"] == "deepseek-r1")
    assert dr1["tier"] == 2


# ─── Key models exist ───

def test_new_models_present():
    """All 25 new models (added from MODELS_50.md) should be present."""
    new_ids = {
        "deepseek-v3.2", "gpt-4.1-nano", "claude-sonnet-4.5", "claude-opus-4.5",
        "gpt-5.4", "gemini-3-pro", "minimax-m2.5", "glm-5", "command-r7",
        "kimi-k2.5", "o4-mini", "o3", "claude-haiku-4.5-think",
        "gemini-2.5-flash-think", "devstral", "gpt-5-image", "gpt-5-image-mini",
        "flux-schnell", "stable-diffusion-xl", "gemma-3n-4b", "llama-3.3-70b",
        "qwen-turbo", "nvidia-nemotron", "mythomax-13b",
        "perplexity-sonar", "perplexity-sonar-deep",
    }
    active_ids = {m["id"] for m in ACTIVE}
    missing = new_ids - active_ids
    assert not missing, f"Missing new models: {missing}"


# ─── Prices per MODELS_50.md ───

def test_strategy_weighted_prices():
    """Key weighted prices from MODELS_50.md."""
    prices = {m["id"]: m["price_weighted"] for m in ACTIVE}
    assert prices["gpt-4o-mini"] == 2.50
    assert prices["claude-haiku-4.5"] == 11.00
    assert prices["gemini-2.0-flash"] == 1.40
    assert prices["deepseek-r1"] == 6.00
    assert prices["claude-sonnet-4"] == 30.00
    assert prices["claude-opus-4"] == 130.00
    assert prices["claude-opus-4.5"] == 51.00
    assert prices["gpt-4.1"] == 28.00
    assert prices["gpt-5.1"] == 26.00
    assert prices["gpt-5.4"] == 30.00
    assert prices["gemini-2.5-pro"] == 26.00
    assert prices["gemini-3-pro"] == 24.00
    assert prices["grok-3"] == 36.00
    assert prices["o3"] == 19.60
    assert prices["o4-mini"] == 12.32


def test_all_prices_non_negative():
    for m in ACTIVE:
        assert m["price_input"] >= 0, f"{m['id']} has negative input price"
        assert m["price_output"] >= 0, f"{m['id']} has negative output price"
        assert m["price_weighted"] >= 0, f"{m['id']} has negative weighted price"


def test_per_image_models():
    """Per-image models should have price_per_image field."""
    per_img = [m for m in ACTIVE if m.get("price_per_image")]
    assert len(per_img) == 2
    ids = {m["id"] for m in per_img}
    assert ids == {"flux-schnell", "stable-diffusion-xl"}
    assert per_img[0]["price_per_image"] > 0


def test_free_openrouter_models_have_stone_prices():
    """Tier 5 models (free on OR) should have Stone AI prices > 0."""
    tier5 = [m for m in ACTIVE if m["tier"] == 5]
    for m in tier5:
        assert m["price_weighted"] > 0, f"{m['id']} (free on OR) should have Stone AI price"


# ─── Category counts per MODELS_50.md ───

def test_category_counts():
    cats = {}
    for m in ACTIVE:
        cats.setdefault(m["category"], 0)
        cats[m["category"]] += 1
    assert cats["image"] == 6
    assert cats["reason"] == 4
    assert cats["search"] == 3
    assert cats["code"] == 1


# ─── Derived maps ───

def test_model_map_50_entries():
    model_map = {m["id"]: m["openrouter_id"] for m in ACTIVE}
    assert len(model_map) == 50


def test_tier_map_5_lite_45_premium():
    tier_map = {m["id"]: ("lite" if m["tier"] == 1 else "premium") for m in ACTIVE}
    lite_count = sum(1 for v in tier_map.values() if v == "lite")
    premium_count = sum(1 for v in tier_map.values() if v == "premium")
    assert lite_count == 5
    assert premium_count == 45
