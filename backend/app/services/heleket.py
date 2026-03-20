"""Heleket crypto payment service — USDT, BTC, ETH, TON, SOL + 10 more coins.

API docs: https://doc.heleket.com/
Flow:
  1. POST /api/payment/crypto/create-order → creates invoice via Heleket API → returns payment URL
  2. User pays on Heleket's hosted page (picks crypto, scans QR / sends from wallet)
  3. Heleket sends webhook to /api/payment/crypto/webhook → we verify signature → credit user
  4. Frontend can also poll /api/payment/crypto/check/{order_id}

Env vars needed:
  HELEKET_API_KEY    — payment API key from Heleket merchant dashboard
  HELEKET_MERCHANT   — merchant UUID from Heleket dashboard
"""

import hashlib
import hmac
import json
import logging
import uuid

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

HELEKET_API_BASE = "https://api.heleket.com/v1"


def _heleket_sign(api_key: str, data: dict) -> str:
    """Generate MD5 signature for Heleket API.

    Heleket uses: md5(base64(json_body) + api_key) — passed in 'sign' header.
    """
    import base64
    json_str = json.dumps(data)
    b64 = base64.b64encode(json_str.encode("utf-8")).decode("utf-8")
    raw = b64 + api_key
    return hashlib.md5(raw.encode("utf-8")).hexdigest()


def verify_webhook_signature(body: bytes, received_sign: str, api_key: str) -> bool:
    """Verify Heleket webhook signature."""
    import base64
    b64 = base64.b64encode(body).decode("utf-8")
    raw = b64 + api_key
    expected = hashlib.md5(raw.encode("utf-8")).hexdigest()
    return hmac.compare_digest(expected, received_sign)


async def create_invoice(
    amount_usd: float,
    order_id: str,
    currency: str = "USD",
    url_callback: str | None = None,
    url_return: str | None = None,
    url_success: str | None = None,
    lifetime: int = 7200,  # 2 hours default
) -> dict | None:
    """Create a crypto payment invoice via Heleket API.

    Args:
        amount_usd: Amount in USD (Heleket converts to crypto at checkout)
        order_id: Unique order identifier
        currency: Invoice currency (USD, EUR, RUB, or crypto like USDT, BTC, ETH)
        url_callback: Webhook URL for status updates
        url_return: URL to redirect user back to app
        url_success: URL to redirect user on success
        lifetime: Invoice lifetime in seconds

    Returns dict with {uuid, order_id, amount, url, ...} or None on error.
    """
    settings = get_settings()

    if not settings.heleket_api_key or not settings.heleket_merchant:
        logger.error("Heleket credentials not configured")
        return None

    callback = url_callback or "https://stone-ai-production.up.railway.app/api/payment/crypto/webhook"

    data = {
        "amount": str(amount_usd),
        "currency": currency,
        "order_id": order_id,
        "url_callback": callback,
        "lifetime": lifetime,
    }

    if url_return:
        data["url_return"] = url_return
    if url_success:
        data["url_success"] = url_success

    # Must use same json string for sign and body
    body_str = json.dumps(data)
    sign = _heleket_sign(settings.heleket_api_key, data)

    headers = {
        "Content-Type": "application/json",
        "merchant": settings.heleket_merchant,
        "sign": sign,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{HELEKET_API_BASE}/payment",
                content=body_str.encode("utf-8"),
                headers=headers,
            )

            if resp.status_code == 200:
                result = resp.json()
                if result.get("state") == 0:
                    invoice = result.get("result", {})
                    logger.info(
                        f"Heleket invoice created: uuid={invoice.get('uuid')}, "
                        f"order={order_id}, amount=${amount_usd}"
                    )
                    return invoice
                else:
                    logger.error(f"Heleket API error: {result}")
                    return None
            else:
                logger.error(f"Heleket HTTP error: {resp.status_code} {resp.text[:300]}")
                return None

    except Exception as e:
        logger.error(f"Heleket create_invoice error: {e}")
        return None


async def check_invoice_status(payment_uuid: str) -> dict | None:
    """Check payment status of a Heleket invoice.

    Returns dict with payment info or None on error.
    Statuses: process, check, paid, paid_over, fail, wrong_amount, cancel, system_fail, refund_process, refund_fail, refund_paid
    """
    settings = get_settings()

    if not settings.heleket_api_key or not settings.heleket_merchant:
        return None

    data = {
        "uuid": payment_uuid,
    }

    body_str = json.dumps(data)
    sign = _heleket_sign(settings.heleket_api_key, data)

    headers = {
        "Content-Type": "application/json",
        "merchant": settings.heleket_merchant,
        "sign": sign,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{HELEKET_API_BASE}/payment/info",
                content=body_str.encode("utf-8"),
                headers=headers,
            )

            if resp.status_code == 200:
                result = resp.json()
                if result.get("state") == 0:
                    return result.get("result", {})
            return None

    except Exception as e:
        logger.error(f"Heleket check_status error: {e}")
        return None


def generate_order_id(user_tg_id: int) -> str:
    """Generate unique order ID for Heleket."""
    return f"hk-{user_tg_id}-{uuid.uuid4().hex[:8]}"
