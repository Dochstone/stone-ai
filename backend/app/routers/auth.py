"""Auth API — email/password, Google OAuth, Yandex OAuth, TG linking."""

import re
import time
import logging
from datetime import datetime

import httpx
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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TelegramLinkRequest(BaseModel):
    init_data: str


class GoogleAuthRequest(BaseModel):
    code: str
    redirect_uri: str | None = None


class YandexAuthRequest(BaseModel):
    code: str


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


async def _get_or_create_oauth_user(
    db: AsyncSession, email: str, first_name: str, provider: str,
) -> tuple:
    """Find existing user by email or create new one. Returns (user, token)."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user:
        # Existing user — update provider if needed
        if user.auth_provider not in (provider, "both"):
            user.auth_provider = "both"
            await db.flush()
        token = create_jwt(user.id, email)
        return user, token

    # New user
    placeholder_tg_id = -int(time.time() * 1000) % (2**53)
    user = User(
        telegram_id=placeholder_tg_id,
        email=email,
        password_hash=None,
        auth_provider=provider,
        first_name=first_name,
        username=None,
        joined_at=datetime.utcnow(),
    )
    db.add(user)
    await db.flush()
    token = create_jwt(user.id, email)
    return user, token


@router.post("/google")
async def google_auth(body: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate via Google OAuth code → token → user info."""
    settings = get_settings()
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(503, "Google auth not configured")

    # Exchange code for tokens
    try:
        redirect_uri = body.redirect_uri or "https://website-production-907e.up.railway.app/auth/google/callback"
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": body.code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
        if token_resp.status_code != 200:
            logger.warning(f"Google token exchange failed: {token_resp.text}")
            raise HTTPException(401, "Google auth failed")

        tokens = token_resp.json()
        access_token = tokens.get("access_token")
        if not access_token:
            raise HTTPException(401, "No access token from Google")

    except httpx.HTTPError as e:
        logger.error(f"Google token request error: {e}")
        raise HTTPException(502, "Google auth unavailable")

    # Get user info
    try:
        async with httpx.AsyncClient() as client:
            info_resp = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if info_resp.status_code != 200:
            raise HTTPException(401, "Failed to get Google user info")

        google_user = info_resp.json()
        email = google_user.get("email")
        if not email:
            raise HTTPException(400, "Google account has no email")

        first_name = google_user.get("given_name") or google_user.get("name") or email.split("@")[0]

    except httpx.HTTPError as e:
        logger.error(f"Google user info error: {e}")
        raise HTTPException(502, "Google auth unavailable")

    user, token = await _get_or_create_oauth_user(db, email.lower(), first_name, "google")
    logger.info(f"Google auth: user={user.id}, email={email}")
    return _user_response(user, token)


@router.post("/yandex")
async def yandex_auth(body: YandexAuthRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate via Yandex OAuth code → token → user info."""
    settings = get_settings()
    if not settings.yandex_client_id or not settings.yandex_client_secret:
        raise HTTPException(503, "Yandex auth not configured")

    # Exchange code for token
    try:
        async with httpx.AsyncClient() as client:
            token_resp = await client.post(
                "https://oauth.yandex.ru/token",
                data={
                    "grant_type": "authorization_code",
                    "code": body.code,
                    "client_id": settings.yandex_client_id,
                    "client_secret": settings.yandex_client_secret,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        if token_resp.status_code != 200:
            logger.warning(f"Yandex token exchange failed: {token_resp.text}")
            raise HTTPException(401, "Yandex auth failed")

        access_token = token_resp.json().get("access_token")
        if not access_token:
            raise HTTPException(401, "No access token from Yandex")

    except httpx.HTTPError as e:
        logger.error(f"Yandex token request error: {e}")
        raise HTTPException(502, "Yandex auth unavailable")

    # Get user info
    try:
        async with httpx.AsyncClient() as client:
            info_resp = await client.get(
                "https://login.yandex.ru/info",
                params={"format": "json"},
                headers={"Authorization": f"OAuth {access_token}"},
            )
        if info_resp.status_code != 200:
            raise HTTPException(401, "Failed to get Yandex user info")

        yandex_user = info_resp.json()
        email = yandex_user.get("default_email") or yandex_user.get("emails", [None])[0]
        if not email:
            raise HTTPException(400, "Yandex account has no email")

        first_name = yandex_user.get("first_name") or yandex_user.get("display_name") or email.split("@")[0]

    except httpx.HTTPError as e:
        logger.error(f"Yandex user info error: {e}")
        raise HTTPException(502, "Yandex auth unavailable")

    user, token = await _get_or_create_oauth_user(db, email.lower(), first_name, "yandex")
    logger.info(f"Yandex auth: user={user.id}, email={email}")
    return _user_response(user, token)


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
