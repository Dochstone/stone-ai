"""Auth API — email/password registration, login, and TG linking."""

import re
import time
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User
from app.middleware.auth import get_current_user, validate_init_data
from app.middleware.web_auth import (
    hash_password,
    verify_password,
    create_jwt,
    JWT_EXPIRE_DAYS,
)
from app.config import get_settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TelegramLinkRequest(BaseModel):
    init_data: str


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


def _user_response(user: User, token: str) -> JSONResponse:
    return _set_cookie_response(
        {
            "status": "ok",
            "user": {
                "id": user.id,
                "telegram_id": user.telegram_id,
                "email": user.email,
                "balance_usd": round(float(user.balance_usd or 0), 4),
                "total_requests": user.total_requests or 0,
                "auth_provider": user.auth_provider,
            },
            "token": token,
        },
        token,
    )


@router.post("/register")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user with email and password."""
    email = _validate_email(body.email)
    _validate_password(body.password)

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Email already registered")

    # Negative placeholder telegram_id for web-only users
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
    return _user_response(user, token)


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
    return _user_response(user, token)


@router.post("/logout")
async def logout():
    """Clear auth cookie."""
    response = JSONResponse(content={"status": "ok"})
    response.delete_cookie("access_token")
    return response


@router.post("/telegram-link")
async def telegram_link(
    body: TelegramLinkRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Link Telegram account to an existing web (email) account.

    Requires: JWT auth (logged in via email) + TG initData in body.
    Merges TG user into web user — balance, requests, history preserved.
    """
    # Must be logged in via JWT (email account)
    if tg_user.get("auth_provider") == "telegram":
        raise HTTPException(400, "Already authenticated via Telegram. Log in with email first.")

    # Validate TG initData from body
    settings = get_settings()
    try:
        tg_data = validate_init_data(body.init_data, settings.bot_token)
    except ValueError as e:
        raise HTTPException(400, f"Invalid Telegram initData: {e}")

    tg_id = tg_data["id"]
    web_user_pk = tg_user.get("db_id") or tg_user["id"]

    # Get web user (email account)
    result = await db.execute(select(User).where(User.id == web_user_pk))
    web_user = result.scalar_one_or_none()
    if not web_user:
        raise HTTPException(404, "Web user not found")

    # Check if TG account already exists in DB
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    tg_existing = result.scalar_one_or_none()

    if tg_existing and tg_existing.id == web_user.id:
        return {"status": "ok", "message": "Already linked"}

    if tg_existing:
        # Merge: transfer TG user's balance and stats into web user
        web_user.balance_usd = float(web_user.balance_usd or 0) + float(tg_existing.balance_usd or 0)
        web_user.total_deposited_usd = float(web_user.total_deposited_usd or 0) + float(tg_existing.total_deposited_usd or 0)
        web_user.total_requests = (web_user.total_requests or 0) + (tg_existing.total_requests or 0)
        web_user.total_tokens_used = (web_user.total_tokens_used or 0) + (tg_existing.total_tokens_used or 0)

        # Update all usage/transaction records to point to web user
        from app.models.usage import Usage
        from app.models.transaction import Transaction
        from sqlalchemy import update

        await db.execute(
            update(Usage).where(Usage.user_tg_id == tg_id).values(user_tg_id=web_user.telegram_id)
        )
        await db.execute(
            update(Transaction).where(Transaction.user_tg_id == tg_id).values(user_tg_id=web_user.telegram_id)
        )

        # Delete old TG-only user
        await db.delete(tg_existing)

    # Set real telegram_id on web user
    web_user.telegram_id = tg_id
    web_user.username = tg_data.get("username") or web_user.username
    web_user.first_name = tg_data.get("first_name") or web_user.first_name
    web_user.auth_provider = "both"

    await db.flush()

    # Issue new JWT with updated info
    token = create_jwt(web_user.id, web_user.email or "")

    return _set_cookie_response(
        {
            "status": "ok",
            "message": "Telegram account linked successfully",
            "user": {
                "id": web_user.id,
                "telegram_id": web_user.telegram_id,
                "email": web_user.email,
                "username": web_user.username,
                "balance_usd": round(float(web_user.balance_usd or 0), 4),
                "auth_provider": web_user.auth_provider,
            },
        },
        token,
    )
