"""3D generation endpoints — async generation via fal.ai (Tripo, TripoSR)."""

import asyncio
import uuid
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.models.threed_task import ThreeDTask
from app.services.threed_router import (
    get_threed_model,
    get_threed_price,
    get_threed_models_list,
    submit_threed_generation,
    check_threed_status,
)
from app.routers.achievements import check_and_update

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/3d", tags=["3d"])


class GenerateRequest(BaseModel):
    model_id: str
    prompt: str | None = None
    image_url: str | None = None


@router.get("/models")
async def list_threed_models():
    """List available 3D generation models with pricing."""
    return {"models": get_threed_models_list()}


@router.post("/generate")
async def generate_threed(
    req: GenerateRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Start async 3D generation. Charges balance BEFORE generation.
    Returns task_id for polling.
    """
    tg_id = tg_user["id"]
    db_id = tg_user.get("db_id")

    model = get_threed_model(req.model_id)
    if not model:
        raise HTTPException(400, "Неизвестная 3D-модель")

    if not req.prompt and not req.image_url:
        raise HTTPException(400, "Нужен текст или изображение")

    price = get_threed_price(req.model_id)

    # Find user
    if db_id:
        result = await db.execute(select(User).where(User.id == db_id).with_for_update())
    else:
        result = await db.execute(select(User).where(User.telegram_id == tg_id).with_for_update())
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Пользователь не найден")

    # Use daily limits system (same as chat)
    from app.services.daily_limits import check_daily_limit, increment_usage
    tier = user.subscription_tier or "free"
    balance = float(user.balance_usd or 0)

    # 3D uses image limits
    check = await check_daily_limit(db, tg_id, req.model_id, tier, balance)
    if not check.get("allowed"):
        raise HTTPException(
            429 if check.get("error") == "daily_limit_exceeded" else 403,
            check,
        )

    new_balance = balance

    task_id = str(uuid.uuid4())[:12]
    task = ThreeDTask(
        task_id=task_id,
        user_tg_id=tg_id,
        model_id=req.model_id,
        prompt=req.prompt,
        source_image_url=req.image_url,
        status="pending",
        cost_usd=price,
    )
    db.add(task)
    await db.flush()

    # Submit to fal.ai
    fal_result = await submit_threed_generation(
        req.model_id, req.prompt, req.image_url
    )

    if "error" in fal_result:
        task.status = "failed"
        task.error_message = fal_result["error"]
        await db.commit()
        # No increment_usage — user doesn't lose generation on submit error
        raise HTTPException(502, f"Ошибка генерации: {fal_result['error']}")

    # Increment usage ONLY after successful submit
    await increment_usage(db, tg_id, req.model_id, tier)

    # Sync result (e.g. TripoSR returns immediately)
    if fal_result.get("request_id") == "__sync__" and fal_result.get("model_url"):
        task.fal_request_id = "__sync__"
        task.status = "completed"
        task.model_url = fal_result["model_url"]
        task.completed_at = datetime.utcnow()
        await db.commit()
        asyncio.create_task(check_and_update(tg_id, "3d", 1))
        return {
            "task_id": task_id,
            "status": "completed",
            "model_url": fal_result["model_url"],
            "model": model["name"],
            "cost_usd": price,
            "balance_usd": new_balance,
        }

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
async def threed_status(
    task_id: str,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Poll 3D generation status. Returns model_url when completed."""
    tg_id = tg_user["id"]

    result = await db.execute(
        select(ThreeDTask).where(
            ThreeDTask.task_id == task_id,
            ThreeDTask.user_tg_id == tg_id,
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Задача не найдена")

    if task.status in ("completed", "failed"):
        return {
            "task_id": task.task_id,
            "status": task.status,
            "model_url": task.model_url,
            "error": task.error_message,
        }

    if not task.fal_request_id:
        return {"task_id": task.task_id, "status": task.status}

    fal_status = await check_threed_status(task.model_id, task.fal_request_id)
    status = fal_status.get("status", "UNKNOWN")

    if status == "COMPLETED":
        task.status = "completed"
        task.model_url = fal_status.get("model_url")
        task.completed_at = datetime.utcnow()
        # Save to gallery (separate session to avoid breaking main tx)
        try:
            from app.models.generation import Generation
            from app.database import async_session
            async with async_session() as gen_db:
                gen = Generation(user_tg_id=tg_id, type="3d", model=task.model_id, prompt=task.prompt or "", result_url=task.model_url, cost=float(task.cost or 0))
                gen_db.add(gen)
                await gen_db.commit()
        except Exception as e:
            logger.warning(f"Failed to save 3D generation: {e}")
        await db.commit()
        asyncio.create_task(check_and_update(tg_id, "3d", 1))
        return {
            "task_id": task.task_id,
            "status": "completed",
            "model_url": task.model_url,
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

    return {"task_id": task.task_id, "status": "processing"}


@router.get("/history")
async def threed_history(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's 3D generation history."""
    tg_id = tg_user["id"]

    result = await db.execute(
        select(ThreeDTask)
        .where(ThreeDTask.user_tg_id == tg_id)
        .order_by(ThreeDTask.created_at.desc())
        .limit(50)
    )
    tasks = result.scalars().all()

    return {
        "models": [
            {
                "task_id": t.task_id,
                "model_id": t.model_id,
                "prompt": t.prompt,
                "status": t.status,
                "model_url": t.model_url,
                "cost_usd": t.cost_usd,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in tasks
        ]
    }
