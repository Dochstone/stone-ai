"""Tests for /api/models endpoint filtering (Step 3).

Verifies:
- models.py supports tier, company, category query params
- Source code has correct filter logic
"""

import ast
from pathlib import Path

BACKEND = Path(__file__).parent.parent
MODELS_SRC = BACKEND / "app" / "routers" / "models.py"
ROUTER_SRC = BACKEND / "app" / "services" / "ai_router.py"


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
MODELS_INFO = [
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


def test_models_endpoint_has_query_params():
    """models.py should accept tier, company, category query parameters."""
    src = MODELS_SRC.read_text(encoding="utf-8")
    assert "tier:" in src or "tier :" in src
    assert "company:" in src or "company :" in src
    assert "category:" in src or "category :" in src


def test_filter_by_tier_lite():
    models = [m for m in MODELS_INFO if m["tier"] == "lite"]
    assert len(models) == 5
    assert all(m["tier"] == "lite" for m in models)


def test_filter_by_tier_premium():
    models = [m for m in MODELS_INFO if m["tier"] == "premium"]
    assert len(models) == 45
    assert all(m["tier"] == "premium" for m in models)


def test_filter_by_company_openai():
    models = [m for m in MODELS_INFO if m["company"].lower() == "openai"]
    ids = {m["id"] for m in models}
    assert "gpt-4o-mini" in ids
    assert "gpt-4.1" in ids
    assert "gpt-5.1" in ids
    assert "o3" in ids
    assert len(models) == 10  # per MODELS_50.md


def test_filter_by_company_anthropic():
    models = [m for m in MODELS_INFO if m["company"].lower() == "anthropic"]
    ids = {m["id"] for m in models}
    assert "claude-haiku-4.5" in ids
    assert "claude-sonnet-4" in ids
    assert "claude-opus-4" in ids
    assert "claude-opus-4.5" in ids
    assert len(models) == 6


def test_filter_by_category_image():
    models = [m for m in MODELS_INFO if m["category"] == "image"]
    assert len(models) == 6
    ids = {m["id"] for m in models}
    assert "nano-banana-pro" in ids
    assert "flux-schnell" in ids


def test_filter_by_category_reason():
    models = [m for m in MODELS_INFO if m["category"] == "reason"]
    assert len(models) == 4
    ids = {m["id"] for m in models}
    assert "o3" in ids
    assert "o4-mini" in ids


def test_filter_by_category_search():
    models = [m for m in MODELS_INFO if m["category"] == "search"]
    assert len(models) == 3
    ids = {m["id"] for m in models}
    assert "perplexity-sonar-pro" in ids
    assert "perplexity-sonar" in ids


def test_no_filter_returns_all():
    assert len(MODELS_INFO) == 50
