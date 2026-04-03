"""Referral program — invite friends, both get +5 requests + 10% of deposits."""

import asyncio
import logging
import secrets
import string

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models import User
from app.routers.achievements import check_and_update

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/referral", tags=["referral"])

REFERRAL_PERCENT = 10  # 10% of deposit
REFERRAL_BONUS_REQUESTS = 5  # both referrer and referred get +5 fast requests


def _generate_code() -> str:
    chars = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(chars) for _ in range(8))


class ApplyCodeRequest(BaseModel):
    code: str


@router.get("/me")
async def get_my_referral(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get or create referral code for current user."""
    tg_id = tg_user["id"]

    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    # Generate code if missing
    if not user.referral_code:
        for _ in range(10):  # retry on collision
            code = _generate_code()
            existing = await db.execute(select(User).where(User.referral_code == code))
            if not existing.scalar_one_or_none():
                user.referral_code = code
                await db.flush()
                break
        await db.commit()

    return {
        "referral_code": user.referral_code,
        "referral_balance": round(float(user.referral_balance or 0), 2),
        "referrer_id": user.referrer_id,
    }


@router.post("/apply")
async def apply_referral_code(
    body: ApplyCodeRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Apply a referral code. Links current user to referrer."""
    tg_id = tg_user["id"]
    code = body.code.strip().upper()

    if not code or len(code) < 4:
        raise HTTPException(400, "Неверный реферальный код")

    # Get current user
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    # Already has referrer
    if user.referrer_id:
        raise HTTPException(400, "Реферальный код уже применён")

    # Find referrer by code
    result = await db.execute(select(User).where(User.referral_code == code))
    referrer = result.scalar_one_or_none()
    if not referrer:
        raise HTTPException(404, "Код не найден")

    # Can't refer yourself
    if referrer.telegram_id == tg_id:
        raise HTTPException(400, "Нельзя использовать свой код")

    user.referrer_id = referrer.telegram_id

    # Grant bonus requests to both
    from app.services.daily_limits import get_or_create_today
    user_tier = user.subscription_tier or "free"
    referrer_tier = referrer.subscription_tier or "free"

    user_row = await get_or_create_today(db, tg_id, user_tier)
    if user_row:
        user_row.rollover_fast = (user_row.rollover_fast or 0) + REFERRAL_BONUS_REQUESTS

    referrer_tg = referrer.telegram_id or referrer.id
    referrer_row = await get_or_create_today(db, referrer_tg, referrer_tier)
    if referrer_row:
        referrer_row.rollover_fast = (referrer_row.rollover_fast or 0) + REFERRAL_BONUS_REQUESTS

    await db.commit()

    # Achievement: referrals (count for the referrer)
    referrer_tg_id = referrer.telegram_id or referrer.id
    # Count total referrals for the referrer
    referral_count_result = await db.execute(
        select(func.count(User.id)).where(User.referrer_id == referrer_tg_id)
    )
    total_referrals = referral_count_result.scalar() or 0
    asyncio.create_task(check_and_update(referrer_tg_id, "referrals", total_referrals))

    logger.info(f"Referral applied: user={tg_id} referred_by={referrer.telegram_id}, +{REFERRAL_BONUS_REQUESTS} requests each")

    return {
        "status": "ok",
        "message": f"Вы и ваш друг получили +{REFERRAL_BONUS_REQUESTS} запросов! А ещё {REFERRAL_PERCENT}% от пополнений.",
        "bonus_requests": REFERRAL_BONUS_REQUESTS,
    }


@router.get("/stats")
async def get_referral_stats(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get referral stats: how many invited, total earned."""
    tg_id = tg_user["id"]

    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    # Count referred users
    count_result = await db.execute(
        select(func.count(User.id)).where(User.referrer_id == tg_id)
    )
    referral_count = count_result.scalar() or 0

    # Get referred users details
    refs_result = await db.execute(
        select(User.username, User.first_name, User.joined_at, User.total_deposited_usd)
        .where(User.referrer_id == tg_id)
        .order_by(User.id.desc())
        .limit(50)
    )
    referrals = [
        {
            "name": row.first_name or row.username or "User",
            "joined": row.joined_at.isoformat() if row.joined_at else None,
            "deposited_usd": round(float(row.total_deposited_usd or 0), 2),
        }
        for row in refs_result.all()
    ]

    return {
        "referral_code": user.referral_code,
        "referral_count": referral_count,
        "referral_balance": round(float(user.referral_balance or 0), 2),
        "referral_percent": REFERRAL_PERCENT,
        "referrals": referrals,
    }


async def credit_referrer(db: AsyncSession, user_tg_id: int, deposit_usd: float):
    """Credit referrer with REFERRAL_PERCENT of deposit. Call after successful payment."""
    result = await db.execute(select(User).where(User.telegram_id == user_tg_id))
    user = result.scalar_one_or_none()
    if not user or not user.referrer_id:
        return

    bonus = round(deposit_usd * REFERRAL_PERCENT / 100, 6)
    if bonus <= 0:
        return

    referrer_result = await db.execute(
        select(User).where(User.telegram_id == user.referrer_id).with_for_update()
    )
    referrer = referrer_result.scalar_one_or_none()
    if not referrer:
        return

    referrer.referral_balance = round(float(referrer.referral_balance or 0) + bonus, 6)
    referrer.balance_usd = round(float(referrer.balance_usd or 0) + bonus, 6)

    logger.info(
        f"Referral bonus: referrer={referrer.telegram_id}, "
        f"from_user={user_tg_id}, deposit=${deposit_usd}, bonus=${bonus}"
    )
