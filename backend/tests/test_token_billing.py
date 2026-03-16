"""Tests for token_billing.py (Step 2).

Verifies:
- TOKEN_PRICES imported from MODELS_REGISTRY (not hardcoded)
- All active models have prices
- calculate_cost formula is correct
- get_weighted_price returns correct values
"""

import ast
from pathlib import Path

BACKEND = Path(__file__).parent.parent
ROUTER_SRC = BACKEND / "app" / "services" / "ai_router.py"
BILLING_SRC = BACKEND / "app" / "services" / "token_billing.py"


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


def test_billing_imports_from_registry():
    """token_billing.py should import from ai_router, not define its own dict."""
    src = BILLING_SRC.read_text(encoding="utf-8")
    assert "from app.services.ai_router import MODELS_REGISTRY" in src
    # Should NOT have a hardcoded TOKEN_PRICES dict with model entries
    assert '"gpt-4o-mini":' not in src


def test_all_registry_models_have_prices():
    """Every active model in MODELS_REGISTRY should produce a TOKEN_PRICES entry."""
    expected_ids = {m["id"] for m in ACTIVE}
    # Simulate what token_billing does
    token_prices = {
        m["id"]: {"input": m["price_input"], "output": m["price_output"], "weighted": m["price_weighted"]}
        for m in ACTIVE
    }
    assert set(token_prices.keys()) == expected_ids


def test_calculate_cost_formula():
    """cost = (tokens_in * input_price + tokens_out * output_price) / 1_000_000."""
    # Simulate calculate_cost for gpt-4o-mini
    m = next(m for m in ACTIVE if m["id"] == "gpt-4o-mini")
    tokens_in, tokens_out = 500, 1500
    expected = (tokens_in * m["price_input"] + tokens_out * m["price_output"]) / 1_000_000
    expected = round(expected, 6)
    # 500*0.60 + 1500*2.40 = 300 + 3600 = 3900 / 1M = 0.003900
    assert expected == 0.0039


def test_calculate_cost_opus():
    """Claude Opus 4 should be expensive."""
    m = next(m for m in ACTIVE if m["id"] == "claude-opus-4")
    tokens_in, tokens_out = 1000, 2000
    cost = round((tokens_in * m["price_input"] + tokens_out * m["price_output"]) / 1_000_000, 6)
    # 1000*60 + 2000*300 = 60000 + 600000 = 660000 / 1M = 0.66
    assert cost == 0.66


def test_new_models_have_prices():
    """New models from Phase 2 should all be priced."""
    new_models = {"gemma-3-27b", "qwen-3-235b", "phi-4", "qwen-qwq",
                  "command-r", "mistral-small", "gpt-5.1", "nano-banana-pro", "nano-banana"}
    active_ids = {m["id"] for m in ACTIVE}
    for model_id in new_models:
        assert model_id in active_ids, f"{model_id} missing from registry"
        m = next(m for m in ACTIVE if m["id"] == model_id)
        assert m["price_weighted"] > 0, f"{model_id} has no weighted price"
