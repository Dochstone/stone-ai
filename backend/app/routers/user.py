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
    """Pure HTML avatar upload page with cropper — no JS frameworks."""
    from fastapi.responses import HTMLResponse
    return HTMLResponse("""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Загрузить аватарку — Stone AI</title>
<style>
*{box-sizing:border-box;margin:0}
body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0f0f12;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
body.embed{background:transparent;padding:0;min-height:auto;overflow:hidden}
.card{background:#1a1a22;border:1px solid rgba(255,255,255,0.06);border-radius:20px;padding:32px;max-width:420px;width:100%}
body.embed .card{background:transparent;border:none;border-radius:0;padding:24px;max-width:100%}
body.embed .back{display:none}
h1{font-size:20px;font-weight:700;margin-bottom:8px}
p.sub{font-size:13px;color:rgba(255,255,255,0.4);margin-bottom:20px}
.pick-label{display:inline-flex;align-items:center;gap:8px;background:#C4623D;color:#fff;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer}
.pick-label:hover{background:#b5553a}
.cropper{position:relative;width:300px;height:300px;margin:16px auto;overflow:hidden;border-radius:16px;background:#000;touch-action:none;cursor:grab;display:none}
.cropper canvas{display:block}
.cropper .circle{position:absolute;top:50%;left:50%;width:240px;height:240px;transform:translate(-50%,-50%);border-radius:50%;border:2px solid rgba(255,255,255,0.8);box-shadow:0 0 0 9999px rgba(0,0,0,0.55);pointer-events:none}
.zoom{width:100%;margin:8px 0;display:none}
.btn{display:block;width:100%;padding:14px;background:#C4623D;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-top:12px}
.btn:hover{background:#b5553a}
.btn:disabled{opacity:0.5;cursor:not-allowed}
.btn-cancel{background:transparent;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);margin-top:8px}
.btn-cancel:hover{background:rgba(255,255,255,0.05)}
.back{display:inline-block;margin-top:16px;color:#C4623D;text-decoration:none;font-size:13px}
.ok{color:#22c55e;font-size:14px;margin-top:12px}
.err{color:#ef4444;font-size:14px;margin-top:12px}
.hidden{display:none!important}
.spinner{width:20px;height:20px;border:3px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:spin .6s linear infinite;display:inline-block;vertical-align:middle;margin-right:8px}
@keyframes spin{to{transform:rotate(360deg)}}
</style></head>
<body>
<div class="card">
<h1>Загрузить аватарку</h1>
<p class="sub" id="hint">Выберите фото</p>

<div id="step1">
<label class="pick-label">
<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
Выбрать фото
<input type="file" accept="image/*" id="fileInput" style="display:none">
</label>
</div>

<div id="step2" class="hidden">
<div class="cropper" id="cropper">
<canvas id="canvas" width="300" height="300"></canvas>
<div class="circle"></div>
</div>
<input type="range" min="1" max="3" step="0.02" value="1" class="zoom" id="zoom">
<button class="btn" id="saveBtn">Сохранить</button>
<button class="btn btn-cancel" id="cancelBtn">Отмена</button>
</div>

<div id="msg"></div>
<a href="/profile" class="back">← Вернуться в профиль</a>
</div>

<script>
var token='';
try{token=JSON.parse(localStorage.getItem('stone_auth')||'{}').token||'';}catch(e){}

var fileInput=document.getElementById('fileInput');
var cropper=document.getElementById('cropper');
var canvas=document.getElementById('canvas');
var ctx=canvas.getContext('2d');
var zoomInput=document.getElementById('zoom');
var step1=document.getElementById('step1');
var step2=document.getElementById('step2');
var hint=document.getElementById('hint');
var msg=document.getElementById('msg');
var saveBtn=document.getElementById('saveBtn');
var cancelBtn=document.getElementById('cancelBtn');

var img=null, scale=1, baseScale=1, ox=0, oy=0, dragging=false, lx=0, ly=0;
var SIZE=300, R=120;

function draw(){
  ctx.clearRect(0,0,SIZE,SIZE);
  if(!img)return;
  var w=img.naturalWidth*scale, h=img.naturalHeight*scale;
  ctx.drawImage(img,ox,oy,w,h);
}

function clamp(){
  if(!img)return;
  var w=img.naturalWidth*scale, h=img.naturalHeight*scale;
  var minX=SIZE/2+R-w, maxX=SIZE/2-R;
  var minY=SIZE/2+R-h, maxY=SIZE/2-R;
  ox=Math.min(maxX,Math.max(minX,ox));
  oy=Math.min(maxY,Math.max(minY,oy));
}

fileInput.addEventListener('change',function(e){
  var file=e.target.files&&e.target.files[0];
  if(!file)return;
  var url=URL.createObjectURL(file);
  img=new Image();
  img.onload=function(){
    baseScale=Math.max(R*2/img.naturalWidth,R*2/img.naturalHeight);
    scale=baseScale*1.2;
    ox=(SIZE-img.naturalWidth*scale)/2;
    oy=(SIZE-img.naturalHeight*scale)/2;
    zoomInput.value='1';
    draw();
    step1.classList.add('hidden');
    step2.classList.remove('hidden');
    cropper.style.display='block';
    zoomInput.style.display='block';
    hint.textContent='Перетащите фото и выберите область';
  };
  img.src=url;
});

zoomInput.addEventListener('input',function(){
  var z=parseFloat(this.value);
  var prev=scale;
  scale=baseScale*z;
  var cx=SIZE/2,cy=SIZE/2;
  ox=cx-(cx-ox)*(scale/prev);
  oy=cy-(cy-oy)*(scale/prev);
  clamp();draw();
});

// Mouse drag
canvas.addEventListener('mousedown',function(e){e.preventDefault();dragging=true;lx=e.clientX;ly=e.clientY;canvas.style.cursor='grabbing';});
window.addEventListener('mousemove',function(e){if(!dragging)return;ox+=e.clientX-lx;oy+=e.clientY-ly;lx=e.clientX;ly=e.clientY;clamp();draw();});
window.addEventListener('mouseup',function(){dragging=false;canvas.style.cursor='grab';});

// Touch drag
canvas.addEventListener('touchstart',function(e){if(e.touches.length===1){e.preventDefault();dragging=true;lx=e.touches[0].clientX;ly=e.touches[0].clientY;}},{passive:false});
window.addEventListener('touchmove',function(e){if(!dragging||!e.touches.length)return;ox+=e.touches[0].clientX-lx;oy+=e.touches[0].clientY-ly;lx=e.touches[0].clientX;ly=e.touches[0].clientY;clamp();draw();},{passive:true});
window.addEventListener('touchend',function(){dragging=false;});

// Wheel zoom
canvas.addEventListener('wheel',function(e){
  e.preventDefault();
  var d=e.deltaY>0?-0.05:0.05;
  var z=Math.min(3,Math.max(1,parseFloat(zoomInput.value)+d));
  zoomInput.value=z;
  var prev=scale;scale=baseScale*z;
  var cx=SIZE/2,cy=SIZE/2;
  ox=cx-(cx-ox)*(scale/prev);oy=cy-(cy-oy)*(scale/prev);
  clamp();draw();
},{passive:false});

cancelBtn.addEventListener('click',function(){
  step2.classList.add('hidden');
  step1.classList.remove('hidden');
  cropper.style.display='none';
  zoomInput.style.display='none';
  hint.textContent='Выберите фото';
  fileInput.value='';
  img=null;
});

saveBtn.addEventListener('click',function(){
  if(!img)return;
  saveBtn.disabled=true;
  saveBtn.innerHTML='<span class="spinner"></span>Загрузка...';

  var out=document.createElement('canvas');
  out.width=256;out.height=256;
  var oc=out.getContext('2d');
  var srcX=(SIZE/2-R-ox)/scale;
  var srcY=(SIZE/2-R-oy)/scale;
  var srcS=(R*2)/scale;
  oc.drawImage(img,srcX,srcY,srcS,srcS,0,0,256,256);

  out.toBlob(function(blob){
    var fd=new FormData();
    fd.append('file',blob,'avatar.jpg');
    fd.append('token',token);
    fetch('/api/user/avatar-form',{method:'POST',body:fd})
    .then(function(r){
      if(r.redirected||r.ok){
        msg.innerHTML='<p class="ok">Аватарка загружена!</p>';
        step2.classList.add('hidden');
        cropper.style.display='none';
        zoomInput.style.display='none';
        hint.textContent='Готово!';
        if(isEmbed)parent.postMessage({type:'avatar-uploaded'},'*');
        try{
          fetch('/api/user/me',{headers:{Authorization:'Bearer '+token}})
          .then(function(r){return r.json()})
          .then(function(d){
            var u=d.user||d;
            if(u&&u.avatar_url){
              var url=u.avatar_url.startsWith('http')?u.avatar_url:'https://stoneai.ru'+u.avatar_url;
              localStorage.setItem('stone_avatar',url);
            }
          });
        }catch(e){}
      }else{
        msg.innerHTML='<p class="err">Ошибка загрузки</p>';
      }
      saveBtn.disabled=false;saveBtn.textContent='Сохранить';
    })
    .catch(function(){
      msg.innerHTML='<p class="err">Сетевая ошибка</p>';
      saveBtn.disabled=false;saveBtn.textContent='Сохранить';
    });
  },'image/jpeg',0.85);
});

// Embed mode
var u=new URLSearchParams(location.search);
var isEmbed=u.get('embed')==='1';
if(isEmbed)document.body.classList.add('embed');
function notifyHeight(){if(!isEmbed)return;setTimeout(function(){parent.postMessage({type:'avatar-resize',height:document.body.scrollHeight},'*');},50);}
notifyHeight();new MutationObserver(notifyHeight).observe(document.body,{childList:true,subtree:true,attributes:true});

// Show status from redirect
if(u.get('avatar_upload')==='ok'){msg.innerHTML='<p class="ok">Аватарка загружена!</p>';hint.textContent='Готово!';}
else if(u.get('avatar_upload'))msg.innerHTML='<p class="err">Ошибка: '+u.get('avatar_upload')+'</p>';
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
