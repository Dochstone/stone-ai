"""Promo code system — bonus days, credits, discounts on subscriptions."""

import json
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

from sqlalchemy import func, select, text


def apply_discount(price_rub: float, user: User) -> tuple[float, str | None]:
    """Apply pending discount to price. Returns (discounted_price, description)."""
    if not user.pending_discount:
        return price_rub, None
    try:
        d = json.loads(user.pending_discount)
    except (json.JSONDecodeError, TypeError):
        return price_rub, None

    if d["type"] == "percent":
        discount = round(price_rub * d["value"] / 100)
        new_price = max(1, price_rub - discount)
        desc = f"-{d['value']}% (промокод {d.get('code', '')})"
    elif d["type"] == "rub":
        new_price = max(1, price_rub - d["value"])
        desc = f"-{d['value']}₽ (промокод {d.get('code', '')})"
    else:
        return price_rub, None

    return new_price, desc


def clear_discount(user: User) -> None:
    """Clear pending discount after it has been used."""
    user.pending_discount = None


async def _count_promo_uses(db: AsyncSession, code: str) -> int:
    """Count total uses of a promo code from DB."""
    result = await db.execute(
        text("SELECT COUNT(*) FROM users WHERE used_promo_codes LIKE :pattern"),
        {"pattern": f"%{code}%"},
    )
    return result.scalar() or 0


async def apply_promo(db: AsyncSession, user: User, code: str) -> dict:
    """Apply promo code to user."""
    code = code.strip().upper()

    if code not in PROMO_CODES:
        return {"ok": False, "error": "Промокод не найден"}

    promo = PROMO_CODES[code]

    total_uses = await _count_promo_uses(db, code)
    if total_uses >= promo["max_uses"]:
        return {"ok": False, "error": "Промокод больше не действует"}

    used_codes = (user.used_promo_codes or "").split(",")
    if promo["one_per_user"] and code in used_codes:
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

    elif promo["type"] == "discount_percent":
        pct = promo.get("discount_value", 0)
        if pct <= 0 or pct > 100:
            return {"ok": False, "error": "Некорректная скидка"}
        user.pending_discount = json.dumps({"type": "percent", "value": pct, "code": code})
        message = f"Скидка {pct}% будет применена при следующей оплате подписки!"

    elif promo["type"] == "discount_rub":
        rub = promo.get("discount_value", 0)
        if rub <= 0:
            return {"ok": False, "error": "Некорректная скидка"}
        user.pending_discount = json.dumps({"type": "rub", "value": rub, "code": code})
        message = f"Скидка {rub}₽ будет применена при следующей оплате подписки!"

    existing = (user.used_promo_codes or "").strip(",")
    user.used_promo_codes = f"{existing},{code}" if existing else code
    await db.flush()

    logger.info(f"Promo {code} applied for user {user.id}: {promo['desc']}")

    return {
        "ok": True,
        "message": message,
        "promo_type": promo["type"],
        "tier": user.subscription_tier,
    }
