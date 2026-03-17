"""Authentication middleware — supports Telegram WebApp and JWT (email/password).

Telegram: Authorization: tma <initData>
JWT:      Authorization: Bearer <token>  OR  httpOnly cookie "access_token"
"""

import hashlib
import hmac
import json
import time
from urllib.parse import unquote

from fastapi import HTTPException, Request
from app.config import get_settings


def validate_init_data(init_data: str, bot_token: str, max_age: int = 86400) -> dict:
    """
    Validate Telegram WebApp initData and return parsed user data.

    Returns:
        Dict with user info: {id, first_name, username, language_code, ...}

    Raises:
        ValueError: If validation fails
    """
    parsed = {}
    for pair in init_data.split("&"):
        if "=" in pair:
            key, value = pair.split("=", 1)
            parsed[key] = unquote(value)

    received_hash = parsed.pop("hash", None)
    if not received_hash:
        raise ValueError("Missing hash in initData")

    auth_date = parsed.get("auth_date")
    if auth_date:
        age = int(time.time()) - int(auth_date)
        if age > max_age:
            raise ValueError(f"initData expired: {age}s old (max {max_age}s)")

    data_check_string = "\n".join(
        f"{key}={parsed[key]}" for key in sorted(parsed.keys())
    )

    secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        raise ValueError("Invalid hash — data may be tampered")

    user_data = parsed.get("user")
    if user_data:
        return json.loads(user_data)

    raise ValueError("No user data in initData")


async def get_current_user(request: Request) -> dict:
    """
    FastAPI dependency: extract and validate user from request.

    Supports two auth methods:
    1. Telegram WebApp: Authorization: tma <initData>
    2. JWT (email):     Authorization: Bearer <token> OR cookie "access_token"

    Returns dict with at least {id, first_name}.
    """
    settings = get_settings()

    # Dev mode: allow fake user
    if not settings.bot_token or settings.bot_token.startswith("PLACEHOLDER"):
        return {
            "id": 123456789,
            "first_name": "Art",
            "username": "art_stone",
            "language_code": "ru",
        }

    auth_header = request.headers.get("Authorization", "")

    # --- Telegram WebApp auth ---
    if auth_header.startswith("tma "):
        init_data = auth_header[4:]
        try:
            return validate_init_data(init_data, settings.bot_token)
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e))

    # --- JWT auth (Bearer token or cookie) ---
    from app.middleware.web_auth import extract_jwt_from_request, decode_jwt

    token = extract_jwt_from_request(request)
    if token:
        payload = decode_jwt(token)
        return {
            "id": int(payload["sub"]),
            "email": payload.get("email"),
            "first_name": payload.get("email", "").split("@")[0],
            "username": None,
            "language_code": "ru",
            "auth_provider": "email",
        }

    raise HTTPException(status_code=401, detail="Missing authorization (Telegram or JWT)")
