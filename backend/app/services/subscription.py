"""Subscription plans — tier definitions, credit costs, model access."""

# ─── Plan definitions (what user sees + hidden credits) ───

PLANS = {
    "free": {
        "name": "Free",
        "price_rub": 0,
        "credits": 0,
        "limits": {
            "text_fast": 15,        # per day
            "text_premium": 0,      # locked
            "opus_limit": 0,        # locked
            "images": 2,            # per day (Nano Banana only)
            "videos": 0,            # locked
            "models_3d": 0,         # locked
            "audio": 0,             # locked
        },
        "period": "day",
        "features": {
            "history": True,
            "voice": False,
            "delay": 0,
            "api": False,
        },
    },
    "mini": {
        "name": "Mini",
        "price_rub": 390,
        "credits": 1000,
        "limits": {
            "text_fast": 500,
            "text_premium": 20,
            "opus_limit": 5,
            "images": 15,
            "videos": 3,
            "models_3d": 0,
            "audio": 0,
        },
        "period": "month",
        "features": {
            "history": True,
            "voice": False,
            "delay": 0,
            "api": False,
        },
    },
    "max": {
        "name": "Max",
        "price_rub": 890,
        "credits": 3000,
        "limits": {
            "text_fast": 2000,
            "text_premium": 100,
            "opus_limit": 20,
            "images": 50,
            "videos": 10,
            "models_3d": 5,
            "audio": 20,
        },
        "period": "month",
        "features": {
            "history": True,
            "voice": True,
            "delay": 0,
            "api": False,
        },
    },
    "max-pro": {
        "name": "Max Pro",
        "price_rub": 1990,
        "credits": 10000,
        "limits": {
            "text_fast": 10000,
            "text_premium": 500,
            "opus_limit": 80,
            "images": 300,
            "videos": 50,
            "models_3d": 30,
            "audio": 100,
        },
        "period": "month",
        "features": {
            "history": True,
            "voice": True,
            "delay": 0,
            "api": True,
            "priority_speed": True,
            "early_access": True,
        },
    },
}

# ─── Credit costs per model (hidden from user) ───

CREDIT_COSTS = {
    # Text — budget (1 cr)
    "gemma-3-27b": 1, "gemma-3n-4b": 1, "phi-4": 1,
    "llama-3.3-70b": 1, "nvidia-nemotron": 1, "mythomax-13b": 1,
    # Text — lite (2 cr)
    "gpt-4o-mini": 2, "gemini-2.0-flash": 2, "qwen-turbo": 2,
    # Text — mid-low (3 cr)
    "deepseek-v3": 3, "deepseek-v3.2": 3, "deepseek-r1": 3,
    "qwen-3-235b": 3, "qwen-qwq": 3, "mistral-small": 3, "command-r7": 3,
    # Text — mid (5 cr)
    "gpt-4.1-mini": 5, "gpt-4.1-nano": 5, "gemini-2.5-flash": 5,
    "grok-3-mini": 5, "devstral": 5, "minimax-m2.5": 5,
    "llama-4-maverick": 5, "mistral-large-25": 5,
    # Text — premium-mid (8 cr)
    "gpt-5.1": 8, "gpt-5.4": 8, "gemini-2.5-pro": 8,
    "gemini-3-pro": 8, "o3": 8, "o4-mini": 8,
    "kimi-k2.5": 8, "claude-haiku-4.5": 8,
    "gemini-2.5-flash-think": 8, "claude-haiku-4.5-think": 8,
    # Text — premium-high (15 cr)
    "claude-sonnet-4": 15, "claude-sonnet-4.5": 15,
    "grok-3": 15, "gpt-4.1": 15,
    "perplexity-sonar-pro": 15, "perplexity-sonar-deep": 15,
    "perplexity-sonar": 15,
    # Text — ultra premium (25 cr)
    "claude-opus-4.5": 25,
    # Text — max premium (40 cr)
    "claude-opus-4": 40,

    # Images
    "nano-banana": 3, "nano-banana-pro": 5,
    "gpt-5-image-mini": 8, "gpt-5-image": 15,

    # Video
    "ltx-video": 20, "wan-2": 20, "hunyuan": 20,
    "pika-2": 25, "pixverse-v5": 25, "stable-video": 25,
    "kling-v2": 35, "luma-dream": 35, "minimax": 35,
    "kling-v3": 50, "sora-2": 50, "veo-3": 50,
    "runway-gen3": 70,

    # 3D
    "triposr": 15, "tripo-v2.5": 25,

    # Audio
    "tts": 3, "stt": 2,
}

# ─── Model access per tier ───

FREE_MODELS = {
    "gpt-4o-mini", "gemini-2.0-flash", "deepseek-v3",
    "llama-4-maverick", "mistral-small", "qwen-turbo", "nano-banana",
}

# Budget video models available on Mini
BUDGET_VIDEO_MODELS = {"ltx-video", "wan-2", "hunyuan"}

MINI_MODELS = FREE_MODELS | {
    "claude-haiku-4.5", "claude-sonnet-4", "gpt-4.1-mini", "gpt-5.1",
    "gemini-2.5-flash", "grok-3-mini", "deepseek-r1", "deepseek-v3.2",
    # All image models
    "nano-banana-pro", "gpt-5-image-mini", "gpt-5-image",
    # Budget video models
} | BUDGET_VIDEO_MODELS

# Opus model IDs (for sub-limit checking)
OPUS_MODEL_IDS = {"claude-opus-4", "claude-opus-4.5"}

# max and max-pro have access to ALL models
FULL_ACCESS_TIERS = {"max", "max-pro"}


def get_accessible_models(tier: str) -> set | None:
    """Return set of model IDs accessible on this tier. None = all models."""
    if tier in FULL_ACCESS_TIERS:
        return None
    if tier == "mini":
        return MINI_MODELS
    return FREE_MODELS


def get_credit_cost(model_id: str) -> int:
    """Return credit cost for a single request to this model."""
    return CREDIT_COSTS.get(model_id, 5)


def get_required_tier(model_id: str) -> str:
    """Return minimum tier required to access this model."""
    if model_id in FREE_MODELS:
        return "free"
    if model_id in MINI_MODELS:
        return "mini"
    return "max"


def is_opus_model(model_id: str) -> bool:
    """Check if model is Claude Opus (has sub-limit)."""
    return model_id in OPUS_MODEL_IDS


def get_plan(tier: str) -> dict:
    """Return plan definition."""
    return PLANS.get(tier, PLANS["free"])
