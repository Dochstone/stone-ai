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

logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════
# Constants
# ═══════════════════════════════════════════════════════════

MSK = timezone(timedelta(hours=3))

DAILY_LIMITS = {
    "free":     {"fast": 10, "premium": 0,  "opus": 0,  "image": 2, "video": 1},
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
    "claude-opus-4", "claude-opus-4.5", "o3",
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
    "cogvideox", "mochi",
}

# Models available on free plan — only 7 models (everything else is locked)
FREE_PLAN_MODELS = {
    "gpt-4o-mini", "claude-haiku-4.5", "gemini-2.0-flash",
    "deepseek-v3", "llama-4-maverick", "mistral-large-25",
    "nano-banana",  # 2 free images
    "veo-3",        # 1 free video
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

async def get_or_create_today(db: AsyncSession, tg_id: int, tier: str) -> DailyUsage:
    """Get or create today's DailyUsage row, calculating rollover from yesterday."""
    today = get_msk_today()

    # Try to find today's row
    result = await db.execute(
        select(DailyUsage).where(
            DailyUsage.user_tg_id == tg_id,
            DailyUsage.date == today,
        )
    )
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
        result = await db.execute(
            select(DailyUsage).where(
                DailyUsage.user_tg_id == tg_id,
                DailyUsage.date == today,
            )
        )
        row = result.scalar_one_or_none()

    return row


async def check_daily_limit(
    db: AsyncSession, tg_id: int, model_id: str, tier: str, balance: float = 0
) -> dict:
    """Check if user can make a request. Returns allow/deny with details."""
    # Chat always uses daily limits — balance is for dashboard tools only.
    category = get_model_category(model_id)
    limits = DAILY_LIMITS.get(tier, DAILY_LIMITS["free"])

    # Free users can only use FREE_PLAN_MODELS
    if tier == "free" and model_id not in FREE_PLAN_MODELS:
        return {
            "allowed": False,
            "error": "model_locked",
            "reason": f"Эта модель доступна по подписке от 390₽/мес",
            "required_tier": "mini",
            "plan": tier,
            "tier": tier,
            "category": category,
        }

    # Mini users can't access opus
    if tier == "mini" and category == "opus":
        return {
            "allowed": False,
            "error": "model_locked",
            "reason": f"Claude Opus доступен на тарифе Max от 890₽/мес",
            "required_tier": "max",
            "plan": tier,
            "tier": tier,
            "category": category,
        }

    row = await get_or_create_today(db, tg_id, tier)

    # Check by category
    if category == "fast":
        effective = limits["fast"] + row.rollover_fast
        if row.fast_used >= effective:
            return _denied(tier, "fast", row.fast_used, effective, row.rollover_fast, limits["fast"])

    elif category == "premium":
        if tier in WEEKLY_TIERS:
            weekly_limit = WEEKLY_LIMITS[tier]["premium"]
            weekly_used = await get_weekly_usage(db, tg_id, "premium")
            if weekly_used >= weekly_limit:
                return _denied(tier, "premium", weekly_used, weekly_limit, 0, weekly_limit, weekly=True)
        else:
            effective = limits["premium"] + row.rollover_premium
            if row.premium_used >= effective:
                return _denied(tier, "premium", row.premium_used, effective, row.rollover_premium, limits["premium"])

    elif category == "opus":
        if tier in WEEKLY_TIERS:
            opus_weekly = WEEKLY_LIMITS[tier]["opus"]
            premium_weekly = WEEKLY_LIMITS[tier]["premium"]
            opus_used = await get_weekly_usage(db, tg_id, "opus")
            premium_used = await get_weekly_usage(db, tg_id, "premium")
            if opus_used >= opus_weekly:
                return _denied(tier, "opus", opus_used, opus_weekly, 0, opus_weekly, weekly=True)
            if premium_used >= premium_weekly:
                return _denied(tier, "premium", premium_used, premium_weekly, 0, premium_weekly, weekly=True)
        else:
            opus_effective = limits["opus"] + row.rollover_opus
            premium_effective = limits["premium"] + row.rollover_premium
            if row.opus_used >= opus_effective:
                return _denied(tier, "opus", row.opus_used, opus_effective, row.rollover_opus, limits["opus"])
            if row.premium_used >= premium_effective:
                return _denied(tier, "premium", row.premium_used, premium_effective, row.rollover_premium, limits["premium"])

    elif category == "image":
        if tier in WEEKLY_TIERS:
            weekly_limit = WEEKLY_LIMITS[tier]["image"]
            weekly_used = await get_weekly_usage(db, tg_id, "image")
            if weekly_used >= weekly_limit:
                return _denied(tier, "image", weekly_used, weekly_limit, 0, weekly_limit, weekly=True)
        else:
            if row.image_used >= limits["image"]:
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
    """Increment today's counters after successful request."""
    category = get_model_category(model_id)
    row = await get_or_create_today(db, tg_id, tier)

    if category == "fast":
        row.fast_used = (row.fast_used or 0) + 1
    elif category == "premium":
        row.premium_used = (row.premium_used or 0) + 1
    elif category == "opus":
        row.premium_used = (row.premium_used or 0) + 1
        row.opus_used = (row.opus_used or 0) + 1
    elif category == "image":
        row.image_used = (row.image_used or 0) + 1
    elif category == "video":
        row.video_used = (row.video_used or 0) + 1

    await db.flush()


async def get_limits_info(db: AsyncSession, user: User) -> dict:
    """Full limits info for /api/user/limits endpoint."""
    tier = user.subscription_tier or "free"
    tg_id = user.telegram_id or user.id
    limits = DAILY_LIMITS.get(tier, DAILY_LIMITS["free"])

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
