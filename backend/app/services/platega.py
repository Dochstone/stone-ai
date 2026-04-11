"""Platega.io payment service — SBP QR payments.

API docs: https://app.platega.io
Flow:
  1. POST /api/payment/platega/create-order -> POST /transaction/process -> redirect URL
  2. User pays via SBP QR on Platega's hosted page
  3. Platega sends webhook to /api/payment/platega/webhook (X-MerchantId + X-Secret headers)
  4. Frontend polls /api/payment/platega/check/{order_id} for status

Env vars needed:
  PLATEGA_MERCHANT_ID — merchant ID from Platega dashboard
  PLATEGA_SECRET      — secret key from Platega dashboard
"""

import logging
import uuid
import hmac

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

PLATEGA_API_BASE = "https://app.platega.io"


async def create_payment(
    amount_rub: float,
    user_id: str,
    description: str = "Stone AI — Пополнение баланса",
) -> dict | None:
    """Create a payment via Platega /transaction/process.

    Returns dict with transaction_id, redirect_url, usdt_rate, status or None on error.
    """
    settings = get_settings()

    if not settings.platega_merchant_id or not settings.platega_secret:
        logger.error("Platega credentials not configured")
        return None

    headers = {
        "Content-Type": "application/json",
        "X-MerchantId": settings.platega_merchant_id,
        "X-Secret": settings.platega_secret,
    }

    payload = {
        "paymentMethod": 2,
        "paymentDetails": {
            "amount": int(amount_rub),
            "currency": "RUB",
        },
        "description": description,
        "return": "https://stoneai.ru/payment/success",
        "failedUrl": "https://stoneai.ru/payment/failed",
        "payload": f"user:{user_id}",
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{PLATEGA_API_BASE}/transaction/process",
                json=payload,
                headers=headers,
            )

            if resp.status_code == 200:
                result = resp.json()
                transaction_id = result.get("transactionId")
                redirect_url = result.get("redirect")

                if transaction_id and redirect_url:
                    logger.info(f"Platega payment created: {transaction_id}")
                    return {
                        "transaction_id": transaction_id,
                        "redirect_url": redirect_url,
                        "usdt_rate": result.get("usdtRate"),
                        "status": result.get("status"),
                        "expires_in": result.get("expiresIn"),
                    }

                logger.error(f"Platega API: missing transactionId/redirect in response: {result}")
                return None

            logger.error(f"Platega HTTP error: {resp.status_code} {resp.text[:300]}")
            return None

    except Exception as e:
        logger.error(f"Platega create_payment error: {e}")
        return None


async def check_status(transaction_id: str) -> dict | None:
    """Check payment status via GET /transaction/{transactionId}.

    Returns dict with status, amount, currency, payload or None on error.
    """
    settings = get_settings()

    if not settings.platega_merchant_id or not settings.platega_secret:
        return None

    headers = {
        "X-MerchantId": settings.platega_merchant_id,
        "X-Secret": settings.platega_secret,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{PLATEGA_API_BASE}/transaction/{transaction_id}",
                headers=headers,
            )

            if resp.status_code == 200:
                data = resp.json()
                return {
                    "status": data.get("status"),
                    "amount": data.get("paymentDetails", {}).get("amount"),
                    "currency": data.get("paymentDetails", {}).get("currency"),
                    "payload": data.get("payload"),
                    "amount_usdt": data.get("amountUsdt"),
                }
            return None

    except Exception as e:
        logger.error(f"Platega check_status error: {e}")
        return None


def verify_webhook(merchant_id: str, secret: str) -> bool:
    """Verify webhook authenticity by comparing X-MerchantId and X-Secret headers."""
    settings = get_settings()
    return bool(
        merchant_id
        and secret
        and settings.platega_merchant_id
        and settings.platega_secret
        and hmac.compare_digest(merchant_id, settings.platega_merchant_id)
        and hmac.compare_digest(secret, settings.platega_secret)
    )


def generate_order_id(user_tg_id: int) -> str:
    """Generate unique order ID for Platega."""
    return f"sa-plt-{user_tg_id}-{uuid.uuid4().hex[:8]}"
