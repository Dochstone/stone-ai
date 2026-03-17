"""Auth API — email/password registration and login with JWT."""

import re
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.middleware.web_auth import (
    hash_password,
    verify_password,
    create_jwt,
    JWT_EXPIRE_DAYS,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


def _validate_email(email: str) -> str:
    email = email.strip().lower()
    if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email):
        raise HTTPException(400, "Invalid email format")
    return email


def _validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")


def _set_cookie_response(data: dict, token: str) -> JSONResponse:
    response = JSONResponse(content=data)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=JWT_EXPIRE_DAYS * 86400,
    )
    return response


@router.post("/register")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user with email and password."""
    email = _validate_email(body.email)
    _validate_password(body.password)

    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Email already registered")

    # Create user — use negative telegram_id as placeholder for web users
    import time
    placeholder_tg_id = -int(time.time() * 1000) % (2**53)

    user = User(
        telegram_id=placeholder_tg_id,
        email=email,
        password_hash=hash_password(body.password),
        auth_provider="email",
        first_name=email.split("@")[0],
        username=None,
        joined_at=datetime.utcnow(),
    )
    db.add(user)
    await db.flush()

    token = create_jwt(user.id, email)

    return _set_cookie_response(
        {
            "status": "ok",
            "user": {
                "id": user.id,
                "email": email,
                "balance_usd": 0.0,
            },
            "token": token,
        },
        token,
    )


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email and password, returns JWT."""
    email = _validate_email(body.email)

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(401, "Invalid email or password")

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")

    token = create_jwt(user.id, email)

    return _set_cookie_response(
        {
            "status": "ok",
            "user": {
                "id": user.id,
                "email": email,
                "balance_usd": round(float(user.balance_usd or 0), 4),
                "total_requests": user.total_requests or 0,
            },
            "token": token,
        },
        token,
    )


@router.post("/logout")
async def logout():
    """Clear auth cookie."""
    response = JSONResponse(content={"status": "ok"})
    response.delete_cookie("access_token")
    return response
