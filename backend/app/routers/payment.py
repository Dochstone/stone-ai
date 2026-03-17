"""Payment endpoints — Stars + TON Connect for USD balance top-up."""

import logging
import math
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models import Transaction
from app.services.token_billing import add_balance, get_user_balance, TOKEN_PRICES, get_weighted_price
from app.services.ton import (
    get_ton_price_usd,
    create_order,
    get_order,
    complete_order,
    verify_transaction,
)
from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payment", tags=["payment"])

# Pricing constants
STAR_PRICE_USD = 0.013          # 1 Telegram Star ~ $0.013
MIN_TOP_UP_USD = 1.0            # minimum top-up


class TopUpRequest(BaseModel):
    usd_amount: float       # how much user wants to add to balance


# ═══════════════════════════════════════════════════════════
# Stars Payments (direct USD balance top-up)
# ═══════════════════════════════════════════════════════════

@router.post("/stars/create-invoice")
async def create_stars_invoice(
    req: TopUpRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Telegram Stars invoice for USD balance top-up."""
    if req.usd_amount < MIN_TOP_UP_USD:
        raise HTTPException(status_code=400, detail=f"Минимальная сумма ${MIN_TOP_UP_USD:.0f}")

    stars_amount = max(1, math.ceil(req.usd_amount / STAR_PRICE_USD))

    from app.main import bot
    if not bot:
        raise HTTPException(status_code=503, detail="Bot not configured")

    try:
        from aiogram.types import LabeledPrice
        invoice_url = await bot.create_invoice_link(
            title="Stone AI — Пополнение баланса",
            description=f"Пополнение баланса: ${req.usd_amount:.2f}",
            payload=f"topup:{tg_user['id']}:{req.usd_amount}",
            provider_token="",
            currency="XTR",
            prices=[LabeledPrice(label=f"${req.usd_amount:.2f}", amount=stars_amount)],
        )
        logger.info(f"Stars invoice: user={tg_user['id']}, usd={req.usd_amount}, stars={stars_amount}")
        return {
            "invoice_url": invoice_url,
            "stars": stars_amount,
            "usd_amount": req.usd_amount,
        }

    except Exception as e:
        logger.error(f"Failed to create Stars invoice: {e}")
        raise HTTPException(status_code=500, detail=f"Ошибка создания инвойса: {str(e)}")


@router.post("/stars/confirm")
async def confirm_stars_payment(
    tg_id: int,
    usd_amount: float,
    payment_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Called by bot after successful_payment. Adds USD to balance."""
    new_balance = await add_balance(db, tg_id, usd_amount)

    # Update total_deposited_usd
    await db.execute(
        text("UPDATE users SET total_deposited_usd = COALESCE(total_deposited_usd, 0) + :amt WHERE telegram_id = :tid"),
        {"amt": usd_amount, "tid": tg_id}
    )

    tx = Transaction(
        user_tg_id=tg_id,
        amount=round(usd_amount / STAR_PRICE_USD),
        currency="XTR",
        amount_usd=usd_amount,
        product_type="balance_topup",
        product_id="usd_topup",
        status="completed",
        provider_id=payment_id,
    )
    db.add(tx)

    # Referral bonus
    from app.routers.referral import credit_referrer
    await credit_referrer(db, tg_id, usd_amount)

    await db.commit()

    logger.info(f"Balance added: user={tg_id}, usd={usd_amount}, balance=${new_balance:.6f}")
    return {"status": "ok", "added_usd": usd_amount, "new_balance_usd": new_balance}


@router.post("/fiat/create-invoice")
async def create_fiat_invoice(
    req: TopUpRequest,
    tg_user: dict = Depends(get_current_user),
):
    """YooKassa invoice — to be implemented."""
    raise HTTPException(status_code=501, detail="Оплата картой скоро будет доступна")


@router.get("/pricing")
async def get_pricing(tg_user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Return per-token pricing info and user balance."""
    tg_id = tg_user["id"]
    balance = await get_user_balance(db, tg_id)

    # Build model prices for frontend
    model_prices = {}
    for model_id, prices in TOKEN_PRICES.items():
        model_prices[model_id] = {
            "input_per_m": prices["input"],
            "output_per_m": prices["output"],
            "weighted_per_m": prices["weighted"],
        }

    return {
        "balance_usd": balance,
        "min_top_up_usd": MIN_TOP_UP_USD,
        "star_price_usd": STAR_PRICE_USD,
        "model_prices": model_prices,
        "billing_type": "per_token",
    }


# ═══════════════════════════════════════════════════════════
# Rewarded Ads
# ═══════════════════════════════════════════════════════════

@router.post("/rewarded-ad-complete")
async def rewarded_ad_complete(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Grant +5 free requests after watching a rewarded ad.
    Max 1 time per day.
    """
    tg_id = tg_user["id"]
    result = await db.execute(
        select(User).where(User.telegram_id == tg_id).with_for_update()
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if (user.rewarded_today or 0) >= 5:
        raise HTTPException(status_code=429, detail="Бонус за рекламу уже получен сегодня")

    user.rewarded_today = 5
    await db.commit()

    from app.services.limiter import get_today_usage, FREE_DAILY_LIMIT
    used = await get_today_usage(db, tg_id, "lite")

    logger.info(f"Rewarded ad: user={tg_id}, bonus=5")
    return {
        "bonus": 5,
        "new_limit": FREE_DAILY_LIMIT + 5,
        "used_today": used,
    }


# ═══════════════════════════════════════════════════════════
# TON Connect Payments
# ═══════════════════════════════════════════════════════════

class TonCreateOrderRequest(BaseModel):
    usd_amount: float


class TonVerifyRequest(BaseModel):
    order_id: str
    boc: str = ""


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
    """Create a TON payment order for USD balance top-up."""
    settings = get_settings()

    if not settings.ton_wallet_address:
        raise HTTPException(status_code=503, detail="TON оплата временно недоступна")

    if req.usd_amount < MIN_TOP_UP_USD:
        raise HTTPException(status_code=400, detail=f"Минимальная сумма ${MIN_TOP_UP_USD:.0f}")

    # Convert USD to TON
    ton_price = await get_ton_price_usd()
    if ton_price <= 0:
        raise HTTPException(status_code=503, detail="Не удалось получить курс TON")

    ton_amount = round(req.usd_amount / ton_price, 4)

    order = create_order(
        user_tg_id=tg_user["id"],
        usd_amount=req.usd_amount,
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
        "expires_in": 900,
        "ton_usd": ton_price,
    }


@router.post("/ton/verify")
async def verify_ton_payment(
    req: TonVerifyRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify a TON payment and add USD to balance."""
    order = get_order(req.order_id)

    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    if order["status"] == "completed":
        return {"status": "already_completed"}
    if order["status"] == "expired":
        raise HTTPException(status_code=410, detail="Заказ истёк. Создайте новый.")
    if order["user_tg_id"] != tg_user["id"]:
        raise HTTPException(status_code=403, detail="Заказ принадлежит другому пользователю")

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

    # Transaction found — add USD to balance
    usd_amount = order["usd_amount"]
    new_balance = await add_balance(db, tg_user["id"], usd_amount)

    # Update total_deposited_usd
    await db.execute(
        text("UPDATE users SET total_deposited_usd = COALESCE(total_deposited_usd, 0) + :amt WHERE telegram_id = :tid"),
        {"amt": usd_amount, "tid": tg_user["id"]}
    )

    tx = Transaction(
        user_tg_id=tg_user["id"],
        amount=tx_info["amount_ton"],
        currency="TON",
        amount_usd=usd_amount,
        product_type="balance_topup",
        product_id="usd_topup",
        status="completed",
        tx_hash=tx_info["tx_hash"],
        provider_id=f"tonconnect:{req.order_id}",
    )
    db.add(tx)
    await db.commit()

    complete_order(req.order_id, tx_info["tx_hash"])

    logger.info(
        f"TON payment: user={tg_user['id']}, usd={usd_amount}, "
        f"ton={tx_info['amount_ton']}, balance=${new_balance:.6f}"
    )

    return {
        "status": "completed",
        "added_usd": usd_amount,
        "new_balance_usd": new_balance,
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
        "usd_amount": order["usd_amount"],
        "payload_comment": order["payload_comment"],
    }
