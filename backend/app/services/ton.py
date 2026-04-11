"""TON Connect payment service — order creation, transaction verification via TonAPI.

Flow:
  1. Frontend: user connects wallet via TON Connect UI
  2. Frontend: POST /api/payment/ton/create-order → gets {order_id, payload_comment, ton_amount, address}
  3. Frontend: sends TON via tonConnectUI.sendTransaction() with payload_comment in body
  4. Frontend: POST /api/payment/ton/verify → sends {order_id, boc}
  5. Backend: polls TonAPI to find the incoming transaction, verifies amount & comment
  6. Backend: credits user account
"""

import logging
import time
import uuid
import hashlib
from datetime import datetime, timedelta

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

# In-memory pending orders (for MVP; migrate to DB/Redis for production scale)
_pending_orders: dict[str, dict] = {}

# TON price cache (refresh every 60s)
_ton_price_cache: dict = {"price": 0.0, "updated": 0.0}
TON_PRICE_CACHE_TTL = 60  # seconds

# Nanoton conversion
NANOTON = 1_000_000_000  # 1 TON = 10^9 nanotons


async def get_ton_price_usd() -> float:
    """Get current TON/USD price from CoinGecko (free, no key needed)."""
    now = time.time()
    if _ton_price_cache["price"] > 0 and (now - _ton_price_cache["updated"]) < TON_PRICE_CACHE_TTL:
        return _ton_price_cache["price"]

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # Try CoinGecko first
            resp = await client.get(
                "https://api.coingecko.com/api/v3/simple/price",
                params={"ids": "the-open-network", "vs_currencies": "usd"},
            )
            if resp.status_code == 200:
                data = resp.json()
                price = data.get("the-open-network", {}).get("usd", 0)
                if price > 0:
                    _ton_price_cache["price"] = price
                    _ton_price_cache["updated"] = now
                    logger.info(f"TON price updated: ${price}")
                    return price

        # Fallback: try TonAPI rates
        settings = get_settings()
        if settings.tonapi_key:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    "https://tonapi.io/v2/rates",
                    params={"tokens": "ton", "currencies": "usd"},
                    headers={"Authorization": f"Bearer {settings.tonapi_key}"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    price = data.get("rates", {}).get("TON", {}).get("prices", {}).get("USD", 0)
                    if price > 0:
                        _ton_price_cache["price"] = price
                        _ton_price_cache["updated"] = now
                        return price

    except Exception as e:
        logger.warning(f"Failed to fetch TON price: {e}")

    # Return cached or fallback
    return _ton_price_cache["price"] if _ton_price_cache["price"] > 0 else 3.5


def create_order(user_tg_id: int, usd_amount: float, ton_amount: float) -> dict:
    """Create a pending TON payment order with unique comment."""
    order_id = uuid.uuid4().hex[:16]

    # Unique comment for matching the transaction
    raw = f"stoneai:{order_id}:{user_tg_id}:{int(time.time())}"
    comment = hashlib.sha256(raw.encode()).hexdigest()[:32]
    payload_comment = f"SA-{comment}"

    order = {
        "order_id": order_id,
        "user_tg_id": user_tg_id,
        "usd_amount": usd_amount,
        "ton_amount": ton_amount,
        "payload_comment": payload_comment,
        "status": "pending",
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=15),
        "tx_hash": None,
    }
    _pending_orders[order_id] = order
    logger.info(f"TON order created: {order_id}, user={user_tg_id}, ton={ton_amount}, comment={payload_comment}")
    return order


def get_order(order_id: str) -> dict | None:
    """Get a pending order by ID."""
    order = _pending_orders.get(order_id)
    if order and order["expires_at"] < datetime.utcnow():
        order["status"] = "expired"
    return order


def complete_order(order_id: str, tx_hash: str) -> dict | None:
    """Mark order as completed."""
    order = _pending_orders.get(order_id)
    if order:
        order["status"] = "completed"
        order["tx_hash"] = tx_hash
    return order


async def verify_transaction(
    wallet_address: str,
    expected_comment: str,
    expected_amount_ton: float,
    max_age_seconds: int = 900,
) -> dict | None:
    """
    Check TonAPI for a recent incoming transaction matching our comment and amount.

    Returns transaction info dict if found, None otherwise.
    """
    settings = get_settings()
    dest_address = settings.ton_wallet_address

    if not dest_address:
        logger.error("TON_WALLET_ADDRESS not configured")
        return None

    headers = {}
    if settings.tonapi_key:
        headers["Authorization"] = f"Bearer {settings.tonapi_key}"

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # Get recent transactions for our wallet
            resp = await client.get(
                f"https://tonapi.io/v2/blockchain/accounts/{dest_address}/transactions",
                params={"limit": 50},
                headers=headers,
            )

            if resp.status_code != 200:
                logger.error(f"TonAPI error: {resp.status_code} {resp.text[:200]}")
                return None

            data = resp.json()
            transactions = data.get("transactions", [])

            now_ts = int(time.time())

            for tx in transactions:
                # Check age
                tx_time = tx.get("utime", 0)
                if (now_ts - tx_time) > max_age_seconds:
                    continue

                # Check incoming message
                in_msg = tx.get("in_msg")
                if not in_msg:
                    continue

                # Check it's an incoming transfer (not outgoing)
                msg_value = int(in_msg.get("value", 0))
                if msg_value <= 0:
                    continue

                # Check comment/payload in the message body
                decoded_body = in_msg.get("decoded_body")
                raw_body = in_msg.get("raw_body", "")
                msg_comment = ""

                if decoded_body and isinstance(decoded_body, dict):
                    msg_comment = decoded_body.get("text", "")
                elif in_msg.get("decoded_op_name") == "text_comment":
                    msg_comment = decoded_body.get("text", "") if decoded_body else ""

                # Also check message_content for text
                msg_content = in_msg.get("message_content", {})
                if not msg_comment and msg_content:
                    decoded = msg_content.get("decoded", {})
                    if decoded and decoded.get("type") == "text_comment":
                        msg_comment = decoded.get("value", "")

                if msg_comment != expected_comment:
                    continue

                # Check amount (allow 1% tolerance for network fees)
                received_ton = msg_value / NANOTON
                expected_min = expected_amount_ton * 0.98

                if received_ton < expected_min:
                    logger.warning(
                        f"TON amount mismatch: received={received_ton}, expected={expected_amount_ton}"
                    )
                    continue

                # Match found!
                tx_hash = tx.get("hash", "")
                sender = in_msg.get("source", {}).get("address", "")

                logger.info(
                    f"TON tx verified: hash={tx_hash}, from={sender}, "
                    f"amount={received_ton} TON, comment={msg_comment}"
                )

                return {
                    "tx_hash": tx_hash,
                    "sender": sender,
                    "amount_ton": received_ton,
                    "amount_nanoton": msg_value,
                    "comment": msg_comment,
                    "timestamp": tx_time,
                }

    except Exception as e:
        logger.error(f"TON verify error: {e}")

    return None


def cleanup_expired_orders():
    """Remove expired orders from memory."""
    now = datetime.utcnow()
    expired = [oid for oid, o in _pending_orders.items()
               if o["expires_at"] < now and o["status"] == "pending"]
    for oid in expired:
        _pending_orders[oid]["status"] = "expired"
    if expired:
        logger.info(f"Cleaned up {len(expired)} expired TON orders")
