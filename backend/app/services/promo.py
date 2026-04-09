"""Promo code system — bonus days, credits, discounts on subscriptions."""

import logging
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.services.subscription import PLANS

logger = logging.getLogger(__name__)

# Promo codes
# type: "days" = free days of a tier, "credits" = bonus credits, "discount" = % off first month
PROMO_CODES = {
    "STONE7": {
        "type": "days",
        "tier": "mini",
        "days": 7,
        "max_uses": 5000,
        "one_per_user": True,
        "desc": "7 дней Start бесплатно",
    },
    "WELCOME": {
        "type": "days",
        "tier": "mini",
        "days": 3,
        "max_uses": 10000,
        "one_per_user": True,
        "desc": "3 дня Start бесплатно",
    },
    "MAXFREE": {
        "type": "days",
        "tier": "max",
        "days": 3,
        "max_uses": 2000,
        "one_per_user": True,
        "desc": "3 дня Pro бесплатно",
    },
    "BONUS500": {
        "type": "credits",
        "credits": 500,
        "max_uses": 3000,
        "one_per_user": True,
        "desc": "+500 кредитов к текущему тарифу",
    },
    "BLOGSTONE": {
        "type": "days",
        "tier": "mini",
        "days": 7,
        "max_uses": 1000,
        "one_per_user": True,
        "desc": "7 дней Start бесплатно (для читателей блога)",
    },
}

# In-memory usage tracking (MVP — move to DB later)
_promo_usage: dict[str, set[int]] = {code: set() for code in PROMO_CODES}
_promo_total_uses: dict[str, int] = {code: 0 for code in PROMO_CODES}


async def apply_promo(db: AsyncSession, user: User, code: str) -> dict:
    """Apply promo code to user."""
    code = code.strip().upper()

    if code not in PROMO_CODES:
        return {"ok": False, "error": "Промокод не найден"}

    promo = PROMO_CODES[code]

    if _promo_total_uses.get(code, 0) >= promo["max_uses"]:
        return {"ok": False, "error": "Промокод больше не действует"}

    if promo["one_per_user"] and user.id in _promo_usage.get(code, set()):
        return {"ok": False, "error": "Вы уже использовали этот промокод"}

    now = datetime.now(timezone.utc)
    message = ""

    if promo["type"] == "days":
        # Give free days of a subscription tier
        tier = promo["tier"]
        days = promo["days"]
        plan = PLANS.get(tier, PLANS["mini"])

        user.subscription_tier = tier
        user.credits_balance = int(user.credits_balance or 0) + plan["credits"]
        user.subscription_started = now
        user.credits_reset_date = now + timedelta(days=days)

        # Reset counters
        user.monthly_fast_used = 0
        user.monthly_premium_used = 0
        user.monthly_images_used = 0
        user.monthly_videos_used = 0
        user.monthly_3d_used = 0
        user.monthly_audio_used = 0
        user.opus_requests_used = 0

        message = f"Тариф {plan['name']} активирован на {days} дней бесплатно!"

    elif promo["type"] == "credits":
        credits = promo["credits"]
        user.credits_balance = int(user.credits_balance or 0) + credits
        message = f"+{credits} кредитов добавлено к вашему тарифу!"

    await db.flush()

    _promo_usage.setdefault(code, set()).add(user.id)
    _promo_total_uses[code] = _promo_total_uses.get(code, 0) + 1

    logger.info(f"Promo {code} applied for user {user.id}: {promo['desc']}")

    return {
        "ok": True,
        "message": message,
        "promo_type": promo["type"],
        "tier": user.subscription_tier,
    }
