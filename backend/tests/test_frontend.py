"""Tests for frontend updates (Step 7).

Verifies:
- Model interface extended with new fields
- FALLBACK_MODELS has 25 models with correct tiers
- translations.ts has descriptions for all new models in 3 languages
- ModelDetailScreen has desc key mapping for all 25 models
"""

from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
FRONTEND = ROOT / "frontend" / "src"


def test_model_interface_extended():
    """useStore.ts Model interface should have price/context/category fields."""
    src = (FRONTEND / "store" / "useStore.ts").read_text(encoding="utf-8")
    assert "price_weighted?" in src
    assert "price_input?" in src
    assert "price_output?" in src
    assert "context_length?" in src
    assert "category?" in src


def test_fallback_models_count():
    """FALLBACK_MODELS should have 25 entries."""
    src = (FRONTEND / "hooks" / "useUser.ts").read_text(encoding="utf-8")
    # Count model IDs in fallback
    count = src.count("id: '")
    assert count == 25, f"Expected 25 fallback models, found {count}"


def test_fallback_deepseek_r1_premium():
    """DeepSeek R1 should be tier: 'premium' in fallback."""
    src = (FRONTEND / "hooks" / "useUser.ts").read_text(encoding="utf-8")
    # Find the deepseek-r1 entry
    idx = src.index("deepseek-r1")
    # Find the tier value nearby (within ~100 chars)
    chunk = src[idx:idx + 100]
    assert "'premium'" in chunk, f"deepseek-r1 should be premium, found: {chunk}"


def test_fallback_new_models_present():
    """New models should be in FALLBACK_MODELS."""
    src = (FRONTEND / "hooks" / "useUser.ts").read_text(encoding="utf-8")
    new_models = [
        "gemma-3-27b", "qwen-3-235b", "deepseek-v3", "gpt-4.1-mini",
        "gemini-2.5-flash", "claude-sonnet-4", "grok-3-mini", "phi-4",
        "qwen-qwq", "command-r", "mistral-small", "gpt-5.1",
        "nano-banana-pro", "nano-banana",
    ]
    for model_id in new_models:
        assert model_id in src, f"{model_id} missing from FALLBACK_MODELS"


def test_fallback_no_old_credit_costs():
    """Fallback error handler should not have creditCosts with model prices."""
    src = (FRONTEND / "hooks" / "useUser.ts").read_text(encoding="utf-8")
    # Find the catch/error block fallback
    error_idx = src.index("Failed to init user")
    fallback_chunk = src[error_idx:error_idx + 500]
    # Should have empty creditCosts
    assert "creditCosts: {}," in fallback_chunk or "creditCosts: {}" in fallback_chunk


# ─── Translations ───

def _load_translations():
    return (FRONTEND / "i18n" / "translations.ts").read_text(encoding="utf-8")


def test_translations_new_model_descs_en():
    src = _load_translations()
    keys = [
        "mdesc_gemma3", "mdesc_qwen3", "mdesc_deepseek_v3", "mdesc_gpt41_mini",
        "mdesc_gemini25_flash", "mdesc_claude_sonnet", "mdesc_grok3_mini",
        "mdesc_phi4", "mdesc_qwq", "mdesc_command_r", "mdesc_mistral_small",
        "mdesc_gpt51", "mdesc_nano_banana_pro", "mdesc_nano_banana",
    ]
    for key in keys:
        assert key in src, f"Translation key {key} missing"


def test_translations_3_languages():
    """Each new desc key should appear 3 times (en, ru, zh)."""
    src = _load_translations()
    keys = ["mdesc_gemma3", "mdesc_gpt51", "mdesc_phi4"]
    for key in keys:
        count = src.count(key)
        assert count == 3, f"{key} appears {count} times, expected 3 (en/ru/zh)"


def test_profile_models_val_updated():
    """profile_models_val should reflect 25 models (7+18)."""
    src = _load_translations()
    assert "25 (7 Lite + 18 Premium)" in src or "25 (7个Lite + 18个Premium)" in src
    assert "11 (6 Lite + 5 Premium)" not in src
    assert "11 (6个Lite + 5个Premium)" not in src


# ─── ModelDetailScreen ───

def test_model_detail_desc_keys():
    """MODEL_DESC_KEY should have entries for all 25 models."""
    src = (FRONTEND / "components" / "ModelDetailScreen" / "ModelDetailScreen.tsx").read_text(encoding="utf-8")
    models = [
        "gpt-4o-mini", "claude-haiku-4.5", "gemini-2.0-flash",
        "llama-4-maverick", "mistral-large-25", "gemma-3-27b", "qwen-3-235b",
        "deepseek-r1", "deepseek-v3", "gpt-4.1-mini", "gemini-2.5-flash",
        "claude-sonnet-4", "grok-3-mini", "phi-4", "qwen-qwq",
        "command-r", "mistral-small",
        "gpt-4.1", "claude-opus-4", "grok-3", "gemini-2.5-pro",
        "perplexity-sonar-pro", "gpt-5.1",
        "nano-banana-pro", "nano-banana",
    ]
    for model_id in models:
        assert f"'{model_id}'" in src, f"MODEL_DESC_KEY missing {model_id}"
