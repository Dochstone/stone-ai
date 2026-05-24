"""Regression tests for Start-tier model access.

These rules keep marketing, API labels, and runtime gating aligned:
- GPT-5.1 is a Start model and costs one premium unit.
- Start has enough daily premium units for normal GPT-5.1 usage.
- Expensive image models are not marked as Start when their weights exceed
  the Start image quota.
"""

import ast
from pathlib import Path


BACKEND = Path(__file__).parent.parent
SUBSCRIPTION_SRC = BACKEND / "app" / "services" / "subscription.py"
DAILY_LIMITS_SRC = BACKEND / "app" / "services" / "daily_limits.py"
AI_ROUTER_SRC = BACKEND / "app" / "services" / "ai_router.py"


def _assignments(path: Path) -> dict[str, ast.AST]:
    tree = ast.parse(path.read_text(encoding="utf-8"))
    out: dict[str, ast.AST] = {}
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name):
                    out[target.id] = node.value
        elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name):
            out[node.target.id] = node.value
    return out


def _const(node: ast.AST, env: dict[str, object]) -> object:
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.Set):
        return {_const(item, env) for item in node.elts}
    if isinstance(node, ast.Dict):
        return {_const(k, env): _const(v, env) for k, v in zip(node.keys, node.values)}
    if isinstance(node, ast.BinOp) and isinstance(node.op, ast.BitOr):
        return _const(node.left, env) | _const(node.right, env)
    if isinstance(node, ast.Name):
        return env[node.id]
    raise TypeError(f"Unsupported constant expression: {ast.dump(node)[:120]}")


def _load_start_models() -> set[str]:
    assigns = _assignments(SUBSCRIPTION_SRC)
    env: dict[str, object] = {}
    for name in ("FREE_MODELS", "BUDGET_VIDEO_MODELS", "MINI_MODELS"):
        env[name] = _const(assigns[name], env)
    return env["MINI_MODELS"]


def test_start_premium_limit_is_five_daily_units():
    limits = _const(_assignments(DAILY_LIMITS_SRC)["DAILY_LIMITS"], {})
    assert limits["mini"]["premium"] == 5


def test_gpt51_is_start_model_with_unit_weight():
    start_models = _load_start_models()
    weights = _const(_assignments(DAILY_LIMITS_SRC)["MODEL_WEIGHTS"], {})

    assert "gpt-5.1" in start_models
    assert weights.get("gpt-5.1", 1) == 1


def test_expensive_image_models_are_not_start_models():
    start_models = _load_start_models()

    assert "gpt-5-image-mini" in start_models
    assert "nano-banana-pro" not in start_models
    assert "gpt-5-image" not in start_models


def test_models_api_exposes_access_metadata():
    src = AI_ROUTER_SRC.read_text(encoding="utf-8")

    assert '"required_tier"' in src
    assert '"access_label"' in src
