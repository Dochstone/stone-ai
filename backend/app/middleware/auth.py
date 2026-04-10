"""Authentication middleware — supports Telegram WebApp and JWT (email/password).

Priority:
1. X-TG-Init-Data header (Telegram Mini App)
2. Authorization: tma <initData> (Telegram, legacy compat)
3. Authorization: Bearer <token> OR httpOnly cookie (JWT, web)
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

    Auth priority:
    1. X-TG-Init-Data header → Telegram WebApp
    2. Authorization: tma <initData> → Telegram WebApp (legacy)
    3. Authorization: Bearer <token> / cookie → JWT (email/password)

    Returns dict with at least {id, first_name, auth_provider}.
    For TG users: id = telegram_id (int).
    For JWT users: id = telegram_id from DB (for unified lookup).
    """
    settings = get_settings()

    # Dev mode: only if explicitly enabled via DEV_AUTH_BYPASS=true
    if settings.dev_auth_bypass and (not settings.bot_token or settings.bot_token.startswith("PLACEHOLDER")):
        return {
            "id": 123456789,
            "first_name": "Dev",
            "username": "dev_user",
            "language_code": "ru",
            "auth_provider": "telegram",
        }

    # --- 1. X-TG-Init-Data header (preferred for TG) ---
    tg_init = request.headers.get("X-TG-Init-Data", "")
    if tg_init:
        try:
            user = validate_init_data(tg_init, settings.bot_token)
            user["auth_provider"] = "telegram"
            return user
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e))

    # --- 2. Authorization: tma <initData> (legacy compat) ---
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("tma "):
        init_data = auth_header[4:]
        try:
            user = validate_init_data(init_data, settings.bot_token)
            user["auth_provider"] = "telegram"
            return user
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e))

    # --- 3. JWT auth (Bearer token or cookie) ---
    from app.middleware.web_auth import extract_jwt_from_request, decode_jwt

    token = extract_jwt_from_request(request)
    if token:
        payload = decode_jwt(token)
        user_pk = int(payload["sub"])

        # Resolve telegram_id from DB so all downstream code works uniformly
        from app.database import async_session
        from sqlalchemy import select
        from app.models import User

        async with async_session() as db:
            result = await db.execute(select(User).where(User.id == user_pk))
            user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(401, "User not found")

        return {
            "id": user.telegram_id or user.id,
            "db_id": user.id,
            "email": user.email,
            "first_name": user.first_name or (user.email or "").split("@")[0],
            "username": user.username,
            "language_code": user.language or "ru",
            "auth_provider": user.auth_provider or "email",
        }

    raise HTTPException(status_code=401, detail="Missing authorization (Telegram or JWT)")


async def get_current_user_optional(request: Request) -> dict | None:
    """Same as get_current_user but returns None instead of 401 for guests."""
    try:
        return await get_current_user(request)
    except HTTPException:
        return None
