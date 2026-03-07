"""Payment endpoints — Stars invoices (Phase 1), TON and USDT in later phases."""

from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models import Subscription, Pass, Transaction

router = APIRouter(prefix="/api/payment", tags=["payment"])


# ─── Stars subscription products ───
STARS_PRODUCTS = {
    "plus_stars": {"plan": "plus", "price": 469, "duration_days": 30, "name": "PLUS"},
    "max_stars": {"plan": "max", "price": 1499, "duration_days": 30, "name": "MAX"},
}

# ─── Stars pass products ───
STARS_PASSES = {
    "day_pass": {"price": 59, "type": "day", "requests": 15, "hours": 24, "name": "Day Pass"},
    "week_pass": {"price": 229, "type": "week", "requests": 80, "hours": 168, "name": "Week Pass"},
    "single_query": {"price": 6, "type": "single", "requests": 1, "hours": None, "name": "1 запрос"},
}


class InvoiceRequest(BaseModel):
    product_id: str  # e.g. "plus_stars", "day_pass"


@router.post("/stars/create-invoice")
async def create_stars_invoice(
    req: InvoiceRequest,
    tg_user: dict = Depends(get_current_user),
):
    """
    Create a Telegram Stars invoice link.

    This returns the invoice data that the frontend sends to WebApp.openInvoice().
    The actual invoice creation happens via the bot (aiogram).
    """
    product = STARS_PRODUCTS.get(req.product_id) or STARS_PASSES.get(req.product_id)
    if not product:
        raise HTTPException(status_code=400, detail=f"Unknown product: {req.product_id}")

    # Return invoice params — the bot will create the actual invoice
    return {
        "product_id": req.product_id,
        "title": f"Stone AI — {product['name']}",
        "description": f"{'Подписка' if req.product_id in STARS_PRODUCTS else 'Pass'} {product['name']}",
        "amount": product["price"],
        "currency": "XTR",
        "payload": f"{req.product_id}:{tg_user['id']}",
    }


@router.post("/stars/confirm")
async def confirm_stars_payment(
    product_id: str,
    tg_id: int,
    payment_id: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Called by the bot after successful_payment to activate subscription/pass.
    Internal endpoint — not exposed to frontend.
    """
    now = datetime.utcnow()

    # Handle subscription
    if product_id in STARS_PRODUCTS:
        product = STARS_PRODUCTS[product_id]
        sub = Subscription(
            user_tg_id=tg_id,
            plan=product["plan"],
            payment_method="stars",
            payment_id=payment_id,
            is_active=True,
            started_at=now,
            expires_at=now + timedelta(days=product["duration_days"]),
        )
        db.add(sub)

        # Record transaction
        tx = Transaction(
            user_tg_id=tg_id,
            amount=product["price"],
            currency="XTR",
            amount_usd=product["price"] * 0.013,  # ~$0.013 per Star
            product_type="subscription",
            product_id=product_id,
            status="completed",
            provider_id=payment_id,
        )
        db.add(tx)
        await db.commit()

        return {"status": "ok", "plan": product["plan"], "expires_at": sub.expires_at.isoformat()}

    # Handle pass
    if product_id in STARS_PASSES:
        product = STARS_PASSES[product_id]
        new_pass = Pass(
            user_tg_id=tg_id,
            pass_type=product["type"],
            payment_method="stars",
            payment_id=payment_id,
            requests_left=product["requests"],
            is_active=True,
            activated_at=now,
            expires_at=now + timedelta(hours=product["hours"]) if product["hours"] else None,
        )
        db.add(new_pass)

        tx = Transaction(
            user_tg_id=tg_id,
            amount=product["price"],
            currency="XTR",
            amount_usd=product["price"] * 0.013,
            product_type="pass",
            product_id=product_id,
            status="completed",
            provider_id=payment_id,
        )
        db.add(tx)
        await db.commit()

        return {"status": "ok", "pass_type": product["type"], "requests": product["requests"]}

    raise HTTPException(status_code=400, detail=f"Unknown product: {product_id}")
