"""AI Photo Session — product background change, on-model photos, marketplace cards."""

from app.config import USD_TO_RUB
import base64
import json
import logging
import re
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.generation import Generation
from app.models.user import User
from app.services.ai_router import get_openrouter_model

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/photo-session", tags=["photo-session"])

# ─── Costs (USD, approx RUB / USD_TO_RUB) ───

COST_BACKGROUND = 0.158    # ~15 RUB
COST_ON_MODEL = 0.421      # ~40 RUB
COST_MARKETPLACE = 0.21    # ~20 RUB

DEFAULT_IMAGE_MODEL = "nano-banana"

OPENROUTER_IMAGE_MODELS = {"nano-banana", "nano-banana-pro", "gpt-image-1"}


# ─── Schemas ───

class BackgroundRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded product image (for reference in prompt)")
    background_prompt: str = Field(..., description="Desired background description")
    style: str | None = Field(default=None, description="Style preset: studio, nature, gradient, abstract")
    model_id: str | None = None
    project_id: str | None = None


class OnModelRequest(BaseModel):
    product_image_base64: str = Field(..., description="Base64-encoded product image")
    model_description: str = Field(..., description="Description of the model (e.g. young woman, athletic man)")
    scene: str | None = Field(default=None, description="Scene/setting description")
    pose: str | None = Field(default=None, description="Desired pose")
    model_id: str | None = None
    project_id: str | None = None


class MarketplaceCardRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded product image")
    platform: str = Field(..., description="Target platform: wildberries, ozon, amazon, etsy")
    product_name: str = Field(..., description="Product name for the card")
    background_color: str | None = Field(default=None, description="Background color, e.g. white, light gray")
    model_id: str | None = None
    project_id: str | None = None


# ─── Style presets ───

STYLE_PRESETS = {
    "studio": "professional studio lighting, clean white backdrop, soft shadows, commercial product photography",
    "nature": "natural outdoor setting, soft daylight, organic textures, lifestyle product photography",
    "gradient": "smooth gradient background, modern minimalist look, soft color transition",
    "abstract": "abstract artistic background, creative shapes and colors, editorial style",
    "luxury": "dark moody background, dramatic lighting, premium feel, luxury brand photography",
    "pastel": "soft pastel background, gentle warm tones, airy feel, feminine aesthetic",
}

PLATFORM_SPECS = {
    "wildberries": "Wildberries marketplace card, clean white background, centered product, high contrast, sharp details, 900x1200 resolution ratio, Russian e-commerce style",
    "ozon": "Ozon marketplace listing photo, pure white background, product centered with padding, bright even lighting, 1000x1000 square format, clean and professional",
    "amazon": "Amazon product listing photo, pure white background (#FFFFFF), product fills 85% of frame, no text overlay, professional e-commerce photography",
    "etsy": "Etsy listing photo, lifestyle product photography, warm natural lighting, styled with props, artisan handmade feel",
}


# ─── Background presets ───

BACKGROUND_PRESETS = [
    {"id": "white-studio", "name": "Белая студия", "prompt": "pure white studio background, professional lighting, soft shadows", "emoji": "⬜"},
    {"id": "marble", "name": "Мрамор", "prompt": "elegant marble surface and background, luxury feel, soft reflections", "emoji": "🪨"},
    {"id": "nature-green", "name": "Природа", "prompt": "lush green nature background, soft bokeh, natural daylight, organic setting", "emoji": "🌿"},
    {"id": "gradient-blue", "name": "Синий градиент", "prompt": "smooth blue gradient background, modern and clean, tech aesthetic", "emoji": "🔵"},
    {"id": "wood-table", "name": "Деревянный стол", "prompt": "warm wooden table surface, rustic cozy atmosphere, natural textures", "emoji": "🪵"},
    {"id": "beach-sunset", "name": "Пляж на закате", "prompt": "golden hour beach background, warm sunset glow, sand and ocean", "emoji": "🌅"},
    {"id": "dark-moody", "name": "Тёмный", "prompt": "dark moody background, dramatic side lighting, premium luxury feel", "emoji": "🖤"},
    {"id": "pastel-pink", "name": "Пастельный розовый", "prompt": "soft pastel pink background, gentle lighting, feminine aesthetic", "emoji": "🩷"},
    {"id": "concrete", "name": "Бетон", "prompt": "industrial concrete background, urban loft style, raw textured surface", "emoji": "🏗️"},
    {"id": "christmas", "name": "Новогодний", "prompt": "festive Christmas background, bokeh lights, red and gold decorations, holiday atmosphere", "emoji": "🎄"},
]


# ─── Helpers ───

async def _find_user(db: AsyncSession, tg_user: dict) -> User:
    """Locate the User row by db_id or telegram_id."""
    db_id = tg_user.get("db_id")
    if db_id:
        result = await db.execute(select(User).where(User.id == db_id).with_for_update())
    else:
        result = await db.execute(select(User).where(User.telegram_id == tg_user["id"]).with_for_update())
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Пользователь не найден")
    return user


def _resolve_model(model_id: str | None) -> str:
    """Resolve model_id to an OpenRouter model identifier."""
    mid = model_id or DEFAULT_IMAGE_MODEL
    if mid not in OPENROUTER_IMAGE_MODELS:
        mid = DEFAULT_IMAGE_MODEL
    return get_openrouter_model(mid)


async def _check_and_deduct(db: AsyncSession, user: User, cost_usd: float) -> tuple[float, bool]:
    """Check balance and deduct. Subscribers get 20% discount. Returns (new_balance, is_subscriber)."""
    from app.config import apply_discount
    balance = float(user.balance_usd or 0)
    tier = user.subscription_tier or "free"
    is_sub = tier in ("mini", "max", "max-pro")

    cost_usd = apply_discount(cost_usd, tier)

    if balance < cost_usd:
        cost_rub = round(cost_usd * USD_TO_RUB, 0)
        raise HTTPException(402, {
            "error": "insufficient_balance",
            "message": f"Недостаточно средств ({cost_rub:.0f}₽)",
            "required_usd": cost_usd,
            "balance_usd": balance,
        })

    user.balance_usd = round(balance - cost_usd, 6)
    new_balance = float(user.balance_usd)
    await db.flush()

    return new_balance, is_sub


async def _refund(db: AsyncSession, user: User, new_balance: float, cost_usd: float, has_sub: bool):
    """Refund deducted balance on failure."""
    user.balance_usd = round(new_balance + cost_usd, 6)
    await db.flush()


async def _generate_image(prompt: str, model_id: str | None = None, input_image_b64: str | None = None) -> str | None:
    """Generate image using OpenAI gpt-image-1 or OpenRouter models. Supports input image for editing."""
    from app.services.safety import check_blocked
    blocked = check_blocked(prompt)
    if blocked:
        raise HTTPException(400, blocked)

    settings = get_settings()

    # Default to gpt-image-1 via OpenAI API (most reliable for image generation)
    use_openai = model_id in (None, "gpt-image-1", "gpt-5-image", "gpt-5-image-mini") or not model_id

    if use_openai and settings.openai_api_key:
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                # If input image provided, use edit endpoint
                if input_image_b64:
                    prompt_with_ref = f"Edit this photo. Keep ALL foreground subjects and objects exactly as they are — do not remove, modify, or replace anything in the foreground (people, products, furniture, etc). ONLY replace the background with: {prompt}"
                else:
                    prompt_with_ref = prompt
                resp = await client.post(
                    "https://api.openai.com/v1/images/generations",
                    headers={"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"},
                    json={"model": "gpt-image-1", "prompt": prompt_with_ref, "n": 1, "size": "1024x1024", "quality": "high"},
                )
                if resp.status_code != 200:
                    error_body = resp.text[:300]
                    logger.error(f"OpenAI image error {resp.status_code}: {error_body}")
                    if "safety" in error_body.lower():
                        raise HTTPException(400, "Промпт отклонён системой безопасности.")
                    if "billing" in error_body.lower() or "limit" in error_body.lower():
                        raise HTTPException(503, "Сервис генерации временно недоступен. Попробуйте позже.")
                    raise RuntimeError(f"OpenAI error: {error_body[:200]}")

                data = resp.json()
                image_data = data["data"][0]
                if "b64_json" in image_data:
                    return f"data:image/png;base64,{image_data['b64_json']}"
                if image_data.get("url"):
                    img_resp = await client.get(image_data["url"], timeout=30.0)
                    if img_resp.status_code == 200:
                        return f"data:image/png;base64,{base64.b64encode(img_resp.content).decode('ascii')}"
        except HTTPException:
            raise
        except Exception as exc:
            logger.error(f"OpenAI image gen failed: {exc}")
            raise RuntimeError(str(exc))

    # Fallback: OpenRouter for other models (supports multimodal with image input)
    openrouter_model = get_openrouter_model(model_id or "nano-banana")

    # Build message — multimodal if input image provided
    if input_image_b64:
        img_url = input_image_b64 if input_image_b64.startswith("data:") else f"data:image/png;base64,{input_image_b64}"
        user_content = [
            {"type": "image_url", "image_url": {"url": img_url}},
            {"type": "text", "text": f"Edit this photo. Keep ALL foreground subjects and objects exactly as they are — do not remove, modify, or replace anything in the foreground (people, products, furniture, animals, etc). ONLY replace the background with: {prompt}. Output only the edited image, no text."},
        ]
    else:
        user_content = f"Generate an image based on this description. Do NOT reply with text, ONLY generate the image. Description: {prompt}"

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "HTTP-Referer": settings.webapp_url,
                "X-Title": "Stone AI",
                "Content-Type": "application/json",
            },
            json={"model": openrouter_model, "messages": [{"role": "user", "content": user_content}], "max_tokens": 8192},
        )
        if resp.status_code != 200:
            raise RuntimeError(f"OpenRouter error {resp.status_code}")

        data = resp.json()
        message = data.get("choices", [{}])[0].get("message", {})
        raw_content = message.get("content")
        content = raw_content if isinstance(raw_content, str) else ""
        parts = message.get("parts", [])

        # Check message.images[] (OpenRouter Gemini format)
        images = message.get("images", [])
        for img in images:
            if isinstance(img, dict):
                url = img.get("image_url", {}).get("url", "") if isinstance(img.get("image_url"), dict) else ""
                if url and url.startswith("data:image"):
                    return url

        for part in parts:
            if isinstance(part, dict) and "inline_data" in part:
                b64 = part["inline_data"].get("data", "")
                if b64:
                    return f"data:{part['inline_data'].get('mime_type', 'image/png')};base64,{b64}"

        if content:
            md_match = re.search(r'!\[.*?\]\((https?://[^\s)]+)\)', content)
            if md_match:
                async with httpx.AsyncClient(timeout=30.0) as dl:
                    img_resp = await dl.get(md_match.group(1))
                    if img_resp.status_code == 200:
                        return f"data:image/png;base64,{base64.b64encode(img_resp.content).decode('ascii')}"
            data_match = re.search(r'(data:image/[^;]+;base64,[A-Za-z0-9+/=]+)', content)
            if data_match:
                return data_match.group(1)

        return None


# ─── Endpoints ───

@router.get("/presets/backgrounds")
async def get_background_presets():
    """Return predefined background presets (no auth required)."""
    return {"presets": BACKGROUND_PRESETS}


@router.post("/background")
async def change_background(
    req: BackgroundRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a product photo with a new background."""
    tg_id = tg_user["id"]
    user = await _find_user(db, tg_user)
    new_balance, has_sub = await _check_and_deduct(db, user, COST_BACKGROUND)

    # Build prompt
    style_hint = STYLE_PRESETS.get(req.style, "") if req.style else ""
    prompt = (
        f"Edit this photo: keep ALL foreground subjects and objects exactly as they are "
        f"(people, products, furniture, animals — do NOT remove or change anything in the foreground). "
        f"ONLY replace the background with: {req.background_prompt}. "
        f"{style_hint} "
        f"High resolution, sharp focus, photorealistic, commercial quality, "
        f"perfect lighting, clean composition."
    ).strip()

    model_id_used = req.model_id or DEFAULT_IMAGE_MODEL

    try:
        image_url = await _generate_image(prompt, model_id_used, input_image_b64=req.image_base64)
    except HTTPException:
        await _refund(db, user, new_balance, COST_BACKGROUND, has_sub)
        raise
    except Exception as exc:
        await _refund(db, user, new_balance, COST_BACKGROUND, has_sub)
        logger.error(f"Background generation failed: {exc}")
        raise HTTPException(502, f"Ошибка генерации: {str(exc)[:200]}")

    if not image_url:
        await _refund(db, user, new_balance, COST_BACKGROUND, has_sub)
        raise HTTPException(502, "Модель не вернула изображение. Попробуйте другую модель.")

    # Save generation
    gen = Generation(
        user_tg_id=tg_id,
        project_id=req.project_id,
        type="image",
        model=model_id_used,
        prompt=prompt,
        result_url=image_url if image_url.startswith("http") else None,
        result_text=image_url if image_url.startswith("data:") else None,
        metadata_={"feature": "photo-session-background", "style": req.style, "background_prompt": req.background_prompt},
        cost=COST_BACKGROUND,
    )
    db.add(gen)
    await db.commit()
    await db.refresh(gen)

    return {
        "id": gen.id,
        "image_url": image_url,
        "model": model_id_used,
        "cost_rub": round(COST_BACKGROUND * USD_TO_RUB, 2),
        "balance_usd": new_balance,
    }


@router.post("/on-model")
async def product_on_model(
    req: OnModelRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a fashion/lifestyle photo of a product worn or held by a model."""
    tg_id = tg_user["id"]
    user = await _find_user(db, tg_user)
    new_balance, has_sub = await _check_and_deduct(db, user, COST_ON_MODEL)

    # Build prompt
    scene_hint = f", in a setting of {req.scene}" if req.scene else ""
    pose_hint = f", pose: {req.pose}" if req.pose else ""
    prompt = (
        f"Professional fashion photography. A {req.model_description} wearing/holding the product{scene_hint}{pose_hint}. "
        f"High-end editorial style, studio or lifestyle setting, perfect lighting, "
        f"sharp focus, photorealistic, magazine quality, "
        f"natural skin texture, elegant composition, 4K detail."
    ).strip()

    model_id_used = req.model_id or DEFAULT_IMAGE_MODEL

    try:
        image_url = await _generate_image(prompt, model_id_used, input_image_b64=req.product_image_base64)
    except HTTPException:
        await _refund(db, user, new_balance, COST_ON_MODEL, has_sub)
        raise
    except Exception as exc:
        await _refund(db, user, new_balance, COST_ON_MODEL, has_sub)
        logger.error(f"On-model generation failed: {exc}")
        raise HTTPException(502, f"Ошибка генерации: {str(exc)[:200]}")

    if not image_url:
        await _refund(db, user, new_balance, COST_ON_MODEL, has_sub)
        raise HTTPException(502, "Модель не вернула изображение. Попробуйте другую модель.")

    gen = Generation(
        user_tg_id=tg_id,
        project_id=req.project_id,
        type="image",
        model=model_id_used,
        prompt=prompt,
        result_url=image_url if image_url.startswith("http") else None,
        result_text=image_url if image_url.startswith("data:") else None,
        metadata_={"feature": "photo-session-on-model", "model_description": req.model_description, "scene": req.scene, "pose": req.pose},
        cost=COST_ON_MODEL,
    )
    db.add(gen)
    await db.commit()
    await db.refresh(gen)

    return {
        "id": gen.id,
        "image_url": image_url,
        "model": model_id_used,
        "cost_rub": round(COST_ON_MODEL * USD_TO_RUB, 2),
        "balance_usd": new_balance,
    }


@router.post("/marketplace-card")
async def marketplace_card(
    req: MarketplaceCardRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a clean product card for a marketplace platform."""
    tg_id = tg_user["id"]
    user = await _find_user(db, tg_user)
    new_balance, has_sub = await _check_and_deduct(db, user, COST_MARKETPLACE)

    # Build prompt
    platform_hint = PLATFORM_SPECS.get(req.platform.lower(), f"clean e-commerce product photo for {req.platform}")
    bg_hint = f"Background color: {req.background_color}. " if req.background_color else ""
    prompt = (
        f"{platform_hint}. "
        f"Product: {req.product_name}. "
        f"{bg_hint}"
        f"Professional e-commerce product photography, perfectly centered, "
        f"even lighting from all sides, no harsh shadows, crisp sharp details, "
        f"photorealistic, commercial catalog quality."
    ).strip()

    model_id_used = req.model_id or DEFAULT_IMAGE_MODEL

    try:
        image_url = await _generate_image(prompt, model_id_used, input_image_b64=req.image_base64)
    except HTTPException:
        await _refund(db, user, new_balance, COST_MARKETPLACE, has_sub)
        raise
    except Exception as exc:
        await _refund(db, user, new_balance, COST_MARKETPLACE, has_sub)
        logger.error(f"Marketplace card generation failed: {exc}")
        raise HTTPException(502, f"Ошибка генерации: {str(exc)[:200]}")

    if not image_url:
        await _refund(db, user, new_balance, COST_MARKETPLACE, has_sub)
        raise HTTPException(502, "Модель не вернула изображение. Попробуйте другую модель.")

    gen = Generation(
        user_tg_id=tg_id,
        project_id=req.project_id,
        type="image",
        model=model_id_used,
        prompt=prompt,
        result_url=image_url if image_url.startswith("http") else None,
        result_text=image_url if image_url.startswith("data:") else None,
        metadata_={"feature": "photo-session-marketplace", "platform": req.platform, "product_name": req.product_name},
        cost=COST_MARKETPLACE,
    )
    db.add(gen)
    await db.commit()
    await db.refresh(gen)

    return {
        "id": gen.id,
        "image_url": image_url,
        "model": model_id_used,
        "cost_rub": round(COST_MARKETPLACE * USD_TO_RUB, 2),
        "balance_usd": new_balance,
    }


# ─── Batch Processing ───

class BatchBackgroundRequest(BaseModel):
    images: list[str] = Field(max_length=10)  # list of base64 data URLs
    background_prompt: str
    style: str | None = None
    model_id: str | None = None


@router.post("/batch")
async def batch_process(
    req: BatchBackgroundRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Process multiple product photos with the same background. Max 10 images."""
    tg_id = tg_user["id"]
    user = await _find_user(db, tg_user)

    from app.config import apply_discount
    tier = user.subscription_tier or "free"
    per_image_cost = apply_discount(COST_BACKGROUND, tier)
    total_cost = per_image_cost * len(req.images)
    balance = float(user.balance_usd or 0)

    if balance < total_cost:
        raise HTTPException(402, f"Недостаточно средств. Нужно ~{int(total_cost * USD_TO_RUB)}₽ для {len(req.images)} фото")

    style_hint = STYLE_PRESETS.get(req.style, "") if req.style else ""
    model_id_used = req.model_id or DEFAULT_IMAGE_MODEL
    results = []
    total_spent = 0.0

    for i, image_data in enumerate(req.images):
        prompt = (
            f"Edit this photo: keep ALL foreground subjects and objects exactly as they are "
            f"(people, products, furniture, animals — do NOT remove or change anything in the foreground). "
            f"ONLY replace the background with: {req.background_prompt}. "
            f"{style_hint} "
            f"High resolution, sharp focus, photorealistic, commercial quality."
        ).strip()

        try:
            image_url = await _generate_image(prompt, model_id_used, input_image_b64=image_data)

            user.balance_usd = max(0, float(user.balance_usd or 0) - per_image_cost)
            total_spent += per_image_cost

            gen = Generation(
                user_tg_id=tg_id, type="image", model=model_id_used,
                prompt=f"[batch {i+1}/{len(req.images)}] {req.background_prompt}",
                result_text=image_url, cost=COST_BACKGROUND,
            )
            db.add(gen)

            results.append({"index": i, "status": "ok", "image_url": image_url, "id": gen.id})
        except Exception as e:
            logger.error(f"Batch item {i} failed: {e}")
            results.append({"index": i, "status": "error", "error": str(e)[:200]})

    await db.commit()

    return {
        "results": results,
        "total_cost_rub": round(total_spent * USD_TO_RUB, 2),
        "balance_usd": float(user.balance_usd or 0),
        "processed": sum(1 for r in results if r["status"] == "ok"),
        "failed": sum(1 for r in results if r["status"] == "error"),
    }
