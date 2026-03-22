"""User endpoint — profile, limits, balance info, usage history, subscriptions."""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query, Request, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
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
from app.services.promo import apply_promo

router = APIRouter(prefix="/api", tags=["user"])


class SubscribeRequest(BaseModel):
    tier: str  # mini, max, max-pro

class PromoRequest(BaseModel):
    code: str


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


@router.post("/subscribe")
async def subscribe(req: SubscribeRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Activate a subscription plan. Deducts from USD balance at current exchange rate."""
    if req.tier not in PLANS or req.tier == "free":
        raise HTTPException(400, "Недопустимый тариф")

    plan = PLANS[req.tier]
    price_rub = plan["price_rub"]
    usd_rate = 95.0  # ~95 RUB/USD
    price_usd = round(price_rub / usd_rate, 2)

    # Auth — JWT or TG
    token = extract_jwt_from_request(request)
    if token:
        payload = decode_jwt(token)
        user_id = int(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
    else:
        try:
            tg_user = await get_current_user(request)
            result = await db.execute(select(User).where(User.telegram_id == tg_user["id"]))
            user = result.scalar_one_or_none()
        except Exception:
            raise HTTPException(401, "Не авторизован")

    if not user:
        raise HTTPException(404, "Пользователь не найден")

    balance = float(user.balance_usd or 0)
    if balance < price_usd:
        raise HTTPException(
            402,
            {
                "error": "insufficient_balance",
                "message": f"Недостаточно средств. Нужно ${price_usd:.2f}, баланс ${balance:.2f}. Пополните баланс.",
                "required": price_usd,
                "balance": balance,
                "topup_url": "/topup",
            },
        )

    # Deduct balance
    user.balance_usd = round(balance - price_usd, 6)

    # Activate subscription
    now = datetime.utcnow()
    user.subscription_tier = req.tier
    user.credits_balance = plan["credits"]
    user.subscription_started = now
    user.credits_reset_date = now + timedelta(days=30)

    # Reset monthly counters
    user.monthly_fast_used = 0
    user.monthly_premium_used = 0
    user.monthly_images_used = 0
    user.monthly_videos_used = 0
    user.monthly_3d_used = 0
    user.monthly_audio_used = 0
    user.opus_requests_used = 0

    await db.flush()

    return {
        "status": "ok",
        "tier": req.tier,
        "plan_name": plan["name"],
        "price_rub": price_rub,
        "price_usd": price_usd,
        "credits": plan["credits"],
        "expires": user.credits_reset_date.isoformat(),
        "new_balance_usd": float(user.balance_usd),
    }


@router.post("/promo")
async def apply_promo_code(req: PromoRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Apply a promo code to get bonus balance or credits."""
    token = extract_jwt_from_request(request)
    if token:
        payload = decode_jwt(token)
        user_id = int(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
    else:
        try:
            tg_user = await get_current_user(request)
            result = await db.execute(select(User).where(User.telegram_id == tg_user["id"]))
            user = result.scalar_one_or_none()
        except Exception:
            raise HTTPException(401, "Не авторизован")

    if not user:
        raise HTTPException(404, "Пользователь не найден")

    promo_result = await apply_promo(db, user, req.code)
    if not promo_result["ok"]:
        raise HTTPException(400, promo_result["error"])

    return promo_result


@router.get("/referral")
async def get_referral_info(request: Request, db: AsyncSession = Depends(get_db)):
    """Get referral link and stats."""
    token = extract_jwt_from_request(request)
    if token:
        payload = decode_jwt(token)
        user_id = int(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
    else:
        try:
            tg_user = await get_current_user(request)
            result = await db.execute(select(User).where(User.telegram_id == tg_user["id"]))
            user = result.scalar_one_or_none()
        except Exception:
            raise HTTPException(401, "Не авторизован")

    if not user:
        raise HTTPException(404, "Пользователь не найден")

    # Generate referral code if not exists
    if not user.referral_code:
        import hashlib
        user.referral_code = hashlib.md5(str(user.id).encode()).hexdigest()[:8]
        await db.flush()

    # Count referrals
    ref_count = await db.scalar(
        select(func.count()).select_from(User).where(User.referrer_id == user.telegram_id)
    ) or 0

    from app.services.subscription import PLANS
    from app.services.limiter import _hours_until_reset

    return {
        "referral_code": user.referral_code,
        "referral_link": f"https://stoneai.ru/webchat?ref={user.referral_code}",
        "referral_count": ref_count,
        "referral_balance": round(float(user.referral_balance or 0), 2),
        "referral_percent": 10,  # 10% from each referral top-up
    }
