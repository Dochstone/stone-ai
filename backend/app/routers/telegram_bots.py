"""Telegram bot linking — connect custom bots to Telegram via BotFather token."""

import logging
import os

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session
from app.middleware.auth import get_current_user
from app.models.custom_bot import CustomBot, TelegramBotLink

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/telegram-bots", tags=["telegram-bots"])

RAILWAY_URL = os.getenv("RAILWAY_PUBLIC_DOMAIN", "stone-ai-production.up.railway.app").replace("https://", "").replace("http://", "").rstrip("/")


class ConnectRequest(BaseModel):
    bot_id: int
    bot_token: str = Field(max_length=100)


@router.post("/connect")
async def connect_telegram(
    body: ConnectRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Connect a Telegram bot to a custom bot."""
    tg_id = tg_user["id"]

    # Verify bot ownership
    result = await db.execute(
        select(CustomBot).where(CustomBot.id == body.bot_id, CustomBot.user_tg_id == tg_id)
    )
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(404, "Бот не найден")

    # Verify token with Telegram API
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"https://api.telegram.org/bot{body.bot_token}/getMe")
            if resp.status_code != 200:
                raise HTTPException(400, "Невалидный токен. Проверьте токен от @BotFather")
            tg_bot_info = resp.json().get("result", {})
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(502, "Не удалось подключиться к Telegram API")

    # Check if token already used
    existing = await db.execute(
        select(TelegramBotLink).where(TelegramBotLink.bot_token == body.bot_token)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Этот токен уже подключён")

    # Set webhook
    webhook_url = f"https://{RAILWAY_URL}/api/telegram-bots/webhook/{body.bot_token}"
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"https://api.telegram.org/bot{body.bot_token}/setWebhook",
                json={"url": webhook_url},
            )
            if resp.status_code != 200:
                raise HTTPException(502, "Не удалось установить webhook")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(502, "Ошибка установки webhook")

    # Save link
    link = TelegramBotLink(
        bot_id=body.bot_id,
        user_tg_id=tg_id,
        bot_token=body.bot_token,
        bot_username=tg_bot_info.get("username"),
    )
    db.add(link)

    return {
        "ok": True,
        "username": tg_bot_info.get("username"),
        "first_name": tg_bot_info.get("first_name"),
    }


@router.delete("/disconnect/{bot_id}")
async def disconnect_telegram(
    bot_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Disconnect Telegram bot."""
    result = await db.execute(
        select(TelegramBotLink).where(
            TelegramBotLink.bot_id == bot_id,
            TelegramBotLink.user_tg_id == tg_user["id"],
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(404, "Подключение не найдено")

    # Remove webhook
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(f"https://api.telegram.org/bot{link.bot_token}/deleteWebhook")
    except Exception:
        pass

    await db.delete(link)
    return {"ok": True}


@router.post("/webhook/{token}")
async def telegram_webhook(token: str, request: Request):
    """Handle incoming Telegram messages for custom bots."""
    try:
        update = await request.json()
    except Exception:
        return {"ok": True}

    message = update.get("message")
    if not message or not message.get("text"):
        return {"ok": True}

    text = message["text"]
    chat_id = message["chat"]["id"]

    # Skip commands
    if text.startswith("/start"):
        async with httpx.AsyncClient(timeout=10) as client:
            # Find bot info
            async with async_session() as db:
                result = await db.execute(
                    select(TelegramBotLink).where(TelegramBotLink.bot_token == token)
                )
                link = result.scalar_one_or_none()
                if link:
                    bot_result = await db.execute(select(CustomBot).where(CustomBot.id == link.bot_id))
                    bot = bot_result.scalar_one_or_none()
                    welcome = f"Привет! Я {bot.name if bot else 'AI-бот'}. Чем могу помочь?" if bot else "Привет!"
                else:
                    welcome = "Привет!"

            await client.post(
                f"https://api.telegram.org/bot{token}/sendMessage",
                json={"chat_id": chat_id, "text": welcome},
            )
        return {"ok": True}

    if text.startswith("/"):
        return {"ok": True}

    # Find linked bot
    async with async_session() as db:
        result = await db.execute(
            select(TelegramBotLink).where(TelegramBotLink.bot_token == token, TelegramBotLink.is_active == True)
        )
        link = result.scalar_one_or_none()
        if not link:
            return {"ok": True}

        bot_result = await db.execute(select(CustomBot).where(CustomBot.id == link.bot_id))
        bot = bot_result.scalar_one_or_none()
        if not bot:
            return {"ok": True}

    # Generate response via OpenRouter
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_key:
        return {"ok": True}

    try:
        from app.services.ai_router import get_openrouter_model
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {openrouter_key}"},
                json={
                    "model": get_openrouter_model(bot.model_id),
                    "messages": [
                        {"role": "system", "content": bot.system_prompt or "You are a helpful assistant. Always respond in the same language as the user's message."},
                        {"role": "user", "content": text},
                    ],
                    "max_tokens": 1000,
                },
            )
            if resp.status_code == 200:
                ai_text = resp.json()["choices"][0]["message"]["content"]
                # Send reply
                await client.post(
                    f"https://api.telegram.org/bot{token}/sendMessage",
                    json={"chat_id": chat_id, "text": ai_text, "parse_mode": "Markdown"},
                )
    except Exception as e:
        logger.error(f"Telegram bot webhook error: {e}")

    return {"ok": True}
