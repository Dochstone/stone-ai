"""Audio endpoints — TTS (text-to-speech) and STT (speech-to-text)."""

import asyncio
import base64
import logging
import math

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.audio_router import (
    text_to_speech,
    speech_to_text,
    TTS_VOICES,
    STT_PRICE_PER_MINUTE,
)
from app.services.token_billing import calculate_cost, deduct_balance
from app.services.limiter import record_usage
from app.routers.achievements import check_and_update

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/audio", tags=["audio"])


class TTSRequest(BaseModel):
    text: str
    voice: str = "nova"


@router.get("/voices")
async def list_voices():
    """List available TTS voices."""
    return {"voices": TTS_VOICES}


@router.post("/tts")
async def tts_generate(
    req: TTSRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate speech from text. Returns base64 audio.
    Billing: per-token via OpenRouter (gpt-4o-mini-tts).
    """
    tg_id = tg_user["id"]
    db_id = tg_user.get("db_id")

    if not req.text or len(req.text) > 4096:
        raise HTTPException(400, "Текст должен быть от 1 до 4096 символов")

    # Find user
    if db_id:
        result = await db.execute(select(User).where(User.id == db_id))
    else:
        result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "Пользователь не найден")

    # Everyone pays from balance
    balance = float(user.balance_usd or 0)

    if balance < 0.01:
        raise HTTPException(402, {
            "error": "insufficient_balance",
            "message": "Недостаточно средств для озвучки. Пополните баланс.",
            "upgrade_url": "/topup",
        })

    # Generate
    tts_result = await text_to_speech(req.text, req.voice)

    if "error" in tts_result:
        raise HTTPException(502, tts_result["error"])

    # Bill per-token
    tokens_in = tts_result.get("tokens_in", 0)
    tokens_out = tts_result.get("tokens_out", 0)

    # Use gpt-4o-mini pricing as proxy (audio mini is similar)
    cost = calculate_cost("gpt-4o-mini", tokens_in, tokens_out)
    if cost > 0:
        await deduct_balance(db, tg_id, cost)

    from app.services.provider_costs import calculate_chat_provider_cost
    provider_cost = calculate_chat_provider_cost("gpt-4o-mini", tokens_in, tokens_out)
    await record_usage(db, tg_id, "gpt-audio-mini", tokens_in=tokens_in, tokens_out=tokens_out, cost_usd=cost, provider_cost_usd=provider_cost)
    await db.commit()

    # Achievement: audio (TTS) used
    asyncio.create_task(check_and_update(tg_id, "audio", 1))

    return {
        "audio_b64": tts_result["audio_b64"],
        "content_type": tts_result["content_type"],
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "cost_usd": cost,
    }


@router.post("/stt")
async def stt_transcribe(
    file: UploadFile = File(...),
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Transcribe audio to text via Whisper.
    Billing: $0.02/min (Stone AI price).
    """
    tg_id = tg_user["id"]

    if not file.content_type or not file.content_type.startswith("audio/"):
        raise HTTPException(400, "Нужен аудиофайл (audio/*)")

    # Check size via Content-Length header first (if available)
    if file.size and file.size > 25 * 1024 * 1024:
        raise HTTPException(400, "Файл слишком большой (макс 25MB)")

    audio_bytes = await file.read()
    if len(audio_bytes) > 25 * 1024 * 1024:
        raise HTTPException(400, "Файл слишком большой (макс 25MB)")

    # Transcribe
    stt_result = await speech_to_text(audio_bytes, file.filename or "audio.webm")

    if "error" in stt_result:
        raise HTTPException(502, stt_result["error"])

    # Bill per minute
    duration_min = stt_result.get("duration_seconds", 0) / 60.0
    cost = round(max(duration_min, 0.1) * STT_PRICE_PER_MINUTE, 6)  # min 0.1 min charge

    if cost > 0:
        await deduct_balance(db, tg_id, cost)

    from app.services.provider_costs import calculate_audio_provider_cost
    provider = stt_result.get("provider", "groq")
    provider_cost = calculate_audio_provider_cost(stt_result.get("duration_seconds", 0), provider)
    model_id = "whisper-groq" if provider == "groq" else "whisper-openai"
    await record_usage(db, tg_id, model_id, tokens_in=0, tokens_out=0, cost_usd=cost, provider_cost_usd=provider_cost)
    await db.commit()

    return {
        "text": stt_result["text"],
        "duration_seconds": stt_result.get("duration_seconds", 0),
        "cost_usd": cost,
    }
