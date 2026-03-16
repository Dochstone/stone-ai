"""Payment endpoints — Stars + TON Connect + Fiat invoices for credits."""

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
from app.services.ton import (
    get_ton_price_usd,
    create_order,
    get_order,
    complete_order,
    verify_transaction,
    cleanup_expired_orders,
)
from app.config import get_settings

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


# ═══════════════════════════════════════════════════════════
# TON Connect Payments
# ═══════════════════════════════════════════════════════════

class TonCreateOrderRequest(BaseModel):
    usd_amount: float
    credits: int


class TonVerifyRequest(BaseModel):
    order_id: str
    boc: str = ""  # optional — we verify via TonAPI polling, not BOC parsing


@router.get("/ton/price")
async def get_ton_current_price():
    """Get current TON price in USD for frontend conversion."""
    price = await get_ton_price_usd()
    return {"ton_usd": price}


@router.post("/ton/create-order")
async def create_ton_order(
    req: TonCreateOrderRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a TON payment order.

    Returns wallet address, TON amount, and unique comment for the transaction.
    Frontend uses these to build a TON Connect sendTransaction call.
    """
    settings = get_settings()

    if not settings.ton_wallet_address:
        raise HTTPException(status_code=503, detail="TON оплата временно недоступна")

    if req.usd_amount < 1.0:
        raise HTTPException(status_code=400, detail="Минимальная сумма $1")
    if req.credits <= 0:
        raise HTTPException(status_code=400, detail="Некорректное количество кредитов")

    # Verify credits match pricing
    from sqlalchemy import text
    result = await db.execute(
        text("SELECT total_deposited_usd FROM users WHERE tg_id = :tid"),
        {"tid": tg_user["id"]}
    )
    row = result.fetchone()
    is_vip = (row[0] or 0.0) >= VIP_THRESHOLD_USD if row else False
    expected_credits = credits_for_usd(req.usd_amount, is_vip)

    if abs(expected_credits - req.credits) > 1:
        raise HTTPException(status_code=400, detail="Несоответствие суммы и кредитов")

    # Convert USD to TON
    ton_price = await get_ton_price_usd()
    if ton_price <= 0:
        raise HTTPException(status_code=503, detail="Не удалось получить курс TON")

    ton_amount = round(req.usd_amount / ton_price, 4)

    # Create order with unique comment
    order = create_order(
        user_tg_id=tg_user["id"],
        usd_amount=req.usd_amount,
        credits=req.credits,
        ton_amount=ton_amount,
    )

    logger.info(
        f"TON order: user={tg_user['id']}, usd={req.usd_amount}, "
        f"ton={ton_amount}, comment={order['payload_comment']}"
    )

    return {
        "order_id": order["order_id"],
        "address": settings.ton_wallet_address,
        "ton_amount": ton_amount,
        "nanoton_amount": str(int(ton_amount * 1_000_000_000)),
        "payload_comment": order["payload_comment"],
        "expires_in": 900,  # 15 minutes
        "ton_usd": ton_price,
    }


@router.post("/ton/verify")
async def verify_ton_payment(
    req: TonVerifyRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Verify a TON payment after user sends the transaction.

    Polls TonAPI to find a matching transaction by comment and amount.
    On success, credits the user's account.
    """
    order = get_order(req.order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    if order["status"] == "completed":
        return {"status": "already_completed", "credits": order["credits"]}
    if order["status"] == "expired":
        raise HTTPException(status_code=410, detail="Заказ истёк. Создайте новый.")
    if order["user_tg_id"] != tg_user["id"]:
        raise HTTPException(status_code=403, detail="Заказ принадлежит другому пользователю")

    # Try to find matching transaction via TonAPI
    tx_info = await verify_transaction(
        wallet_address=get_settings().ton_wallet_address,
        expected_comment=order["payload_comment"],
        expected_amount_ton=order["ton_amount"],
        max_age_seconds=900,
    )

    if not tx_info:
        return {
            "status": "pending",
            "message": "Транзакция ещё не найдена. Подождите 1-2 минуты и попробуйте снова.",
        }

    # Transaction found — credit the user
    credits_amount = order["credits"]
    usd_amount = order["usd_amount"]

    new_balance = await add_credits(db, tg_user["id"], credits_amount)

    # Update total_deposited_usd
    from sqlalchemy import text
    await db.execute(
        text("UPDATE users SET total_deposited_usd = COALESCE(total_deposited_usd, 0) + :amt WHERE tg_id = :tid"),
        {"amt": usd_amount, "tid": tg_user["id"]}
    )

    # Record transaction
    tx = Transaction(
        user_tg_id=tg_user["id"],
        amount=tx_info["amount_ton"],
        currency="TON",
        amount_usd=usd_amount,
        product_type="credits",
        product_id="credits_topup",
        status="completed",
        tx_hash=tx_info["tx_hash"],
        provider_id=f"tonconnect:{req.order_id}",
    )
    db.add(tx)
    await db.commit()

    # Mark order complete
    complete_order(req.order_id, tx_info["tx_hash"])

    logger.info(
        f"TON payment completed: user={tg_user['id']}, credits={credits_amount}, "
        f"ton={tx_info['amount_ton']}, tx={tx_info['tx_hash'][:16]}..."
    )

    return {
        "status": "completed",
        "credits_added": credits_amount,
        "new_balance": new_balance,
        "tx_hash": tx_info["tx_hash"],
        "ton_amount": tx_info["amount_ton"],
    }


@router.get("/ton/order/{order_id}")
async def get_ton_order_status(
    order_id: str,
    tg_user: dict = Depends(get_current_user),
):
    """Check status of a TON payment order."""
    order = get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    if order["user_tg_id"] != tg_user["id"]:
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    return {
        "order_id": order["order_id"],
        "status": order["status"],
        "ton_amount": order["ton_amount"],
        "credits": order["credits"],
        "payload_comment": order["payload_comment"],
    }
