"""Chat endpoint — streaming AI responses via SSE with per-token billing."""

import asyncio
import base64
import json
import logging
import os
import tempfile
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middleware.auth import get_current_user, get_current_user_optional
from app.models.user import User
from app.services.ai_router import stream_chat_response, get_model_tier, DEFAULT_MODEL
from app.services.limiter import (
    get_or_create_user,
    check_can_request,
    record_usage,
    MAX_TOKENS_LITE,
    MAX_TOKENS_PREMIUM,
)
from app.services.token_billing import calculate_cost, deduct_balance, get_weighted_price
from app.config import get_settings

from app.models.generation import Generation
from app.routers.achievements import check_and_update

logger = logging.getLogger(__name__)


async def _save_generation(db, tg_id: int, gen_type: str, model: str, prompt: str, result_url: str | None = None, result_text: str | None = None, cost: float | None = None) -> int | None:
    """Save a generation record to the gallery. Uses separate session to avoid breaking main transaction. Returns generation ID."""
    try:
        from app.database import async_session
        async with async_session() as gen_db:
            gen = Generation(user_tg_id=tg_id, type=gen_type, model=model, prompt=prompt, result_url=result_url, result_text=result_text, cost=cost)
            gen_db.add(gen)
            await gen_db.commit()
            await gen_db.refresh(gen)
            return gen.id
    except Exception as e:
        logger.warning(f"Failed to save generation: {e}")
        return None

router = APIRouter(prefix="/api", tags=["chat"])

# ─── Guest (anonymous) rate limiting by IP ───
GUEST_LIMIT = 2
_guest_usage: dict[str, int] = {}  # ip -> total requests


class ChatRequest(BaseModel):
    model_id: str = DEFAULT_MODEL
    messages: list[dict]
    system_prompt: str | None = None
    project_id: str | None = None

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, v):
        if len(v) > 50:
            raise ValueError("Too many messages (max 50)")
        for msg in v:
            if "content" in msg and isinstance(msg["content"], str) and len(msg["content"]) > 100000:
                raise ValueError("Message too long (max 100K chars)")
        return v


@router.post("/chat/guest")
async def chat_guest(
    req: ChatRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Guest chat — no auth required, limited to 10 requests per IP, fast models only."""
    ip = request.headers.get("X-Real-IP") or request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or (request.client.host if request.client else "unknown")

    used = _guest_usage.get(ip, 0)
    if used >= GUEST_LIMIT:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "guest_limit",
                "message": f"Бесплатный лимит {GUEST_LIMIT} запросов исчерпан. Зарегистрируйтесь для продолжения.",
                "used": used,
                "limit": GUEST_LIMIT,
            },
        )

    # Only allow free models for guests
    from app.services.subscription import FREE_MODELS
    if req.model_id not in FREE_MODELS:
        req.model_id = DEFAULT_MODEL

    # Limit messages to last 6 for guests
    if len(req.messages) > 6:
        req.messages = req.messages[-6:]

    from app.services.safety import inject_safety, check_blocked
    blocked = check_blocked(req.messages[-1].get("content", "") if req.messages else "")
    if blocked:
        async def blocked_gen():
            yield f'data: {json.dumps({"content": blocked})}\n\n'
            yield "data: [DONE]\n\n"
        return StreamingResponse(blocked_gen(), media_type="text/event-stream")
    default_system = "Always respond in the same language as the user's message. Match the user's language exactly."
    system_prompt = inject_safety(req.system_prompt if req.system_prompt else default_system)
    max_tokens = MAX_TOKENS_LITE

    async def generate():
        _guest_usage[ip] = used + 1

        async for chunk in stream_chat_response(req.model_id, req.messages, system_prompt, max_tokens=max_tokens):
            yield chunk

        billing_data = {
            "billing": {
                "tokens_in": 0, "tokens_out": 0,
                "cost_usd": 0, "balance_usd": 0,
                "billing_mode": "guest",
                "guest_used": _guest_usage.get(ip, 0),
                "guest_limit": GUEST_LIMIT,
            }
        }
        yield f"data: {json.dumps(billing_data)}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.get("/chat/guest/status")
async def guest_status(request: "Request"):
    """Check guest usage for current IP."""
    ip = request.headers.get("X-Real-IP") or request.headers.get("X-Forwarded-For", "").split(",")[0].strip() or (request.client.host if request.client else "unknown")
    used = _guest_usage.get(ip, 0)
    return {"used": used, "limit": GUEST_LIMIT, "remaining": max(0, GUEST_LIMIT - used)}


@router.post("/chat")
async def chat(
    req: ChatRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Stream chat completion — free within daily limits.

    Flow:
    1. Check daily limits (fast/premium/opus quotas)
    2. Stream response → collect token usage for analytics
    3. Record usage (no balance deduction)
    4. Send billing info as final SSE chunk
    """
    tg_id = tg_user["id"]
    db_id = tg_user.get("db_id")
    await get_or_create_user(db, tg_user)

    # Check BYOK — find user by telegram_id or by db id
    if db_id:
        result = await db.execute(select(User).where(User.id == db_id))
    else:
        result = await db.execute(select(User).where(User.telegram_id == tg_id))
    db_user = result.scalar_one_or_none()
    byok_key = None
    using_byok = False

    if db_user and db_user.byok_enabled and db_user.byok_openrouter_key:
        byok_key = db_user.byok_openrouter_key
        using_byok = True

    billing_mode = "free"

    if not using_byok:
        check = await check_can_request(db, tg_id, req.model_id)
        if not check["allowed"]:
            is_locked = check.get("error") == "model_locked"
            status = 403 if is_locked else 429
            raise HTTPException(
                status_code=status,
                detail={
                    "error": check.get("error", check.get("reason", "limit")),
                    "message": check.get("reason", "Лимит исчерпан"),
                    "plan": check.get("plan", "free"),
                    "tier": check.get("tier", "free"),
                    "required_tier": check.get("required_tier"),
                    "used_today": check.get("used_today", 0),
                    "limit": check.get("limit", 0),
                    "need_balance": False,
                    "upgrade_url": "/pricing",
                },
            )

        # Artificial delay for free-plan users before streaming starts
        delay = check.get("delay", 0)
        if delay > 0:
            await asyncio.sleep(delay)

        plan = check["plan"]
        billing_mode = check["billing"]
    else:
        plan = "byok"

    # System prompt — allowed for all users
    # Default: respond in the user's language (critical for multilingual models like Llama)
    from app.services.safety import inject_safety, check_blocked, log_violation, check_banned
    if await check_banned(tg_id):
        raise HTTPException(403, "Ваш аккаунт заблокирован за нарушение правил.")
    last_msg = req.messages[-1].get("content", "") if req.messages else ""
    if isinstance(last_msg, str):
        blocked = check_blocked(last_msg)
        if blocked:
            asyncio.create_task(log_violation(tg_id, "chat", last_msg, blocked,
                                             username=db_user.username if db_user else None,
                                             email=db_user.email if db_user else None))
            async def blocked_gen():
                yield f'data: {json.dumps({"content": blocked})}\n\n'
                yield "data: [DONE]\n\n"
            return StreamingResponse(blocked_gen(), media_type="text/event-stream")
    default_system = "Always respond in the same language as the user's message. Match the user's language exactly."
    system_prompt = inject_safety(req.system_prompt if req.system_prompt else default_system)

    # Inject project context if project_id provided
    if req.project_id:
        from app.models.project import Project
        from app.routers.projects import build_project_context
        proj_result = await db.execute(
            select(Project).where(Project.id == req.project_id, Project.user_tg_id == tg_id)
        )
        proj = proj_result.scalar_one_or_none()
        if proj:
            brand_ctx = build_project_context(proj)
            system_prompt = brand_ctx + "\n\n" + (system_prompt or "")

    # Dynamic max_tokens based on subscription tier
    user_tier = (db_user.subscription_tier or "free") if db_user else "free"
    max_tokens = MAX_TOKENS_PREMIUM if user_tier in ("max", "max-pro") else MAX_TOKENS_LITE

    # Stream response
    async def generate():
        usage_data = {"tokens_in": 0, "tokens_out": 0}
        had_error = False

        async for chunk in stream_chat_response(req.model_id, req.messages, system_prompt, byok_key=byok_key, max_tokens=max_tokens):
            yield chunk

            # Check for error in stream
            try:
                chunk_data = json.loads(chunk.replace("data: ", "", 1).strip())
                if isinstance(chunk_data, dict) and "error" in chunk_data:
                    had_error = True
            except (json.JSONDecodeError, ValueError):
                pass

            # Extract usage data from the usage chunk
            if '"usage"' in chunk:
                try:
                    data = json.loads(chunk.replace("data: ", "").strip())
                    if "usage" in data:
                        usage_data = data["usage"]
                except Exception:
                    pass

        tokens_in = usage_data.get("tokens_in", 0)
        tokens_out = usage_data.get("tokens_out", 0)

        # Chat is free (daily limits) — no balance deduction.
        # Record usage for analytics only.
        real_cost = 0.0

        if not using_byok and not had_error:
            # Send billing info as final SSE chunk
            balance = float(db_user.balance_usd or 0) if db_user else 0.0
            billing_data = {
                "billing": {
                    "tokens_in": tokens_in,
                    "tokens_out": tokens_out,
                    "cost_usd": 0.0,
                    "balance_usd": balance,
                    "billing_mode": "free",
                }
            }
            yield f"data: {json.dumps(billing_data)}\n\n"

            # Record usage in background task with separate DB session for reliability
            async def _record_usage_bg(tg_id, model_id, tokens_in, tokens_out, cost_usd):
                try:
                    from app.database import async_session
                    async with async_session() as bg_db:
                        await record_usage(bg_db, tg_id, model_id, tokens_in=tokens_in, tokens_out=tokens_out, cost_usd=cost_usd)
                        await bg_db.commit()
                except Exception as e:
                    logger.error(f"Failed to record usage: {e}")

            asyncio.create_task(_record_usage_bg(tg_id, req.model_id, tokens_in, tokens_out, 0.0))

            # Achievement: messages sent
            if db_user:
                asyncio.create_task(check_and_update(tg_id, "messages", db_user.total_requests or 1))
                asyncio.create_task(check_and_update(tg_id, "unique_models", 0))

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ═══════════════════════════════════════════════════════════
# Image Generation — OpenAI gpt-image-1 / DALL-E 3
# ═══════════════════════════════════════════════════════════

IMAGE_MODELS = {"nano-banana", "nano-banana-pro", "gpt-image-1", "gpt-5-image", "gpt-5-image-mini", "kolors-v2", "kolors-v3"}


def _add_watermark(image_bytes: bytes) -> bytes:
    """Add 'stoneai.ru' watermark to bottom-right of image for free users."""
    from PIL import Image, ImageDraw, ImageFont
    from io import BytesIO

    img = Image.open(BytesIO(image_bytes)).convert("RGBA")
    w, h = img.size

    # Create transparent overlay
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    text = "stoneai.ru"
    font_size = max(18, w // 40)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]

    x = w - tw - 16
    y = h - th - 12

    # Semi-transparent background
    draw.rounded_rectangle(
        [x - 8, y - 4, x + tw + 8, y + th + 4],
        radius=6, fill=(0, 0, 0, 100),
    )
    draw.text((x, y), text, font=font, fill=(255, 255, 255, 180))

    result = Image.alpha_composite(img, overlay).convert("RGB")
    buf = BytesIO()
    result.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


async def _save_image_to_disk(image_bytes: bytes, gen_id: int) -> str:
    """Save image to disk and return public URL."""
    import os
    from PIL import Image
    from io import BytesIO

    media_dir = "/var/www/stone-ai/media/images"
    os.makedirs(media_dir, exist_ok=True)

    # Convert to WebP for smaller size
    try:
        img = Image.open(BytesIO(image_bytes))
        buf = BytesIO()
        img.save(buf, format="WEBP", quality=85)
        image_bytes = buf.getvalue()
        ext = "webp"
    except Exception:
        ext = "png"

    filepath = f"{media_dir}/{gen_id}.{ext}"

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    return f"https://stoneai.ru/media/images/{gen_id}.{ext}"


async def _save_image_bg(gen_id: int, image_bytes: bytes):
    """Background: save image to disk, update DB with disk URL, remove base64."""
    try:
        disk_url = await _save_image_to_disk(image_bytes, gen_id)
        from app.database import async_session
        async with async_session() as db:
            result = await db.execute(select(Generation).where(Generation.id == gen_id))
            gen = result.scalar_one_or_none()
            if gen:
                gen.result_url = disk_url
                gen.result_text = None  # remove base64 from DB
                await db.commit()
    except Exception as e:
        logger.error(f"Failed to save image to disk: {e}")


class ImageGenRequest(BaseModel):
    prompt: str
    model_id: str = "nano-banana"


@router.post("/chat/image")
async def generate_image(
    req: ImageGenRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate image using OpenAI gpt-image-1 API."""
    import httpx
    from app.services.safety import check_blocked, log_violation

    tg_id = tg_user["id"]
    blocked = check_blocked(req.prompt)
    if blocked:
        asyncio.create_task(log_violation(tg_id, "image", req.prompt, blocked))
        raise HTTPException(400, blocked)

    db_id = tg_user.get("db_id")
    await get_or_create_user(db, tg_user)

    # Find user and check access
    if db_id:
        result = await db.execute(select(User).where(User.id == db_id))
    else:
        result = await db.execute(select(User).where(User.telegram_id == tg_id))
    db_user = result.scalar_one_or_none()

    tier = db_user.subscription_tier or "free" if db_user else "free"
    # Chat image generation stays on subscription and chat limits only.
    # Free users have a fixed lifetime trial that balance top-ups must not extend.
    if tier == "free":
        from app.config import FREE_TRIAL_IMAGES
        from sqlalchemy import func as sql_func
        total_images = await db.scalar(
            select(sql_func.count()).select_from(Generation).where(
                Generation.user_tg_id == tg_id, Generation.type == "image"
            )
        ) or 0
        if total_images >= FREE_TRIAL_IMAGES:
            raise HTTPException(429, f"Бесплатный лимит {FREE_TRIAL_IMAGES} картинок исчерпан. Пополните баланс для продолжения.")

    settings = get_settings()

    # OpenRouter image models (Gemini image, etc.) — generate via chat API
    OPENROUTER_IMAGE_MODELS = {"nano-banana", "nano-banana-pro", "gpt-5-image", "gpt-5-image-mini"}
    if req.model_id in OPENROUTER_IMAGE_MODELS:
        try:
            from app.services.ai_router import get_openrouter_model
            openrouter_model = get_openrouter_model(req.model_id)
            api_key = settings.openrouter_api_key

            async with httpx.AsyncClient(timeout=120.0) as client:
                prompt_text = f"Generate an image based on this description. You MUST output ONLY the generated image, absolutely no text or commentary. Description: {req.prompt}"
                resp = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "HTTP-Referer": settings.webapp_url,
                        "X-Title": "Stone AI",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": openrouter_model,
                        "messages": [{"role": "user", "content": prompt_text}],
                        "max_tokens": 8192,
                    },
                )

                if resp.status_code != 200:
                    error_body = resp.text[:500]
                    logger.error(f"OpenRouter image error {resp.status_code}: {error_body}")
                    if "safety" in error_body.lower() or "rejected" in error_body.lower():
                        raise HTTPException(400, "Промпт отклонён системой безопасности.")
                    raise HTTPException(502, f"Ошибка генерации: {error_body[:200]}")

                data = resp.json()
                choices = data.get("choices") or [{}]
                message = choices[0].get("message", {}) if choices else {}
                raw_content = message.get("content")
                content = ""
                parts = []

                # OpenRouter may return content as string, list (multimodal), or null
                if isinstance(raw_content, list):
                    # Multimodal: [{"type":"text","text":"..."}, {"type":"image_url","image_url":{"url":"data:..."}}]
                    for item in raw_content:
                        if isinstance(item, dict):
                            if item.get("type") == "image_url":
                                url = item.get("image_url", {}).get("url", "")
                                if url:
                                    parts.append({"inline_data": {"mime_type": "image/png", "data": url.split(",", 1)[-1] if url.startswith("data:") else ""}})
                                    if not parts[-1]["inline_data"]["data"]:
                                        parts[-1] = {"url": url}
                            elif item.get("type") == "text":
                                content += item.get("text", "")
                            elif "inline_data" in item:
                                parts.append(item)
                elif isinstance(raw_content, str):
                    content = raw_content
                # else: None → content stays ""

                logger.info(f"OpenRouter image response keys: {list(message.keys())}, content_type={type(raw_content).__name__}, content_len={len(content)}, parts={len(parts)}")

                # Also check message-level parts (Gemini native format)
                msg_parts = message.get("parts", [])
                if msg_parts:
                    parts.extend(msg_parts)

                # Try to find image in response — could be inline base64 or URL
                image_url = None

                # Check message.images[] (OpenRouter Gemini format)
                images = message.get("images", [])
                for img in images:
                    if isinstance(img, dict):
                        url = img.get("image_url", {}).get("url", "") if isinstance(img.get("image_url"), dict) else ""
                        if url and url.startswith("data:image"):
                            image_url = url
                            break
                        elif url and url.startswith("http"):
                            try:
                                async with httpx.AsyncClient(timeout=30.0) as dl:
                                    img_resp = await dl.get(url)
                                    if img_resp.status_code == 200:
                                        image_url = f"data:image/png;base64,{base64.b64encode(img_resp.content).decode('ascii')}"
                                        break
                            except Exception:
                                pass

                # Check for inline_data in parts (Gemini format) or image_url
                for part in parts:
                    if isinstance(part, dict):
                        if "inline_data" in part:
                            mime = part["inline_data"].get("mime_type", "image/png")
                            b64 = part["inline_data"].get("data", "")
                            if b64:
                                image_url = f"data:{mime};base64,{b64}"
                                break
                        elif "url" in part and part["url"].startswith("http"):
                            # Direct URL — download and convert
                            try:
                                async with httpx.AsyncClient(timeout=30.0) as dl:
                                    img_resp = await dl.get(part["url"])
                                    if img_resp.status_code == 200:
                                        image_url = f"data:image/png;base64,{base64.b64encode(img_resp.content).decode('ascii')}"
                                        break
                            except Exception:
                                pass

                # If not in parts, check content for markdown image or data URI
                if not image_url and content:
                    import re
                    # Match markdown image: ![...](url)
                    md_match = re.search(r'!\[.*?\]\((https?://[^\s)]+)\)', content)
                    if md_match:
                        img_src = md_match.group(1)
                        # Download and convert to base64
                        async with httpx.AsyncClient(timeout=30.0) as dl:
                            img_resp = await dl.get(img_src)
                            if img_resp.status_code == 200:
                                image_url = f"data:image/png;base64,{base64.b64encode(img_resp.content).decode('ascii')}"

                    # Check for data URI directly in content
                    if not image_url:
                        data_match = re.search(r'(data:image/[^;]+;base64,[A-Za-z0-9+/=]+)', content)
                        if data_match:
                            image_url = data_match.group(1)

                if not image_url:
                    logger.warning(f"OpenRouter image model returned text instead of image: {content[:200]}")
                    raise HTTPException(400, "Не удалось сгенерировать изображение. Попробуйте описать картинку подробнее.")

                await record_usage(db, tg_id, req.model_id, cost_usd=0)
                gen_id = await _save_generation(db, tg_id, "image", req.model_id, req.prompt, result_text=image_url)
                await db.commit()
                asyncio.create_task(check_and_update(tg_id, "images", db_user.monthly_images_used or 1 if db_user else 1))

                # Save to disk in background
                if gen_id:
                    try:
                        raw_b64 = image_url.split(",", 1)[1] if image_url.startswith("data:") else None
                        if raw_b64:
                            asyncio.create_task(_save_image_bg(gen_id, base64.b64decode(raw_b64)))
                    except Exception:
                        pass

                return {"image_url": image_url, "model": req.model_id}

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"OpenRouter image error: {e}")
            raise HTTPException(502, f"Ошибка генерации: {str(e)[:200]}")

    # KOLORS (Kling) image generation
    if req.model_id in ("kolors-v2", "kolors-v3") and settings.kling_access_key:
        try:
            from app.services.kling_client import create_kling_image, check_kling_image_status

            kolors_model = "kolors-v3" if req.model_id == "kolors-v3" else "kolors-v2"
            result = await create_kling_image(
                settings.kling_access_key, settings.kling_secret_key,
                req.prompt, model=kolors_model,
            )
            if "error" in result:
                raise HTTPException(502, f"KOLORS ошибка: {result['error']}")

            task_id = result["task_id"]
            # Poll for result (max 60s)
            for _ in range(30):
                await asyncio.sleep(2)
                status = await check_kling_image_status(
                    settings.kling_access_key, settings.kling_secret_key, task_id
                )
                if status.get("status") == "COMPLETED" and status.get("images"):
                    image_source_url = status["images"][0]
                    # Download and convert to base64
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        img_resp = await client.get(image_source_url)
                        if img_resp.status_code == 200:
                            image_url = f"data:image/png;base64,{base64.b64encode(img_resp.content).decode('ascii')}"
                            # Watermark for free users
                            if tier == "free":
                                try:
                                    watermarked = _add_watermark(img_resp.content)
                                    image_url = f"data:image/png;base64,{base64.b64encode(watermarked).decode('ascii')}"
                                except Exception:
                                    pass
                            await record_usage(db, tg_id, req.model_id, cost_usd=0)
                            gen_id = await _save_generation(db, tg_id, "image", req.model_id, req.prompt, result_url=image_source_url, result_text=image_url)
                            await db.commit()
                            asyncio.create_task(check_and_update(tg_id, "images", db_user.monthly_images_used or 1 if db_user else 1))

                            # Save to disk in background
                            if gen_id:
                                try:
                                    raw_b64 = image_url.split(",", 1)[1] if image_url.startswith("data:") else None
                                    if raw_b64:
                                        asyncio.create_task(_save_image_bg(gen_id, base64.b64decode(raw_b64)))
                                except Exception:
                                    pass

                            return {"image_url": image_url, "model": req.model_id}
                    break
                if status.get("status") == "FAILED":
                    raise HTTPException(502, f"KOLORS: {status.get('error', 'Failed')}")

            raise HTTPException(504, "KOLORS таймаут генерации")
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"KOLORS error: {e}")
            raise HTTPException(502, "Ошибка KOLORS генерации")

    openai_key = settings.openai_api_key
    if not openai_key:
        raise HTTPException(503, "Image generation not configured")

    logger.info(f"Image generation: user={tg_id}, model={req.model_id}, prompt={req.prompt[:100]}")

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                json={
                    "model": "gpt-image-1",
                    "prompt": req.prompt,
                    "n": 1,
                    "size": "1024x1024",
                    "quality": "high",
                },
            )

            if resp.status_code != 200:
                error_body = resp.text[:500]
                logger.error(f"OpenAI image error {resp.status_code}: {error_body}")
                if "safety" in error_body.lower() or "rejected" in error_body.lower():
                    raise HTTPException(400, "Промпт отклонён системой безопасности. Попробуйте переформулировать запрос.")
                if "billing" in error_body.lower() or "quota" in error_body.lower():
                    raise HTTPException(503, "Сервис генерации изображений временно недоступен.")
                raise HTTPException(502, "Ошибка генерации изображения. Попробуйте позже.")

            data = resp.json()
            image_data = data["data"][0]

            # gpt-image-1 returns b64_json by default, dall-e-3 returns url
            if "b64_json" in image_data:
                image_url = f"data:image/png;base64,{image_data['b64_json']}"
            elif image_data.get("url"):
                source_url = image_data["url"]
                img_resp = await client.get(source_url, timeout=30.0)
                if img_resp.status_code == 200:
                    image_url = f"data:image/png;base64,{base64.b64encode(img_resp.content).decode('ascii')}"
                else:
                    image_url = source_url
            else:
                raise HTTPException(502, "No image in response")

        # Add watermark for free users
        if tier == "free" and image_url.startswith("data:image"):
            try:
                raw_b64 = image_url.split(",", 1)[1]
                img_bytes = base64.b64decode(raw_b64)
                watermarked = _add_watermark(img_bytes)
                image_url = f"data:image/png;base64,{base64.b64encode(watermarked).decode('ascii')}"
            except Exception as e:
                logger.warning(f"Watermark failed: {e}")  # skip watermark on error

        # Record usage
        await record_usage(db, tg_id, req.model_id, tokens_in=0, tokens_out=0, cost_usd=0)
        gen_id = await _save_generation(db, tg_id, "image", req.model_id, req.prompt, result_text=image_url)
        await db.commit()

        asyncio.create_task(check_and_update(tg_id, "images", db_user.monthly_images_used or 1 if db_user else 1))

        # Save to disk in background
        if gen_id:
            try:
                raw_b64 = image_url.split(",", 1)[1] if image_url.startswith("data:") else None
                if raw_b64:
                    asyncio.create_task(_save_image_bg(gen_id, base64.b64decode(raw_b64)))
            except Exception:
                pass

        return {"image_url": image_url, "model": req.model_id}

    except httpx.TimeoutException:
        raise HTTPException(504, "Таймаут генерации. Попробуйте снова.")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image gen error: {e}")
        raise HTTPException(502, "Ошибка генерации")


# ═══════════════════════════════════════════════════════════
# File Upload — PDF/Image → base64/text for multimodal models
# ═══════════════════════════════════════════════════════════

ALLOWED_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/chat/upload")
async def upload_file(
    file: UploadFile = File(...),
    tg_user: dict = Depends(get_current_user),
):
    """
    Upload a file for use in chat. Returns content ready to inject into messages.

    Images → base64 data URL (for vision models via OpenRouter).
    PDF → extracted text (first ~50K chars).

    Returns:
        {
            "file_id": str,
            "file_name": str,
            "file_type": "image" | "pdf",
            "mime_type": str,
            "size": int,
            "content": str  — base64 data URL for images, text for PDFs
        }
    """
    if not file.content_type or file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}. Allowed: images (JPEG, PNG, GIF, WebP) and PDF.")

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(400, f"File too large: {len(data) / 1024 / 1024:.1f}MB. Max: 10MB.")

    file_id = str(uuid.uuid4())[:8]
    mime = file.content_type

    if mime.startswith("image/"):
        b64 = base64.b64encode(data).decode("ascii")
        content = f"data:{mime};base64,{b64}"
        file_type = "image"
    elif mime == "application/pdf":
        text = _extract_pdf_text(data)
        content = text[:50000]  # cap at ~50K chars
        file_type = "pdf"
    else:
        raise HTTPException(400, "Unsupported file type")

    logger.info(f"File upload: user={tg_user['id']}, type={file_type}, size={len(data)}, name={file.filename}")

    return {
        "file_id": file_id,
        "file_name": file.filename or "file",
        "file_type": file_type,
        "mime_type": mime,
        "size": len(data),
        "content": content,
    }


def _extract_pdf_text(data: bytes) -> str:
    """Extract text from PDF bytes. Falls back to placeholder if no PDF lib."""
    try:
        import io
        # Try PyPDF2 / pypdf
        try:
            from pypdf import PdfReader
        except ImportError:
            from PyPDF2 import PdfReader

        reader = PdfReader(io.BytesIO(data))
        pages = []
        for page in reader.pages[:200]:  # max 200 pages
            text = page.extract_text()
            if text:
                pages.append(text)
        return "\n\n".join(pages) if pages else "[PDF: не удалось извлечь текст]"

    except Exception as e:
        logger.warning(f"PDF text extraction failed: {e}")
        # Fallback: send as base64 for models that support PDF natively
        b64 = base64.b64encode(data).decode("ascii")
        return f"[PDF файл, {len(data) // 1024}KB. Содержимое в base64: {b64[:500]}...]"
