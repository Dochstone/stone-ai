"""User endpoint — profile, limits, balance info, usage history."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.usage import Usage
from app.services.limiter import (
    get_or_create_user,
    get_today_usage,
    FREE_DAILY_LIMIT,
    REWARDED_BONUS,
)
from app.services.token_billing import get_user_balance, TOKEN_PRICES

router = APIRouter(prefix="/api", tags=["user"])


@router.get("/user/me")
async def get_me(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user profile with limits, balance, and pricing info.

    Returns per-token billing data instead of credit-based system.
    """
    tg_id = tg_user["id"]
    user = await get_or_create_user(db, tg_user)
    balance = await get_user_balance(db, tg_id)
    lite_today = await get_today_usage(db, tg_id, "lite")
    rewarded_bonus = int(user.rewarded_today or 0)

    # Build model prices map for frontend
    model_prices = {}
    for model_id, prices in TOKEN_PRICES.items():
        model_prices[model_id] = {
            "input_per_m": prices["input"],
            "output_per_m": prices["output"],
            "weighted_per_m": prices["weighted"],
        }

    return {
        "user": {
            "tg_id": user.telegram_id,
            "username": user.username,
            "first_name": user.first_name,
            "language": user.language,
        },
        "plan": "per_token",
        "balance_usd": balance,
        "model_prices": model_prices,
        "usage": {
            "lite_today": lite_today,
        },
        "limits": {
            "lite": FREE_DAILY_LIMIT + rewarded_bonus,
            "lite_base": FREE_DAILY_LIMIT,
            "rewarded_bonus": rewarded_bonus,
            "rewarded_max": REWARDED_BONUS,
        },
        "stats": {
            "total_requests": user.total_requests or 0,
            "total_tokens": user.total_tokens_used or 0,
        },
    }


@router.get("/user/usage-history")
async def get_usage_history(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=20, le=100),
):
    """Get last N usage records for the current user."""
    result = await db.execute(
        select(Usage)
        .where(Usage.user_tg_id == tg_user["id"])
        .order_by(Usage.created_at.desc())
        .limit(limit)
    )
    rows = result.scalars().all()

    return {
        "history": [
            {
                "model_id": r.model_id,
                "tier": r.tier,
                "tokens_in": r.tokens_in,
                "tokens_out": r.tokens_out,
                "cost_usd": float(r.cost_usd or 0),
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    }
