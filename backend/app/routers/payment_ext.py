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
from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payment", tags=["payment"])

MIN_TOP_UP_USD = 1.0
USD_TO_RUB = 95.0  # approximate, can be fetched dynamically


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
    await db.commit()

    logger.info(f"Lava payment completed: user={user_tg_id}, usd={usd_amount}, balance=${new_balance:.6f}")
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
        text("SELECT id, user_tg_id, amount_usd, status FROM transactions "
             "WHERE provider_id = :pid AND status = 'pending' LIMIT 1"),
        {"pid": f"heleket:{payment_uuid}"}
    )
    row = result.fetchone()

    if not row:
        logger.warning(f"Heleket webhook: transaction not found for uuid={payment_uuid}")
        return {"ok": True, "message": "Transaction not found"}

    tx_id, user_tg_id, usd_amount, tx_status = row

    if tx_status == "completed":
        return {"ok": True, "message": "Already processed"}

    new_balance = await add_balance(db, user_tg_id, usd_amount)

    await db.execute(
        text("UPDATE transactions SET status = 'completed', tx_hash = :txh WHERE id = :tid"),
        {"txh": payment_uuid, "tid": tx_id}
    )
    await db.execute(
        text("UPDATE users SET total_deposited_usd = COALESCE(total_deposited_usd, 0) + :amt WHERE telegram_id = :tid"),
        {"amt": usd_amount, "tid": user_tg_id}
    )
    await db.commit()

    logger.info(f"Heleket payment completed: user={user_tg_id}, usd={usd_amount}, balance=${new_balance:.6f}")
    return {"ok": True}


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
