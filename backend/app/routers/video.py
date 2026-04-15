"""Video generation endpoints with monthly video points accounting."""

import asyncio
import json
import logging
import uuid
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.video_task import VideoTask
from app.routers.achievements import check_and_update
from app.services.video_router import (
    check_video_status,
    get_video_model,
    get_video_models_list,
    get_video_provider,
    submit_video_generation,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/video", tags=["video"])


def _get_video_provider_cost(model_id: str) -> float:
    from app.services.provider_costs import calculate_video_provider_cost

    return calculate_video_provider_cost(model_id)


async def _check_provider_status(task: VideoTask) -> dict:
    settings = get_settings()
    request_id = task.fal_request_id or ""
    if request_id.startswith("kling:"):
        from app.services.kling_client import check_kling_status

        kling_task_id = request_id.split(":", 1)[1]
        return await check_kling_status(
            settings.kling_access_key,
            settings.kling_secret_key,
            kling_task_id,
            is_image2video=bool(task.source_image_url),
        )

    if request_id.startswith("novita:"):
        from app.services.novita_client import check_novita_status

        novita_task_id = request_id.split(":", 1)[1]
        return await check_novita_status(settings.novita_api_key, novita_task_id)

    if request_id.startswith("vertex:"):
        from app.services.vertex_client import check_vertex_status

        vertex_operation = request_id.split(":", 1)[1]
        return await check_vertex_status(settings.vertex_api_key, vertex_operation)

    return await check_video_status(task.model_id, request_id)


def _resolve_generate_options(req: "GenerateRequest") -> dict[str, str | int]:
    mode = "i2v" if req.source_image_url else "t2v"
    if req.options:
        mode = (req.options.mode or mode).strip().lower()
        return {
            "duration": int(req.options.duration or 5),
            "resolution": (req.options.resolution or "720P").strip().upper(),
            "mode": "i2v" if req.source_image_url else mode,
            "quality": (req.options.quality or "standard").strip().lower(),
        }
    return {
        "duration": 5,
        "resolution": "720P",
        "mode": mode,
        "quality": "standard",
    }


class GenerateOptions(BaseModel):
    duration: int = 5
    resolution: str = "720P"
    mode: str = "t2v"
    quality: str = "standard"


class GenerateRequest(BaseModel):
    model_id: str
    prompt: str
    source_image_url: str | None = None
    options: GenerateOptions | None = None


@router.get("/models")
async def list_video_models():
    """List available video generation models with backend-driven variants."""
    return {"models": get_video_models_list()}


@router.post("/generate")
async def generate_video(
    req: GenerateRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start async video generation and charge video points after accepted submit."""
    from app.services.daily_limits import (
        apply_video_points_charge,
        check_and_expire_subscription,
        check_video_points,
        increment_usage,
    )
    from app.services.provider_costs import get_default_video_options
    from app.services.safety import check_blocked, check_banned, log_violation

    tg_id = tg_user["id"]
    if await check_banned(tg_id):
        raise HTTPException(403, "Аккаунт заблокирован")

    blocked = check_blocked(req.prompt)
    if blocked:
        asyncio.create_task(log_violation(tg_id, "video", req.prompt, blocked))
        raise HTTPException(400, blocked)

    db_id = tg_user.get("db_id")
    model = get_video_model(req.model_id)
    if not model:
        raise HTTPException(400, "Неизвестная видео-модель")

    if db_id:
        result = await db.execute(select(User).where(User.id == db_id).with_for_update())
    else:
        result = await db.execute(select(User).where(User.telegram_id == tg_id).with_for_update())
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Пользователь не найден")

    tier = user.subscription_tier or "free"
    if tier != "free":
        tier = await check_and_expire_subscription(db, user)
    user.subscription_tier = tier

    resolved_options = _resolve_generate_options(req)
    if req.options is None:
        defaults = get_default_video_options(req.model_id, mode=resolved_options["mode"])
        resolved_options = {
            "duration": int(defaults["duration"]),
            "resolution": str(defaults["resolution"]),
            "mode": "i2v" if req.source_image_url else str(defaults["mode"]),
            "quality": str(defaults["quality"]),
        }

    points_check = await check_video_points(db, user, req.model_id, resolved_options)
    if not points_check.get("allowed"):
        reason = str(points_check.get("reason", "")).lower()
        raise HTTPException(429 if "points" in reason else 403, points_check)

    settings = get_settings()
    provider = get_video_provider(req.model_id)
    provider_request_id = ""

    if provider == "kling":
        if not settings.kling_access_key or not settings.kling_secret_key:
            raise HTTPException(502, "Kling API credentials are not configured")
        from app.services.kling_client import create_kling_video

        kling_model = "kling-v2-master"
        if "v1" in req.model_id:
            kling_model = "kling-v1-6"
        submit_result = await create_kling_video(
            settings.kling_access_key,
            settings.kling_secret_key,
            req.prompt,
            model=kling_model,
            source_image_url=req.source_image_url,
        )
        if "error" in submit_result:
            raise HTTPException(502, f"Ошибка генерации: {submit_result['error']}")
        provider_request_id = f"kling:{submit_result['task_id']}"
    elif provider == "novita":
        if not settings.novita_api_key:
            raise HTTPException(502, "Novita API key is not configured")
        from app.services.novita_client import create_novita_video

        submit_result = await create_novita_video(
            settings.novita_api_key,
            req.prompt,
            model=req.model_id,
            source_image_url=req.source_image_url,
            duration=int(resolved_options["duration"]),
            resolution=str(resolved_options["resolution"]),
            quality=str(resolved_options["quality"]),
            mode=str(resolved_options["mode"]),
        )
        if "error" in submit_result:
            raise HTTPException(502, f"Ошибка генерации: {submit_result['error']}")
        provider_request_id = f"novita:{submit_result['task_id']}"
        if submit_result.get("resolved_options"):
            resolved_options = {
                "duration": int(submit_result["resolved_options"]["duration"]),
                "resolution": str(submit_result["resolved_options"]["resolution"]),
                "mode": str(submit_result["resolved_options"]["mode"]),
                "quality": str(submit_result["resolved_options"]["quality"]),
            }
    elif provider == "vertex":
        if not settings.vertex_api_key:
            raise HTTPException(502, "Vertex API key is not configured")
        if req.source_image_url:
            raise HTTPException(502, "Vertex image-to-video is not configured")
        from app.services.vertex_client import create_vertex_video

        submit_result = await create_vertex_video(settings.vertex_api_key, req.prompt)
        if "error" in submit_result:
            raise HTTPException(502, f"Ошибка генерации: {submit_result['error']}")
        provider_request_id = f"vertex:{submit_result['task_id']}"
    elif provider == "fal":
        submit_result = await submit_video_generation(req.model_id, req.prompt, req.source_image_url)
        if "error" in submit_result:
            raise HTTPException(502, f"Ошибка генерации: {submit_result['error']}")
        provider_request_id = submit_result["request_id"]
    else:
        raise HTTPException(502, f"Unsupported video provider: {provider}")

    task_id = str(uuid.uuid4())[:12]
    task = VideoTask(
        task_id=task_id,
        user_tg_id=tg_id,
        model_id=req.model_id,
        prompt=req.prompt,
        source_image_url=req.source_image_url,
        status="processing",
        fal_request_id=provider_request_id,
        cost_usd=0.0,
        provider_cost_usd=float(points_check.get("cost_usd", _get_video_provider_cost(req.model_id)) or 0.0),
        options_json=json.dumps(resolved_options, ensure_ascii=True),
        points_charged=int(points_check.get("points_needed", 0) or 0),
    )
    db.add(task)

    apply_video_points_charge(user, points_check)
    await increment_usage(db, tg_id, req.model_id, tier)
    user.total_requests = (user.total_requests or 0) + 1
    await db.commit()

    points_left_after = max(
        0,
        int(points_check.get("points_left", 0) or 0) - int(points_check.get("points_needed", 0) or 0),
    )

    return {
        "task_id": task_id,
        "status": "processing",
        "model": model["name"],
        "cost_usd": float(points_check.get("cost_usd", 0) or 0),
        "points_charged": int(points_check.get("points_needed", 0) or 0),
        "video_points_left": points_left_after,
        "resolved_options": resolved_options,
        "balance_usd": float(user.balance_usd or 0),
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

    if task.status in ("completed", "failed"):
        video_url = task.video_url
        if video_url and "stoneai.ru/media/" not in video_url:
            video_url = f"https://stoneai.ru/api/video/stream/{task.task_id}"
        return {
            "task_id": task.task_id,
            "status": task.status,
            "video_url": video_url,
            "error": task.error_message,
        }

    if task.created_at and (datetime.utcnow() - task.created_at).total_seconds() > 480:
        task.status = "failed"
        task.error_message = "Таймаут генерации (8 мин). Попробуйте другую модель."
        await db.commit()
        return {
            "task_id": task.task_id,
            "status": "failed",
            "error": task.error_message,
        }

    if not task.fal_request_id:
        return {"task_id": task.task_id, "status": task.status}

    provider_status = await _check_provider_status(task)
    status = provider_status.get("status", "UNKNOWN")

    if status == "COMPLETED":
        provider_video_url = provider_status.get("video_url")
        task.status = "completed"
        task.video_url = provider_video_url
        task.completed_at = datetime.utcnow()
        await db.commit()

        # Log to `usage` so finance reports see real provider cost per tier
        try:
            from app.services.limiter import record_usage
            await record_usage(
                db, tg_id, task.model_id,
                cost_usd=float(task.cost_usd or 0),
                provider_cost_usd=float(task.provider_cost_usd or 0),
            )
            await db.commit()
        except Exception:
            pass

        asyncio.create_task(
            _save_video_to_disk(
                task.task_id,
                provider_video_url,
                tg_id,
                task.model_id,
                task.prompt,
                task.cost_usd,
            )
        )
        asyncio.create_task(check_and_update(tg_id, "videos", 1))

        stream_url = f"https://stoneai.ru/api/video/stream/{task.task_id}"
        return {
            "task_id": task.task_id,
            "status": "completed",
            "video_url": stream_url,
            "direct_url": stream_url,
        }

    if status == "FAILED":
        task.status = "failed"
        task.error_message = provider_status.get("error", "Generation failed")
        await db.commit()
        return {
            "task_id": task.task_id,
            "status": "failed",
            "error": task.error_message,
        }

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
                "provider_cost_usd": t.provider_cost_usd,
                "points_charged": t.points_charged,
                "options": json.loads(t.options_json) if t.options_json else None,
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
    """Proxy video stream - bypasses CORS restrictions on provider URLs."""
    from app.middleware.web_auth import decode_jwt

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

    video_url = task.video_url
    async with httpx.AsyncClient(timeout=10.0) as check_client:
        try:
            head = await check_client.head(video_url)
            if head.status_code in (403, 404, 410):
                logger.info(f"Video URL expired for {task_id}, re-fetching from provider")
                fresh = await _check_provider_status(task)
                if fresh.get("video_url"):
                    video_url = fresh["video_url"]
                    task.video_url = video_url
                    await db.commit()
                    logger.info(f"Refreshed video URL for {task_id}")
                else:
                    raise HTTPException(410, "Видео больше недоступно. Сгенерируйте заново.")
        except httpx.TimeoutException:
            pass
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Video URL check failed: {e}")

    async def proxy_stream():
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("GET", video_url) as resp:
                if resp.status_code != 200:
                    return
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


_thumb_cache: dict[str, bytes] = {}


@router.get("/thumb/{task_id}")
async def video_thumbnail(
    task_id: str,
    token: str = "",
    db: AsyncSession = Depends(get_db),
):
    """Extract first frame from video as JPEG thumbnail."""
    from fastapi.responses import Response
    from app.middleware.web_auth import decode_jwt

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

    if task_id in _thumb_cache:
        return Response(
            content=_thumb_cache[task_id],
            media_type="image/jpeg",
            headers={"Cache-Control": "public, max-age=86400"},
        )

    tg_id = user.telegram_id or user.id
    result = await db.execute(
        select(VideoTask).where(VideoTask.task_id == task_id, VideoTask.user_tg_id == tg_id)
    )
    task = result.scalar_one_or_none()
    if not task or not task.video_url:
        raise HTTPException(404, "Video not found")

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(task.video_url, headers={"Range": "bytes=0-524287"})
            video_bytes = resp.content

        import imageio.v3 as iio
        from io import BytesIO
        from PIL import Image

        frames = iio.imread(BytesIO(video_bytes), plugin="pyav", format_hint=".mp4")
        if len(frames) > 0:
            frame = frames[0] if hasattr(frames, "__len__") else frames
            img = Image.fromarray(frame)
            if img.width > 480:
                ratio = 480 / img.width
                img = img.resize((480, int(img.height * ratio)), Image.LANCZOS)
            buf = BytesIO()
            img.save(buf, format="JPEG", quality=80)
            thumb_bytes = buf.getvalue()

            _thumb_cache[task_id] = thumb_bytes
            if len(_thumb_cache) > 200:
                oldest = list(_thumb_cache.keys())[:100]
                for key in oldest:
                    _thumb_cache.pop(key, None)

            return Response(
                content=thumb_bytes,
                media_type="image/jpeg",
                headers={"Cache-Control": "public, max-age=86400"},
            )

    except Exception as e:
        logger.warning(f"Thumbnail generation failed: {e}")

    raise HTTPException(404, "Could not generate thumbnail")


async def _save_video_to_disk(
    task_id: str,
    video_url: str | None,
    tg_id: int,
    model_id: str,
    prompt: str | None,
    cost_usd: float | None,
):
    """Background: download video, save to /media/videos/, update DB."""
    if not video_url:
        return
    try:
        import os

        media_dir = "/var/www/stone-ai/media/videos"
        os.makedirs(media_dir, exist_ok=True)
        local_path = f"{media_dir}/{task_id}.mp4"

        async with httpx.AsyncClient(timeout=120.0) as dl:
            resp = await dl.get(video_url)
            if resp.status_code == 200 and len(resp.content) > 1000:
                with open(local_path, "wb") as f:
                    f.write(resp.content)
                local_url = f"https://stoneai.ru/media/videos/{task_id}.mp4"

                from app.database import async_session

                async with async_session() as db:
                    task_result = await db.execute(select(VideoTask).where(VideoTask.task_id == task_id))
                    task = task_result.scalar_one_or_none()
                    if task:
                        task.video_url = local_url
                        await db.commit()

                from app.models.generation import Generation

                async with async_session() as db:
                    provider_cost = 0.0
                    task_result = await db.execute(select(VideoTask).where(VideoTask.task_id == task_id))
                    task = task_result.scalar_one_or_none()
                    if task:
                        provider_cost = float(task.provider_cost_usd or 0)
                    gen = Generation(
                        user_tg_id=tg_id,
                        type="video",
                        model=model_id,
                        prompt=prompt or "",
                        result_url=local_url,
                        cost=float(cost_usd or 0),
                        provider_cost=provider_cost,
                    )
                    db.add(gen)
                    await db.commit()

                logger.info(f"Video saved: {local_path} ({len(resp.content)} bytes)")
            else:
                logger.warning(
                    f"Video download failed: status={resp.status_code} size={len(resp.content)}"
                )
    except Exception as e:
        logger.warning(f"_save_video_to_disk error: {e}")
