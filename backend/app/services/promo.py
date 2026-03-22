"""Promo code system — bonus credits on first top-up or subscription."""

import os
import logging
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User

logger = logging.getLogger(__name__)

# Promo codes: code -> {bonus_usd, bonus_credits, max_uses, tier_required, one_per_user}
PROMO_CODES = {
    "STONE50": {"bonus_usd": 0.50, "bonus_credits": 0, "max_uses": 1000, "one_per_user": True, "desc": "+$0.50 к балансу"},
    "WELCOME": {"bonus_usd": 0.30, "bonus_credits": 0, "max_uses": 5000, "one_per_user": True, "desc": "+$0.30 к балансу"},
    "MAX100": {"bonus_usd": 1.00, "bonus_credits": 500, "max_uses": 500, "one_per_user": True, "desc": "+$1 + 500 кредитов"},
}

# In-memory usage tracking (for MVP — move to DB table later)
_promo_usage: dict[str, set[int]] = {code: set() for code in PROMO_CODES}
_promo_total_uses: dict[str, int] = {code: 0 for code in PROMO_CODES}


async def apply_promo(db: AsyncSession, user: User, code: str) -> dict:
    """Apply promo code to user. Returns result dict."""
    code = code.strip().upper()

    if code not in PROMO_CODES:
        return {"ok": False, "error": "Промокод не найден"}

    promo = PROMO_CODES[code]

    # Check max uses
    if _promo_total_uses.get(code, 0) >= promo["max_uses"]:
        return {"ok": False, "error": "Промокод больше не действует"}

    # Check one per user
    if promo["one_per_user"] and user.id in _promo_usage.get(code, set()):
        return {"ok": False, "error": "Вы уже использовали этот промокод"}

    # Apply bonus
    bonus_usd = promo["bonus_usd"]
    bonus_credits = promo["bonus_credits"]

    if bonus_usd > 0:
        user.balance_usd = round(float(user.balance_usd or 0) + bonus_usd, 6)

    if bonus_credits > 0:
        user.credits_balance = int(user.credits_balance or 0) + bonus_credits

    await db.flush()

    # Track usage
    _promo_usage.setdefault(code, set()).add(user.id)
    _promo_total_uses[code] = _promo_total_uses.get(code, 0) + 1

    logger.info(f"Promo {code} applied for user {user.id}: +${bonus_usd} +{bonus_credits}cr")

    parts = []
    if bonus_usd > 0:
        parts.append(f"+${bonus_usd:.2f} к балансу")
    if bonus_credits > 0:
        parts.append(f"+{bonus_credits} кредитов")

    return {
        "ok": True,
        "message": f"Промокод активирован! {', '.join(parts)}",
        "bonus_usd": bonus_usd,
        "bonus_credits": bonus_credits,
        "new_balance": float(user.balance_usd),
    }
