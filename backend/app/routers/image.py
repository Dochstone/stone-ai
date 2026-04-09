"""Async image generation — submit/poll/result pattern."""

import asyncio
import base64
import logging
from datetime import datetime
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.image_task import ImageTask
from app.models.generation import Generation
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/image", tags=["image"])


class ImageGenRequest(BaseModel):
    prompt: str
    model_id: str = "nano-banana"


@router.post("/generate")
async def submit_image(
    req: ImageGenRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit async image generation. Returns task_id for polling."""
    from app.services.safety import check_blocked, check_banned, log_violation

    tg_id = tg_user["id"]

    if await check_banned(tg_id):
        raise HTTPException(403, "Аккаунт заблокирован")

    blocked = check_blocked(req.prompt)
    if blocked:
        asyncio.create_task(log_violation(tg_id, "image", req.prompt, blocked))
        raise HTTPException(400, blocked)

    # Get user
    db_id = tg_user.get("db_id")
    if db_id:
        result = await db.execute(select(User).where(User.id == db_id))
    else:
        result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Пользователь не найден")

    tier = user.subscription_tier or "free"

    # Check subscription expiry
    if tier != "free":
        from app.services.daily_limits import check_and_expire_subscription
        tier = await check_and_expire_subscription(db, user)

    # Check daily limits
    from app.services.daily_limits import check_daily_limit
    balance = float(user.balance_usd or 0)
    check = await check_daily_limit(db, tg_id, req.model_id, tier, balance)
    if not check.get("allowed"):
        raise HTTPException(
            429 if check.get("error") == "daily_limit_exceeded" else 403,
            check,
        )

    # Create task
    task = ImageTask(
        user_tg_id=tg_id,
        model_id=req.model_id,
        prompt=req.prompt,
        status="generating",
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    # Start generation in background
    asyncio.create_task(_generate_image_bg(task.id, tg_id, req.model_id, req.prompt, tier))

    return {"task_id": task.id, "status": "generating"}


@router.get("/status/{task_id}")
async def check_image_status(
    task_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Poll for image generation result."""
    tg_id = tg_user["id"]

    result = await db.execute(
        select(ImageTask).where(ImageTask.id == task_id, ImageTask.user_tg_id == tg_id)
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Задача не найдена")

    response = {
        "task_id": task.id,
        "status": task.status,
        "model_id": task.model_id,
    }

    if task.status == "completed" and task.image_url:
        response["image_url"] = task.image_url
    elif task.status == "failed":
        response["error"] = task.error or "Ошибка генерации"

    return response


@router.get("/history")
async def image_history(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get last 20 image generation tasks."""
    tg_id = tg_user["id"]
    result = await db.execute(
        select(ImageTask)
        .where(ImageTask.user_tg_id == tg_id)
        .order_by(ImageTask.created_at.desc())
        .limit(20)
    )
    tasks = result.scalars().all()
    return [
        {
            "id": t.id,
            "model_id": t.model_id,
            "prompt": t.prompt[:100],
            "status": t.status,
            "image_url": t.image_url if t.status == "completed" else None,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in tasks
    ]


async def _generate_image_bg(task_id: int, tg_id: int, model_id: str, prompt: str, tier: str):
    """Background task: generate image, save to disk, update task."""
    import httpx

    try:
        settings = get_settings()
        image_bytes = None

        OPENROUTER_MODELS = {"nano-banana", "nano-banana-pro", "gpt-5-image", "gpt-5-image-mini"}

        if model_id in OPENROUTER_MODELS:
            image_bytes = await _gen_openrouter(settings, model_id, prompt)
        elif model_id in ("kolors-v2", "kolors-v3"):
            image_bytes = await _gen_kolors(settings, model_id, prompt)
        else:
            image_bytes = await _gen_openai(settings, prompt)

        if not image_bytes:
            logger.error(f"Image generation returned None for task {task_id}, model={model_id}")
            await _update_task(task_id, "failed", error="Модель не вернула изображение. Попробуйте другую модель.")
            return

        # Watermark for free users
        if tier == "free":
            try:
                from app.routers.chat import _add_watermark
                image_bytes = _add_watermark(image_bytes)
            except Exception:
                pass

        # Save to disk
        import os
        from PIL import Image

        media_dir = "/var/www/stone-ai/media/images"
        os.makedirs(media_dir, exist_ok=True)

        try:
            img = Image.open(BytesIO(image_bytes))
            buf = BytesIO()
            img.save(buf, format="WEBP", quality=85)
            disk_bytes = buf.getvalue()
            ext = "webp"
        except Exception:
            disk_bytes = image_bytes
            ext = "png"

        filepath = f"{media_dir}/{task_id}.{ext}"
        with open(filepath, "wb") as f:
            f.write(disk_bytes)

        disk_url = f"https://stoneai.ru/media/images/{task_id}.{ext}"

        # Update task + record usage + save generation
        async with async_session() as db:
            result = await db.execute(select(ImageTask).where(ImageTask.id == task_id))
            task = result.scalar_one_or_none()
            if task:
                task.status = "completed"
                task.image_url = disk_url
                task.completed_at = datetime.utcnow()

            # Record usage
            from app.services.limiter import record_usage
            await record_usage(db, tg_id, model_id, cost_usd=0)

            # Increment daily usage
            from app.services.daily_limits import increment_usage
            user_result = await db.execute(select(User).where(User.telegram_id == tg_id))
            user = user_result.scalar_one_or_none()
            if not user:
                user_result = await db.execute(select(User).where(User.id == tg_id))
                user = user_result.scalar_one_or_none()
            sub_tier = (user.subscription_tier or "free") if user else "free"
            await increment_usage(db, tg_id, model_id, sub_tier)

            # Save generation record
            gen = Generation(
                user_tg_id=tg_id, type="image", model=model_id,
                prompt=prompt[:2000], result_url=disk_url,
            )
            db.add(gen)
            await db.commit()

            # Achievement
            from app.routers.achievements import check_and_update
            asyncio.create_task(check_and_update(tg_id, "images", 1))

        logger.info(f"Image generated: task={task_id}, url={disk_url}")

    except Exception as e:
        logger.error(f"Image generation failed: task={task_id}, error={e}")
        await _update_task(task_id, "failed", error=str(e)[:400])


async def _update_task(task_id: int, status: str, error: str | None = None, image_url: str | None = None):
    """Update task status in DB."""
    try:
        async with async_session() as db:
            result = await db.execute(select(ImageTask).where(ImageTask.id == task_id))
            task = result.scalar_one_or_none()
            if task:
                task.status = status
                if error:
                    task.error = error
                if image_url:
                    task.image_url = image_url
                if status in ("completed", "failed"):
                    task.completed_at = datetime.utcnow()
                await db.commit()
    except Exception as e:
        logger.error(f"Failed to update task {task_id}: {e}")


async def _gen_openrouter(settings, model_id: str, prompt: str) -> bytes | None:
    """Generate via OpenRouter."""
    import httpx
    import re
    from app.services.ai_router import get_openrouter_model

    openrouter_model = get_openrouter_model(model_id)
    prompt_text = f"Generate an image based on this description. You MUST output ONLY the generated image, absolutely no text or commentary. Description: {prompt}"

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
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
            raise Exception(f"OpenRouter error {resp.status_code}: {resp.text[:200]}")

        data = resp.json()
        message = (data.get("choices") or [{}])[0].get("message", {})
        raw_content = message.get("content")

        # Extract image bytes from various response formats

        # Check message.images[] (OpenRouter Gemini format)
        for img in message.get("images", []):
            if isinstance(img, dict):
                url = img.get("image_url", {}).get("url", "") if isinstance(img.get("image_url"), dict) else ""
                if url and url.startswith("data:image"):
                    b64 = url.split(",", 1)[1]
                    return base64.b64decode(b64)

        # Check multimodal parts
        if isinstance(raw_content, list):
            for item in raw_content:
                if isinstance(item, dict) and item.get("type") == "image_url":
                    url = item.get("image_url", {}).get("url", "")
                    if url.startswith("data:"):
                        b64 = url.split(",", 1)[1]
                        return base64.b64decode(b64)
                    elif url.startswith("http"):
                        img_resp = await client.get(url, timeout=30.0)
                        if img_resp.status_code == 200:
                            return img_resp.content

        # Check inline_data in parts
        for part in message.get("parts", []):
            if isinstance(part, dict) and "inline_data" in part:
                b64 = part["inline_data"].get("data", "")
                if b64:
                    return base64.b64decode(b64)

        # Check content for data URI or markdown image
        content = raw_content if isinstance(raw_content, str) else ""
        if content:
            data_match = re.search(r'data:image/[^;]+;base64,([A-Za-z0-9+/=]+)', content)
            if data_match:
                return base64.b64decode(data_match.group(1))
            md_match = re.search(r'!\[.*?\]\((https?://[^\s)]+)\)', content)
            if md_match:
                img_resp = await client.get(md_match.group(1), timeout=30.0)
                if img_resp.status_code == 200:
                    return img_resp.content

    return None


async def _gen_kolors(settings, model_id: str, prompt: str) -> bytes | None:
    """Generate via Kling KOLORS API."""
    import httpx
    from app.services.kling_client import create_kling_image, check_kling_image_status

    kolors_model = "kolors-v3" if model_id == "kolors-v3" else "kolors-v2"
    result = await create_kling_image(settings.kling_access_key, settings.kling_secret_key, prompt, model=kolors_model)
    if "error" in result:
        raise Exception(f"KOLORS: {result['error']}")

    task_id = result["task_id"]
    for _ in range(30):
        await asyncio.sleep(2)
        status = await check_kling_image_status(settings.kling_access_key, settings.kling_secret_key, task_id)
        if status.get("status") == "COMPLETED" and status.get("images"):
            async with httpx.AsyncClient(timeout=30.0) as client:
                img_resp = await client.get(status["images"][0])
                if img_resp.status_code == 200:
                    return img_resp.content
            break
        if status.get("status") == "FAILED":
            raise Exception(f"KOLORS failed: {status.get('error')}")

    return None


async def _gen_openai(settings, prompt: str) -> bytes | None:
    """Generate via OpenAI gpt-image-1."""
    import httpx

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            "https://api.openai.com/v1/images/generations",
            headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            json={"model": "gpt-image-1", "prompt": prompt, "n": 1, "size": "1024x1024", "quality": "high"},
        )
        if resp.status_code != 200:
            raise Exception(f"OpenAI error {resp.status_code}: {resp.text[:200]}")

        data = resp.json()
        image_data = data["data"][0]

        if "b64_json" in image_data:
            return base64.b64decode(image_data["b64_json"])
        elif image_data.get("url"):
            img_resp = await client.get(image_data["url"], timeout=30.0)
            if img_resp.status_code == 200:
                return img_resp.content

    return None
