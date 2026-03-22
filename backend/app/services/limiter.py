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
from app.services.subscription import FREE_MODELS, get_accessible_models, get_credit_cost, get_required_tier, get_plan, PLANS, CREDIT_COSTS

# ─── Free plan constants ───

FREE_LIMITS = {
    "text": 15,          # 15 text requests/day
    "image": 2,          # 2 images/day (Nano Banana only)
    "video": 0,          # no video on free
    "audio": 0,          # no audio on free
    "3d": 0,             # no 3D on free
}

FREE_RESPONSE_DELAY = 5  # fixed 5 second delay for free users

# Streak milestones: days -> what unlocks (for get_free_limits display)
STREAK_MILESTONES = [3, 7, 14, 30, 60]

# Legacy constants (kept for backward compatibility with existing code)
FREE_DAILY_LIMIT = 10
REWARDED_BONUS = 5
MAX_TOKENS_LITE = 4096
MAX_TOKENS_PREMIUM = 8192

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
    "limit_hit": "Лимит на сегодня исчерпан. Обновление через {hours}ч. Перейдите на тариф Мини за 339₽/мес",
    "image_limit": "Лимит {limit} изображений на сегодня. Перейдите на тариф Мини за 339₽/мес",
    "model_locked": "{model_name} доступен на тарифе Мини (339₽/мес)",
    "video_locked": "Видео доступно на тарифе Опти (790₽/мес)",
    "audio_locked": "Аудио доступно на тарифе Опти (790₽/мес)",
    "3d_locked": "3D генерация доступна на тарифе Опти (790₽/мес)",
}


# ─── Helper functions ───

async def get_or_create_user(db: AsyncSession, tg_user: dict) -> User:
    """Get existing user or create new one from Telegram data."""
    tg_id = tg_user["id"]
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            telegram_id=tg_id,
            username=tg_user.get("username"),
            first_name=tg_user.get("first_name"),
            language=tg_user.get("language_code", "ru"),
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
    Check if user can make a request to the specified model.

    Logic:
    1. Determine model category (fast / premium / image).
    2. Get today's usage count for that category.
    3. Get streak bonuses from user object.
    4. effective_limit = base_limit + streak_bonus_for_category.
    5. If used >= effective_limit AND balance_usd <= 0 AND subscription_tier == "free":
       -> denied with upgrade message.
    6. If balance > 0: always allow (per-token billing, no limits).
    7. If allowed AND subscription_tier == "free": add delay.

    Returns dict with: allowed, reason, plan, tier, category, used_today,
                       limit, has_pass, billing, delay (optional).
    """
    tier = get_model_tier(model_id)
    category = get_model_category(model_id)

    # Load user
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    balance = float(user.balance_usd or 0) if user else 0.0
    sub_tier = (user.subscription_tier or "free") if user else "free"

    base = {
        "plan": sub_tier,
        "tier": tier,
        "category": category,
        "has_pass": False,
    }

    # ── Users with positive balance: always allow (per-token billing) ──
    if balance > 0:
        used = await _get_today_category_usage(db, tg_id, category)
        if category == "image":
            used = int(user.daily_image_used or 0) if user else 0
        return {
            **base,
            "allowed": True,
            "reason": None,
            "used_today": used,
            "limit": -1,
            "billing": "per_token",
        }

    # ── Paid subscription tiers (mini/opti/plus/max): bypass free limits ──
    if sub_tier not in ("free", None):
        # Check active pass for premium models
        if category == "premium":
            active_pass = await get_active_pass(db, tg_id)
            if active_pass:
                return {
                    **base,
                    "allowed": True,
                    "reason": None,
                    "used_today": 0,
                    "limit": active_pass.requests_left,
                    "has_pass": True,
                    "billing": "pass",
                }

        # Subscription-based access
        plan_key = sub_tier if sub_tier in LIMITS else "plus"
        plan_limits = LIMITS.get(plan_key, LIMITS["plus"])
        tier_key = "lite" if category == "fast" else "premium"
        limit = plan_limits.get(tier_key, -1)
        used = await get_today_usage(db, tg_id, "lite" if category == "fast" else "premium")

        if limit == -1 or used < limit:
            return {
                **base,
                "allowed": True,
                "reason": None,
                "used_today": used,
                "limit": limit,
                "billing": "subscription",
            }
        return {
            **base,
            "allowed": False,
            "reason": f"Лимит {limit} запросов на сегодня исчерпан",
            "used_today": used,
            "limit": limit,
            "billing": "subscription",
        }

    # ── Free plan logic (subscription_tier == "free" AND balance <= 0) ──

    # Check model access for current tier
    accessible = get_accessible_models(sub_tier)
    if accessible is not None and model_id not in accessible:
        required = get_required_tier(model_id)
        plan_info = get_plan(required)
        model_info = next((m for m in MODELS_REGISTRY if m["id"] == model_id), None)
        model_name = model_info["name"] if model_info else model_id
        msg = f"{model_name} доступен на тарифе {plan_info['name']} ({plan_info['price_rub']}₽/мес)"

        return {
            **base,
            "allowed": False,
            "reason": msg,
            "error": "model_locked",
            "required_tier": required,
            "used_today": 0,
            "limit": 0,
            "billing": "free",
        }

    # Streak bonuses
    streak_fast = int(user.streak_bonus_fast or 0) if user else 0
    streak_images = int(user.streak_bonus_images or 0) if user else 0

    if category == "image":
        base_limit = FREE_LIMITS["image"]
        effective_limit = base_limit + streak_images
        used = int(user.daily_image_used or 0) if user else 0
    else:
        # Text request to allowed model
        base_limit = FREE_LIMITS["text"]
        effective_limit = base_limit + streak_fast
        used = await _get_today_category_usage(db, tg_id, "fast")

    # Check limit
    if used >= effective_limit:
        hours = _hours_until_reset()
        if category == "image":
            reason = _UPGRADE_MESSAGES["image_limit"].format(limit=effective_limit)
        else:
            reason = _UPGRADE_MESSAGES["limit_hit"].format(hours=hours)
        return {
            **base,
            "allowed": False,
            "reason": reason,
            "used_today": used,
            "limit": effective_limit,
            "billing": "free",
        }

    # Allowed — add fixed 5 sec delay for free users
    return {
        **base,
        "allowed": True,
        "reason": None,
        "used_today": used,
        "limit": effective_limit,
        "billing": "free",
        "delay": FREE_RESPONSE_DELAY,
    }


# ─── Limits endpoint helper ───

async def get_free_limits(db: AsyncSession, user: User) -> dict:
    """
    Return current usage vs limits for /api/user/limits endpoint.

    Works for any user: free-plan users see their limits & bonuses,
    paid users see unlimited (-1).
    """
    tg_id = user.telegram_id
    sub_tier = user.subscription_tier or "free"

    # Count today's fast usage (tier == 'lite' in Usage table)
    fast_used = await _get_today_category_usage(db, tg_id, "fast")
    # Count today's premium usage (tier == 'premium' in Usage table)
    premium_used = await _get_today_category_usage(db, tg_id, "premium")
    # Image & video from user counters
    image_used = int(user.daily_image_used or 0)
    video_used = int(user.weekly_video_used or 0)

    # Streak bonuses
    streak_fast = int(user.streak_bonus_fast or 0)
    streak_images = int(user.streak_bonus_images or 0)
    streak_video = int(user.streak_bonus_video or 0)
    login_streak = int(user.login_streak or 0)

    return {
        "plan": sub_tier,
        "text": {
            "used": fast_used,
            "limit": FREE_LIMITS["text"] + streak_fast if sub_tier == "free" else -1,
            "bonus": streak_fast,
        },
        "image": {
            "used": image_used,
            "limit": FREE_LIMITS["image"] + streak_images if sub_tier == "free" else -1,
            "bonus": streak_images,
        },
        "video": {
            "used": video_used,
            "limit": FREE_LIMITS["video"] if sub_tier == "free" else -1,
            "bonus": 0,
        },
        "free_models": list(FREE_MODELS),
        "streak": {
            "days": login_streak,
            "next_bonus_at": _next_streak_milestone(login_streak),
        },
        "has_delay": sub_tier == "free" and float(user.balance_usd or 0) <= 0,
    }


# ─── Usage recording (preserved from original) ───

async def record_usage(
    db: AsyncSession,
    tg_id: int,
    model_id: str,
    tokens_in: int = 0,
    tokens_out: int = 0,
    cost_usd: float = 0.0,
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
    )
    db.add(usage)

    # Update user counters
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    if user:
        user.total_requests = (user.total_requests or 0) + 1
        user.total_tokens_used = (user.total_tokens_used or 0) + tokens_in + tokens_out
        if tier == "lite":
            user.daily_lite_used = (user.daily_lite_used or 0) + 1
        else:
            user.daily_premium_used = (user.daily_premium_used or 0) + 1

    # Decrement pass if used
    active_pass = await get_active_pass(db, tg_id)
    if active_pass and tier == "premium":
        active_pass.requests_left -= 1
        if active_pass.requests_left <= 0:
            active_pass.is_active = False

    await db.flush()
