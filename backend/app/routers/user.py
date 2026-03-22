"""User endpoint — profile, limits, balance info, usage history."""

from fastapi import APIRouter, Depends, Query, Request, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.web_auth import extract_jwt_from_request, decode_jwt
from app.models import User
from app.models.usage import Usage
from app.services.limiter import (
    get_or_create_user,
    get_today_usage,
    get_free_limits,
    FREE_DAILY_LIMIT,
    REWARDED_BONUS,
)
from app.services.subscription import PLANS, CREDIT_COSTS, get_accessible_models
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
        "total_deposited_usd": round(float(user.total_deposited_usd or 0), 2),
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


@router.get("/user/transactions")
async def get_transactions(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=20, le=100),
):
    """Get last N payment transactions for the current user."""
    from app.models.transaction import Transaction

    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_tg_id == tg_user["id"])
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    )
    rows = result.scalars().all()

    return {
        "transactions": [
            {
                "amount_usd": float(r.amount_usd or 0),
                "amount": float(r.amount or 0),
                "currency": r.currency,
                "status": r.status,
                "product_type": r.product_type,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    }


@router.get("/user/limits")
async def user_limits(request: Request, db: AsyncSession = Depends(get_db)):
    """Get current usage limits for the authenticated user."""
    # Try JWT first (web), then TG auth
    token = extract_jwt_from_request(request)
    if token:
        payload = decode_jwt(token)
        user_id = int(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
    else:
        # Try TG auth
        try:
            tg_user = await get_current_user(request)
            result = await db.execute(select(User).where(User.telegram_id == tg_user["id"]))
            user = result.scalar_one_or_none()
        except Exception:
            raise HTTPException(status_code=401, detail="Not authenticated")

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return await get_free_limits(db, user)


@router.get("/plans")
async def list_plans():
    """Return available subscription plans for /pricing page."""
    result = []
    for tier, plan in PLANS.items():
        result.append({
            "id": tier,
            "name": plan["name"],
            "price_rub": plan["price_rub"],
            "limits": plan["limits"],
            "period": plan["period"],
            "features": plan["features"],
        })
    return {"plans": result}
