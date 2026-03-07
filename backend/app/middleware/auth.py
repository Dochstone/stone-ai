"""Telegram WebApp authentication middleware.

Validates initData using HMAC-SHA256 as per Telegram docs:
https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
"""

import hashlib
import hmac
import json
import time
from urllib.parse import parse_qs, unquote

from fastapi import HTTPException, Request, Depends
from app.config import get_settings


def validate_init_data(init_data: str, bot_token: str, max_age: int = 86400) -> dict:
    """
    Validate Telegram WebApp initData and return parsed user data.

    Args:
        init_data: Raw initData string from Telegram WebApp
        bot_token: Bot token for HMAC verification
        max_age: Max allowed age in seconds (default 24h for dev, 300 for prod)

    Returns:
        Dict with user info: {id, first_name, username, language_code, ...}

    Raises:
        ValueError: If validation fails
    """
    # Parse the query string
    parsed = {}
    for pair in init_data.split("&"):
        if "=" in pair:
            key, value = pair.split("=", 1)
            parsed[key] = unquote(value)

    # Extract and remove hash
    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise ValueError("Missing hash in initData")

    # Check auth_date freshness
    auth_date = parsed.get("auth_date")
    if auth_date:
        age = int(time.time()) - int(auth_date)
        if age > max_age:
            raise ValueError(f"initData expired: {age}s old (max {max_age}s)")

    # Build data-check-string (sorted alphabetically)
    data_check_string = "\n".join(
        f"{key}={parsed[key]}" for key in sorted(parsed.keys())
    )

    # Compute HMAC
    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        raise ValueError("Invalid hash — data may be tampered")

    # Parse user JSON
    user_data = parsed.get("user")
    if user_data:
        return json.loads(user_data)

    raise ValueError("No user data in initData")


async def get_current_user(request: Request) -> dict:
    """
    FastAPI dependency: extract and validate Telegram user from request.

    Expects header: Authorization: tma <initData>
    """
    settings = get_settings()

    auth_header = request.headers.get("Authorization", "")

    # Dev mode: allow fake user
    if not settings.bot_token or settings.bot_token.startswith("PLACEHOLDER"):
        return {
            "id": 123456789,
            "first_name": "Art",
            "username": "art_stone",
            "language_code": "ru",
        }

    if not auth_header.startswith("tma "):
        raise HTTPException(status_code=401, detail="Missing Telegram authorization")

    init_data = auth_header[4:]  # Remove "tma " prefix

    try:
        user = validate_init_data(init_data, settings.bot_token)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

    return user
