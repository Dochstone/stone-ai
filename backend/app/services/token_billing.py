"""Token billing service — per-token pricing in USD.

Replaces the old credit-based system (credits.py).
Users pay for actual token usage, not fixed per-request costs.

Pricing: flexible markup over OpenRouter costs (x2.5-6 depending on tier).
Balance stored in USD with 6 decimal places for micro-transactions.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.services.ai_router import MODELS_REGISTRY

# Stone AI prices per 1M tokens — derived from MODELS_REGISTRY
TOKEN_PRICES: dict[str, dict] = {
    m["id"]: {"input": m["price_input"], "output": m["price_output"], "weighted": m["price_weighted"]}
    for m in MODELS_REGISTRY
    if m.get("active", True)
}

# Average tokens per request (for balance estimation)
AVG_TOKENS_PER_REQUEST = 2000


def calculate_cost(model_id: str, tokens_in: int, tokens_out: int) -> float:
    """
    Calculate request cost in USD based on actual token usage.

    Returns:
        float — cost in USD (e.g. 0.004200)
    """
    prices = TOKEN_PRICES.get(model_id)
    if not prices:
        return 0.0
    cost = (tokens_in * prices["input"] + tokens_out * prices["output"]) / 1_000_000
    return round(cost, 6)


def get_weighted_price(model_id: str) -> float:
    """Weighted average price per 1M tokens (40/60 input/output). For display to user."""
    prices = TOKEN_PRICES.get(model_id)
    return prices["weighted"] if prices else 0.0


def estimate_request_cost(model_id: str) -> float:
    """Estimate cost for a typical request (~2K tokens). Used for balance pre-check."""
    weighted = get_weighted_price(model_id)
    return round(weighted * AVG_TOKENS_PER_REQUEST / 1_000_000, 6)


async def get_user_balance(db: AsyncSession, tg_id: int) -> float:
    """Get current USD balance for a user."""
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    return float(user.balance_usd) if user and user.balance_usd else 0.0


async def check_balance(db: AsyncSession, tg_id: int, model_id: str) -> dict:
    """
    Check if user has enough balance for an estimated request.

    Returns:
        {"allowed": bool, "balance": float, "estimated_cost": float, "reason": str | None}
    """
    estimated = estimate_request_cost(model_id)
    balance = await get_user_balance(db, tg_id)

    if balance < estimated:
        return {
            "allowed": False,
            "balance": balance,
            "estimated_cost": estimated,
            "reason": f"Недостаточно средств. Баланс ${balance:.2f}, примерная стоимость ${estimated:.4f}",
        }

    return {
        "allowed": True,
        "balance": balance,
        "estimated_cost": estimated,
        "reason": None,
    }


async def deduct_balance(db: AsyncSession, tg_id: int, amount: float) -> dict:
    """
    Deduct USD from user balance. Atomic operation with FOR UPDATE.
    Called AFTER receiving AI response (not before).

    Returns:
        {"success": bool, "new_balance": float, "deducted": float}
    """
    result = await db.execute(
        select(User).where(User.telegram_id == tg_id).with_for_update()
    )
    user = result.scalar_one_or_none()

    if not user:
        return {"success": False, "new_balance": 0.0, "deducted": 0.0}

    current = float(user.balance_usd or 0)

    if current < amount:
        # Deduct what we can, log the debt
        actual_deduct = current
        user.balance_usd = 0
    else:
        actual_deduct = amount
        user.balance_usd = round(current - amount, 6)

    await db.flush()

    # Track spending for achievements
    if actual_deduct > 0:
        import asyncio
        from app.routers.achievements import check_and_update
        total_spent_rub = round((float(user.total_deposited_usd or 0) - float(user.balance_usd or 0)) * 95)
        asyncio.create_task(check_and_update(tg_id, "spent_rub", max(0, total_spent_rub)))

    return {
        "success": True,
        "new_balance": float(user.balance_usd),
        "deducted": actual_deduct,
    }


async def add_balance(db: AsyncSession, tg_id: int, amount_usd: float) -> float:
    """Add USD to user balance. Returns new balance."""
    result = await db.execute(
        select(User).where(User.telegram_id == tg_id).with_for_update()
    )
    user = result.scalar_one_or_none()

    if not user:
        return 0.0

    user.balance_usd = round(float(user.balance_usd or 0) + amount_usd, 6)
    await db.flush()
    return float(user.balance_usd)
