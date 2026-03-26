"""Chat endpoint — streaming AI responses via SSE with per-token billing."""

import asyncio
import base64
import json
import logging
import os
import tempfile
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middleware.auth import get_current_user
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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    model_id: str = DEFAULT_MODEL
    messages: list[dict]
    system_prompt: str | None = None


@router.post("/chat")
async def chat(
    req: ChatRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Stream chat completion with per-token billing.

    Flow:
    1. Check limits (10+5 for lite, balance for premium)
    2. Stream response → collect actual token usage
    3. Calculate real cost from tokens
    4. Deduct USD AFTER streaming (not before)
    5. Send billing info as final SSE chunk
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
                    "error": check.get("error", check["reason"]),
                    "message": check["reason"],
                    "plan": check["plan"],
                    "tier": check["tier"],
                    "required_tier": check.get("required_tier"),
                    "used_today": check["used_today"],
                    "limit": check["limit"],
                    "need_balance": check["billing"] == "per_token",
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
    system_prompt = req.system_prompt if req.system_prompt else None

    # Dynamic max_tokens based on billing mode
    max_tokens = MAX_TOKENS_LITE if billing_mode == "free" else MAX_TOKENS_PREMIUM

    # Stream response
    async def generate():
        usage_data = {"tokens_in": 0, "tokens_out": 0}
        had_error = False

        async for chunk in stream_chat_response(req.model_id, req.messages, system_prompt, byok_key=byok_key, max_tokens=max_tokens):
            yield chunk

            # Check for error in stream
            if '"error"' in chunk:
                had_error = True

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

        # Calculate real cost and deduct if per_token billing
        real_cost = 0.0
        new_balance = 0.0

        if not using_byok and not had_error:
            if billing_mode == "per_token":
                real_cost = calculate_cost(req.model_id, tokens_in, tokens_out)
                if real_cost > 0:
                    deduct_result = await deduct_balance(db, tg_id, real_cost)
                    new_balance = deduct_result["new_balance"]
                    real_cost = deduct_result["deducted"]
                    logger.info(
                        f"Per-token billing: user={tg_id}, model={req.model_id}, "
                        f"tokens={tokens_in}+{tokens_out}, cost=${real_cost:.6f}, "
                        f"balance=${new_balance:.6f}"
                    )

            # Record usage with cost
            await record_usage(
                db, tg_id, req.model_id,
                tokens_in=tokens_in,
                tokens_out=tokens_out,
                cost_usd=real_cost,
            )

            # Send billing info as final SSE chunk (before [DONE])
            billing_data = {
                "billing": {
                    "tokens_in": tokens_in,
                    "tokens_out": tokens_out,
                    "cost_usd": real_cost,
                    "balance_usd": new_balance,
                    "model_price_per_m": get_weighted_price(req.model_id),
                    "billing_mode": billing_mode,
                }
            }
            yield f"data: {json.dumps(billing_data)}\n\n"

            await db.commit()

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

IMAGE_MODELS = {"nano-banana", "nano-banana-pro", "gpt-5-image", "gpt-5-image-mini", "flux-schnell", "stable-diffusion-xl"}


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

    tg_id = tg_user["id"]
    db_id = tg_user.get("db_id")
    await get_or_create_user(db, tg_user)

    # Find user and check access
    if db_id:
        result = await db.execute(select(User).where(User.id == db_id))
    else:
        result = await db.execute(select(User).where(User.telegram_id == tg_id))
    db_user = result.scalar_one_or_none()

    tier = db_user.subscription_tier or "free" if db_user else "free"
    balance = float(db_user.balance_usd or 0) if db_user else 0

    # Free users: 2 images/day
    if tier == "free" and balance <= 0:
        from app.services.limiter import get_today_usage
        img_today = await get_today_usage(db, tg_id, "image") if db_user else 0
        if img_today >= 2:
            raise HTTPException(429, "Лимит картинок исчерпан (2/день). Подписка от 390₽/мес.")

    settings = get_settings()
    openai_key = settings.openai_api_key
    if not openai_key:
        raise HTTPException(503, "Image generation not configured")

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                json={
                    "model": "dall-e-3",
                    "prompt": req.prompt,
                    "n": 1,
                    "size": "1024x1024",
                    "quality": "hd",
                    "style": "natural",
                    "response_format": "url",
                },
            )

            if resp.status_code != 200:
                logger.error(f"OpenAI image error {resp.status_code}: {resp.text[:200]}")
                raise HTTPException(502, "Ошибка генерации изображения")

            data = resp.json()
            image_data = data["data"][0]

            # Get URL or base64
            if "url" in image_data:
                image_url = image_data["url"]
            elif "b64_json" in image_data:
                image_url = f"data:image/png;base64,{image_data['b64_json']}"
            else:
                raise HTTPException(502, "No image in response")

        # Record usage
        await record_usage(db, tg_id, req.model_id, tokens_in=0, tokens_out=0, cost_usd=0)
        await db.commit()

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
