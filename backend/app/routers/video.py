"""Video generation endpoints — async generation via fal.ai."""

import uuid
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.video_task import VideoTask
from app.services.video_router import (
    get_video_model,
    get_video_price,
    get_video_models_list,
    submit_video_generation,
    check_video_status,
)
from app.services.token_billing import deduct_balance

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/video", tags=["video"])


class GenerateRequest(BaseModel):
    model_id: str
    prompt: str
    source_image_url: str | None = None


@router.get("/models")
async def list_video_models():
    """List available video generation models with pricing."""
    return {"models": get_video_models_list()}


@router.post("/generate")
async def generate_video(
    req: GenerateRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Start async video generation.

    Charges balance BEFORE generation. Returns task_id for polling.
    On failure, balance is refunded.
    """
    tg_id = tg_user["id"]
    db_id = tg_user.get("db_id")

    # Validate model
    model = get_video_model(req.model_id)
    if not model:
        raise HTTPException(400, "Неизвестная видео-модель")

    price = get_video_price(req.model_id)

    # Find user
    if db_id:
        result = await db.execute(select(User).where(User.id == db_id).with_for_update())
    else:
        result = await db.execute(select(User).where(User.telegram_id == tg_id).with_for_update())
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Пользователь не найден")

    # Check access: subscription OR balance
    tier = user.subscription_tier or "free"
    has_subscription = tier in ("mini", "max", "max-pro")
    balance = float(user.balance_usd or 0)

    if not has_subscription and balance < price:
        raise HTTPException(402, {
            "error": "need_subscription",
            "message": f"Генерация видео доступна по подписке от 390₽/мес",
            "upgrade_url": "/pricing",
        })

    # Deduct from balance only if no subscription
    new_balance = balance
    if not has_subscription and balance >= price:
        user.balance_usd = round(balance - price, 6)
        new_balance = float(user.balance_usd)

    # Create task
    task_id = str(uuid.uuid4())[:12]
    task = VideoTask(
        task_id=task_id,
        user_tg_id=tg_id,
        model_id=req.model_id,
        prompt=req.prompt,
        source_image_url=req.source_image_url,
        status="pending",
        cost_usd=price,
    )
    db.add(task)
    await db.flush()

    # Submit to fal.ai
    fal_result = await submit_video_generation(
        req.model_id, req.prompt, req.source_image_url
    )

    if "error" in fal_result:
        # Refund on failure
        user.balance_usd = round(new_balance + price, 6)
        task.status = "failed"
        task.error_message = fal_result["error"]
        await db.commit()
        raise HTTPException(502, f"Ошибка генерации: {fal_result['error']}")

    # Update task with fal request ID
    task.fal_request_id = fal_result["request_id"]
    task.status = "processing"
    await db.commit()

    return {
        "task_id": task_id,
        "status": "processing",
        "model": model["name"],
        "cost_usd": price,
        "balance_usd": new_balance,
        "estimated_seconds": 60,
    }


@router.get("/status/{task_id}")
async def video_status(
    task_id: str,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Poll video generation status. Returns video_url when completed."""
    tg_id = tg_user["id"]

    result = await db.execute(
        select(VideoTask).where(
            VideoTask.task_id == task_id,
            VideoTask.user_tg_id == tg_id,
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Задача не найдена")

    # If already completed/failed, return cached result
    if task.status in ("completed", "failed"):
        return {
            "task_id": task.task_id,
            "status": task.status,
            "video_url": task.video_url,
            "error": task.error_message,
        }

    # Check fal.ai status
    if not task.fal_request_id:
        return {"task_id": task.task_id, "status": task.status}

    fal_status = await check_video_status(task.model_id, task.fal_request_id)
    status = fal_status.get("status", "UNKNOWN")

    if status == "COMPLETED":
        task.status = "completed"
        task.video_url = fal_status.get("video_url")
        task.completed_at = datetime.utcnow()
        await db.commit()

        return {
            "task_id": task.task_id,
            "status": "completed",
            "video_url": task.video_url,
        }

    if status == "FAILED":
        # Refund
        user_result = await db.execute(
            select(User).where(User.telegram_id == tg_id).with_for_update()
        )
        user = user_result.scalar_one_or_none()
        if user:
            user.balance_usd = round(float(user.balance_usd or 0) + task.cost_usd, 6)

        task.status = "failed"
        task.error_message = fal_status.get("error", "Generation failed")
        await db.commit()

        return {
            "task_id": task.task_id,
            "status": "failed",
            "error": task.error_message,
        }

    # Still processing
    return {
        "task_id": task.task_id,
        "status": "processing",
    }


@router.get("/history")
async def video_history(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's video generation history."""
    tg_id = tg_user["id"]

    result = await db.execute(
        select(VideoTask)
        .where(VideoTask.user_tg_id == tg_id)
        .order_by(VideoTask.created_at.desc())
        .limit(50)
    )
    tasks = result.scalars().all()

    return {
        "videos": [
            {
                "task_id": t.task_id,
                "model_id": t.model_id,
                "prompt": t.prompt,
                "status": t.status,
                "video_url": t.video_url,
                "cost_usd": t.cost_usd,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tasks
        ]
    }


@router.get("/stream/{task_id}")
async def stream_video(
    task_id: str,
    token: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Proxy video stream — bypasses CORS restrictions on fal.ai URLs."""
    from app.middleware.web_auth import decode_jwt

    # Auth via query param (video src can't send headers)
    if not token:
        raise HTTPException(401, "Token required")
    try:
        payload = decode_jwt(token)
    except Exception:
        raise HTTPException(401, "Invalid token")

    user_id = payload.get("user_id")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "User not found")

    tg_id = user.telegram_id or user.id
    result = await db.execute(
        select(VideoTask).where(VideoTask.task_id == task_id, VideoTask.user_tg_id == tg_id)
    )
    task = result.scalar_one_or_none()

    if not task or not task.video_url:
        raise HTTPException(404, "Video not found")

    async def proxy_stream():
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("GET", task.video_url) as resp:
                async for chunk in resp.aiter_bytes(chunk_size=65536):
                    yield chunk

    return StreamingResponse(
        proxy_stream(),
        media_type="video/mp4",
        headers={
            "Content-Disposition": f'inline; filename="stone-ai-{task_id}.mp4"',
            "Cache-Control": "public, max-age=86400",
        },
    )
