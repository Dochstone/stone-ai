"""User endpoint — profile, limits, subscription status."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.services.limiter import (
    get_or_create_user,
    get_user_plan,
    get_today_usage,
    get_active_subscription,
    get_active_pass,
)

router = APIRouter(prefix="/api", tags=["user"])


@router.get("/user/me")
async def get_me(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user profile with limits and subscription info.

    Returns:
        {
            "user": { tg_id, username, first_name, ... },
            "plan": "free" | "plus" | "max",
            "subscription": { plan, expires_at } | null,
            "pass": { type, requests_left, expires_at } | null,
            "usage": { lite_today, premium_today },
            "limits": { lite: 20, premium: 0 },
            "stats": { total_requests, total_tokens }
        }
    """
    tg_id = tg_user["id"]
    user = await get_or_create_user(db, tg_user)
    plan = await get_user_plan(db, tg_id)
    sub = await get_active_subscription(db, tg_id)
    active_pass = await get_active_pass(db, tg_id)
    lite_today = await get_today_usage(db, tg_id, "lite")
    premium_today = await get_today_usage(db, tg_id, "premium")

    from app.services.limiter import LIMITS
    limits = LIMITS.get(plan, LIMITS["free"])

    return {
        "user": {
            "tg_id": user.tg_id,
            "username": user.username,
            "first_name": user.first_name,
            "language": user.language,
        },
        "plan": plan,
        "subscription": {
            "plan": sub.plan,
            "expires_at": sub.expires_at.isoformat(),
            "payment_method": sub.payment_method,
        } if sub else None,
        "pass": {
            "type": active_pass.pass_type,
            "requests_left": active_pass.requests_left,
            "expires_at": active_pass.expires_at.isoformat() if active_pass.expires_at else None,
        } if active_pass else None,
        "usage": {
            "lite_today": lite_today,
            "premium_today": premium_today,
        },
        "limits": {
            "lite": limits["lite"],
            "premium": limits["premium"],
        },
        "stats": {
            "total_requests": user.total_requests,
            "total_tokens": user.total_tokens_used,
            "days_active": (user.updated_at - user.created_at).days + 1 if user.updated_at else 1,
        },
    }
