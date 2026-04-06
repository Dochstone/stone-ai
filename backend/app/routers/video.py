"""Video generation endpoints — async generation via fal.ai."""

import asyncio
import uuid
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.database import get_db
from app.middleware.auth import get_current_user
from app.config import get_settings, USD_TO_RUB
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
from app.routers.achievements import check_and_update

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

    # Everyone pays from balance
    balance = float(user.balance_usd or 0)

    if balance < price:
        raise HTTPException(402, {
            "error": "insufficient_balance",
            "message": f"Недостаточно средств. Нужно ~{int(price * USD_TO_RUB)}₽",
            "upgrade_url": "/topup",
        })

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

    # Submit to Kling direct API or fal.ai
    is_kling = req.model_id.startswith("kling")
    settings = get_settings()

    if is_kling and settings.kling_access_key:
        from app.services.kling_client import create_kling_video
        kling_model = "kling-v2-master"
        if "v1" in req.model_id:
            kling_model = "kling-v1-6"
        kling_result = await create_kling_video(
            settings.kling_access_key, settings.kling_secret_key,
            req.prompt, model=kling_model,
            source_image_url=req.source_image_url,
        )
        if "error" in kling_result:
            user.balance_usd = round(new_balance + price, 6)
            task.status = "failed"
            task.error_message = kling_result["error"]
            await db.commit()
            raise HTTPException(502, f"Ошибка генерации: {kling_result['error']}")
        task.fal_request_id = f"kling:{kling_result['task_id']}"
        task.status = "processing"
        await db.commit()
    else:
        fal_result = await submit_video_generation(
            req.model_id, req.prompt, req.source_image_url
        )
        if "error" in fal_result:
            user.balance_usd = round(new_balance + price, 6)
            task.status = "failed"
            task.error_message = fal_result["error"]
            await db.commit()
            raise HTTPException(502, f"Ошибка генерации: {fal_result['error']}")
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
    request: Request,
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

    if not task.fal_request_id:
        return {"task_id": task.task_id, "status": task.status}

    # Check Kling direct API or fal.ai
    is_kling_direct = task.fal_request_id.startswith("kling:")
    if is_kling_direct:
        from app.services.kling_client import check_kling_status
        settings = get_settings()
        kling_task_id = task.fal_request_id.split(":", 1)[1]
        is_i2v = bool(task.source_image_url)
        fal_status = await check_kling_status(
            settings.kling_access_key, settings.kling_secret_key,
            kling_task_id, is_image2video=is_i2v,
        )
    else:
        fal_status = await check_video_status(task.model_id, task.fal_request_id)
    status = fal_status.get("status", "UNKNOWN")

    if status == "COMPLETED":
        task.status = "completed"
        task.video_url = fal_status.get("video_url")
        task.completed_at = datetime.utcnow()
        await db.commit()

        # Return proxy URL instead of direct fal.ai URL (CORS/expiry issues)
        from app.middleware.web_auth import extract_jwt_from_request
        jwt_token = extract_jwt_from_request(request) if request else None
        if jwt_token:
            proxy_url = f"https://stone-ai-production.up.railway.app/api/video/stream/{task.task_id}?token={jwt_token}"
        else:
            proxy_url = task.video_url

        # Generate thumbnail in background
        thumbnail_url = None
        if jwt_token:
            thumbnail_url = f"https://stone-ai-production.up.railway.app/api/video/thumb/{task.task_id}?token={jwt_token}"

        # Save to gallery (separate session to avoid breaking main tx)
        try:
            from app.models.generation import Generation
            from app.database import async_session
            async with async_session() as gen_db:
                gen = Generation(user_tg_id=tg_id, type="video", model=task.model_id, prompt=task.prompt or "", result_url=task.video_url, cost=float(task.cost or 0))
                gen_db.add(gen)
                await gen_db.commit()
        except Exception as e:
            logger.warning(f"Failed to save video generation: {e}")

        # Achievement: videos generated
        asyncio.create_task(check_and_update(tg_id, "videos", 1))

        return {
            "task_id": task.task_id,
            "status": "completed",
            "video_url": proxy_url,
            "direct_url": task.video_url,
            "thumbnail_url": thumbnail_url,
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

    user_id = int(payload.get("user_id") or payload.get("sub") or 0)
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


# In-memory thumbnail cache
_thumb_cache: dict[str, bytes] = {}


@router.get("/thumb/{task_id}")
async def video_thumbnail(
    task_id: str,
    token: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Extract first frame from video as JPEG thumbnail."""
    from app.middleware.web_auth import decode_jwt
    from fastapi.responses import Response

    if not token:
        raise HTTPException(401, "Token required")
    try:
        payload = decode_jwt(token)
    except Exception:
        raise HTTPException(401, "Invalid token")

    user_id = int(payload.get("user_id") or payload.get("sub") or 0)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(401, "User not found")

    # Check cache
    if task_id in _thumb_cache:
        return Response(content=_thumb_cache[task_id], media_type="image/jpeg",
                       headers={"Cache-Control": "public, max-age=86400"})

    tg_id = user.telegram_id or user.id
    result = await db.execute(
        select(VideoTask).where(VideoTask.task_id == task_id, VideoTask.user_tg_id == tg_id)
    )
    task = result.scalar_one_or_none()
    if not task or not task.video_url:
        raise HTTPException(404, "Video not found")

    try:
        # Download first ~500KB of video (enough for first frame)
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(task.video_url, headers={"Range": "bytes=0-524287"})
            video_bytes = resp.content

        # Extract first frame using imageio
        import imageio.v3 as iio
        from io import BytesIO
        from PIL import Image

        frames = iio.imread(BytesIO(video_bytes), plugin="pyav", format_hint=".mp4")
        if len(frames) > 0:
            frame = frames[0] if hasattr(frames, '__len__') else frames
            img = Image.fromarray(frame)
            # Resize to max 480px wide
            if img.width > 480:
                ratio = 480 / img.width
                img = img.resize((480, int(img.height * ratio)), Image.LANCZOS)
            buf = BytesIO()
            img.save(buf, format="JPEG", quality=80)
            thumb_bytes = buf.getvalue()

            # Cache it
            _thumb_cache[task_id] = thumb_bytes
            # Keep cache small
            if len(_thumb_cache) > 200:
                oldest = list(_thumb_cache.keys())[:100]
                for k in oldest:
                    _thumb_cache.pop(k, None)

            return Response(content=thumb_bytes, media_type="image/jpeg",
                           headers={"Cache-Control": "public, max-age=86400"})

    except Exception as e:
        logger.warning(f"Thumbnail generation failed: {e}")

    raise HTTPException(404, "Could not generate thumbnail")
