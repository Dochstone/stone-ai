"""Payment endpoints — Stars + Fiat (YooKassa) invoices for credits."""

import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models import Transaction
from app.services.credits import add_credits, get_user_credits

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payment", tags=["payment"])

# Pricing
CREDIT_PRICE_STANDARD = 1.1    # USD per credit
CREDIT_PRICE_VIP = 1.0         # USD per credit (total deposited > $10,000)
VIP_THRESHOLD_USD = 10000.0
STAR_PRICE_USD = 0.013          # 1 Telegram Star ≈ $0.013


def credits_for_usd(usd: float, is_vip: bool) -> int:
    price = CREDIT_PRICE_VIP if is_vip else CREDIT_PRICE_STANDARD
    return max(0, int(usd / price))


class TopUpRequest(BaseModel):
    usd_amount: float       # how much user wants to spend
    credits: int            # how many credits to receive (pre-calculated by frontend)
    method: str             # "stars" | "fiat"


@router.post("/stars/create-invoice")
async def create_stars_invoice(
    req: TopUpRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.usd_amount < 1.0:
        raise HTTPException(status_code=400, detail="Минимальная сумма $1")
    if req.credits <= 0:
        raise HTTPException(status_code=400, detail="Некорректное количество кредитов")

    # Verify credits match the user's current price tier
    from sqlalchemy import text
    result = await db.execute(
        text("SELECT total_deposited_usd FROM users WHERE tg_id = :tid"),
        {"tid": tg_user["id"]}
    )
    row = result.fetchone()
    is_vip = (row[0] or 0.0) >= VIP_THRESHOLD_USD if row else False
    expected_credits = credits_for_usd(req.usd_amount, is_vip)

    # Allow ±1 rounding difference
    if abs(expected_credits - req.credits) > 1:
        raise HTTPException(status_code=400, detail="Несоответствие суммы и кредитов")

    stars_amount = max(1, round(req.usd_amount / STAR_PRICE_USD))

    from app.main import bot
    if not bot:
        raise HTTPException(status_code=503, detail="Bot not configured")

    try:
        from aiogram.types import LabeledPrice
        invoice_url = await bot.create_invoice_link(
            title="Stone AI — Пополнение кредитов",
            description=f"{req.credits} кредитов · ${req.usd_amount:.2f}",
            payload=f"credits:{req.credits}:{tg_user['id']}:{req.usd_amount}",
            provider_token="",
            currency="XTR",
            prices=[LabeledPrice(label=f"{req.credits} кредитов", amount=stars_amount)],
        )
        logger.info(f"Stars invoice: user={tg_user['id']}, usd={req.usd_amount}, credits={req.credits}, stars={stars_amount}")
        return {"invoice_url": invoice_url, "stars": stars_amount, "credits": req.credits}

    except Exception as e:
        logger.error(f"Failed to create Stars invoice: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка создания инвойса: {str(e)}")


@router.post("/stars/confirm")
async def confirm_stars_payment(
    credits: int,
    tg_id: int,
    usd_amount: float,
    payment_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Called by bot after successful_payment. Adds credits, updates total_deposited_usd."""
    new_balance = await add_credits(db, tg_id, credits)

    # Update total_deposited_usd
    from sqlalchemy import text
    await db.execute(
        text("UPDATE users SET total_deposited_usd = COALESCE(total_deposited_usd, 0) + :amt WHERE tg_id = :tid"),
        {"amt": usd_amount, "tid": tg_id}
    )

    tx = Transaction(
        user_tg_id=tg_id,
        amount=round(usd_amount / STAR_PRICE_USD),
        currency="XTR",
        amount_usd=usd_amount,
        product_type="credits",
        product_id="credits_topup",
        status="completed",
        provider_id=payment_id,
    )
    db.add(tx)
    await db.commit()

    logger.info(f"Credits added: user={tg_id}, credits={credits}, usd={usd_amount}, balance={new_balance}")
    return {"status": "ok", "credits_added": credits, "new_balance": new_balance}


@router.post("/fiat/create-invoice")
async def create_fiat_invoice(
    req: TopUpRequest,
    tg_user: dict = Depends(get_current_user),
):
    """YooKassa invoice — to be implemented."""
    raise HTTPException(status_code=501, detail="Оплата картой скоро будет доступна")


@router.get("/pricing")
async def get_pricing(tg_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return credit pricing for current user."""
    from sqlalchemy import text
    result = await db.execute(
        text("SELECT total_deposited_usd FROM users WHERE tg_id = :tid"),
        {"tid": tg_user["id"]}
    )
    row = result.fetchone()
    total_deposited = row[0] or 0.0 if row else 0.0
    is_vip = total_deposited >= VIP_THRESHOLD_USD

    return {
        "credit_price_usd": CREDIT_PRICE_VIP if is_vip else CREDIT_PRICE_STANDARD,
        "is_vip": is_vip,
        "total_deposited_usd": total_deposited,
        "vip_threshold_usd": VIP_THRESHOLD_USD,
    }
