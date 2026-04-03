"""Platega.io payment service — Russian cards (Visa/MC/MIR) + SBP.

API docs: https://platega.io (documentation in dashboard my.platega.io)
Flow:
  1. POST /api/payment/platega/create-order → creates invoice via Platega API → returns payment URL
  2. User pays on Platega's hosted page (card / SBP)
  3. Platega sends webhook to /api/payment/platega/webhook → we verify signature → credit user
  4. Frontend polls /api/payment/platega/check/{order_id} for status

Env vars needed:
  PLATEGA_API_KEY       — API key from Platega dashboard
  PLATEGA_SHOP_ID       — shop/merchant ID from Platega dashboard
  PLATEGA_WEBHOOK_SECRET — secret for verifying webhook signatures
"""

import hashlib
import hmac
import json
import logging
import uuid

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

PLATEGA_API_BASE = "https://api.platega.io/v1"


def verify_webhook_signature(body: bytes, signature: str, secret: str) -> bool:
    """Verify webhook signature from Platega.

    TODO: Adjust algorithm once Platega API docs confirm exact signing method.
    Assuming HMAC-SHA256(raw_body, secret) — most common pattern.
    """
    expected = hmac.new(
        secret.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


async def create_invoice(
    amount_rub: float,
    order_id: str,
    description: str = "Stone AI — Пополнение баланса",
    success_url: str | None = None,
    fail_url: str | None = None,
    webhook_url: str | None = None,
) -> dict | None:
    """Create a payment invoice via Platega.io API.

    Returns dict with payment URL and order info, or None on error.

    TODO: Adjust request format once Platega API docs are available.
    Current structure follows common payment gateway patterns.
    """
    settings = get_settings()

    if not settings.platega_api_key or not settings.platega_shop_id:
        logger.error("Platega credentials not configured")
        return None

    data = {
        "shop_id": settings.platega_shop_id,
        "amount": amount_rub,
        "order_id": order_id,
        "description": description,
        "currency": "RUB",
    }

    if webhook_url:
        data["webhook_url"] = webhook_url
    if success_url:
        data["success_url"] = success_url
    if fail_url:
        data["fail_url"] = fail_url

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.platega_api_key}",
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{PLATEGA_API_BASE}/payment/create",
                json=data,
                headers=headers,
            )

            if resp.status_code == 200:
                result = resp.json()
                # TODO: Adjust response parsing based on actual Platega API response format
                payment_url = result.get("payment_url") or result.get("url") or result.get("data", {}).get("url")
                payment_id = result.get("payment_id") or result.get("id") or result.get("data", {}).get("id")

                if payment_url:
                    logger.info(f"Platega invoice created: {payment_id}, order={order_id}")
                    return {
                        "id": payment_id,
                        "url": payment_url,
                        "amount": amount_rub,
                        "order_id": order_id,
                    }
                else:
                    logger.error(f"Platega API: no payment_url in response: {result}")
                    return None
            else:
                logger.error(f"Platega HTTP error: {resp.status_code} {resp.text[:300]}")
                return None

    except Exception as e:
        logger.error(f"Platega create_invoice error: {e}")
        return None


async def check_invoice_status(payment_id: str) -> dict | None:
    """Check payment status of a Platega invoice.

    Returns dict with status info or None on error.
    """
    settings = get_settings()

    if not settings.platega_api_key:
        return None

    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {settings.platega_api_key}",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{PLATEGA_API_BASE}/payment/{payment_id}",
                headers=headers,
            )

            if resp.status_code == 200:
                return resp.json()
            return None

    except Exception as e:
        logger.error(f"Platega check_status error: {e}")
        return None


def generate_order_id(user_tg_id: int) -> str:
    """Generate unique order ID for Platega."""
    return f"sa-plt-{user_tg_id}-{uuid.uuid4().hex[:8]}"
