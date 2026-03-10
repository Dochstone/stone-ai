"""Rate limiter — checks user permissions and daily limits."""

from datetime import datetime, date, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, Subscription, Pass, Usage
from app.services.ai_router import get_model_tier

# Daily request limits per plan
LIMITS = {
    "free": {"lite": 20, "premium": 0},
    "plus": {"lite": -1, "premium": 100},     # -1 = unlimited
    "max": {"lite": -1, "premium": 500},
}

# Pass limits
PASS_LIMITS = {
    "day": {"premium": 15, "duration_hours": 24},
    "week": {"premium": 80, "duration_hours": 168},
    "single": {"premium": 1, "duration_hours": None},
}


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
        # Check expiration for day/week passes
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


async def check_can_request(db: AsyncSession, tg_id: int, model_id: str) -> dict:
    """
    Check if user can make a request to the specified model.

    Returns:
        {
            "allowed": bool,
            "reason": str | None,
            "plan": str,
            "tier": str,
            "used_today": int,
            "limit": int,
            "has_pass": bool,
        }
    """
    tier = get_model_tier(model_id)
    plan = await get_user_plan(db, tg_id)
    used_today = await get_today_usage(db, tg_id, tier)

    # Check active pass first (overrides plan limits for premium)
    active_pass = None
    if tier == "premium":
        active_pass = await get_active_pass(db, tg_id)
        if active_pass:
            return {
                "allowed": True,
                "reason": None,
                "plan": plan,
                "tier": tier,
                "used_today": used_today,
                "limit": active_pass.requests_left,
                "has_pass": True,
            }

    # Check plan limits
    limit = LIMITS.get(plan, LIMITS["free"]).get(tier, 0)

    if limit == -1:
        return {
            "allowed": True,
            "reason": None,
            "plan": plan,
            "tier": tier,
            "used_today": used_today,
            "limit": -1,
            "has_pass": False,
        }

    if limit == 0:
        return {
            "allowed": False,
            "reason": f"Premium модели доступны по подписке PLUS/MAX или Pass",
            "plan": plan,
            "tier": tier,
            "used_today": used_today,
            "limit": 0,
            "has_pass": False,
        }

    if used_today >= limit:
        return {
            "allowed": False,
            "reason": f"Лимит {limit} {tier} запросов на сегодня исчерпан",
            "plan": plan,
            "tier": tier,
            "used_today": used_today,
            "limit": limit,
            "has_pass": False,
        }

    return {
        "allowed": True,
        "reason": None,
        "plan": plan,
        "tier": tier,
        "used_today": used_today,
        "limit": limit,
        "has_pass": False,
    }


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
        user.total_requests += 1
        user.total_tokens_used += tokens_in + tokens_out
        if tier == "lite":
            user.daily_lite_used += 1
        else:
            user.daily_premium_used += 1

    # Decrement pass if used
    active_pass = await get_active_pass(db, tg_id)
    if active_pass and tier == "premium":
        active_pass.requests_left -= 1
        if active_pass.requests_left <= 0:
            active_pass.is_active = False

    await db.flush()
