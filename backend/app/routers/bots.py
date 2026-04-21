"""Custom AI Bots — create, manage, and chat with custom bots."""

import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.middleware.rate_limit import bot_create_limiter
from app.models.custom_bot import CustomBot

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/bots", tags=["bots"])

ALLOWED_EMOJI = {"🤖", "💬", "🧠", "📚", "✍️", "🎯", "🔬", "💡", "🎓", "🛠️", "📊", "🌐", "🎨", "🎵", "📝", "🔍", "💼", "🏥", "🎮", "🍳"}
ALLOWED_MODELS = {
    "gpt-4o-mini", "claude-haiku-4.5", "gemini-2.0-flash",
    "deepseek-v3", "llama-4-maverick", "mistral-large-25",
}


class CreateBotRequest(BaseModel):
    name: str = Field(max_length=100)
    description: str = Field(default="", max_length=500)
    system_prompt: str = Field(max_length=5000)
    model_id: str = "gpt-4o-mini"
    avatar_emoji: str = Field(default="🤖", max_length=10)
    is_public: bool = False


class UpdateBotRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    system_prompt: str | None = None
    model_id: str | None = None
    avatar_emoji: str | None = None
    is_public: bool | None = None


@router.get("")
async def list_bots(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's custom bots."""
    result = await db.execute(
        select(CustomBot)
        .where(CustomBot.user_tg_id == tg_user["id"])
        .order_by(CustomBot.updated_at.desc())
    )
    bots = result.scalars().all()
    return {
        "bots": [
            {
                "id": b.id,
                "name": b.name,
                "description": b.description,
                "system_prompt": b.system_prompt,
                "model_id": b.model_id,
                "avatar_emoji": b.avatar_emoji,
                "is_public": b.is_public,
                "usage_count": b.usage_count,
                "created_at": b.created_at.isoformat() if b.created_at else None,
            }
            for b in bots
        ]
    }


@router.get("/public")
async def list_public_bots(
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """List public bots (marketplace)."""
    result = await db.execute(
        select(CustomBot)
        .where(CustomBot.is_public == True)
        .order_by(CustomBot.usage_count.desc())
        .limit(limit)
        .offset(offset)
    )
    bots = result.scalars().all()
    total = await db.scalar(
        select(func.count()).select_from(CustomBot).where(CustomBot.is_public == True)
    )
    return {
        "bots": [
            {
                "id": b.id,
                "name": b.name,
                "description": b.description,
                "model_id": b.model_id,
                "avatar_emoji": b.avatar_emoji,
                "usage_count": b.usage_count,
                "author_id": b.user_tg_id,
            }
            for b in bots
        ],
        "total": total,
    }


@router.get("/{bot_id}")
async def get_bot(
    bot_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get bot details (own or public)."""
    result = await db.execute(select(CustomBot).where(CustomBot.id == bot_id))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(404, "Бот не найден")
    if bot.user_tg_id != tg_user["id"] and not bot.is_public:
        raise HTTPException(403, "Нет доступа")
    is_owner = bot.user_tg_id == tg_user["id"]
    return {
        "id": bot.id,
        "name": bot.name,
        "description": bot.description,
        "system_prompt": bot.system_prompt if is_owner else bot.system_prompt[:100] + "...",
        "model_id": bot.model_id,
        "avatar_emoji": bot.avatar_emoji,
        "is_public": bot.is_public,
        "usage_count": bot.usage_count,
        "is_owner": bot.user_tg_id == tg_user["id"],
    }


@router.post("")
async def create_bot(
    body: CreateBotRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new custom bot."""
    bot_create_limiter.check(str(tg_user["id"]))
    if body.avatar_emoji not in ALLOWED_EMOJI:
        body.avatar_emoji = "🤖"
    if body.model_id not in ALLOWED_MODELS:
        raise HTTPException(400, "Неизвестная модель")
    # Limit: max 20 bots per user
    count = await db.scalar(
        select(func.count()).select_from(CustomBot).where(CustomBot.user_tg_id == tg_user["id"])
    )
    if count >= 20:
        raise HTTPException(400, "Максимум 20 ботов")

    bot = CustomBot(
        user_tg_id=tg_user["id"],
        name=body.name,
        description=body.description,
        system_prompt=body.system_prompt,
        model_id=body.model_id,
        avatar_emoji=body.avatar_emoji,
        is_public=body.is_public,
    )
    db.add(bot)
    await db.flush()
    return {"id": bot.id, "name": bot.name}


@router.patch("/{bot_id}")
async def update_bot(
    bot_id: int,
    body: UpdateBotRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a custom bot."""
    if body.avatar_emoji is not None and body.avatar_emoji not in ALLOWED_EMOJI:
        body.avatar_emoji = "🤖"
    if body.model_id is not None and body.model_id not in ALLOWED_MODELS:
        raise HTTPException(400, "Неизвестная модель")
    result = await db.execute(
        select(CustomBot).where(
            CustomBot.id == bot_id,
            CustomBot.user_tg_id == tg_user["id"],
        )
    )
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(404, "Бот не найден")

    if body.name is not None:
        bot.name = body.name[:100]
    if body.description is not None:
        bot.description = body.description[:500]
    if body.system_prompt is not None:
        bot.system_prompt = body.system_prompt[:5000]
    if body.model_id is not None:
        bot.model_id = body.model_id
    if body.avatar_emoji is not None:
        bot.avatar_emoji = body.avatar_emoji[:10]
    if body.is_public is not None:
        bot.is_public = body.is_public

    await db.flush()
    return {"status": "ok"}


@router.delete("/{bot_id}")
async def delete_bot(
    bot_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a custom bot."""
    result = await db.execute(
        select(CustomBot).where(
            CustomBot.id == bot_id,
            CustomBot.user_tg_id == tg_user["id"],
        )
    )
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(404, "Бот не найден")
    await db.delete(bot)
    return {"status": "ok"}


@router.post("/{bot_id}/use")
async def use_bot(
    bot_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Increment usage counter and return bot config for chat."""
    result = await db.execute(select(CustomBot).where(CustomBot.id == bot_id))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(404, "Бот не найден")
    if bot.user_tg_id != tg_user["id"] and not bot.is_public:
        raise HTTPException(403, "Нет доступа")

    bot.usage_count += 1
    await db.flush()

    # Check if bot has knowledge base
    from app.models.knowledge_base import KnowledgeChunk
    has_kb = await db.scalar(
        select(func.count()).select_from(KnowledgeChunk).where(KnowledgeChunk.bot_id == bot_id)
    ) or 0

    return {
        "system_prompt": bot.system_prompt,
        "model_id": bot.model_id,
        "name": bot.name,
        "avatar_emoji": bot.avatar_emoji,
        "has_knowledge_base": has_kb > 0,
    }


@router.get("/widget/{bot_id}")
async def get_widget_config(
    bot_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — get bot config for embeddable widget. No auth needed."""
    result = await db.execute(select(CustomBot).where(CustomBot.id == bot_id, CustomBot.is_public == True))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(404, "Бот не найден или не публичный")

    return {
        "id": bot.id,
        "name": bot.name,
        "description": bot.description,
        "system_prompt": bot.system_prompt,
        "avatar_emoji": bot.avatar_emoji,
        "model_id": bot.model_id,
    }
