"""BYOK (Bring Your Own Key) — user connects their own OpenRouter API key.

Routes:
  GET  /api/byok/status   — get current BYOK status (key masked)
  POST /api/byok/key      — save/update key
  DELETE /api/byok/key    — remove key (revert to platform key)
"""

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.limiter import get_or_create_user

router = APIRouter(prefix="/api/byok", tags=["byok"])

OPENROUTER_URL = "https://openrouter.ai/api/v1/models"


def mask_key(key: str) -> str:
    """Show first 8 and last 4 chars: sk-or-v1-abcd...xyz"""
    if len(key) <= 12:
        return "***"
    return key[:8] + "..." + key[-4:]


async def validate_openrouter_key(key: str) -> bool:
    """Check key is valid by hitting OpenRouter /models endpoint."""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                OPENROUTER_URL,
                headers={"Authorization": f"Bearer {key}"},
            )
            return resp.status_code == 200
    except Exception:
        return False


class SetKeyRequest(BaseModel):
    key: str  # OpenRouter API key (sk-or-v1-...)


@router.get("/status")
async def get_byok_status(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get current BYOK status."""
    user = await get_or_create_user(db, tg_user)
    result = await db.execute(select(User).where(User.telegram_id == user.telegram_id))
    db_user = result.scalar_one_or_none()

    return {
        "enabled": bool(db_user and db_user.byok_enabled and db_user.byok_openrouter_key),
        "key_masked": mask_key(db_user.byok_openrouter_key) if (db_user and db_user.byok_openrouter_key) else None,
    }


@router.post("/key")
async def set_byok_key(
    req: SetKeyRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save and validate OpenRouter API key."""
    key = req.key.strip()

    if not key.startswith("sk-or-"):
        raise HTTPException(
            status_code=400,
            detail="Неверный ключ. Должен начинаться с sk-or- (OpenRouter API key)",
        )

    # Validate key is working
    is_valid = await validate_openrouter_key(key)
    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Ключ не прошёл проверку. Убедись что ключ активен на openrouter.ai",
        )

    user = await get_or_create_user(db, tg_user)
    result = await db.execute(select(User).where(User.telegram_id == user.telegram_id))
    db_user = result.scalar_one_or_none()

    if db_user:
        db_user.byok_openrouter_key = key
        db_user.byok_enabled = True
        await db.commit()

    return {
        "ok": True,
        "message": "API ключ подключён успешно ✅",
        "key_masked": mask_key(key),
    }


@router.delete("/key")
async def delete_byok_key(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove BYOK key — revert to platform key."""
    user = await get_or_create_user(db, tg_user)
    result = await db.execute(select(User).where(User.telegram_id == user.telegram_id))
    db_user = result.scalar_one_or_none()

    if db_user:
        db_user.byok_openrouter_key = None
        db_user.byok_enabled = False
        await db.commit()

    return {"ok": True, "message": "API ключ удалён. Используется ключ платформы."}
