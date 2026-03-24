"""Tests for dynamic max_tokens in chat.py.

Verifies:
- chat.py imports MAX_TOKENS_LITE and MAX_TOKENS_PREMIUM from limiter
- max_tokens is passed to stream_chat_response based on billing_mode
- stream_chat_response accepts max_tokens parameter
"""

import ast
from pathlib import Path

BACKEND = Path(__file__).parent.parent
CHAT_SRC = BACKEND / "app" / "routers" / "chat.py"
ROUTER_SRC = BACKEND / "app" / "services" / "ai_router.py"


def test_chat_imports_token_limits():
    """chat.py should import MAX_TOKENS_LITE and MAX_TOKENS_PREMIUM."""
    src = CHAT_SRC.read_text(encoding="utf-8")
    assert "MAX_TOKENS_LITE" in src
    assert "MAX_TOKENS_PREMIUM" in src


def test_chat_sets_max_tokens_dynamically():
    """chat.py should set max_tokens based on billing_mode."""
    src = CHAT_SRC.read_text(encoding="utf-8")
    assert 'max_tokens = MAX_TOKENS_LITE if billing_mode == "free" else MAX_TOKENS_PREMIUM' in src


def test_chat_passes_max_tokens_to_stream():
    """chat.py should pass max_tokens to stream_chat_response."""
    src = CHAT_SRC.read_text(encoding="utf-8")
    assert "max_tokens=max_tokens" in src


def test_stream_chat_response_has_max_tokens_param():
    """ai_router.stream_chat_response should accept max_tokens parameter."""
    tree = ast.parse(ROUTER_SRC.read_text(encoding="utf-8"))
    for node in ast.walk(tree):
        if isinstance(node, ast.AsyncFunctionDef) and node.name == "stream_chat_response":
            param_names = [arg.arg for arg in node.args.args]
            assert "max_tokens" in param_names
            defaults = node.args.defaults
            kw_defaults = {
                node.args.args[-(len(defaults) - i)].arg: defaults[i]
                for i in range(len(defaults))
                if isinstance(defaults[i], ast.Constant)
            }
            assert kw_defaults.get("max_tokens") is not None
            return
    raise AssertionError("stream_chat_response not found")


def test_limiter_defines_token_limits():
    """limiter.py should define MAX_TOKENS_LITE and MAX_TOKENS_PREMIUM."""
    limiter_src = BACKEND / "app" / "services" / "limiter.py"
    src = limiter_src.read_text(encoding="utf-8")
    assert "MAX_TOKENS_LITE" in src
    assert "MAX_TOKENS_PREMIUM" in src
