"""Auth API — email/password, Google OAuth, Yandex OAuth, TG linking, TG web login."""

import asyncio
import re
import time
import uuid
import logging
from datetime import datetime, timedelta

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
from app.middleware.rate_limit import RateLimiter
from app.config import get_settings, WELCOME_BONUS_USD, WELCOME_BONUS_RUB
from app.services.email_service import generate_code, send_verification_code, send_reset_code
from app.services.linked_providers import add_linked_providers, get_linked_providers
from app.services.streak import update_login_streak
from app.routers.achievements import check_and_update

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

CODE_TTL = 600  # 10 minutes
MAX_CODE_ATTEMPTS = 5
verification_request_limiter = RateLimiter(max_requests=3, window_seconds=300)
TIER_RANK = {"free": 0, "mini": 1, "max": 2, "max-pro": 3}


def _should_keep_subscription(source: User, target: User) -> bool:
    """Prefer the higher active tier; for equal tiers prefer the later expiry."""
    source_tier = source.subscription_tier or "free"
    target_tier = target.subscription_tier or "free"
    source_rank = TIER_RANK.get(source_tier, 0)
    target_rank = TIER_RANK.get(target_tier, 0)
    if source_rank != target_rank:
        return source_rank > target_rank
    source_expiry = source.credits_reset_date or datetime.min
    target_expiry = target.credits_reset_date or datetime.min
    return source_expiry > target_expiry


def _copy_subscription_state(target: User, source: User) -> None:
    """Copy subscription-related state during account merge."""
    target.subscription_tier = source.subscription_tier
    target.subscription_started = source.subscription_started
    target.credits_reset_date = source.credits_reset_date
    target.credits_balance = source.credits_balance
    target.monthly_fast_used = source.monthly_fast_used
    target.monthly_premium_used = source.monthly_premium_used
    target.monthly_images_used = source.monthly_images_used
    target.monthly_videos_used = source.monthly_videos_used
    target.monthly_3d_used = source.monthly_3d_used
    target.monthly_audio_used = source.monthly_audio_used
    target.opus_requests_used = source.opus_requests_used
    target.video_points_used = source.video_points_used
    target.video_points_reset_date = source.video_points_reset_date
    target.trial_video_points_used = source.trial_video_points_used
    target.trial_start_standard_used = source.trial_start_standard_used
    target.trial_start_premium_used = source.trial_start_premium_used


class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TelegramLinkRequest(BaseModel):
    init_data: str
    password: str


class GoogleAuthRequest(BaseModel):
    code: str
    redirect_uri: str | None = None
    ref_code: str | None = None
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    utm_content: str | None = None
    utm_term: str | None = None
    first_referrer: str | None = None
    first_landing_path: str | None = None
    first_landing_url: str | None = None


class YandexAuthRequest(BaseModel):
    code: str
    ref_code: str | None = None
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    utm_content: str | None = None
    utm_term: str | None = None
    first_referrer: str | None = None
    first_landing_path: str | None = None
    first_landing_url: str | None = None


class VerifyEmailRequest(BaseModel):
    email: str
    code: str
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    utm_content: str | None = None
    utm_term: str | None = None
    first_referrer: str | None = None
    first_landing_path: str | None = None
    first_landing_url: str | None = None
    ref_code: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    code: str
    new_password: str


BLOCKED_EMAIL_DOMAINS = {
    "tempmail.com", "guerrillamail.com", "yopmail.com", "mailinator.com",
    "throwaway.email", "temp-mail.org", "tempail.com", "guerrillamail.org",
    "fakeinbox.com", "sharklasers.com", "guerrillamail.net", "grr.la",
    "guerrillamail.de", "tmail.com", "tmpmail.net", "tmpmail.org",
    "binkmail.com", "safetymail.info", "trashmail.com", "trashmail.me",
    "mohmal.com", "dispostable.com", "mailnesia.com", "maildrop.cc",
    "temp-mail.io", "emailondeck.com", "getnada.com", "burnermail.io",
}


async def _auto_apply_referral(db: AsyncSession, user: User, ref_code: str | None):
    """Auto-apply referral code during registration. Silent on failure."""
    if not ref_code:
        return
    code = ref_code.strip().upper()
    if len(code) < 4:
        return
    try:
        result = await db.execute(select(User).where(User.referral_code == code))
        referrer = result.scalar_one_or_none()
        if not referrer:
            return
        if referrer.telegram_id == user.telegram_id:
            return
        user.referrer_id = referrer.telegram_id

        from app.services.daily_limits import get_or_create_today
        from app.routers.referral import REFERRAL_BONUS_REQUESTS

        user_tier = user.subscription_tier or "free"
        user_row = await get_or_create_today(db, user.telegram_id, user_tier)
        if user_row:
            user_row.rollover_fast = (user_row.rollover_fast or 0) + REFERRAL_BONUS_REQUESTS

        referrer_tg = referrer.telegram_id or referrer.id
        referrer_tier = referrer.subscription_tier or "free"
        referrer_row = await get_or_create_today(db, referrer_tg, referrer_tier)
        if referrer_row:
            referrer_row.rollover_fast = (referrer_row.rollover_fast or 0) + REFERRAL_BONUS_REQUESTS

        logger.info(f"Auto-applied referral: user={user.telegram_id}, referrer={referrer.telegram_id}, code={code}")
    except Exception as e:
        logger.warning(f"Failed to auto-apply referral code {code}: {e}")


def _validate_email(email: str) -> str:
    email = email.strip().lower()
    if not re.match(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$", email):
        raise HTTPException(400, "Invalid email format")
    domain = email.split("@")[1].lower()
    if domain in BLOCKED_EMAIL_DOMAINS:
        raise HTTPException(400, "Используйте реальный email адрес")
    return email


def _validate_password(password: str):
    if len(password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")


def _throttle_verification_request(request: Request, email: str, purpose: str) -> None:
    client_ip = request.client.host if request.client else "unknown"
    verification_request_limiter.check(f"{purpose}:{email}:{client_ip}")


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
    linked_providers = get_linked_providers(user)
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
                "linked_providers": linked_providers,
            },
            "token": token,
        },
        token,
    )


@router.post("/register")
async def register(body: RegisterRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Step 1: Send verification code to email."""
    from app.models.verification_code import VerificationCode
    from sqlalchemy import delete

    email = _validate_email(body.email)
    _validate_password(body.password)
    _throttle_verification_request(request, email, "register")

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Email уже зарегистрирован")

    code = generate_code()

    # Delete old codes for this email + cleanup expired
    await db.execute(delete(VerificationCode).where(
        (VerificationCode.email == email) & (VerificationCode.code_type == "register")
    ))
    await db.execute(delete(VerificationCode).where(
        VerificationCode.created_at < datetime.utcnow() - timedelta(seconds=CODE_TTL)
    ))

    vc = VerificationCode(
        email=email,
        code=code,
        code_type="register",
        password_hash=hash_password(body.password),
    )
    db.add(vc)
    await db.flush()

    send_verification_code(email, code)
    return {"status": "code_sent", "message": "Код отправлен на почту"}


@router.post("/verify-email")
async def verify_email(body: VerifyEmailRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Step 2: Verify code and create account."""
    email = _validate_email(body.email)

    from app.models.verification_code import VerificationCode
    from sqlalchemy import delete

    result = await db.execute(
        select(VerificationCode).where(
            VerificationCode.email == email,
            VerificationCode.code_type == "register",
        )
    )
    pending = result.scalar_one_or_none()
    if not pending:
        raise HTTPException(400, "Сначала запросите код регистрации")

    if (datetime.utcnow() - pending.created_at).total_seconds() > CODE_TTL:
        await db.execute(delete(VerificationCode).where(VerificationCode.id == pending.id))
        await db.flush()
        raise HTTPException(400, "Код истёк. Запросите новый.")

    if pending.attempts >= MAX_CODE_ATTEMPTS:
        await db.execute(delete(VerificationCode).where(VerificationCode.id == pending.id))
        await db.flush()
        raise HTTPException(429, "Слишком много попыток. Запросите новый код.")

    if pending.code != body.code.strip():
        pending.attempts += 1
        await db.flush()
        raise HTTPException(400, "Неверный код")

    saved_password_hash = pending.password_hash

    # Check again that email isn't taken
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        await db.execute(delete(VerificationCode).where(VerificationCode.id == pending.id))
        await db.flush()
        raise HTTPException(409, "Email уже зарегистрирован")

    placeholder_tg_id = -int(uuid.uuid4().int % (2**53))
    user = User(
        telegram_id=placeholder_tg_id,
        email=email,
        password_hash=saved_password_hash,
        auth_provider="email",
        linked_providers="email",
        first_name=email.split("@")[0],
        username=None,
        joined_at=datetime.utcnow(),
        balance_usd=WELCOME_BONUS_USD,
        utm_source=body.utm_source,
        utm_medium=body.utm_medium,
        utm_campaign=body.utm_campaign,
        utm_content=body.utm_content,
        utm_term=body.utm_term,
        first_referrer=body.first_referrer,
        first_landing_path=body.first_landing_path,
        first_landing_url=body.first_landing_url,
    )
    db.add(user)
    await db.flush()
    logger.info(f"Welcome bonus {WELCOME_BONUS_RUB}₽ credited to new email user {email}")

    # Auto-apply referral code from partner link
    await _auto_apply_referral(db, user, body.ref_code)

    user.last_ip = request.client.host if request.client else None
    await update_login_streak(db, user)

    # Clean up verification code
    await db.execute(delete(VerificationCode).where(VerificationCode.id == pending.id))
    await db.flush()
    token = create_jwt(user.id, email)

    # Achievement: registered
    asyncio.create_task(check_and_update(user.telegram_id or user.id, "registered", 1))

    # Welcome email/TG
    try:
        from app.services.email_service import send_welcome
        send_welcome(email, user.first_name or "", tg_id=user.telegram_id)
    except Exception:
        pass

    return _user_response(user, token)


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Send password reset code to email."""
    email = _validate_email(body.email)
    _throttle_verification_request(request, email, "reset")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        # Don't reveal if email exists
        return {"status": "ok", "message": "Если аккаунт существует, код отправлен на почту"}

    from app.models.verification_code import VerificationCode
    from sqlalchemy import delete

    code = generate_code()

    # Delete old reset codes for this email
    await db.execute(delete(VerificationCode).where(
        (VerificationCode.email == email) & (VerificationCode.code_type == "reset")
    ))
    vc = VerificationCode(email=email, code=code, code_type="reset")
    db.add(vc)
    await db.flush()

    send_reset_code(email, code)
    return {"status": "ok", "message": "Если аккаунт существует, код отправлен на почту"}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Verify reset code and set new password."""
    from app.models.verification_code import VerificationCode
    from sqlalchemy import delete

    email = _validate_email(body.email)
    _validate_password(body.new_password)

    result = await db.execute(
        select(VerificationCode).where(
            VerificationCode.email == email,
            VerificationCode.code_type == "reset",
        )
    )
    pending = result.scalar_one_or_none()
    if not pending:
        raise HTTPException(400, "Сначала запросите код сброса")

    if (datetime.utcnow() - pending.created_at).total_seconds() > CODE_TTL:
        await db.execute(delete(VerificationCode).where(VerificationCode.id == pending.id))
        await db.flush()
        raise HTTPException(400, "Код истёк. Запросите новый.")

    if pending.attempts >= MAX_CODE_ATTEMPTS:
        await db.execute(delete(VerificationCode).where(VerificationCode.id == pending.id))
        await db.flush()
        raise HTTPException(429, "Слишком много попыток. Запросите новый код.")

    if pending.code != body.code.strip():
        pending.attempts += 1
        await db.flush()
        raise HTTPException(400, "Неверный код")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Пользователь не найден")

    user.password_hash = hash_password(body.new_password)
    await db.execute(delete(VerificationCode).where(VerificationCode.id == pending.id))
    await db.flush()

    token = create_jwt(user.id, email)
    return _user_response(user, token)


@router.post("/login")
async def login(body: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Login with email and password, returns JWT."""
    email = _validate_email(body.email)

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash:
        raise HTTPException(401, "Invalid email or password")

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")

    user.last_ip = request.client.host if request.client else None
    await update_login_streak(db, user)

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
    utm_source: str | None = None, utm_medium: str | None = None,
    utm_campaign: str | None = None, utm_content: str | None = None,
    utm_term: str | None = None, first_referrer: str | None = None,
    first_landing_path: str | None = None, first_landing_url: str | None = None,
    ref_code: str | None = None,
) -> tuple:
    """Find existing user by email or create new one. Returns (user, token)."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if user:
        # Existing user — update provider if needed
        add_linked_providers(user, provider)
        # Preserve first-touch attribution, but fill missing fields on later OAuth login.
        if not user.utm_source and utm_source:
            user.utm_source = utm_source
        if not user.utm_medium and utm_medium:
            user.utm_medium = utm_medium
        if not user.utm_campaign and utm_campaign:
            user.utm_campaign = utm_campaign
        if not getattr(user, "utm_content", None) and utm_content:
            user.utm_content = utm_content
        if not getattr(user, "utm_term", None) and utm_term:
            user.utm_term = utm_term
        if not user.first_referrer and first_referrer:
            user.first_referrer = first_referrer
        if not getattr(user, "first_landing_path", None) and first_landing_path:
            user.first_landing_path = first_landing_path
        if not getattr(user, "first_landing_url", None) and first_landing_url:
            user.first_landing_url = first_landing_url
        await db.flush()
        token = create_jwt(user.id, email)
        return user, token

    # New user
    placeholder_tg_id = -int(uuid.uuid4().int % (2**53))
    user = User(
        telegram_id=placeholder_tg_id,
        email=email,
        password_hash=None,
        auth_provider=provider,
        linked_providers=provider,
        first_name=first_name,
        username=None,
        joined_at=datetime.utcnow(),
        balance_usd=WELCOME_BONUS_USD,
        utm_source=utm_source,
        utm_medium=utm_medium,
        utm_campaign=utm_campaign,
        utm_content=utm_content,
        utm_term=utm_term,
        first_referrer=first_referrer,
        first_landing_path=first_landing_path,
        first_landing_url=first_landing_url,
    )
    db.add(user)
    await db.flush()
    logger.info(f"Welcome bonus {WELCOME_BONUS_RUB}₽ credited to new OAuth user {email} ({provider})")

    # Auto-apply referral code from partner link
    await _auto_apply_referral(db, user, ref_code)

    # Achievement: registered
    asyncio.create_task(check_and_update(user.telegram_id or user.id, "registered", 1))

    # Welcome email/TG
    try:
        from app.services.email_service import send_welcome
        send_welcome(email, user.first_name or "", tg_id=user.telegram_id)
    except Exception:
        pass

    token = create_jwt(user.id, email)
    return user, token


@router.post("/google")
async def google_auth(body: GoogleAuthRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Authenticate via Google OAuth code → token → user info."""
    settings = get_settings()
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(503, "Google auth not configured")

    # Exchange code for tokens
    try:
        redirect_uri = body.redirect_uri or settings.google_redirect_uri
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

    user, token = await _get_or_create_oauth_user(
        db, email.lower(), first_name, "google",
        utm_source=body.utm_source, utm_medium=body.utm_medium,
        utm_campaign=body.utm_campaign, utm_content=body.utm_content,
        utm_term=body.utm_term, first_referrer=body.first_referrer,
        first_landing_path=body.first_landing_path, first_landing_url=body.first_landing_url,
        ref_code=body.ref_code,
    )
    user.last_ip = request.client.host if request.client else None
    await update_login_streak(db, user)
    logger.info(f"Google auth: user={user.id}, email={email}")
    return _user_response(user, token)


@router.post("/yandex")
async def yandex_auth(body: YandexAuthRequest, request: Request, db: AsyncSession = Depends(get_db)):
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

    user, token = await _get_or_create_oauth_user(
        db, email.lower(), first_name, "yandex",
        utm_source=body.utm_source, utm_medium=body.utm_medium,
        utm_campaign=body.utm_campaign, utm_content=body.utm_content,
        utm_term=body.utm_term, first_referrer=body.first_referrer,
        first_landing_path=body.first_landing_path, first_landing_url=body.first_landing_url,
        ref_code=body.ref_code,
    )
    user.last_ip = request.client.host if request.client else None
    await update_login_streak(db, user)
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
    if not web_user.password_hash or not verify_password(body.password, web_user.password_hash):
        raise HTTPException(401, "Invalid password")

    joined_at = web_user.joined_at or datetime.utcnow()
    if (datetime.utcnow() - joined_at).total_seconds() < 3600:
        raise HTTPException(400, "Wait 1 hour before linking Telegram")

    # Check if TG account already exists in DB
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    tg_existing = result.scalar_one_or_none()

    if tg_existing and tg_existing.id == web_user.id:
        return {"status": "ok", "message": "Already linked"}

    if tg_existing:
        # Merge: transfer TG user's balance and stats into web user
        old_web_tg_id = web_user.telegram_id
        web_user.balance_usd = min(1.0, max(float(web_user.balance_usd or 0), float(tg_existing.balance_usd or 0)))
        web_user.total_deposited_usd = float(web_user.total_deposited_usd or 0) + float(tg_existing.total_deposited_usd or 0)
        web_user.total_requests = (web_user.total_requests or 0) + (tg_existing.total_requests or 0)
        web_user.total_tokens_used = (web_user.total_tokens_used or 0) + (tg_existing.total_tokens_used or 0)
        if _should_keep_subscription(tg_existing, web_user):
            _copy_subscription_state(web_user, tg_existing)

        # Set the final telegram_id before moving rows keyed by user_tg_id.
        web_user.telegram_id = tg_id

        # Update all usage/transaction records to point to web user
        from app.models.daily_usage import DailyUsage
        from app.models.generation import Generation
        from app.models.usage import Usage
        from app.models.transaction import Transaction
        from sqlalchemy import update

        await db.execute(
            update(Usage).where(Usage.user_tg_id == tg_id).values(user_tg_id=tg_id)
        )
        await db.execute(
            update(Transaction).where(Transaction.user_tg_id == tg_id).values(user_tg_id=tg_id)
        )
        await db.execute(
            update(DailyUsage).where(DailyUsage.user_tg_id == tg_id).values(user_tg_id=tg_id)
        )
        await db.execute(
            update(Generation).where(Generation.user_tg_id == tg_id).values(user_tg_id=tg_id)
        )

        if old_web_tg_id and old_web_tg_id != tg_id:
            await db.execute(
                update(Usage).where(Usage.user_tg_id == old_web_tg_id).values(user_tg_id=tg_id)
            )
            await db.execute(
                update(Transaction).where(Transaction.user_tg_id == old_web_tg_id).values(user_tg_id=tg_id)
            )
            await db.execute(
                update(DailyUsage).where(DailyUsage.user_tg_id == old_web_tg_id).values(user_tg_id=tg_id)
            )
            await db.execute(
                update(Generation).where(Generation.user_tg_id == old_web_tg_id).values(user_tg_id=tg_id)
            )

        # Delete old TG-only user
        await db.delete(tg_existing)

    # Set real telegram_id on web user
    web_user.telegram_id = tg_id
    web_user.username = tg_data.get("username") or web_user.username
    web_user.first_name = tg_data.get("first_name") or web_user.first_name
    add_linked_providers(web_user, "telegram")

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
                "linked_providers": get_linked_providers(web_user),
            },
        },
        token,
    )


# ── Telegram Web Login (deep link flow) ──

# DB-backed store for TG web sessions (survives restarts)
_TG_SESSION_TTL = 600  # 10 minutes

# In-memory cache (fast lookups, synced with DB)
_tg_web_sessions: dict[str, dict | str] = {}


def _cleanup_old_sessions():
    """Remove sessions older than TTL."""
    now = time.time()
    expired = [k for k, v in _tg_web_sessions.items()
               if isinstance(v, dict) and now - v.get("created_at", 0) > _TG_SESSION_TTL]
    for k in expired:
        _tg_web_sessions.pop(k, None)
    # Safety cap
    if len(_tg_web_sessions) > 1000:
        _tg_web_sessions.clear()


@router.post("/telegram-web-start")
async def telegram_web_start():
    """Generate a session ID for Telegram web login.

    Returns session_id that the website will use to poll for completion.
    """
    _cleanup_old_sessions()
    session_id = uuid.uuid4().hex[:16]
    # Save to DB (survives restarts)
    try:
        from app.database import async_session
        from sqlalchemy import text
        async with async_session() as db:
            await db.execute(text("INSERT INTO tg_web_sessions (session_id, status) VALUES (:sid, 'pending')"), {"sid": session_id})
            await db.execute(text("DELETE FROM tg_web_sessions WHERE created_at < NOW() - INTERVAL '10 minutes'"))
            await db.commit()
    except Exception as e:
        logger.warning(f"DB session save failed: {e}")
    # Also keep in memory for fast lookups
    _tg_web_sessions[session_id] = {"status": "pending", "created_at": time.time()}
    logger.info(f"TG web session CREATED: {session_id}")
    return {"session_id": session_id}


@router.get("/telegram-web-check")
async def telegram_web_check(
    session: str,
    db: AsyncSession = Depends(get_db),
):
    """Poll endpoint — check if Telegram bot confirmed the session.

    Returns {status: "pending"} or {status: "ok", token, user}.
    """
    data = _tg_web_sessions.get(session)
    if not data:
        raise HTTPException(404, "Session not found or expired")

    if isinstance(data, dict) and data.get("status") == "pending":
        return {"status": "pending"}

    if isinstance(data, dict) and data.get("status") == "confirmed":
        user_id = data["user_id"]

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(404, "User not found")

        await update_login_streak(db, user)
        token = create_jwt(user.id, user.email or "")

        # Clean up session
        _tg_web_sessions.pop(session, None)

        return _set_cookie_response(
            {
                "status": "ok",
                "token": token,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "first_name": user.first_name,
                    "balance_usd": round(float(user.balance_usd or 0), 4),
                    "subscription_tier": user.subscription_tier or "free",
                    "telegram_id": user.telegram_id,
                },
            },
            token,
        )

    raise HTTPException(400, "Invalid session state")


async def confirm_tg_web_session(session_id: str, tg_id: int, tg_user_data: dict):
    """Called by the bot handler when user presses /start web_{session_id}."""
    from app.database import async_session as get_session

    if session_id not in _tg_web_sessions:
        # Check DB (session may have been created before restart)
        try:
            from sqlalchemy import text
            async with get_session() as db:
                row = await db.execute(text("SELECT session_id FROM tg_web_sessions WHERE session_id = :sid AND created_at > NOW() - INTERVAL '10 minutes'"), {"sid": session_id})
                if row.scalar_one_or_none():
                    _tg_web_sessions[session_id] = {"status": "pending", "created_at": time.time()}
                    logger.info(f"TG web session {session_id} restored from DB")
                else:
                    logger.warning(f"TG web session {session_id} NOT FOUND in memory or DB")
                    raise ValueError("Session not found or expired")
        except ValueError:
            raise
        except Exception as e:
            logger.warning(f"DB session check failed: {e}")
            raise ValueError("Session not found or expired")

    logger.info(f"TG web login confirmed: session={session_id}, tg_id={tg_id}")

    async with get_session() as db:
        # Find or create user by telegram_id
        result = await db.execute(select(User).where(User.telegram_id == tg_id))
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                telegram_id=tg_id,
                username=tg_user_data.get("username"),
                first_name=tg_user_data.get("first_name"),
                language=tg_user_data.get("language_code", "ru"),
                joined_at=datetime.utcnow(),
                auth_provider="telegram",
                linked_providers="telegram",
                balance_usd=WELCOME_BONUS_USD,
            )
            db.add(user)
            await db.flush()
            logger.info(f"Welcome bonus {WELCOME_BONUS_RUB}₽ credited to new TG web user {tg_id}")

            # Achievement: registered
            asyncio.create_task(check_and_update(tg_id, "registered", 1))

            # Welcome in Telegram
            try:
                from app.services.email_service import send_welcome
                send_welcome(None, tg_user_data.get("first_name", ""), tg_id=tg_id)
            except Exception:
                pass

        _tg_web_sessions[session_id] = {
            "status": "confirmed",
            "user_id": user.id,
            "created_at": time.time(),
        }

        # Also update DB session
        try:
            await db.execute(text("UPDATE tg_web_sessions SET status = 'confirmed', user_id = :uid WHERE session_id = :sid"),
                             {"uid": user.id, "sid": session_id})
        except Exception:
            pass

        await db.commit()

        # Generate JWT for direct login
        token = create_jwt(user.id, user.email or "")
        return user, token


# ── Telegram WebApp auto-login (initData) ──

class TelegramWebAppRequest(BaseModel):
    init_data: str


@router.post("/telegram-webapp")
async def telegram_webapp_login(
    body: TelegramWebAppRequest,
    db: AsyncSession = Depends(get_db),
):
    """Auto-login via Telegram WebApp initData.

    Used when site is opened inside Telegram In-App Browser from a bot.
    Validates initData signature and creates/finds user.
    """
    settings = get_settings()
    if not settings.bot_token:
        raise HTTPException(503, "Bot token not configured")

    try:
        from app.middleware.auth import validate_init_data
        tg_user = validate_init_data(body.init_data, settings.bot_token)
    except ValueError as e:
        raise HTTPException(401, f"Invalid initData: {e}")

    tg_id = tg_user["id"]

    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            telegram_id=tg_id,
            username=tg_user.get("username"),
            first_name=tg_user.get("first_name"),
            language=tg_user.get("language_code", "ru"),
            joined_at=datetime.utcnow(),
            auth_provider="telegram",
            linked_providers="telegram",
            balance_usd=WELCOME_BONUS_USD,
        )
        db.add(user)
        await db.flush()
        logger.info(f"Welcome bonus {WELCOME_BONUS_RUB}₽ credited to new TG WebApp user {tg_id}")

    await update_login_streak(db, user)
    token = create_jwt(user.id, user.email or "")
    await db.commit()

    return _set_cookie_response(
        {
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "balance_usd": round(float(user.balance_usd or 0), 4),
                "subscription_tier": user.subscription_tier or "free",
                "telegram_id": user.telegram_id,
            },
        },
        token,
    )
