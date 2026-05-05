"""Subscription plans — tier definitions, credit costs, model access."""

from app.pricing import PLAN_PRICES_RUB  # single source of truth for tier prices

# ─── Plan definitions (what user sees + hidden credits) ───

PLANS = {
    "free": {
        "name": "Free",
        "price_rub": 0,
        "credits": 0,
        "limits": {
            "text_fast": 10,         # per day
            "text_premium": 2,       # per day
            "opus_limit": 0,         # locked
            "images": 2,             # TOTAL trial (not daily)
            "videos": 1,             # TOTAL trial (not daily)
            "models_3d": 0,          # locked
            "audio": 0,              # locked
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
        "name": "Start",
        "price_rub": PLAN_PRICES_RUB["mini"],
        "credits": 1000,
        "limits": {
            "text_fast": 600,        # 20/day × 30
            "text_premium": 90,      # 3/day × 30
            "opus_limit": 0,         # locked on Start
            "images": 60,            # 2/day × 30
            "videos": 30,            # 1/day × 30
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
        "name": "Pro",
        "price_rub": PLAN_PRICES_RUB["max"],
        "credits": 3000,
        "limits": {
            "text_fast": 1500,       # 50/day × 30
            "text_premium": 112,     # 28/week × 4
            "opus_limit": 28,        # 7/week × 4
            "images": 140,           # 35/week × 4
            "videos": 28,            # 7/week × 4
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
        "name": "Elite",
        "price_rub": PLAN_PRICES_RUB["max-pro"],
        "credits": 10000,
        "limits": {
            "text_fast": 4500,       # 150/day × 30
            "text_premium": 336,     # 84/week × 4
            "opus_limit": 56,        # 14/week × 4
            "images": 280,           # 70/week × 4
            "videos": 84,            # 21/week × 4
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


VIDEO_POINTS_PLANS = {
    "free": {"points_per_month": 0, "trial_points_lifetime": 2},
    "mini": {"points_per_month": 13, "trial_standard": 1, "trial_premium": 1},
    "max": {"points_per_month": 33},
    "max-pro": {"points_per_month": 80},
}


# Note: old credit-based system (CREDIT_COSTS) removed — billing is now
# per-token for chat (free via daily limits) and fixed-price for tools.

# ─── Model access per tier ───

FREE_MODELS = {
    "gpt-4o-mini", "claude-haiku-4.5", "gemini-2.0-flash",
    "deepseek-v3", "llama-4-maverick", "mistral-large-25",
    "nano-banana",
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
OPUS_MODEL_IDS = {"claude-opus-4", "claude-opus-4.5", "claude-opus-4-7"}

# max and max-pro have access to ALL models
FULL_ACCESS_TIERS = {"max", "max-pro"}


def get_accessible_models(tier: str) -> set | None:
    """Return set of model IDs accessible on this tier. None = all models."""
    if tier in FULL_ACCESS_TIERS:
        return None
    if tier == "mini":
        return MINI_MODELS
    return FREE_MODELS


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


def get_video_points_plan(tier: str) -> dict:
    """Return video points plan for a subscription tier."""
    return VIDEO_POINTS_PLANS.get(tier, VIDEO_POINTS_PLANS["free"])


def activate_subscription(user, tier: str, days: int = 30) -> None:
    """Activate or renew a paid subscription on the User row.

    Sets tier, expiration date, and resets all monthly counters including video
    points. Video points reset date is synced with subscription expiration so
    points refresh together with subscription renewal — not on the calendar 1st.
    """
    from datetime import datetime, timedelta

    now = datetime.utcnow()
    plan = PLANS.get(tier, PLANS["mini"])
    new_reset = now + timedelta(days=days)

    user.subscription_tier = tier
    user.subscription_started = now
    user.credits_reset_date = new_reset
    user.credits_balance = plan.get("credits", 0)

    # Reset monthly usage counters
    user.monthly_fast_used = 0
    user.monthly_premium_used = 0
    user.monthly_images_used = 0
    user.monthly_videos_used = 0
    user.monthly_3d_used = 0
    user.monthly_audio_used = 0
    user.opus_requests_used = 0

    # Reset video points and sync reset date with subscription end
    user.video_points_used = 0
    user.video_points_reset_date = new_reset.date()
    user.trial_start_standard_used = False
    user.trial_start_premium_used = False
