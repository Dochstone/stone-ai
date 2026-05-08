"""Referral program — invite friends, both get +5 requests + 10% of deposits."""

import asyncio
import logging
import secrets
import string
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models import User
from app.models.page_view import PageView
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
        select(
            User.username, User.first_name, User.joined_at,
            User.total_deposited_usd, User.subscription_tier,
            User.total_requests, User.last_ip,
        )
        .where(User.referrer_id == tg_id)
        .order_by(User.id.desc())
        .limit(100)
    )
    referrals = []
    total_deposits = 0.0
    paid_count = 0
    for row in refs_result.all():
        dep = round(float(row.total_deposited_usd or 0), 2)
        total_deposits += dep
        if dep > 0:
            paid_count += 1
        referrals.append({
            "name": row.first_name or row.username or "User",
            "joined": row.joined_at.isoformat() if row.joined_at else None,
            "deposited_usd": dep,
            "plan": row.subscription_tier or "free",
            "requests": row.total_requests or 0,
        })

    percent = user.referral_percent if user.referral_percent is not None else REFERRAL_PERCENT
    is_partner = user.referral_percent is not None

    return {
        "referral_code": user.referral_code,
        "referral_count": referral_count,
        "referral_balance": round(float(user.referral_balance or 0), 2),
        "referral_percent": percent,
        "is_partner": is_partner,
        "total_deposits_usd": round(total_deposits, 2),
        "paid_count": paid_count,
        "conversion_pct": round(paid_count / referral_count * 100, 1) if referral_count > 0 else 0,
        "referrals": referrals,
    }


@router.get("/clicks")
async def get_referral_clicks(
    days: int = Query(30, ge=1, le=180),
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Click stats for the partner's referral code: total/unique/daily/by_campaign/by_source."""
    tg_id = tg_user["id"]

    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    if not user.referral_code:
        return {
            "period_days": days,
            "total_clicks": 0,
            "unique_clicks": 0,
            "registrations": 0,
            "conversion_pct": 0,
            "daily": [],
            "by_campaign": [],
            "by_source": [],
        }

    code = user.referral_code
    cutoff = datetime.utcnow() - timedelta(days=days)

    total_clicks = await db.scalar(
        select(func.count()).select_from(PageView).where(
            PageView.ref_code == code, PageView.created_at >= cutoff
        )
    ) or 0

    unique_clicks = await db.scalar(
        select(func.count(func.distinct(PageView.ip_hash))).select_from(PageView).where(
            PageView.ref_code == code, PageView.created_at >= cutoff, PageView.ip_hash.isnot(None)
        )
    ) or 0

    registrations = await db.scalar(
        select(func.count(User.id)).where(
            User.referrer_id == tg_id, User.joined_at >= cutoff
        )
    ) or 0

    daily_result = await db.execute(
        select(
            cast(PageView.created_at, Date).label("day"),
            func.count().label("clicks"),
            func.count(func.distinct(PageView.ip_hash)).label("unique"),
        )
        .where(PageView.ref_code == code, PageView.created_at >= cutoff)
        .group_by(cast(PageView.created_at, Date))
        .order_by(cast(PageView.created_at, Date))
    )
    daily = [{"date": str(r.day), "clicks": r.clicks, "unique": r.unique} for r in daily_result]

    campaign_result = await db.execute(
        select(
            func.coalesce(PageView.utm_campaign, "(none)").label("campaign"),
            func.coalesce(PageView.utm_source, "(none)").label("source"),
            func.count().label("clicks"),
            func.count(func.distinct(PageView.ip_hash)).label("unique"),
        )
        .where(PageView.ref_code == code, PageView.created_at >= cutoff)
        .group_by(PageView.utm_campaign, PageView.utm_source)
        .order_by(func.count().desc())
        .limit(50)
    )
    by_campaign = [
        {"campaign": r.campaign, "source": r.source, "clicks": r.clicks, "unique": r.unique}
        for r in campaign_result
    ]

    source_result = await db.execute(
        select(
            func.coalesce(PageView.utm_source, "(none)").label("source"),
            func.count().label("clicks"),
            func.count(func.distinct(PageView.ip_hash)).label("unique"),
        )
        .where(PageView.ref_code == code, PageView.created_at >= cutoff)
        .group_by(PageView.utm_source)
        .order_by(func.count().desc())
        .limit(20)
    )
    by_source = [
        {"source": r.source, "clicks": r.clicks, "unique": r.unique}
        for r in source_result
    ]

    conversion = round(registrations / unique_clicks * 100, 1) if unique_clicks > 0 else 0.0

    return {
        "period_days": days,
        "total_clicks": total_clicks,
        "unique_clicks": unique_clicks,
        "registrations": registrations,
        "conversion_pct": conversion,
        "daily": daily,
        "by_campaign": by_campaign,
        "by_source": by_source,
    }


async def credit_referrer(db: AsyncSession, user_tg_id: int, deposit_usd: float):
    """Credit referrer with their referral_percent (or global default) of deposit."""
    result = await db.execute(select(User).where(User.telegram_id == user_tg_id))
    user = result.scalar_one_or_none()
    if not user or not user.referrer_id:
        return

    referrer_result = await db.execute(
        select(User).where(User.telegram_id == user.referrer_id).with_for_update()
    )
    referrer = referrer_result.scalar_one_or_none()
    if not referrer:
        return

    percent = referrer.referral_percent if referrer.referral_percent is not None else REFERRAL_PERCENT
    bonus = round(deposit_usd * percent / 100, 6)
    if bonus <= 0:
        return

    referrer.referral_balance = round(float(referrer.referral_balance or 0) + bonus, 6)
    referrer.balance_usd = round(float(referrer.balance_usd or 0) + bonus, 6)

    logger.info(
        f"Referral bonus: referrer={referrer.telegram_id}, "
        f"from_user={user_tg_id}, deposit=${deposit_usd}, percent={percent}%, bonus=${bonus}"
    )
