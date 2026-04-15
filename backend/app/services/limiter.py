"""Rate limiter — Free plan limits, streak bonuses, and per-token billing bypass.

Free plan users (subscription_tier == "free" AND balance_usd <= 0) are subject to
daily/weekly limits. Users with balance > 0 always pass (per-token billing).
Paid subscription tiers bypass limits according to their plan.
"""

import random
from datetime import datetime, date, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Subscription, Pass, Usage
from app.services.ai_router import get_model_tier, get_model_category, MODELS_REGISTRY
from app.services.subscription import FREE_MODELS, get_accessible_models, get_required_tier, get_plan, PLANS

# ─── Free plan constants ───

FREE_LIMITS = {
    "text": 15,          # 15 text requests/day
    "image": 2,          # 2 images/day (Nano Banana only)
    "video": 0,          # no video on free
    "audio": 0,          # no audio on free
    "3d": 0,             # no 3D on free
}

FREE_RESPONSE_DELAY = 0  # no artificial delay for free users

# Streak milestones: days -> what unlocks (for get_free_limits display)
STREAK_MILESTONES = [3, 7, 14, 30, 60]

# Legacy constants (kept for backward compatibility with existing code)
FREE_DAILY_LIMIT = 10
REWARDED_BONUS = 5
MAX_TOKENS_LITE = 4096
MAX_TOKENS_PREMIUM = 8192


# Per-category output cap to protect margin on expensive models.
# Cheap fast models can generate longer answers since their tokens cost ~$0.001 per 1K.
# Expensive models (Sonnet/GPT-5 ~$15/M, Opus ~$75/M) must be capped tighter
# or one long answer can cost more than the user paid for a whole month.
MAX_TOKENS_BY_CATEGORY = {
    "fast":    {"free": 2000, "paid": 4096},
    "premium": {"free": 1500, "paid": 2500},
    "opus":    {"free": 0,    "paid": 2000},  # opus locked on free
}

# Per-category INPUT cap (in tokens). Models technically support 128K-1M context
# but charging input at $15/M means a user could paste 100K tokens for $1.50
# of just-input cost — wiping subscription margin in one call.
MAX_INPUT_BY_CATEGORY = {
    "fast":    {"free": 8000,  "paid": 16000},
    "premium": {"free": 8000,  "paid": 16000},
    "opus":    {"free": 0,     "paid": 8000},
}


def get_max_tokens_for(model_id: str, tier: str) -> int:
    """Return safe output token cap based on model category and user tier."""
    from app.services.daily_limits import get_model_category
    category = get_model_category(model_id)
    if category not in MAX_TOKENS_BY_CATEGORY:
        # image/video/3d — handled by their own routers, fall back to lite
        return MAX_TOKENS_LITE
    is_paid = tier in ("max", "max-pro")
    return MAX_TOKENS_BY_CATEGORY[category]["paid" if is_paid else "free"]


def get_max_input_tokens_for(model_id: str, tier: str) -> int:
    """Return safe input context cap based on model category and user tier."""
    from app.services.daily_limits import get_model_category
    category = get_model_category(model_id)
    if category not in MAX_INPUT_BY_CATEGORY:
        return 8000
    is_paid = tier in ("max", "max-pro")
    return MAX_INPUT_BY_CATEGORY[category]["paid" if is_paid else "free"]

# Subscription plan limits (legacy, kept for PLUS/MAX subscribers)
LIMITS = {
    "free": {"lite": FREE_DAILY_LIMIT, "premium": 0},
    "plus": {"lite": -1, "premium": 100},
    "max":  {"lite": -1, "premium": 500},
}

# Pass limits
PASS_LIMITS = {
    "day":    {"premium": 15, "duration_hours": 24},
    "week":   {"premium": 80, "duration_hours": 168},
    "single": {"premium": 1,  "duration_hours": None},
}

# Upgrade messages
_UPGRADE_MESSAGES = {
    "limit_hit": "Лимит на сегодня исчерпан. Обновление через {hours}ч. Перейдите на тариф Start за 990₽/мес",
    "image_limit": "Лимит {limit} изображений на сегодня. Перейдите на тариф Start за 990₽/мес",
    "model_locked": "{model_name} доступен на тарифе Start (990₽/мес)",
    "video_locked": "Видео доступно на тарифе Опти (790₽/мес)",
    "audio_locked": "Аудио доступно на тарифе Опти (790₽/мес)",
    "3d_locked": "3D генерация доступна на тарифе Опти (790₽/мес)",
}


# ─── Helper functions ───

async def get_or_create_user(db: AsyncSession, tg_user: dict, start_param: str | None = None) -> User:
    """Get existing user or create new one from Telegram data."""
    tg_id = tg_user["id"]
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()

    if not user:
        utm_source = None
        utm_medium = None
        utm_campaign = None
        if start_param and start_param.startswith("src_"):
            utm_source = start_param[4:]
            utm_medium = "telegram"
        elif start_param:
            utm_source = start_param
            utm_medium = "telegram"

        user = User(
            telegram_id=tg_id,
            username=tg_user.get("username"),
            first_name=tg_user.get("first_name"),
            language=tg_user.get("language_code", "ru"),
            balance_usd=1.05,  # Welcome bonus ≈100₽ ($1.05 × 95₽)
            utm_source=utm_source,
            utm_medium=utm_medium,
            utm_campaign=utm_campaign,
        )
        db.add(user)
        await db.flush()

    return user


async def get_active_subscription(db: AsyncSession, tg_id: int) -> Subscription | None:
    """Get user's active subscription (PLUS or MAX)."""
    result = await db.execute(
        select(Subscription)
        .where(
            Subscription.user_tg_id == tg_id,
            Subscription.is_active == True,
            Subscription.expires_at > datetime.utcnow(),
        )
        .order_by(Subscription.expires_at.desc())
    )
    return result.scalar_one_or_none()


async def get_active_pass(db: AsyncSession, tg_id: int) -> Pass | None:
    """Get user's active pass (day/week/single) with remaining requests."""
    now = datetime.utcnow()
    result = await db.execute(
        select(Pass)
        .where(
            Pass.user_tg_id == tg_id,
            Pass.is_active == True,
            Pass.requests_left > 0,
        )
    )
    passes = result.scalars().all()

    for p in passes:
        if p.expires_at and p.expires_at < now:
            p.is_active = False
            continue
        return p

    return None


async def get_user_plan(db: AsyncSession, tg_id: int) -> str:
    """Determine user's current plan: 'free', 'plus', or 'max'."""
    sub = await get_active_subscription(db, tg_id)
    if sub:
        return sub.plan
    return "free"


async def get_today_usage(db: AsyncSession, tg_id: int, tier: str) -> int:
    """Count how many requests the user made today for a given tier."""
    today_start = datetime.combine(date.today(), datetime.min.time())
    result = await db.execute(
        select(func.count())
        .select_from(Usage)
        .where(
            Usage.user_tg_id == tg_id,
            Usage.tier == tier,
            Usage.created_at >= today_start,
        )
    )
    return result.scalar() or 0


# Pre-compute model ID sets per category for efficient DB queries
_FAST_MODEL_IDS = [m["id"] for m in MODELS_REGISTRY if m["tier"] in (1, 2, 5) and m.get("category") != "image"]
_PREMIUM_MODEL_IDS = [m["id"] for m in MODELS_REGISTRY if m["tier"] in (3, 6) and m.get("category") != "image"]


async def _get_today_category_usage(db: AsyncSession, tg_id: int, category: str) -> int:
    """Count today's requests for a free-plan category (fast/premium/image).

    Queries the Usage table by model_id sets that belong to each category:
    - fast    -> models from tier 1 + 2 + 5 (non-image)
    - premium -> models from tier 3 + 6 (non-image)
    - image   -> count from user.daily_image_used (images use separate pipeline)
    """
    if category == "image":
        # Image usage tracked on user object, not in Usage table
        return 0  # caller reads user.daily_image_used directly

    today_start = datetime.combine(date.today(), datetime.min.time())
    model_ids = _FAST_MODEL_IDS if category == "fast" else _PREMIUM_MODEL_IDS

    result = await db.execute(
        select(func.count())
        .select_from(Usage)
        .where(
            Usage.user_tg_id == tg_id,
            Usage.model_id.in_(model_ids),
            Usage.created_at >= today_start,
        )
    )
    return result.scalar() or 0


def _hours_until_reset() -> int:
    """Hours remaining until midnight (daily reset)."""
    now = datetime.utcnow()
    tomorrow = datetime.combine(now.date() + timedelta(days=1), datetime.min.time())
    delta = tomorrow - now
    return max(1, int(delta.total_seconds() // 3600))


def _next_streak_milestone(current_streak: int) -> int:
    """Return the next streak milestone after the current streak."""
    for m in STREAK_MILESTONES:
        if current_streak < m:
            return m
    return STREAK_MILESTONES[-1]


# ─── Main limiter ───

async def check_can_request(db: AsyncSession, tg_id: int, model_id: str) -> dict:
    """
    Check if user can make a request — delegates to daily_limits system.
    """
    from app.services.daily_limits import check_daily_limit

    # Load user
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    if not user:
        # Try by id (web users)
        result = await db.execute(select(User).where(User.id == tg_id))
        user = result.scalar_one_or_none()

    balance = float(user.balance_usd or 0) if user else 0.0
    sub_tier = (user.subscription_tier or "free") if user else "free"

    # Check subscription expiry (downgrades to free if expired)
    if user and sub_tier != "free":
        from app.services.daily_limits import check_and_expire_subscription
        sub_tier = await check_and_expire_subscription(db, user)

    return await check_daily_limit(db, tg_id, model_id, sub_tier, balance)



# ─── Limits endpoint helper ───

async def get_free_limits(db: AsyncSession, user: User) -> dict:
    """Return current usage vs limits — delegates to daily_limits system."""
    from app.services.daily_limits import get_limits_info
    return await get_limits_info(db, user)


# ─── Usage recording (preserved from original) ───

async def record_usage(
    db: AsyncSession,
    tg_id: int,
    model_id: str,
    tokens_in: int = 0,
    tokens_out: int = 0,
    cost_usd: float = 0.0,
    provider_cost_usd: float = 0.0,
):
    """Record a usage entry and update user counters."""
    tier = get_model_tier(model_id)

    # Create usage record
    usage = Usage(
        user_tg_id=tg_id,
        model_id=model_id,
        tier=tier,
        tokens_in=tokens_in,
        tokens_out=tokens_out,
        cost_usd=cost_usd,
        provider_cost_usd=provider_cost_usd,
    )
    db.add(usage)

    # Update user counters
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    if not user:
        result = await db.execute(select(User).where(User.id == tg_id))
        user = result.scalar_one_or_none()
    if user:
        user.total_requests = (user.total_requests or 0) + 1
        user.total_tokens_used = (user.total_tokens_used or 0) + tokens_in + tokens_out

    # Increment daily usage counters
    from app.services.daily_limits import increment_usage
    sub_tier = (user.subscription_tier or "free") if user else "free"
    await increment_usage(db, tg_id, model_id, sub_tier)

    await db.flush()
