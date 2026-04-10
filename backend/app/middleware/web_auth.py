"""Web authentication — JWT-based email/password auth.

Works alongside Telegram auth. Does NOT replace get_current_user.
"""

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import HTTPException, Request
from app.config import get_settings

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30


def _get_jwt_secret() -> str:
    secret = get_settings().secret_key
    if not secret:
        raise RuntimeError("SECRET_KEY is required for JWT auth")
    return secret


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def create_jwt(user_id: int, email: str) -> str:
    secret = _get_jwt_secret()
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, secret, algorithm=JWT_ALGORITHM)


def decode_jwt(token: str) -> dict:
    """Decode and validate JWT. Returns payload or raises."""
    try:
        return jwt.decode(token, _get_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except RuntimeError:
        raise HTTPException(503, "JWT authentication is not configured")
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


def extract_jwt_from_request(request: Request) -> str | None:
    """Try to get JWT from cookie or Authorization: Bearer header."""
    # Cookie first
    token = request.cookies.get("access_token")
    if token:
        return token

    # Authorization header
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]

    return None
