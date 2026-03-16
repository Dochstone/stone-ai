"""Lava.ru payment service — Russian cards (Visa/MC/MIR) + SBP.

API docs: https://dev.lava.ru/
Flow:
  1. POST /api/payment/lava/create-order → creates invoice via Lava API → returns payment URL
  2. User pays on Lava's hosted page (card / SBP)
  3. Lava sends webhook to /api/payment/lava/webhook → we verify signature → credit user
  4. Frontend polls /api/payment/lava/check/{order_id} for status

Env vars needed:
  LAVA_SECRET_KEY  — secret key from Lava business dashboard (for signing requests)
  LAVA_SHOP_ID     — shop ID from Lava dashboard
  LAVA_WEBHOOK_KEY — additional key for verifying webhook signatures
"""

import hashlib
import hmac
import json
import logging
import uuid

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

LAVA_API_BASE = "https://api.lava.ru/business"


def _make_signature(data: dict, secret_key: str) -> str:
    """Generate HMAC-SHA256 signature for Lava API request.

    Lava requires: HMAC-SHA256(json_string, secret_key)
    JSON string must be sorted by keys, no spaces, no escaping.
    """
    sorted_data = dict(sorted(data.items()))
    json_str = json.dumps(sorted_data, separators=(",", ":"), ensure_ascii=False)
    signature = hmac.new(
        secret_key.encode("utf-8"),
        json_str.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return signature


def verify_webhook_signature(data: dict, signature: str, webhook_key: str) -> bool:
    """Verify webhook signature from Lava using the additional (webhook) key."""
    expected = _make_signature(data, webhook_key)
    return hmac.compare_digest(expected, signature)


async def create_invoice(
    amount_rub: float,
    order_id: str,
    description: str = "Stone AI — Пополнение кредитов",
    success_url: str | None = None,
    fail_url: str | None = None,
) -> dict | None:
    """Create a payment invoice via Lava.ru API.

    Returns dict with {id, url, status, amount, ...} or None on error.
    """
    settings = get_settings()

    if not settings.lava_secret_key or not settings.lava_shop_id:
        logger.error("Lava credentials not configured")
        return None

    data = {
        "shopId": settings.lava_shop_id,
        "sum": amount_rub,
        "orderId": order_id,
        "comment": description,
        "expire": 900,  # 15 minutes
    }

    hook_url = f"https://stone-ai-production.up.railway.app/api/payment/lava/webhook"
    data["hookUrl"] = hook_url

    if success_url:
        data["successUrl"] = success_url
    if fail_url:
        data["failUrl"] = fail_url

    signature = _make_signature(data, settings.lava_secret_key)

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Signature": signature,
    }

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{LAVA_API_BASE}/invoice/create",
                json=data,
                headers=headers,
            )

            if resp.status_code == 200:
                result = resp.json()
                if result.get("status") == "success":
                    invoice_data = result.get("data", {})
                    logger.info(f"Lava invoice created: {invoice_data.get('id')}, order={order_id}")
                    return invoice_data
                else:
                    logger.error(f"Lava API error: {result}")
                    return None
            else:
                logger.error(f"Lava HTTP error: {resp.status_code} {resp.text[:300]}")
                return None

    except Exception as e:
        logger.error(f"Lava create_invoice error: {e}")
        return None


async def check_invoice_status(invoice_id: str) -> dict | None:
    """Check payment status of a Lava invoice.

    Returns dict with status info or None on error.
    """
    settings = get_settings()

    if not settings.lava_secret_key or not settings.lava_shop_id:
        return None

    data = {
        "shopId": settings.lava_shop_id,
        "invoiceId": invoice_id,
    }

    signature = _make_signature(data, settings.lava_secret_key)

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Signature": signature,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{LAVA_API_BASE}/invoice/status",
                json=data,
                headers=headers,
            )

            if resp.status_code == 200:
                result = resp.json()
                if result.get("status") == "success":
                    return result.get("data", {})
            return None

    except Exception as e:
        logger.error(f"Lava check_status error: {e}")
        return None


def generate_order_id(user_tg_id: int) -> str:
    """Generate unique order ID for Lava."""
    return f"sa-{user_tg_id}-{uuid.uuid4().hex[:8]}"
