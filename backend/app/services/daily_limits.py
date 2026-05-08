"""Daily limits with rollover — core logic for Stone AI.

Each user gets daily quotas per model tier (fast/premium/opus).
Unused requests partially carry over to the next day.
"""

import math
import logging
from datetime import date, datetime, timedelta, timezone, time

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.models.user import User
from app.models.daily_usage import DailyUsage
from app.pricing import PLAN_PRICES_RUB
from app.services.subscription import get_accessible_models, get_required_tier

logger = logging.getLogger(__name__)


async def check_and_expire_subscription(db: AsyncSession, user: User) -> str:
    """Check if user's subscription has expired. Returns current tier (may downgrade to free)."""
    tier = user.subscription_tier or "free"
    if tier == "free":
        return "free"

    if user.credits_reset_date and user.credits_reset_date < datetime.utcnow():
        logger.info(f"Subscription expired for user {user.id} (tier={tier}, expired={user.credits_reset_date})")
        user.subscription_tier = "free"
        user.credits_balance = 0
        user.monthly_fast_used = 0
        user.monthly_premium_used = 0
        user.monthly_images_used = 0
        user.monthly_videos_used = 0
        user.monthly_3d_used = 0
        user.monthly_audio_used = 0
        user.opus_requests_used = 0
        user.video_points_used = 0
        user.trial_start_standard_used = False
        user.trial_start_premium_used = False
        user.video_points_reset_date = get_video_points_reset_date()
        await db.flush()

        # Notify user
        try:
            from app.services.email_service import notify_user
            tier_names = {"mini": "Start", "max": "Pro", "max-pro": "Elite"}
            notify_user(
                user.email,
                f"Подписка {tier_names.get(tier, tier)} истекла",
                f"Ваша подписка {tier_names.get(tier, tier)} истекла. Продлите на stoneai.ru/pricing чтобы продолжить пользоваться всеми моделями.",
                tg_id=user.telegram_id,
            )
        except Exception:
            pass

        return "free"
    return tier


# ═══════════════════════════════════════════════════════════
# Constants
# ═══════════════════════════════════════════════════════════

MSK = timezone(timedelta(hours=3))

DAILY_LIMITS = {
    "free":     {"fast": 10, "premium": 2,  "opus": 0,  "image": 0, "video": 0},  # free uses trial limits (2 img + 1 vid TOTAL), not daily
    "mini":     {"fast": 20, "premium": 3,  "opus": 0,  "image": 2, "video": 1},
    "max":      {"fast": 50, "premium": 4,  "opus": 1,  "image": 5, "video": 1},
    "max-pro":  {"fast": 150, "premium": 12, "opus": 2, "image": 10, "video": 3},
}

# Pro and Elite: premium/opus limits are WEEKLY (7x daily), not daily
# free/mini stay daily
WEEKLY_TIERS = {"max", "max-pro"}
WEEKLY_LIMITS = {
    "max":      {"premium": 28, "opus": 7,  "image": 35, "video": 7},    # 4*7, 1*7, 5*7, 1*7
    "max-pro":  {"premium": 84, "opus": 14, "image": 70, "video": 21},   # 12*7, 2*7, 10*7, 3*7
}

ROLLOVER_RATE = {
    "free": 0.0,
    "mini": 0.3,
    "max": 0.5,
    "max-pro": 0.5,
}

ROLLOVER_CAP = {
    "free":    {"fast": 0,   "premium": 0, "opus": 0},
    "mini":    {"fast": 25,  "premium": 2, "opus": 0},
    "max":     {"fast": 35,  "premium": 4, "opus": 1},
    "max-pro": {"fast": 175, "premium": 9, "opus": 2},
}

# Model → tier mapping
FAST_MODELS = {
    "gpt-4o-mini", "gpt-4.1-nano", "claude-haiku-4.5",
    "gemini-2.0-flash", "gemini-2.5-flash",
    "deepseek-v3", "deepseek-v3.2",
    "llama-4-maverick", "mistral-large-25", "mistral-small",
    "qwen-3-235b", "qwen-qwq", "qwen-turbo",
    "command-r7", "minimax-m2.5", "glm-5",
}

OPUS_MODELS = {
    "claude-opus-4", "claude-opus-4.5", "claude-opus-4-7", "o3",
}

# Everything not in FAST or OPUS is PREMIUM

IMAGE_MODELS = {
    "nano-banana-pro", "nano-banana", "gpt-5-image",
    "gpt-5-image-mini", "flux-schnell", "stable-diffusion-xl",
    "kolors-v2", "kolors-v3",
}

VIDEO_MODELS = {
    "kling-v3", "sora-2", "veo-3", "luma-ray2", "luma-ray2-flash",
    "kling-v2", "runway-gen3", "pika-2", "minimax", "pixverse-v5",
    "luma-dream", "stable-video", "wan-2", "hunyuan", "ltx-video",
}

# Models available on free plan — only 7 models (everything else is locked)
FREE_PLAN_MODELS = {
    "gpt-4o-mini", "claude-haiku-4.5", "gemini-2.0-flash",
    "deepseek-v3", "llama-4-maverick", "mistral-large-25",
    "nano-banana",  # 2 free images
    "veo-3",        # 1 free video
}


# Per-model request weight — how many "units" each call consumes from the daily/weekly limit.
# Default = 1. Expensive models cost more so heavy use does not blow margin.
# Calibrated against OPENROUTER_COSTS to keep worst-case spend within tariff price.
MODEL_WEIGHTS: dict[str, int] = {
    # FAST tier — most cost weight 1, mistral-large is 15x flash so weight 3
    "mistral-large-25": 3,

    # PREMIUM tier — Sonnet ($3/$15) and gpt-5.1 ($2/$16) are 2x of typical premium
    "claude-sonnet-4": 2,
    "claude-sonnet-4.5": 2,
    "gpt-5.1": 2,
    "gpt-5.4": 2,
    "grok-3": 2,
    "perplexity-sonar-pro": 2,

    # OPUS tier — $15/$75 is ~5x of typical premium models
    "claude-opus-4": 5,
    "claude-opus-4.5": 5,
    "claude-opus-4-7": 5,

    # IMAGE — nano-banana-pro and gpt-5-image are most expensive
    "gpt-5-image": 3,
    "nano-banana-pro": 5,
}


def get_model_weight(model_id: str) -> int:
    """Return how many limit units a single call to this model consumes."""
    return MODEL_WEIGHTS.get(model_id, 1)


TIER_MAX_POINTS = {
    "free": 1,
    "mini": 1,
    "max": 4,
    "max-pro": 6,
}


def get_model_category(model_id: str) -> str:
    """Determine model category: fast, premium, opus, image, video."""
    if model_id in IMAGE_MODELS:
        return "image"
    if model_id in VIDEO_MODELS:
        return "video"
    if model_id in OPUS_MODELS:
        return "opus"
    if model_id in FAST_MODELS:
        return "fast"
    return "premium"


def get_msk_today() -> date:
    """Current date in Moscow timezone."""
    return datetime.now(MSK).date()


def get_msk_reset_at() -> str:
    """Next 00:00 MSK as ISO string."""
    now = datetime.now(MSK)
    tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return tomorrow.isoformat()


def get_video_points_reset_date(now_utc: datetime | None = None, user: User | None = None) -> date:
    """Next video-points reset date.

    Paid users: synced with their subscription expiration (credits_reset_date)
    so points refresh together with auto-renewal, not on the calendar 1st.
    Free users: 1st of the following calendar month (legacy behaviour).
    """
    now = now_utc or datetime.now(timezone.utc)
    if user is not None and user.subscription_tier and user.subscription_tier != "free":
        if user.credits_reset_date and user.credits_reset_date.date() > now.date():
            return user.credits_reset_date.date()
    year = now.year + (1 if now.month == 12 else 0)
    month = 1 if now.month == 12 else now.month + 1
    return date(year, month, 1)


def reset_video_points_if_needed(user: User, now_utc: datetime | None = None) -> bool:
    """Reset monthly video point state when reset date is reached."""
    now = now_utc or datetime.now(timezone.utc)
    next_reset = get_video_points_reset_date(now, user)
    current_reset = user.video_points_reset_date

    if current_reset is None:
        user.video_points_reset_date = next_reset
        return False

    if current_reset > now.date():
        return False

    user.video_points_used = 0
    user.trial_start_standard_used = False
    user.trial_start_premium_used = False
    user.video_points_reset_date = next_reset
    return True


def _required_tier_for_points(points_needed: int) -> str:
    if points_needed <= 1:
        return "mini"
    if points_needed <= 4:
        return "max"
    return "max-pro"


def get_video_points_snapshot(user: User) -> dict:
    from app.services.subscription import get_video_points_plan

    tier = user.subscription_tier or "free"
    plan = get_video_points_plan(tier)
    used = int(user.video_points_used or 0)
    total = int(plan.get("points_per_month", 0))
    trial_total = int(plan.get("trial_points_lifetime", 0))
    free_trial_used = int(user.trial_video_points_used or 0)

    return {
        "video_points_used": used,
        "video_points_total": total if total > 0 else trial_total,
        "video_points_available": max(0, total - used) if total > 0 else max(0, trial_total - free_trial_used),
        "video_points_reset": (user.video_points_reset_date or get_video_points_reset_date(user=user)).isoformat(),
        "trial_standard_available": tier == "mini" and not bool(user.trial_start_standard_used),
        "trial_premium_available": tier == "mini" and not bool(user.trial_start_premium_used),
        "trial_video_points_used": free_trial_used,
        "trial_video_points_total": trial_total,
    }


async def check_video_points(db: AsyncSession, user: User, model_id: str, options: dict) -> dict:
    """Check monthly video points and tariff gate for a requested video variant."""
    from app.services.provider_costs import get_novita_video_cost_and_points
    from app.services.subscription import get_video_points_plan

    reset_video_points_if_needed(user)

    tier = user.subscription_tier or "free"
    plan = get_video_points_plan(tier)

    cost_usd, points_needed = get_novita_video_cost_and_points(
        model_id=model_id,
        duration=int(options.get("duration", 5) or 5),
        resolution=str(options.get("resolution", "720P")),
        mode=str(options.get("mode", "t2v")),
        quality=str(options.get("quality", "standard")),
    )

    current_used = int(user.video_points_used or 0)
    points_total = int(plan.get("points_per_month", 0))
    points_left = max(0, points_total - current_used)
    snapshot = get_video_points_snapshot(user)

    if tier == "free":
        if points_needed > TIER_MAX_POINTS["free"]:
            return {
                "allowed": False,
                "reason": "Этот вариант недоступен на бесплатном тарифе",
                "required_tier": _required_tier_for_points(points_needed),
                "points_needed": points_needed,
                "points_left": snapshot["video_points_available"],
                "cost_usd": cost_usd,
            }
        trial_total = int(plan.get("trial_points_lifetime", 0))
        trial_used = int(user.trial_video_points_used or 0)
        if trial_used + points_needed > trial_total:
            return {
                "allowed": False,
                "reason": "Бесплатный lifetime trial на видео исчерпан",
                "required_tier": "mini",
                "points_needed": points_needed,
                "points_left": max(0, trial_total - trial_used),
                "cost_usd": cost_usd,
            }
        return {
            "allowed": True,
            "tier": tier,
            "cost_usd": cost_usd,
            "points_needed": points_needed,
            "points_left": max(0, trial_total - trial_used),
            "charge_target": "free_trial",
        }

    trial_kind = None
    tier_cap = TIER_MAX_POINTS.get(tier, TIER_MAX_POINTS["free"])
    if points_needed > tier_cap:
        if tier == "mini" and points_needed == 2 and not user.trial_start_standard_used:
            trial_kind = "standard"
        elif tier == "mini" and points_needed == 4 and not user.trial_start_premium_used:
            trial_kind = "premium"
        else:
            return {
                "allowed": False,
                "reason": "Этот вариант недоступен на вашем тарифе",
                "required_tier": _required_tier_for_points(points_needed),
                "points_needed": points_needed,
                "points_left": points_left,
                "cost_usd": cost_usd,
            }

    if current_used + points_needed > points_total:
        return {
            "allowed": False,
            "reason": "Недостаточно video points на этот месяц",
            "required_tier": tier,
            "points_needed": points_needed,
            "points_left": points_left,
            "cost_usd": cost_usd,
        }

    return {
        "allowed": True,
        "tier": tier,
        "cost_usd": cost_usd,
        "points_needed": points_needed,
        "points_left": points_left,
        "charge_target": "monthly_points",
        "trial_kind": trial_kind,
    }


def apply_video_points_charge(user: User, charge: dict) -> None:
    """Mutate user counters after provider accepted the video request."""
    reset_video_points_if_needed(user)

    points_needed = int(charge.get("points_needed", 0) or 0)
    target = charge.get("charge_target")

    if target == "free_trial":
        user.trial_video_points_used = int(user.trial_video_points_used or 0) + points_needed
        return

    user.video_points_used = int(user.video_points_used or 0) + points_needed
    if charge.get("trial_kind") == "standard":
        user.trial_start_standard_used = True
    elif charge.get("trial_kind") == "premium":
        user.trial_start_premium_used = True


async def get_weekly_usage(db: AsyncSession, tg_id: int, category: str) -> int:
    """Sum usage for a category over the last 7 days."""
    today = get_msk_today()
    week_ago = today - timedelta(days=6)  # today + 6 previous days = 7 days
    col = f"{category}_used"
    result = await db.execute(
        select(func.coalesce(func.sum(getattr(DailyUsage, col)), 0)).where(
            DailyUsage.user_tg_id == tg_id,
            DailyUsage.date >= week_ago,
            DailyUsage.date <= today,
        )
    )
    return result.scalar() or 0


# ═══════════════════════════════════════════════════════════
# Core functions
# ═══════════════════════════════════════════════════════════

async def get_or_create_today(db: AsyncSession, tg_id: int, tier: str, *, lock_for_update: bool = False) -> DailyUsage:
    """Get or create today's DailyUsage row, calculating rollover from yesterday."""
    today = get_msk_today()

    # Try to find today's row
    query = select(DailyUsage).where(
        DailyUsage.user_tg_id == tg_id,
        DailyUsage.date == today,
    )
    if lock_for_update:
        query = query.with_for_update()
    result = await db.execute(query)
    row = result.scalar_one_or_none()
    if row:
        return row

    # Calculate rollover from yesterday
    yesterday = today - timedelta(days=1)
    result = await db.execute(
        select(DailyUsage).where(
            DailyUsage.user_tg_id == tg_id,
            DailyUsage.date == yesterday,
        )
    )
    yesterday_row = result.scalar_one_or_none()

    rollover_fast = 0
    rollover_premium = 0
    rollover_opus = 0

    if yesterday_row and tier in ROLLOVER_RATE and ROLLOVER_RATE[tier] > 0:
        limits = DAILY_LIMITS.get(tier, DAILY_LIMITS["free"])
        rate = ROLLOVER_RATE[tier]
        cap = ROLLOVER_CAP.get(tier, ROLLOVER_CAP["free"])

        unused_fast = max(0, limits["fast"] + yesterday_row.rollover_fast - yesterday_row.fast_used)
        unused_premium = max(0, limits["premium"] + yesterday_row.rollover_premium - yesterday_row.premium_used)
        unused_opus = max(0, limits["opus"] + yesterday_row.rollover_opus - yesterday_row.opus_used)

        rollover_fast = min(math.floor(unused_fast * rate), cap["fast"])
        rollover_premium = min(math.floor(unused_premium * rate), cap["premium"])
        rollover_opus = min(math.floor(unused_opus * rate), cap["opus"])

    # Create today's row
    row = DailyUsage(
        user_tg_id=tg_id,
        date=today,
        fast_used=0,
        premium_used=0,
        opus_used=0,
        image_used=0,
        video_used=0,
        rollover_fast=rollover_fast,
        rollover_premium=rollover_premium,
        rollover_opus=rollover_opus,
    )
    db.add(row)
    try:
        await db.flush()
    except Exception:
        # Race condition — another request created it
        await db.rollback()
        query = select(DailyUsage).where(
            DailyUsage.user_tg_id == tg_id,
            DailyUsage.date == today,
        )
        if lock_for_update:
            query = query.with_for_update()
        result = await db.execute(query)
        row = result.scalar_one_or_none()

    return row


async def check_daily_limit(
    db: AsyncSession, tg_id: int, model_id: str, tier: str, balance: float = 0
) -> dict:
    """Check if user can make a request. Returns allow/deny with details."""
    # Chat always uses daily limits — balance is for dashboard tools only.
    category = get_model_category(model_id)
    limits = DAILY_LIMITS.get(tier, DAILY_LIMITS["free"])
    if tier == "mini":
        mini_models = get_accessible_models("mini") or set()
        if model_id not in mini_models:
            required_tier = get_required_tier(model_id)
            required_price = PLAN_PRICES_RUB["max"] if required_tier == "max" else PLAN_PRICES_RUB["mini"]
            reason = (
                f"Claude Opus РґРѕСЃС‚СѓРїРµРЅ РЅР° С‚Р°СЂРёС„Рµ Pro РѕС‚ {required_price}в‚Ѕ/РјРµСЃ"
                if category == "opus"
                else f"Р­С‚Р° РјРѕРґРµР»СЊ РґРѕСЃС‚СѓРїРЅР° РїРѕ РїРѕРґРїРёСЃРєРµ РѕС‚ {required_price}в‚Ѕ/РјРµСЃ"
            )
            return {
                "allowed": False,
                "error": "model_locked",
                "reason": reason,
                "required_tier": required_tier,
                "plan": tier,
                "tier": tier,
                "category": category,
            }

    # Free users: FREE_PLAN_MODELS always allowed, premium models allowed within daily limit
    if tier == "free" and model_id not in FREE_PLAN_MODELS:
        if category != "premium" or limits.get("premium", 0) == 0:
            return {
                "allowed": False,
                "error": "model_locked",
                "reason": f"Эта модель доступна по подписке от {PLAN_PRICES_RUB['mini']}₽/мес",
                "required_tier": "mini",
                "plan": tier,
                "tier": tier,
                "category": category,
            }
        # premium model on free tier — will be checked by daily limit below

    # Mini users can't access opus
    if tier == "mini" and category == "opus":
        return {
            "allowed": False,
            "error": "model_locked",
            "reason": f"Claude Opus доступен на тарифе Pro от {PLAN_PRICES_RUB['max']}₽/мес",
            "required_tier": "max",
            "plan": tier,
            "tier": tier,
            "category": category,
        }

    row = await get_or_create_today(db, tg_id, tier, lock_for_update=True)
    weight = get_model_weight(model_id)

    # Check by category — must have ENOUGH room for the model's weight, not just any room
    if category == "fast":
        effective = limits["fast"] + row.rollover_fast
        if row.fast_used + weight > effective:
            return _denied(tier, "fast", row.fast_used, effective, row.rollover_fast, limits["fast"])

    elif category == "premium":
        if tier in WEEKLY_TIERS:
            weekly_limit = WEEKLY_LIMITS[tier]["premium"]
            weekly_used = await get_weekly_usage(db, tg_id, "premium")
            if weekly_used + weight > weekly_limit:
                return _denied(tier, "premium", weekly_used, weekly_limit, 0, weekly_limit, weekly=True)
        else:
            effective = limits["premium"] + row.rollover_premium
            if row.premium_used + weight > effective:
                return _denied(tier, "premium", row.premium_used, effective, row.rollover_premium, limits["premium"])

    elif category == "opus":
        if tier in WEEKLY_TIERS:
            opus_weekly = WEEKLY_LIMITS[tier]["opus"]
            premium_weekly = WEEKLY_LIMITS[tier]["premium"]
            opus_used = await get_weekly_usage(db, tg_id, "opus")
            premium_used = await get_weekly_usage(db, tg_id, "premium")
            if opus_used + weight > opus_weekly:
                return _denied(tier, "opus", opus_used, opus_weekly, 0, opus_weekly, weekly=True)
            if premium_used + weight > premium_weekly:
                return _denied(tier, "premium", premium_used, premium_weekly, 0, premium_weekly, weekly=True)
        else:
            opus_effective = limits["opus"] + row.rollover_opus
            premium_effective = limits["premium"] + row.rollover_premium
            if row.opus_used + weight > opus_effective:
                return _denied(tier, "opus", row.opus_used, opus_effective, row.rollover_opus, limits["opus"])
            if row.premium_used + weight > premium_effective:
                return _denied(tier, "premium", row.premium_used, premium_effective, row.rollover_premium, limits["premium"])

    elif category == "image":
        if tier in WEEKLY_TIERS:
            weekly_limit = WEEKLY_LIMITS[tier]["image"]
            weekly_used = await get_weekly_usage(db, tg_id, "image")
            if weekly_used + weight > weekly_limit:
                return _denied(tier, "image", weekly_used, weekly_limit, 0, weekly_limit, weekly=True)
        else:
            if row.image_used + weight > limits["image"]:
                return _denied(tier, "image", row.image_used, limits["image"], 0, limits["image"])

    elif category == "video":
        if tier in WEEKLY_TIERS:
            weekly_limit = WEEKLY_LIMITS[tier]["video"]
            weekly_used = await get_weekly_usage(db, tg_id, "video")
            if weekly_used >= weekly_limit:
                return _denied(tier, "video", weekly_used, weekly_limit, 0, weekly_limit, weekly=True)
        else:
            if row.video_used >= limits["video"]:
                return _denied(tier, "video", row.video_used, limits["video"], 0, limits["video"])

    # Allowed
    return {
        "allowed": True,
        "billing": "free",
        "plan": tier,
        "tier": tier,
        "category": category,
        "used_today": getattr(row, f"{category}_used", 0),
        "limit": limits.get(category, 0) + getattr(row, f"rollover_{category}", 0) if category in ("fast", "premium", "opus") else limits.get(category, 0),
    }


def _denied(tier: str, category: str, used: int, effective: int, rollover: int, daily_base: int, weekly: bool = False) -> dict:
    """Build informative denial response."""
    cat_names = {"fast": "быстрых", "premium": "премиум", "opus": "Opus", "image": "картинок", "video": "видео"}
    reset_at = get_msk_reset_at()

    now = datetime.now(MSK)
    if weekly:
        # Weekly reset: next Monday 00:00 MSK
        days_until_monday = (7 - now.weekday()) % 7 or 7
        reset_point = (now + timedelta(days=days_until_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        hours_left = int((reset_point - now).total_seconds() // 3600)
        mins_left = int(((reset_point - now).total_seconds() % 3600) // 60)
    else:
        tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
        hours_left = int((tomorrow - now).total_seconds() // 3600)
        mins_left = int(((tomorrow - now).total_seconds() % 3600) // 60)

    suggestions = []
    if category in ("premium", "opus"):
        suggestions.append({
            "type": "downgrade_model",
            "message": "Попробуйте GPT-4o mini или Gemini Flash — быстрые модели",
        })
    if tier != "max-pro":
        next_tier = {"free": "mini", "mini": "max", "max": "max-pro"}.get(tier, "max-pro")
        next_limits = DAILY_LIMITS.get(next_tier, {})
        suggestions.append({
            "type": "upgrade_plan",
            "message": f"На тарифе {next_tier.replace('-', ' ').title()} — {next_limits.get(category, '?')}/{cat_names.get(category, category)} в день",
            "url": "/pricing",
        })

    return {
        "allowed": False,
        "error": "daily_limit_exceeded",
        "reason": f"{'Недельный лимит' if weekly else 'Лимит'} {cat_names.get(category, category)}-запросов исчерпан. Обновится через {hours_left}ч {mins_left}мин.",
        "category": category,
        "used_today": used,
        "limit": effective,
        "rollover": rollover,
        "daily_base": daily_base,
        "reset_at": reset_at,
        "plan": tier,
        "tier": tier,
        "billing": "free",
        "suggestions": suggestions,
        "need_balance": False,
        "upgrade_url": "/pricing",
    }


async def increment_usage(db: AsyncSession, tg_id: int, model_id: str, tier: str) -> None:
    """Increment today's counters after successful request, respecting model weight."""
    category = get_model_category(model_id)
    weight = get_model_weight(model_id)
    row = await get_or_create_today(db, tg_id, tier, lock_for_update=True)

    if category == "fast":
        row.fast_used = (row.fast_used or 0) + weight
    elif category == "premium":
        row.premium_used = (row.premium_used or 0) + weight
    elif category == "opus":
        # Opus consumes from BOTH premium pool and opus pool with same weight
        row.premium_used = (row.premium_used or 0) + weight
        row.opus_used = (row.opus_used or 0) + weight
    elif category == "image":
        row.image_used = (row.image_used or 0) + weight
    elif category == "video":
        row.video_used = (row.video_used or 0) + 1  # video uses points system, weight not applied here

    await db.flush()


async def get_limits_info(db: AsyncSession, user: User) -> dict:
    """Full limits info for /api/user/limits endpoint."""
    tier = user.subscription_tier or "free"
    tg_id = user.telegram_id or user.id
    limits = DAILY_LIMITS.get(tier, DAILY_LIMITS["free"])
    reset_video_points_if_needed(user)

    row = await get_or_create_today(db, tg_id, tier)

    # For Pro/Elite: get weekly usage
    weekly_cache: dict[str, int] = {}
    is_weekly = tier in WEEKLY_TIERS
    if is_weekly:
        for cat in ("premium", "opus", "image", "video"):
            weekly_cache[cat] = await get_weekly_usage(db, tg_id, cat)

    def cat_info(cat: str) -> dict:
        # Pro/Elite: premium, opus, image, video = weekly
        if is_weekly and cat in WEEKLY_LIMITS.get(tier, {}):
            wlimit = WEEKLY_LIMITS[tier][cat]
            wused = weekly_cache.get(cat, 0)
            return {
                "used": wused,
                "limit": wlimit,
                "base": wlimit,
                "rollover": 0,
                "available": max(0, wlimit - wused),
                "period": "weekly",
            }
        base = limits.get(cat, 0)
        rollover = getattr(row, f"rollover_{cat}", 0) if cat in ("fast", "premium", "opus") else 0
        used = getattr(row, f"{cat}_used", 0)
        effective = base + rollover
        return {
            "used": used,
            "limit": effective,
            "base": base,
            "rollover": rollover,
            "available": max(0, effective - used),
            "period": "daily",
        }

    video_points = get_video_points_snapshot(user)

    return {
        "plan": tier,
        "date": get_msk_today().isoformat(),
        "reset_at": get_msk_reset_at(),
        "fast": cat_info("fast"),
        "premium": cat_info("premium"),
        "opus": cat_info("opus"),
        "image": cat_info("image"),
        "video": cat_info("video"),
        # Backward compat
        "text": {
            "used": (row.fast_used or 0) + (row.premium_used or 0),
            "limit": limits["fast"] + limits["premium"] + (row.rollover_fast or 0) + (row.rollover_premium or 0),
        },
        "streak": {
            "days": user.login_streak or 0,
        },
        **video_points,
    }


async def process_daily_rollover(db: AsyncSession) -> int:
    """Batch job: calculate rollover for all paid users and create tomorrow's rows."""
    today = get_msk_today()
    tomorrow = today + timedelta(days=1)

    result = await db.execute(
        select(DailyUsage, User.subscription_tier)
        .join(User, User.telegram_id == DailyUsage.user_tg_id)
        .where(DailyUsage.date == today)
        .where(User.subscription_tier.isnot(None))
    )
    rows = result.all()

    count = 0
    for daily_row, sub_tier in rows:
        tier = sub_tier or "free"
        if tier == "free":
            continue

        rate = ROLLOVER_RATE.get(tier, 0)
        if rate <= 0:
            continue

        limits = DAILY_LIMITS[tier]
        cap = ROLLOVER_CAP.get(tier, ROLLOVER_CAP["free"])

        unused_fast = max(0, limits["fast"] + daily_row.rollover_fast - daily_row.fast_used)
        unused_premium = max(0, limits["premium"] + daily_row.rollover_premium - daily_row.premium_used)

        rollover_fast = min(math.floor(unused_fast * rate), cap["fast"])
        rollover_premium = min(math.floor(unused_premium * rate), cap["premium"])

        # Create tomorrow's row (skip if exists)
        try:
            new_row = DailyUsage(
                user_tg_id=daily_row.user_tg_id,
                date=tomorrow,
                rollover_fast=rollover_fast,
                rollover_premium=rollover_premium,
                rollover_opus=0,  # Opus has no rollover
            )
            db.add(new_row)
            await db.flush()
            count += 1
        except Exception:
            pass  # Row already exists

    await db.commit()
    logger.info(f"Daily rollover: {count} users processed for {tomorrow}")
    return count
