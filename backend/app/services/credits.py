"""Credits service — credit-based billing for premium models.

Lite models: always free (20 req/day limit)
Premium models: deduct credits per request

Credit costs per request (margin ~100-110% over cost):
  Opus 4:          34 credits  (~1.7₽ cost → 34₽ price, 100% margin)
  GPT-4.1:         15 credits  (~0.7₽ cost → 15₽ price, 110% margin)
  Gemini 2.5 Pro:  13 credits  (~0.6₽ cost → 13₽ price, 110% margin)
  Grok 3:          19 credits  (~0.9₽ cost → 19₽ price, 110% margin)
  Perplexity Pro:  19 credits  (~0.9₽ cost → 19₽ price, 110% margin)
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User

# Credits deducted per premium model request
CREDIT_COSTS: dict[str, int] = {
    "gpt-4.1":              15,
    "claude-opus-4":        34,
    "grok-3":               19,
    "gemini-2.5-pro":       13,
    "perplexity-sonar-pro": 19,
}

# Credit packages available for purchase (Stars)
CREDIT_PACKAGES = {
    "credits_100": {
        "credits":  100,
        "price":     99,   # Telegram Stars
        "name":     "100 кредитов",
        "popular":  False,
    },
    "credits_350": {
        "credits":  350,
        "price":    349,
        "name":     "350 кредитов",
        "popular":  False,
    },
    "credits_1000": {
        "credits":  1000,
        "price":    990,
        "name":     "1000 кредитов",
        "popular":  True,
    },
    "credits_3000": {
        "credits":  3000,
        "price":    2490,
        "name":     "3000 кредитов",
        "popular":  False,
    },
}


def get_credit_cost(model_id: str) -> int:
    """Get credit cost for a premium model. Returns 0 for lite models."""
    return CREDIT_COSTS.get(model_id, 0)


async def get_user_credits(db: AsyncSession, tg_id: int) -> int:
    """Get current credit balance for a user."""
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    return user.credits if user and user.credits else 0


async def deduct_credits(db: AsyncSession, tg_id: int, amount: int) -> bool:
    """
    Deduct credits from user balance.
    Returns True if successful, False if insufficient balance.
    """
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()

    if not user or user.credits < amount:
        return False

    user.credits -= amount
    await db.flush()
    return True


async def add_credits(db: AsyncSession, tg_id: int, amount: int) -> int:
    """Add credits to user balance. Returns new balance."""
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()

    if not user:
        return 0

    user.credits = (user.credits or 0) + amount
    await db.flush()
    return user.credits


async def check_can_use_premium(db: AsyncSession, tg_id: int, model_id: str) -> dict:
    """
    Check if user can use a premium model.
    Returns allowed status and credit info.
    """
    cost = get_credit_cost(model_id)
    if cost == 0:
        return {"allowed": True, "cost": 0, "balance": 0, "reason": None}

    balance = await get_user_credits(db, tg_id)

    if balance < cost:
        return {
            "allowed": False,
            "cost": cost,
            "balance": balance,
            "reason": f"Недостаточно кредитов. Нужно {cost}, у тебя {balance}",
        }

    return {
        "allowed": True,
        "cost": cost,
        "balance": balance,
        "reason": None,
    }
