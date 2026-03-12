"""User endpoint — profile, limits, subscription status."""

from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.services.limiter import (
    get_or_create_user,
    get_today_usage,
)
from app.services.credits import get_user_credits, CREDIT_COSTS

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
    credits = await get_user_credits(db, tg_id)
    lite_today = await get_today_usage(db, tg_id, "lite")

    return {
        "user": {
            "tg_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "language": user.language,
        },
        "plan": "credits",
        "credits": credits,
        "credit_costs": CREDIT_COSTS,
        "usage": {
            "lite_today": lite_today,
        },
        "limits": {
            "lite": 20,
        },
        "stats": {
            "total_requests": user.total_requests,
            "total_tokens": user.total_tokens_used,
        },
    }
