"""Payment endpoints — Lava.ru (cards/SBP) + Heleket (crypto).

Both methods top up user's USD balance directly (per-token billing).
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models import Transaction
from app.services.token_billing import add_balance
from app.services import lava as lava_service
from app.services import heleket as heleket_service
from app.services import platega as platega_service
import httpx


async def notify_admin_payment(user_email: str, amount_rub: int, method: str):
    """Send Telegram notification to admin about new payment."""
    try:
        from app.config import get_settings
        settings = get_settings()
        if not settings.bot_token:
            return
        import os
        admin_ids = os.getenv("ADMIN_TG_IDS", "")
        if not admin_ids:
            return
        text_msg = (
            f"💰 <b>Новая оплата!</b>\n\n"
            f"👤 {user_email}\n"
            f"💵 {amount_rub}₽\n"
            f"💳 {method}\n"
        )
        async with httpx.AsyncClient(timeout=5) as client:
            for admin_id in admin_ids.split(","):
                aid = admin_id.strip()
                if aid:
                    await client.post(
                        f"https://api.telegram.org/bot{settings.bot_token}/sendMessage",
                        json={"chat_id": aid, "text": text_msg, "parse_mode": "HTML"},
                    )
    except Exception as e:
        logger.warning(f"Admin notification failed: {e}")
from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payment", tags=["payment"])

from app.config import USD_TO_RUB

MIN_TOP_UP_USD = 1.0


class TopUpRequest(BaseModel):
    usd_amount: float


# ═══════════════════════════════════════════════════════════
# LAVA.RU — Russian Cards + SBP
# ═══════════════════════════════════════════════════════════

@router.post("/lava/create-order")
async def create_lava_order(
    req: TopUpRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Lava.ru payment invoice for card/SBP balance top-up."""
    settings = get_settings()

    if not settings.lava_secret_key or not settings.lava_shop_id:
        raise HTTPException(status_code=503, detail="Оплата картой временно недоступна")

    if req.usd_amount < MIN_TOP_UP_USD:
        raise HTTPException(status_code=400, detail=f"Минимальная сумма ${MIN_TOP_UP_USD:.0f}")

    rub_amount = round(req.usd_amount * USD_TO_RUB, 2)
    order_id = lava_service.generate_order_id(tg_user["id"])

    invoice = await lava_service.create_invoice(
        amount_rub=rub_amount,
        order_id=order_id,
        description=f"Stone AI · Пополнение баланса: ${req.usd_amount:.2f}",
        success_url=settings.webapp_url,
    )

    if not invoice:
        raise HTTPException(status_code=500, detail="Не удалось создать счёт. Попробуйте позже.")

    tx = Transaction(
        user_tg_id=tg_user["id"],
        amount=rub_amount,
        currency="RUB",
        amount_usd=req.usd_amount,
        product_type="topup",
        product_id=f"topup_usd:{req.usd_amount:.2f}",
        status="pending",
        provider_id=f"lava:{invoice.get('id', order_id)}",
    )
    db.add(tx)
    await db.commit()

    logger.info(f"Lava order: user={tg_user['id']}, rub={rub_amount}, usd={req.usd_amount}")

    return {
        "order_id": order_id,
        "invoice_id": invoice.get("id"),
        "payment_url": invoice.get("url"),
        "amount_rub": rub_amount,
        "usd_amount": req.usd_amount,
        "expires_in": 900,
    }


@router.post("/lava/webhook")
async def lava_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Lava.ru webhook callback after payment."""
    settings = get_settings()
    body = await request.json()
    signature = request.headers.get("Signature", "")

    if settings.lava_webhook_key:
        if not lava_service.verify_webhook_signature(body, signature, settings.lava_webhook_key):
            logger.warning("Lava webhook: invalid signature")
            raise HTTPException(status_code=403, detail="Invalid signature")

    status = body.get("status")
    order_id = body.get("order_id", "")
    invoice_id = body.get("invoice_id", "")

    logger.info(f"Lava webhook: status={status}, order={order_id}")

    if status != "success":
        return {"ok": True, "message": "Ignored non-success status"}

    result = await db.execute(
        text("SELECT id, user_tg_id, amount_usd, status FROM transactions "
             "WHERE provider_id = :pid AND status = 'pending' LIMIT 1"),
        {"pid": f"lava:{invoice_id}"}
    )
    row = result.fetchone()

    if not row:
        result = await db.execute(
            text("SELECT id, user_tg_id, amount_usd, status FROM transactions "
                 "WHERE provider_id LIKE :pid AND status = 'pending' LIMIT 1"),
            {"pid": f"lava:%{order_id}%"}
        )
        row = result.fetchone()

    if not row:
        logger.warning(f"Lava webhook: transaction not found for order={order_id}")
        return {"ok": True, "message": "Transaction not found"}

    tx_id, user_tg_id, usd_amount, tx_status = row

    if tx_status == "completed":
        return {"ok": True, "message": "Already processed"}

    new_balance = await add_balance(db, user_tg_id, usd_amount)

    await db.execute(
        text("UPDATE transactions SET status = 'completed' WHERE id = :tid"),
        {"tid": tx_id}
    )
    await db.execute(
        text("UPDATE users SET total_deposited_usd = COALESCE(total_deposited_usd, 0) + :amt WHERE telegram_id = :tid"),
        {"amt": usd_amount, "tid": user_tg_id}
    )

    from app.routers.referral import credit_referrer
    await credit_referrer(db, user_tg_id, usd_amount)

    await db.commit()

    logger.info(f"Lava payment completed: user={user_tg_id}, usd={usd_amount}, balance=${new_balance:.6f}")

    try:
        user_row = await db.execute(text("SELECT email FROM users WHERE telegram_id = :tid OR id = :tid LIMIT 1"), {"tid": user_tg_id})
        user_email = user_row.scalar()
        if user_email:
            from app.services.email_service import send_payment_confirmation
            send_payment_confirmation(user_email, round(usd_amount * 95), round(new_balance * 95), "Карта РФ / СБП")
    except Exception as e:
        logger.warning(f"Failed to send payment email: {e}")

    return {"ok": True}


@router.get("/lava/check/{order_id}")
async def check_lava_payment(
    order_id: str,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check Lava payment status (polled by frontend)."""
    result = await db.execute(
        text("SELECT status, amount_usd FROM transactions "
             "WHERE provider_id LIKE :pid AND user_tg_id = :tid ORDER BY id DESC LIMIT 1"),
        {"pid": f"lava:%{order_id}%", "tid": tg_user["id"]}
    )
    row = result.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    status, usd_amount = row
    return {"status": status, "usd_amount": usd_amount}


# ═══════════════════════════════════════════════════════════
# PLATEGA.IO — Russian Cards + SBP (alternative to Lava)
# ═══════════════════════════════════════════════════════════

@router.post("/platega/create-order")
async def create_platega_order(
    req: TopUpRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Platega.io SBP QR payment for balance top-up."""
    settings = get_settings()

    if not settings.platega_merchant_id or not settings.platega_secret:
        raise HTTPException(status_code=503, detail="Оплата через Platega временно недоступна")

    if req.usd_amount < MIN_TOP_UP_USD:
        raise HTTPException(status_code=400, detail=f"Минимальная сумма ${MIN_TOP_UP_USD:.0f}")

    rub_amount = round(req.usd_amount * USD_TO_RUB, 0)
    order_id = platega_service.generate_order_id(tg_user["id"])

    payment = await platega_service.create_payment(
        amount_rub=rub_amount,
        user_id=str(tg_user["id"]),
        description=f"Stone AI · Пополнение баланса: ${req.usd_amount:.2f}",
    )

    if not payment:
        raise HTTPException(status_code=500, detail="Не удалось создать счёт. Попробуйте позже.")

    transaction_id = payment["transaction_id"]

    tx = Transaction(
        user_tg_id=tg_user["id"],
        amount=rub_amount,
        currency="RUB",
        amount_usd=req.usd_amount,
        product_type="topup",
        product_id=f"topup_usd:{req.usd_amount:.2f}",
        status="pending",
        provider_id=f"platega:{transaction_id}",
    )
    db.add(tx)
    await db.commit()

    logger.info(f"Platega order: user={tg_user['id']}, rub={rub_amount}, usd={req.usd_amount}, txn={transaction_id}")

    return {
        "order_id": order_id,
        "payment_url": payment["redirect_url"],
        "amount_rub": rub_amount,
        "usd_amount": req.usd_amount,
    }


@router.post("/platega/webhook")
async def platega_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Platega.io webhook callback after payment.

    Platega sends X-MerchantId and X-Secret headers for verification.
    Body: {id, amount, currency, status, paymentMethod}
    Status values: PENDING, CONFIRMED, CANCELED, CHARGEBACKED
    """
    merchant_id = request.headers.get("X-MerchantId", "")
    secret = request.headers.get("X-Secret", "")

    if not platega_service.verify_webhook(merchant_id, secret):
        logger.warning("Platega webhook: invalid credentials")
        return {"ok": True}

    body = await request.json()

    status = body.get("status", "")
    transaction_id = body.get("id", "")
    amount = body.get("amount")
    currency = body.get("currency", "")

    logger.info(f"Platega webhook: status={status}, id={transaction_id}, amount={amount} {currency}")

    if status != "CONFIRMED":
        return {"ok": True, "message": f"Ignored status: {status}"}

    provider_id = f"platega:{transaction_id}"

    result = await db.execute(
        text("SELECT id, user_tg_id, amount_usd, status FROM transactions "
             "WHERE provider_id = :pid AND status = 'pending' LIMIT 1"),
        {"pid": provider_id}
    )
    row = result.fetchone()

    if not row:
        logger.warning(f"Platega webhook: transaction not found for id={transaction_id}")
        return {"ok": True, "message": "Transaction not found"}

    tx_id, user_tg_id, usd_amount, tx_status = row

    if tx_status == "completed":
        return {"ok": True, "message": "Already processed"}

    new_balance = await add_balance(db, user_tg_id, usd_amount)

    await db.execute(
        text("UPDATE transactions SET status = 'completed' WHERE id = :tid"),
        {"tid": tx_id}
    )
    await db.execute(
        text("UPDATE users SET total_deposited_usd = COALESCE(total_deposited_usd, 0) + :amt WHERE telegram_id = :tid"),
        {"amt": usd_amount, "tid": user_tg_id}
    )

    from app.routers.referral import credit_referrer
    await credit_referrer(db, user_tg_id, usd_amount)

    await db.commit()

    logger.info(f"Platega payment completed: user={user_tg_id}, usd={usd_amount}, balance=${new_balance:.6f}")

    # Notify admin via Telegram
    try:
        user_row2 = await db.execute(text("SELECT email FROM users WHERE telegram_id = :tid OR id = :tid LIMIT 1"), {"tid": user_tg_id})
        admin_email = user_row2.scalar() or str(user_tg_id)
        import asyncio
        asyncio.create_task(notify_admin_payment(admin_email, round(usd_amount * 95), "Platega (карта/СБП)"))
    except Exception:
        pass

    # Send email notification
    try:
        user_row = await db.execute(text("SELECT email FROM users WHERE telegram_id = :tid OR id = :tid LIMIT 1"), {"tid": user_tg_id})
        user_email = user_row.scalar()
        if user_email:
            from app.services.email_service import send_payment_confirmation
            amount_rub = round(usd_amount * 95)
            balance_rub = round(new_balance * 95)
            send_payment_confirmation(user_email, amount_rub, balance_rub, "Карта РФ / СБП")
    except Exception as e:
        logger.warning(f"Failed to send payment email: {e}")

    return {"ok": True}


@router.get("/platega/check/{order_id}")
async def check_platega_payment(
    order_id: str,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check Platega payment status (polled by frontend)."""
    result = await db.execute(
        text("SELECT status, amount_usd, provider_id FROM transactions "
             "WHERE provider_id LIKE :pid AND user_tg_id = :tid ORDER BY id DESC LIMIT 1"),
        {"pid": f"platega:%", "tid": tg_user["id"]}
    )
    row = result.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    status, usd_amount, provider_id = row
    return {"status": status, "usd_amount": usd_amount}


# ═══════════════════════════════════════════════════════════
# HELEKET — Crypto Payments (USDT, BTC, ETH, TON, SOL, etc.)
# ═══════════════════════════════════════════════════════════

@router.post("/crypto/create-order")
async def create_crypto_order(
    req: TopUpRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a Heleket crypto payment invoice for USD balance top-up."""
    settings = get_settings()

    if not settings.heleket_api_key or not settings.heleket_merchant:
        raise HTTPException(status_code=503, detail="Крипто-оплата временно недоступна")

    if req.usd_amount < MIN_TOP_UP_USD:
        raise HTTPException(status_code=400, detail=f"Минимальная сумма ${MIN_TOP_UP_USD:.0f}")

    order_id = heleket_service.generate_order_id(tg_user["id"])

    invoice = await heleket_service.create_invoice(
        amount_usd=req.usd_amount,
        order_id=order_id,
        currency="USD",
        url_return=settings.webapp_url,
        url_success=settings.webapp_url,
    )

    if not invoice:
        raise HTTPException(status_code=500, detail="Не удалось создать крипто-счёт. Попробуйте позже.")

    tx = Transaction(
        user_tg_id=tg_user["id"],
        amount=req.usd_amount,
        currency="USD",
        amount_usd=req.usd_amount,
        product_type="topup",
        product_id=f"topup_usd:{req.usd_amount:.2f}",
        status="pending",
        provider_id=f"heleket:{invoice.get('uuid', order_id)}",
    )
    db.add(tx)
    await db.commit()

    logger.info(f"Heleket order: user={tg_user['id']}, usd={req.usd_amount}")

    return {
        "order_id": order_id,
        "payment_uuid": invoice.get("uuid"),
        "payment_url": invoice.get("url"),
        "amount_usd": req.usd_amount,
    }


@router.post("/crypto/webhook")
async def heleket_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Heleket webhook callback after crypto payment."""
    settings = get_settings()
    body_bytes = await request.body()
    body = await request.json()
    received_sign = request.headers.get("sign", "")

    if settings.heleket_api_key and received_sign:
        if not heleket_service.verify_webhook_signature(
            body_bytes, received_sign, settings.heleket_api_key
        ):
            logger.warning("Heleket webhook: invalid signature")
            raise HTTPException(status_code=403, detail="Invalid signature")

    status = body.get("status")
    payment_uuid = body.get("uuid", "")

    logger.info(f"Heleket webhook: status={status}, uuid={payment_uuid}")

    if status not in ("paid", "paid_over"):
        return {"ok": True, "message": f"Ignored status: {status}"}

    result = await db.execute(
        text("SELECT id, user_tg_id, amount_usd, status, product_type, product_id FROM transactions "
             "WHERE provider_id = :pid AND status = 'pending' LIMIT 1"),
        {"pid": f"heleket:{payment_uuid}"}
    )
    row = result.fetchone()

    if not row:
        logger.warning(f"Heleket webhook: transaction not found for uuid={payment_uuid}")
        return {"ok": True, "message": "Transaction not found"}

    tx_id, user_tg_id, usd_amount, tx_status, product_type, product_id = row

    if tx_status == "completed":
        return {"ok": True, "message": "Already processed"}

    # Mark transaction as completed
    await db.execute(
        text("UPDATE transactions SET status = 'completed', tx_hash = :txh WHERE id = :tid"),
        {"txh": payment_uuid, "tid": tx_id}
    )
    await db.execute(
        text("UPDATE users SET total_deposited_usd = COALESCE(total_deposited_usd, 0) + :amt WHERE telegram_id = :tid"),
        {"amt": usd_amount, "tid": user_tg_id}
    )

    if product_type == "subscription" and product_id and product_id.startswith("sub:"):
        # Activate subscription
        tier = product_id.split(":", 1)[1]
        from datetime import datetime, timedelta
        from sqlalchemy import select
        from app.models import User
        result = await db.execute(select(User).where(User.telegram_id == user_tg_id))
        user = result.scalar_one_or_none()
        if not user:
            result = await db.execute(select(User).where(User.id == user_tg_id))
            user = result.scalar_one_or_none()
        if user:
            user.subscription_tier = tier
            user.subscription_started = datetime.utcnow()
            user.credits_reset_date = datetime.utcnow() + timedelta(days=30)
            user.monthly_fast_used = 0
            user.monthly_premium_used = 0
            user.monthly_images_used = 0
            user.monthly_videos_used = 0
            logger.info(f"Subscription activated: user={user_tg_id}, tier={tier}")
            # Email: subscription activated
            try:
                user_row2 = await db.execute(text("SELECT email FROM users WHERE telegram_id = :tid OR id = :tid LIMIT 1"), {"tid": user_tg_id})
                uemail = user_row2.scalar()
                if uemail:
                    from app.services.email_service import send_subscription_activated
                    send_subscription_activated(uemail, tier, round(usd_amount * 95))
            except Exception as e:
                logger.warning(f"Failed to send subscription email: {e}")
    else:
        # Top-up balance
        new_balance = await add_balance(db, user_tg_id, usd_amount)
        logger.info(f"Balance top-up: user={user_tg_id}, usd={usd_amount}, balance=${new_balance:.6f}")
        # Email: balance top-up
        try:
            user_row3 = await db.execute(text("SELECT email FROM users WHERE telegram_id = :tid OR id = :tid LIMIT 1"), {"tid": user_tg_id})
            uemail = user_row3.scalar()
            if uemail:
                from app.services.email_service import send_payment_confirmation
                send_payment_confirmation(uemail, round(usd_amount * 95), round(new_balance * 95), "Криптовалюта")
        except Exception as e:
            logger.warning(f"Failed to send payment email: {e}")

    from app.routers.referral import credit_referrer
    await credit_referrer(db, user_tg_id, usd_amount)

    await db.commit()

    # Notify admin via Telegram
    try:
        user_row4 = await db.execute(text("SELECT email FROM users WHERE telegram_id = :tid OR id = :tid LIMIT 1"), {"tid": user_tg_id})
        admin_email = user_row4.scalar() or str(user_tg_id)
        import asyncio
        method = f"Крипто ({product_type})" if product_type == "subscription" else "Heleket (крипто)"
        asyncio.create_task(notify_admin_payment(admin_email, round(usd_amount * 95), method))
    except Exception:
        pass

    return {"ok": True}


# ═══════════════════════════════════════════════════════════
# SUBSCRIPTION PAYMENT — Create invoice for plan purchase
# ═══════════════════════════════════════════════════════════

PLAN_PRICES_RUB = {"mini": 590, "max": 1290, "max-pro": 2990}

class SubscribePaymentRequest(BaseModel):
    tier: str  # mini, max, max-pro


@router.post("/subscribe")
async def create_subscribe_payment(
    req: SubscribePaymentRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create Heleket crypto invoice for subscription payment."""
    settings = get_settings()

    if req.tier not in PLAN_PRICES_RUB:
        raise HTTPException(400, "Недопустимый тариф")

    if not settings.heleket_api_key or not settings.heleket_merchant:
        raise HTTPException(503, "Крипто-оплата временно недоступна")

    price_rub = PLAN_PRICES_RUB[req.tier]
    price_usd = round(price_rub / USD_TO_RUB, 2)

    user_id = tg_user.get("db_id") or tg_user["id"]
    order_id = heleket_service.generate_order_id(user_id)

    invoice = await heleket_service.create_invoice(
        amount_usd=price_usd,
        order_id=order_id,
        currency="USD",
        url_return=f"https://stoneai.ru/pricing?paid={req.tier}",
        url_success=f"https://stoneai.ru/pricing?paid={req.tier}",
    )

    if not invoice:
        raise HTTPException(500, "Не удалось создать счёт")

    tx = Transaction(
        user_tg_id=tg_user["id"],
        amount=price_rub,
        currency="RUB",
        amount_usd=price_usd,
        product_type="subscription",
        product_id=f"sub:{req.tier}",
        status="pending",
        provider_id=f"heleket:{invoice.get('uuid', order_id)}",
    )
    db.add(tx)
    await db.commit()

    logger.info(f"Subscribe order: user={user_id}, tier={req.tier}, usd={price_usd}")

    return {
        "payment_url": invoice.get("url"),
        "payment_uuid": invoice.get("uuid"),
        "tier": req.tier,
        "price_rub": price_rub,
        "price_usd": price_usd,
    }


@router.get("/crypto/check/{order_id}")
async def check_crypto_payment(
    order_id: str,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check Heleket crypto payment status (polled by frontend)."""
    result = await db.execute(
        text("SELECT status, amount_usd FROM transactions "
             "WHERE provider_id LIKE :pid AND user_tg_id = :tid ORDER BY id DESC LIMIT 1"),
        {"pid": f"heleket:%", "tid": tg_user["id"]}
    )
    row = result.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    status, usd_amount = row
    return {"status": status, "usd_amount": usd_amount}


# ═══════════════════════════════════════════════════════════
# TON CONNECT — Pay with TON wallet
# ═══════════════════════════════════════════════════════════

import time as _time
import uuid as _uuid
import httpx

_ton_orders: dict[str, dict] = {}

TON_MERCHANT_WALLET = "UQBfxl37Bgf7FVaO4prAM5YA0d9pfJdRL7hymmYZX01Skjc7"
TON_PLAN_PRICES_USD = {"mini": 4.0, "max": 9.0, "max-pro": 20.0}


@router.get("/ton-rate")
async def get_ton_rate():
    """Get current TON/USD rate."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                "https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd"
            )
            data = resp.json()
            return {"ton_usd": data["the-open-network"]["usd"]}
    except Exception:
        return {"ton_usd": 3.5}


class TonOrderRequest(BaseModel):
    tier: str
    amount_ton: float


@router.post("/ton-order")
async def create_ton_order(
    req: TonOrderRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create TON payment order with unique comment."""
    if req.tier not in TON_PLAN_PRICES_USD:
        raise HTTPException(400, "Недопустимый тариф")

    user_id = tg_user.get("db_id") or tg_user["id"]
    order_id = _uuid.uuid4().hex[:12]
    comment = f"stone_{order_id}"
    price_usd = TON_PLAN_PRICES_USD[req.tier]
    price_rub = PLAN_PRICES_RUB.get(req.tier, 0)

    _ton_orders[order_id] = {
        "user_id": user_id, "user_tg_id": tg_user["id"],
        "tier": req.tier, "amount_ton": req.amount_ton,
        "amount_usd": price_usd, "comment": comment,
        "status": "pending", "created_at": _time.time(),
    }

    tx = Transaction(
        user_tg_id=tg_user["id"], amount=price_rub, currency="TON",
        amount_usd=price_usd, product_type="subscription",
        product_id=f"sub:{req.tier}", status="pending",
        provider_id=f"ton:{order_id}",
    )
    db.add(tx)
    await db.commit()

    now = _time.time()
    for k in [k for k, v in _ton_orders.items() if now - v["created_at"] > 3600]:
        _ton_orders.pop(k, None)

    return {"order_id": order_id, "comment": comment, "amount_ton": req.amount_ton, "wallet": TON_MERCHANT_WALLET}


@router.get("/ton-check")
async def check_ton_payment(
    order_id: str,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if TON payment received via TONAPI."""
    order = _ton_orders.get(order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    if order["status"] == "confirmed":
        return {"status": "confirmed"}

    settings = get_settings()
    tonapi_key = getattr(settings, 'tonapi_key', None)

    try:
        headers = {"Authorization": f"Bearer {tonapi_key}"} if tonapi_key else {}
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"https://tonapi.io/v2/blockchain/accounts/{TON_MERCHANT_WALLET}/transactions?limit=20",
                headers=headers,
            )
            if resp.status_code != 200:
                return {"status": "pending"}

            for tx_item in resp.json().get("transactions", []):
                in_msg = tx_item.get("in_msg", {})
                value = int(in_msg.get("value", 0))
                decoded = in_msg.get("decoded_body", {})
                comment_text = decoded.get("text", "") if isinstance(decoded, dict) else ""
                if not comment_text:
                    comment_text = in_msg.get("message", "")

                min_amount = int(order["amount_ton"] * 1e9 * 0.95)
                if value >= min_amount and order["comment"] in str(comment_text):
                    order["status"] = "confirmed"

                    from datetime import datetime, timedelta
                    from sqlalchemy import select
                    from app.models import User

                    result2 = await db.execute(select(User).where(User.id == order["user_id"]))
                    user = result2.scalar_one_or_none()
                    if not user:
                        result2 = await db.execute(select(User).where(User.telegram_id == order["user_tg_id"]))
                        user = result2.scalar_one_or_none()
                    if user:
                        user.subscription_tier = order["tier"]
                        user.subscription_started = datetime.utcnow()
                        user.credits_reset_date = datetime.utcnow() + timedelta(days=30)
                        user.monthly_fast_used = 0
                        user.monthly_premium_used = 0
                        user.monthly_images_used = 0
                        user.monthly_videos_used = 0

                    await db.execute(
                        text("UPDATE transactions SET status = 'completed' WHERE provider_id = :pid"),
                        {"pid": f"ton:{order_id}"}
                    )
                    from app.routers.referral import credit_referrer
                    await credit_referrer(db, order["user_tg_id"], order["amount_usd"])
                    await db.commit()
                    logger.info(f"TON confirmed: user={order['user_id']}, tier={order['tier']}")
                    return {"status": "confirmed"}

    except Exception as e:
        logger.error(f"TON check error: {e}")

    return {"status": "pending"}
