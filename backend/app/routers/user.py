"""User endpoint — profile, limits, balance info, usage history, subscriptions."""

import json
import logging
import os
import re
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import APIRouter, Depends, Query, Request, HTTPException, UploadFile, File, Form
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.web_auth import extract_jwt_from_request, decode_jwt
from app.models import User
from app.models.usage import Usage
from app.models.daily_usage import DailyUsage


async def _get_total_requests(db: AsyncSession, tg_id: int) -> int:
    """Sum all requests from daily_usage table."""
    result = await db.scalar(
        select(func.coalesce(
            func.sum(DailyUsage.fast_used + DailyUsage.premium_used + DailyUsage.image_used + DailyUsage.video_used), 0
        )).where(DailyUsage.user_tg_id == tg_id)
    )
    return result or 0


from app.services.limiter import (
    get_or_create_user,
    get_today_usage,
    get_free_limits,
    FREE_DAILY_LIMIT,
    REWARDED_BONUS,
)
from app.services.subscription import PLANS, get_accessible_models
from app.services.token_billing import get_user_balance, TOKEN_PRICES
from app.services.promo import apply_promo

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["user"])

UPLOADS_DIR = Path(os.environ.get("UPLOADS_DIR", Path(__file__).resolve().parents[2] / "uploads"))
AVATARS_DIR = UPLOADS_DIR / "avatars"
DATA_URL_RE = re.compile(r"^data:(image/[a-zA-Z0-9.+-]+);base64,")
IMAGE_EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "image/avif": "avif",
    "image/heic": "heic",
    "image/heif": "heif",
}


def _guess_image_extension(img_bytes: bytes) -> str | None:
    """Infer image format from magic bytes when the data URL header is missing."""
    if img_bytes.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if img_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if img_bytes.startswith((b"GIF87a", b"GIF89a")):
        return "gif"
    if img_bytes.startswith(b"RIFF") and img_bytes[8:12] == b"WEBP":
        return "webp"
    return None


def _guess_extension_from_filename(filename: str | None) -> str | None:
    if not filename or "." not in filename:
        return None
    ext = filename.rsplit(".", 1)[1].strip().lower()
    if ext in {"jpg", "jpeg"}:
        return "jpg"
    if ext in {"png", "webp", "gif", "avif", "heic", "heif"}:
        return ext
    return None


def _delete_old_avatar_file(user: User) -> None:
    if user.avatar_url and "/uploads/avatars/" in user.avatar_url:
        old_file = AVATARS_DIR / os.path.basename(user.avatar_url)
        if old_file.exists():
            old_file.unlink()


async def _store_avatar_bytes(user: User, db: AsyncSession, img_bytes: bytes, extension: str) -> str:
    import uuid as uuid_mod

    AVATARS_DIR.mkdir(parents=True, exist_ok=True)
    _delete_old_avatar_file(user)

    filename = f"{user.id}_{uuid_mod.uuid4().hex[:8]}.{extension}"
    filepath = AVATARS_DIR / filename
    with filepath.open("wb") as f:
        f.write(img_bytes)

    user.avatar_url = f"/uploads/avatars/{filename}"
    await db.commit()
    return user.avatar_url


class UpdateProfileRequest(BaseModel):
    first_name: str | None = None


class AvatarUploadRequest(BaseModel):
    image_base64: str  # data:image/...;base64,... (max ~200KB after crop)


class UpdateEmailRequest(BaseModel):
    email: str


class SubscribeRequest(BaseModel):
    tier: str  # mini, max, max-pro

class PromoRequest(BaseModel):
    code: str


async def _get_user_from_request(request: Request, db: AsyncSession) -> User:
    """Get user from JWT or TG auth."""
    token = extract_jwt_from_request(request)
    if token:
        payload = decode_jwt(token)
        user_id = int(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id).with_for_update())
        user = result.scalar_one_or_none()
        if user:
            return user
    try:
        tg_user = await get_current_user(request)
        result = await db.execute(select(User).where(User.telegram_id == tg_user["id"]))
        user = result.scalar_one_or_none()
        if user:
            return user
    except Exception:
        pass
    raise HTTPException(401, "Not authenticated")


async def _get_user_from_token(token: str, db: AsyncSession) -> User:
    payload = decode_jwt(token)
    user_id = int(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id).with_for_update())
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return user


@router.get("/user/me")
async def get_me(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Get current user profile — supports JWT (web) and TG auth."""
    token = extract_jwt_from_request(request)
    if token:
        payload = decode_jwt(token)
        user_id = int(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id).with_for_update())
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(404, "User not found")
        tg_id = user.telegram_id
    else:
        try:
            tg_user = await get_current_user(request)
            tg_id = tg_user["id"]
            start_param = request.headers.get("X-Start-Param")
            user = await get_or_create_user(db, tg_user, start_param=start_param)
        except Exception:
            raise HTTPException(401, "Not authenticated")

    balance = await get_user_balance(db, tg_id)
    lite_today = await get_today_usage(db, tg_id, "lite")
    rewarded_bonus = int(user.rewarded_today or 0) if hasattr(user, 'rewarded_today') else 0

    # Build model prices map for frontend
    model_prices = {}
    for model_id, prices in TOKEN_PRICES.items():
        model_prices[model_id] = {
            "input_per_m": prices["input"],
            "output_per_m": prices["output"],
            "weighted_per_m": prices["weighted"],
        }

    return {
        "user": {
            "id": user.id,
            "tg_id": user.telegram_id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "language": user.language,
            "avatar_url": user.avatar_url,
            "auth_provider": user.auth_provider or "email",
            "created_at": user.joined_at.isoformat() if user.joined_at else None,
            "balance_usd": balance,
            "plan": user.subscription_tier or "free",
        },
        "plan": user.subscription_tier or "free",
        "balance_usd": balance,
        "model_prices": model_prices,
        "usage": {
            "lite_today": lite_today,
        },
        "limits": {
            "lite": FREE_DAILY_LIMIT + rewarded_bonus,
            "lite_base": FREE_DAILY_LIMIT,
            "rewarded_bonus": rewarded_bonus,
            "rewarded_max": REWARDED_BONUS,
        },
        "total_deposited_usd": round(float(user.total_deposited_usd or 0), 2),
        "stats": {
            "total_requests": await _get_total_requests(db, user.telegram_id or user.id),
            "total_tokens": user.total_tokens_used or 0,
        },
    }


@router.get("/user/settings")
async def get_settings_endpoint(request: Request, db: AsyncSession = Depends(get_db)):
    """Get user settings (language, theme, etc.)."""
    user = await _get_user_from_request(request, db)
    if user.settings_json:
        try:
            return json.loads(user.settings_json)
        except Exception:
            pass
    return {}


class UserSettingsRequest(BaseModel):
    language: str | None = None
    theme: str | None = None
    systemPrompt: str | None = None
    maxTokens: int | None = None


@router.put("/user/settings")
async def update_settings(
    body: UserSettingsRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Save user settings."""
    user = await _get_user_from_request(request, db)
    settings = body.model_dump(exclude_none=True)
    user.settings_json = json.dumps(settings)
    await db.commit()
    return {"ok": True}


@router.patch("/user/profile")
async def update_profile(
    body: UpdateProfileRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user display name."""
    db_id = tg_user.get("db_id")
    tg_id = tg_user["id"]

    if db_id:
        result = await db.execute(select(User).where(User.id == db_id))
    else:
        result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Пользователь не найден")

    if body.first_name is not None:
        user.first_name = body.first_name[:100]

    await db.commit()
    return {"ok": True, "first_name": user.first_name}


@router.post("/user/avatar")
async def upload_avatar(
    body: AvatarUploadRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Upload user avatar (base64 -> saved to disk, URL stored in DB)."""
    import base64 as b64mod
    user = await _get_user_from_request(request, db)

    raw_input = body.image_base64.strip()
    mime_match = DATA_URL_RE.match(raw_input)
    mime_type = mime_match.group(1).lower() if mime_match else None
    if mime_type and mime_type not in IMAGE_EXTENSIONS:
        raise HTTPException(400, "Unsupported avatar format")

    raw = raw_input
    if "," in raw:
        raw = raw.split(",", 1)[1]
    if len(raw) > 5_000_000:
        raise HTTPException(413, "Аватар слишком большой. Максимум 3 МБ.")

    try:
        img_bytes = b64mod.b64decode(raw)
    except Exception:
        raise HTTPException(400, "Невалидный base64")

    extension = IMAGE_EXTENSIONS.get(mime_type or "", _guess_image_extension(img_bytes))
    if not extension:
        raise HTTPException(400, "Unsupported avatar format")
    avatar_url = await _store_avatar_bytes(user, db, img_bytes, extension)
    return {"ok": True, "avatar_url": avatar_url}


@router.post("/user/avatar-file")
async def upload_avatar_file(
    request: Request,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload user avatar directly as multipart/form-data."""
    user = await _get_user_from_request(request, db)

    content_type = (file.content_type or "").lower()
    filename = file.filename or ""
    extension = IMAGE_EXTENSIONS.get(content_type) or _guess_extension_from_filename(filename)

    img_bytes = await file.read()
    if not img_bytes:
        raise HTTPException(400, "Empty avatar file")
    if len(img_bytes) > 10 * 1024 * 1024:
        raise HTTPException(413, "Avatar file is too large")

    if not extension:
        extension = _guess_image_extension(img_bytes)
    if not extension:
        raise HTTPException(400, "Unsupported avatar format")

    avatar_url = await _store_avatar_bytes(user, db, img_bytes, extension)
    return {"ok": True, "avatar_url": avatar_url}


@router.get("/user/avatar-test")
async def avatar_test_page():
    """Pure HTML avatar upload page — no JS frameworks."""
    from fastapi.responses import HTMLResponse
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Загрузить аватарку — Stone AI</title>
<style>
*{box-sizing:border-box;margin:0}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0f0f12;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{background:#1a1a22;border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:32px;max-width:400px;width:100%}
h1{font-size:20px;font-weight:700;margin-bottom:8px}
p{font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:20px}
input[type=file]{display:block;width:100%;margin:12px 0;font-size:14px;color:rgba(255,255,255,0.6)}
input[type=file]::file-selector-button{background:#C4623D;color:#fff;border:none;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;margin-right:12px}
input[type=file]::file-selector-button:hover{background:#b5553a}
.btn{display:block;width:100%;padding:14px;background:#C4623D;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-top:16px}
.btn:hover{background:#b5553a}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.back{display:inline-block;margin-top:16px;color:#C4623D;text-decoration:none;font-size:13px}
.ok{color:#22c55e;font-size:14px;margin-top:12px}
.err{color:#ef4444;font-size:14px;margin-top:12px}
</style></head>
<body>
<div class="card">
<h1>Загрузить аватарку</h1>
<p>Выберите фото и нажмите «Загрузить»</p>
<form id="f" action="/api/user/avatar-form" method="POST" enctype="multipart/form-data">
<input type="hidden" name="token" id="tok">
<input name="file" type="file" accept="image/*" required>
<button type="submit" class="btn" id="btn">Загрузить</button>
</form>
<div id="msg"></div>
<a href="/profile" class="back">← Вернуться в профиль</a>
</div>
<script>
try{var a=JSON.parse(localStorage.getItem('stone_auth')||'{}');document.getElementById('tok').value=a.token||'';}catch(e){}
var u=new URLSearchParams(location.search);
if(u.get('avatar_upload')==='ok')document.getElementById('msg').innerHTML='<p class="ok">Аватарка загружена! Вернитесь в профиль.</p>';
else if(u.get('avatar_upload'))document.getElementById('msg').innerHTML='<p class="err">Ошибка: '+u.get('avatar_upload')+'</p>';
</script>
</body></html>""")


@router.post("/user/avatar-form")
async def upload_avatar_form(
    token: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Emergency avatar upload path using plain browser form submission."""
    try:
        user = await _get_user_from_token(token, db)
    except Exception as e:
        logger.error(f"avatar-form auth failed: {e}")
        return RedirectResponse(url=f"/api/user/avatar-test?avatar_upload=auth_error", status_code=303)

    content_type = (file.content_type or "").lower()
    filename = file.filename or ""
    extension = IMAGE_EXTENSIONS.get(content_type) or _guess_extension_from_filename(filename)

    logger.info(f"avatar-form: user={user.id}, file={filename}, type={content_type}, ext={extension}")

    img_bytes = await file.read()
    if not img_bytes:
        logger.error("avatar-form: empty file")
        return RedirectResponse(url="/api/user/avatar-test?avatar_upload=empty", status_code=303)
    if len(img_bytes) > 10 * 1024 * 1024:
        return RedirectResponse(url="/api/user/avatar-test?avatar_upload=too_large", status_code=303)

    if not extension:
        extension = _guess_image_extension(img_bytes)
    if not extension:
        logger.error(f"avatar-form: unsupported format, content_type={content_type}, magic={img_bytes[:8]}")
        return RedirectResponse(url="/api/user/avatar-test?avatar_upload=bad_format", status_code=303)

    await _store_avatar_bytes(user, db, img_bytes, extension)
    logger.info(f"avatar-form: saved avatar for user {user.id}")
    return RedirectResponse(url="/api/user/avatar-test?avatar_upload=ok", status_code=303)


@router.delete("/user/avatar")
async def delete_avatar(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Delete user avatar."""

    user = await _get_user_from_request(request, db)

    _delete_old_avatar_file(user)

    user.avatar_url = None
    await db.commit()

    return {"ok": True}


@router.patch("/user/email")
async def update_email(
    body: UpdateEmailRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Change user email."""
    import re as re_mod

    user = await _get_user_from_request(request, db)

    email = body.email.strip().lower()
    if not re_mod.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email):
        raise HTTPException(400, "Невалидный email")

    if email == (user.email or "").lower():
        return {"ok": True, "email": user.email}

    # Check uniqueness
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Этот email уже используется")

    user.email = email
    await db.commit()

    return {"ok": True, "email": user.email}


@router.get("/user/usage-history")
async def get_usage_history(
    request: Request,
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=20, le=100),
):
    """Get last N usage records for the current user."""
    user = await _get_user_from_request(request, db)
    result = await db.execute(
        select(Usage)
        .where(Usage.user_tg_id == user.telegram_id)
        .order_by(Usage.created_at.desc())
        .limit(limit)
    )
    rows = result.scalars().all()

    return {
        "history": [
            {
                "model_id": r.model_id,
                "tier": r.tier,
                "tokens_in": r.tokens_in,
                "tokens_out": r.tokens_out,
                "cost_usd": float(r.cost_usd or 0),
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    }


@router.get("/user/transactions")
async def get_transactions(
    request: Request,
    db: AsyncSession = Depends(get_db),
    limit: int = Query(default=20, le=100),
):
    """Get last N payment transactions for the current user."""
    from app.models.transaction import Transaction
    user = await _get_user_from_request(request, db)

    result = await db.execute(
        select(Transaction)
        .where(Transaction.user_tg_id == user.telegram_id)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    )
    rows = result.scalars().all()

    return {
        "transactions": [
            {
                "amount_usd": float(r.amount_usd or 0),
                "amount": float(r.amount or 0),
                "currency": r.currency,
                "status": r.status,
                "product_type": r.product_type,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            }
            for r in rows
        ]
    }


@router.get("/user/limits")
async def user_limits(request: Request, db: AsyncSession = Depends(get_db)):
    """Get current usage limits for the authenticated user."""
    # Try JWT first (web), then TG auth
    token = extract_jwt_from_request(request)
    if token:
        payload = decode_jwt(token)
        user_id = int(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id).with_for_update())
        user = result.scalar_one_or_none()
    else:
        # Try TG auth
        try:
            tg_user = await get_current_user(request)
            result = await db.execute(select(User).where(User.telegram_id == tg_user["id"]).with_for_update())
            user = result.scalar_one_or_none()
        except Exception:
            raise HTTPException(status_code=401, detail="Not authenticated")

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return await get_free_limits(db, user)


@router.get("/plans")
async def list_plans():
    """Return available subscription plans for /pricing page."""
    result = []
    for tier, plan in PLANS.items():
        result.append({
            "id": tier,
            "name": plan["name"],
            "price_rub": plan["price_rub"],
            "limits": plan["limits"],
            "period": plan["period"],
            "features": plan["features"],
        })
    return {"plans": result}


@router.post("/subscribe")
async def subscribe(req: SubscribeRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Activate a subscription plan. Deducts from USD balance at current exchange rate."""
    if req.tier not in PLANS or req.tier == "free":
        raise HTTPException(400, "Недопустимый тариф")

    plan = PLANS[req.tier]
    price_rub = plan["price_rub"]
    usd_rate = 95.0  # ~95 RUB/USD
    price_usd = round(price_rub / usd_rate, 2)

    # Auth — JWT or TG
    token = extract_jwt_from_request(request)
    if token:
        payload = decode_jwt(token)
        user_id = int(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id).with_for_update())
        user = result.scalar_one_or_none()
    else:
        try:
            tg_user = await get_current_user(request)
            result = await db.execute(select(User).where(User.telegram_id == tg_user["id"]).with_for_update())
            user = result.scalar_one_or_none()
        except Exception:
            raise HTTPException(401, "Не авторизован")

    if not user:
        raise HTTPException(404, "Пользователь не найден")

    balance = float(user.balance_usd or 0)
    if balance < price_usd:
        raise HTTPException(
            402,
            {
                "error": "insufficient_balance",
                "message": f"Недостаточно средств. Нужно ${price_usd:.2f}, баланс ${balance:.2f}. Пополните баланс.",
                "required": price_usd,
                "balance": balance,
                "topup_url": "/topup",
            },
        )

    # Deduct balance
    user.balance_usd = round(balance - price_usd, 6)

    # Activate subscription
    now = datetime.utcnow()
    user.subscription_tier = req.tier
    user.credits_balance = plan["credits"]
    user.subscription_started = now
    user.credits_reset_date = now + timedelta(days=30)

    # Reset monthly counters
    user.monthly_fast_used = 0
    user.monthly_premium_used = 0
    user.monthly_images_used = 0
    user.monthly_videos_used = 0
    user.monthly_3d_used = 0
    user.monthly_audio_used = 0
    user.opus_requests_used = 0

    await db.flush()
    await db.commit()

    return {
        "status": "ok",
        "tier": req.tier,
        "plan_name": plan["name"],
        "price_rub": price_rub,
        "price_usd": price_usd,
        "credits": plan["credits"],
        "expires": user.credits_reset_date.isoformat(),
        "new_balance_usd": float(user.balance_usd),
    }


@router.post("/promo")
async def apply_promo_code(req: PromoRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Apply a promo code to get bonus balance or credits."""
    token = extract_jwt_from_request(request)
    if token:
        payload = decode_jwt(token)
        user_id = int(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
    else:
        try:
            tg_user = await get_current_user(request)
            result = await db.execute(select(User).where(User.telegram_id == tg_user["id"]))
            user = result.scalar_one_or_none()
        except Exception:
            raise HTTPException(401, "Не авторизован")

    if not user:
        raise HTTPException(404, "Пользователь не найден")

    promo_result = await apply_promo(db, user, req.code)
    if not promo_result["ok"]:
        raise HTTPException(400, promo_result["error"])

    return promo_result


@router.get("/referral")
async def get_referral_info(request: Request, db: AsyncSession = Depends(get_db)):
    """Get referral link and stats."""
    token = extract_jwt_from_request(request)
    if token:
        payload = decode_jwt(token)
        user_id = int(payload["sub"])
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
    else:
        try:
            tg_user = await get_current_user(request)
            result = await db.execute(select(User).where(User.telegram_id == tg_user["id"]))
            user = result.scalar_one_or_none()
        except Exception:
            raise HTTPException(401, "Не авторизован")

    if not user:
        raise HTTPException(404, "Пользователь не найден")

    # Generate referral code if not exists
    if not user.referral_code:
        import hashlib
        user.referral_code = hashlib.md5(str(user.id).encode()).hexdigest()[:8]
        await db.flush()

    # Count referrals
    ref_count = await db.scalar(
        select(func.count()).select_from(User).where(User.referrer_id == user.telegram_id)
    ) or 0

    from app.services.subscription import PLANS
    from app.services.limiter import _hours_until_reset

    return {
        "referral_code": user.referral_code,
        "referral_link": f"https://stoneai.ru/webchat?ref={user.referral_code}",
        "referral_count": ref_count,
        "referral_balance": round(float(user.referral_balance or 0), 2),
        "referral_percent": 10,  # 10% from each referral top-up
    }


@router.delete("/user/me")
async def delete_account(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete user account and all associated data."""
    tg_id = tg_user["id"]

    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    # Delete all user data
    from app.models.chat_session import ChatSession, ChatMessage
    from app.models.agent_task import AgentTask
    from app.models.custom_bot import CustomBot
    from sqlalchemy import delete

    # Chat sessions + messages
    sessions = await db.execute(select(ChatSession.id).where(ChatSession.user_tg_id == tg_id))
    session_ids = [r for r in sessions.scalars().all()]
    if session_ids:
        await db.execute(delete(ChatMessage).where(ChatMessage.session_id.in_(session_ids)))
        await db.execute(delete(ChatSession).where(ChatSession.user_tg_id == tg_id))

    # Bots, agent tasks
    await db.execute(delete(CustomBot).where(CustomBot.user_tg_id == tg_id))
    await db.execute(delete(AgentTask).where(AgentTask.user_tg_id == tg_id))

    # User
    await db.delete(user)

    return {"status": "ok", "message": "Аккаунт удалён"}
