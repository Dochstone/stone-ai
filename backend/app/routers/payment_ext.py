"""Payment endpoints — Lava.ru (cards/SBP) + Heleket (crypto).

Both methods top up user's USD balance directly (per-token billing).
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models import Transaction
from app.models.user import User
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
    tier: str | None = None  # If set, treat as subscription payment


async def _get_user_by_external_id(db: AsyncSession, external_id: int, *, lock: bool = False):
    from app.models.user import User

    query = select(User).where(User.telegram_id == external_id)
    if lock:
        query = query.with_for_update()
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    if user:
        return user

    query = select(User).where(User.id == external_id)
    if lock:
        query = query.with_for_update()
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def _increment_total_deposited(db: AsyncSession, external_id: int, amount_usd: float) -> None:
    user = await _get_user_by_external_id(db, external_id, lock=True)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.total_deposited_usd = round(float(user.total_deposited_usd or 0) + float(amount_usd or 0), 2)


async def _claim_pending_transaction(
    db: AsyncSession,
    *,
    provider_id: str,
    fallback_tx_hash: str | None = None,
) -> tuple[Transaction | None, bool]:
    """Lock and mark a pending transaction as completed exactly once."""
    query = (
        select(Transaction)
        .where(Transaction.provider_id == provider_id, Transaction.status == "pending")
        .order_by(Transaction.id.desc())
        .with_for_update()
    )
    result = await db.execute(query)
    tx = result.scalars().first()

    if not tx and fallback_tx_hash:
        query = (
            select(Transaction)
            .where(Transaction.tx_hash == fallback_tx_hash, Transaction.status == "pending")
            .order_by(Transaction.id.desc())
            .with_for_update()
        )
        result = await db.execute(query)
        tx = result.scalars().first()

    if tx:
        tx.status = "completed"
        await db.flush()
        return tx, False

    existing = await db.execute(
        select(Transaction.id)
        .where(Transaction.provider_id == provider_id)
        .order_by(Transaction.id.desc())
        .limit(1)
    )
    existing_tx = existing.scalars().first()
    if existing_tx is None and fallback_tx_hash:
        existing = await db.execute(
            select(Transaction.id)
            .where(Transaction.tx_hash == fallback_tx_hash)
            .order_by(Transaction.id.desc())
            .limit(1)
        )
        existing_tx = existing.scalars().first()

    return None, existing_tx is not None


async def _verify_platega_webhook_payload(transaction_id: str, amount: float | int | None, currency: str) -> bool:
    """Cross-check webhook data against Platega's API using merchant credentials."""
    remote = await platega_service.check_status(transaction_id)
    if not remote:
        return False
    if str(remote.get("status", "")).upper() != "CONFIRMED":
        return False
    if str(remote.get("currency", "")).upper() != str(currency or "").upper():
        return False

    if amount is None or remote.get("amount") is None:
        return False

    try:
        return int(round(float(remote["amount"]))) == int(round(float(amount)))
    except (TypeError, ValueError):
        return False


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
        tx_hash=order_id,
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
    if not settings.lava_webhook_key:
        raise HTTPException(status_code=503, detail="Lava webhook verification is not configured")

    body = await request.json()
    signature = request.headers.get("Signature", "")
    if not signature or not lava_service.verify_webhook_signature(body, signature, settings.lava_webhook_key):
        logger.warning("Lava webhook: invalid signature")
        raise HTTPException(status_code=403, detail="Invalid signature")

    status = body.get("status")
    order_id = body.get("order_id", "")
    invoice_id = body.get("invoice_id", "")

    logger.info(f"Lava webhook: status={status}, order={order_id}")

    if status != "success":
        return {"ok": True, "message": "Ignored non-success status"}

    tx, already_processed = await _claim_pending_transaction(
        db,
        provider_id=f"lava:{invoice_id}",
        fallback_tx_hash=order_id,
    )
    if already_processed:
        return {"ok": True, "message": "Already processed"}
    if not tx:
        logger.warning(f"Lava webhook: transaction not found for order={order_id}")
        return {"ok": True, "message": "Transaction not found"}

    user_tg_id = tx.user_tg_id
    usd_amount = float(tx.amount_usd or 0)

    new_balance = await add_balance(db, user_tg_id, usd_amount)
    await _increment_total_deposited(db, user_tg_id, usd_amount)

    from app.routers.referral import credit_referrer
    await credit_referrer(db, user_tg_id, usd_amount)

    await db.commit()

    logger.info(f"Lava payment completed: user={user_tg_id}, usd={usd_amount}, balance=${new_balance:.6f}")

    try:
        user_row = await db.execute(text("SELECT email FROM users WHERE telegram_id = :tid OR id = :tid LIMIT 1"), {"tid": user_tg_id})
        user_email = user_row.scalar()
        if user_email and new_balance is not None:
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
             "WHERE tx_hash = :order_id AND user_tg_id = :tid ORDER BY id DESC LIMIT 1"),
        {"order_id": order_id, "tid": tg_user["id"]}
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
    """Create a Platega.io SBP QR payment for balance top-up or subscription."""
    settings = get_settings()

    if not settings.platega_merchant_id or not settings.platega_secret:
        raise HTTPException(status_code=503, detail="Оплата через Platega временно недоступна")

    is_subscription = req.tier and req.tier in ("mini", "max", "max-pro")
    if not is_subscription and req.usd_amount < MIN_TOP_UP_USD:
        raise HTTPException(status_code=400, detail=f"Минимальная сумма ${MIN_TOP_UP_USD:.0f}")

    if is_subscription:
        from app.services.subscription import PLANS

        if req.tier not in PLANS:
            raise HTTPException(status_code=400, detail="Недопустимый тариф")
        plan = PLANS[req.tier]
        rub_amount = round(float(plan["price_rub"]), 0)
        usd_amount = round(float(plan["price_rub"]) / USD_TO_RUB, 2)
    else:
        rub_amount = round(req.usd_amount * USD_TO_RUB, 0)
        usd_amount = req.usd_amount
    order_id = platega_service.generate_order_id(tg_user["id"])

    description = f"Stone AI · Подписка {req.tier}" if is_subscription else f"Stone AI · Пополнение баланса: ${req.usd_amount:.2f}"

    payment = await platega_service.create_payment(
        amount_rub=rub_amount,
        user_id=str(tg_user["id"]),
        description=description,
    )

    if not payment:
        raise HTTPException(status_code=500, detail="Не удалось создать счёт. Попробуйте позже.")

    transaction_id = payment["transaction_id"]

    tx = Transaction(
        user_tg_id=tg_user["id"],
        amount=rub_amount,
        currency="RUB",
        amount_usd=usd_amount,
        product_type="subscription" if is_subscription else "topup",
        product_id=f"sub:{req.tier}" if is_subscription else f"topup_usd:{usd_amount:.2f}",
        status="pending",
        tx_hash=order_id,
        provider_id=f"platega:{transaction_id}",
    )
    db.add(tx)
    await db.commit()

    logger.info(f"Platega order: user={tg_user['id']}, rub={rub_amount}, usd={usd_amount}, txn={transaction_id}")

    return {
        "order_id": order_id,
        "payment_url": payment["redirect_url"],
        "amount_rub": rub_amount,
        "usd_amount": usd_amount,
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
        raise HTTPException(status_code=403, detail="Invalid signature")

    body = await request.json()

    status = body.get("status", "")
    transaction_id = body.get("id", "")
    amount = body.get("amount")
    currency = body.get("currency", "")

    logger.info(f"Platega webhook: status={status}, id={transaction_id}, amount={amount} {currency}")

    if status != "CONFIRMED":
        return {"ok": True, "message": f"Ignored status: {status}"}

    if not await _verify_platega_webhook_payload(transaction_id, amount, currency):
        logger.warning(f"Platega webhook: payload verification failed for id={transaction_id}")
        raise HTTPException(status_code=403, detail="Invalid webhook payload")

    provider_id = f"platega:{transaction_id}"

    tx, already_processed = await _claim_pending_transaction(db, provider_id=provider_id)
    if already_processed:
        return {"ok": True, "message": "Already processed"}
    if not tx:
        logger.warning(f"Platega webhook: transaction not found for id={transaction_id}")
        return {"ok": True, "message": "Transaction not found"}

    user_tg_id = tx.user_tg_id
    usd_amount = float(tx.amount_usd or 0)
    product_type = tx.product_type
    product_id = tx.product_id
    new_balance = None

    # Handle subscription or top-up
    if product_type == "subscription" and product_id and product_id.startswith("sub:"):
        tier = product_id.split(":", 1)[1]
        from datetime import datetime, timedelta
        from sqlalchemy import select as sel
        from app.models.user import User
        from app.services.subscription import PLANS
        user_result = await db.execute(sel(User).where(User.telegram_id == user_tg_id))
        user = user_result.scalar_one_or_none()
        if user and tier in PLANS:
            plan = PLANS[tier]
            user.subscription_tier = tier
            user.subscription_started = datetime.utcnow()
            user.credits_reset_date = datetime.utcnow() + timedelta(days=30)
            user.credits_balance = plan.get("credits", 0)
            user.monthly_fast_used = 0
            user.monthly_premium_used = 0
            user.monthly_images_used = 0
            user.monthly_videos_used = 0
            user.monthly_3d_used = 0
            user.monthly_audio_used = 0
            user.opus_requests_used = 0
            logger.info(f"Platega subscription activated: user={user_tg_id}, tier={tier}")
    else:
        new_balance = await add_balance(db, user_tg_id, usd_amount)
        logger.info(f"Platega balance top-up: user={user_tg_id}, usd={usd_amount}, balance=${new_balance:.6f}")

    await _increment_total_deposited(db, user_tg_id, usd_amount)

    from app.routers.referral import credit_referrer
    await credit_referrer(db, user_tg_id, usd_amount)

    await db.commit()

    logger.info(f"Platega payment completed: user={user_tg_id}, type={product_type}, usd={usd_amount}")

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
        if user_email and new_balance is not None:
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
        text("SELECT status, amount_usd FROM transactions "
             "WHERE tx_hash = :order_id AND user_tg_id = :tid ORDER BY id DESC LIMIT 1"),
        {"order_id": order_id, "tid": tg_user["id"]}
    )
    row = result.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Заказ не найден")

    status, usd_amount = row
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
        tx_hash=order_id,
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
    if not settings.heleket_api_key:
        raise HTTPException(status_code=503, detail="Heleket webhook verification is not configured")

    body_bytes = await request.body()
    body = await request.json()
    received_sign = request.headers.get("sign", "")

    if not received_sign or not heleket_service.verify_webhook_signature(
        body_bytes, received_sign, settings.heleket_api_key
    ):
        logger.warning("Heleket webhook: invalid signature")
        raise HTTPException(status_code=403, detail="Invalid signature")

    status = body.get("status")
    payment_uuid = body.get("uuid", "")

    logger.info(f"Heleket webhook: status={status}, uuid={payment_uuid}")

    if status not in ("paid", "paid_over"):
        return {"ok": True, "message": f"Ignored status: {status}"}

    tx, already_processed = await _claim_pending_transaction(
        db,
        provider_id=f"heleket:{payment_uuid}",
    )
    if already_processed:
        return {"ok": True, "message": "Already processed"}
    if not tx:
        logger.warning(f"Heleket webhook: transaction not found for uuid={payment_uuid}")
        return {"ok": True, "message": "Transaction not found"}

    user_tg_id = tx.user_tg_id
    usd_amount = float(tx.amount_usd or 0)
    product_type = tx.product_type
    product_id = tx.product_id
    await _increment_total_deposited(db, user_tg_id, usd_amount)

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
    from app.services.promo import apply_discount, clear_discount

    settings = get_settings()

    if req.tier not in PLAN_PRICES_RUB:
        raise HTTPException(400, "Недопустимый тариф")

    if not settings.heleket_api_key or not settings.heleket_merchant:
        raise HTTPException(503, "Крипто-оплата временно недоступна")

    user_id = tg_user.get("db_id") or tg_user["id"]
    user = await db.execute(select(User).where(User.telegram_id == tg_user["id"]))
    user = user.scalar_one_or_none()

    price_rub = PLAN_PRICES_RUB[req.tier]
    discount_desc = None
    if user:
        price_rub, discount_desc = apply_discount(price_rub, user)
        if discount_desc:
            clear_discount(user)
            await db.flush()

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
        tx_hash=order_id,
        provider_id=f"heleket:{invoice.get('uuid', order_id)}",
    )
    db.add(tx)
    await db.commit()

    logger.info(f"Subscribe order: user={user_id}, tier={req.tier}, usd={price_usd}")

    result = {
        "payment_url": invoice.get("url"),
        "payment_uuid": invoice.get("uuid"),
        "tier": req.tier,
        "price_rub": price_rub,
        "price_usd": price_usd,
    }
    if discount_desc:
        result["discount"] = discount_desc
        result["original_price_rub"] = PLAN_PRICES_RUB[req.tier]
    return result


@router.get("/crypto/check/{order_id}")
async def check_crypto_payment(
    order_id: str,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check Heleket crypto payment status (polled by frontend)."""
    result = await db.execute(
        text("SELECT status, amount_usd FROM transactions "
             "WHERE tx_hash = :order_id AND user_tg_id = :tid ORDER BY id DESC LIMIT 1"),
        {"order_id": order_id, "tid": tg_user["id"]}
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
_ton_last_cleanup: float = 0.0


def _cleanup_ton_orders():
    """Remove TON orders older than 1 hour. Called periodically."""
    global _ton_last_cleanup
    now = _time.time()
    if now - _ton_last_cleanup < 300:  # max once per 5 min
        return
    _ton_last_cleanup = now
    expired = [k for k, v in _ton_orders.items() if now - v.get("created_at", 0) > 3600]
    for k in expired:
        _ton_orders.pop(k, None)


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
    amount_ton: float | None = None


@router.post("/ton-order")
async def create_ton_order(
    req: TonOrderRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create TON payment order with unique comment."""
    from app.services.promo import apply_discount, clear_discount

    settings = get_settings()
    if not settings.ton_wallet_address:
        raise HTTPException(503, "TON wallet is not configured")
    if req.tier not in PLAN_PRICES_RUB:
        raise HTTPException(400, "Недопустимый тариф")

    user_id = tg_user.get("db_id") or tg_user["id"]
    user = await db.execute(select(User).where(User.telegram_id == tg_user["id"]))
    user = user.scalar_one_or_none()

    order_id = _uuid.uuid4().hex[:12]
    comment = f"stone_{order_id}"
    price_rub = PLAN_PRICES_RUB[req.tier]
    if user:
        price_rub, _ = apply_discount(price_rub, user)
        if _ is not None:
            clear_discount(user)
            await db.flush()

    price_usd = round(price_rub / USD_TO_RUB, 2)
    ton_rate = await get_ton_rate()
    ton_usd = float(ton_rate["ton_usd"])
    if ton_usd <= 0:
        raise HTTPException(503, "TON rate is unavailable")
    amount_ton = round(price_usd / ton_usd, 4)

    _ton_orders[order_id] = {
        "user_id": user_id, "user_tg_id": tg_user["id"],
        "tier": req.tier, "amount_ton": amount_ton,
        "amount_usd": price_usd, "comment": comment,
        "status": "pending", "created_at": _time.time(),
        "confirmed_tx_hash": None,
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

    return {"order_id": order_id, "comment": comment, "amount_ton": amount_ton, "wallet": settings.ton_wallet_address}


@router.get("/ton-check")
async def check_ton_payment(
    order_id: str,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if TON payment received via TONAPI."""
    _cleanup_ton_orders()
    order = _ton_orders.get(order_id)
    if not order:
        raise HTTPException(404, "Заказ не найден")
    if order["status"] == "confirmed":
        return {"status": "confirmed", "tx_hash": order.get("confirmed_tx_hash")}

    settings = get_settings()
    if not settings.ton_wallet_address:
        raise HTTPException(503, "TON wallet is not configured")
    tonapi_key = getattr(settings, 'tonapi_key', None)

    try:
        headers = {"Authorization": f"Bearer {tonapi_key}"} if tonapi_key else {}
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"https://tonapi.io/v2/blockchain/accounts/{settings.ton_wallet_address}/transactions?limit=20",
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
                if value >= min_amount and str(comment_text) == order["comment"]:
                    if order["status"] == "confirmed":
                        return {"status": "confirmed", "tx_hash": order.get("confirmed_tx_hash")}

                    from datetime import datetime, timedelta
                    from app.models import User

                    tx_result = await db.execute(
                        select(Transaction)
                        .where(Transaction.provider_id == f"ton:{order_id}", Transaction.status == "pending")
                        .with_for_update()
                    )
                    tx = tx_result.scalar_one_or_none()
                    if not tx:
                        order["status"] = "confirmed"
                        order["confirmed_tx_hash"] = tx_item.get("hash", "")
                        return {"status": "confirmed", "tx_hash": order.get("confirmed_tx_hash")}

                    result2 = await db.execute(select(User).where(User.id == order["user_id"]).with_for_update())
                    user = result2.scalar_one_or_none()
                    if not user:
                        result2 = await db.execute(
                            select(User).where(User.telegram_id == order["user_tg_id"]).with_for_update()
                        )
                        user = result2.scalar_one_or_none()
                    if user:
                        user.subscription_tier = order["tier"]
                        user.subscription_started = datetime.utcnow()
                        user.credits_reset_date = datetime.utcnow() + timedelta(days=30)
                        user.monthly_fast_used = 0
                        user.monthly_premium_used = 0
                        user.monthly_images_used = 0
                        user.monthly_videos_used = 0

                    tx.status = "completed"
                    from app.routers.referral import credit_referrer
                    await credit_referrer(db, order["user_tg_id"], order["amount_usd"])
                    await db.commit()
                    order["status"] = "confirmed"
                    order["confirmed_tx_hash"] = tx_item.get("hash", "")
                    logger.info(f"TON confirmed: user={order['user_id']}, tier={order['tier']}")
                    return {"status": "confirmed", "tx_hash": order.get("confirmed_tx_hash")}

    except Exception as e:
        logger.error(f"TON check error: {e}")

    return {"status": "pending"}
