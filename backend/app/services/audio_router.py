"""Audio service — TTS via OpenRouter (GPT Audio Mini), STT via OpenAI Whisper."""

import base64
import io
import json
import logging
import tempfile

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENAI_STT_URL = "https://api.openai.com/v1/audio/transcriptions"

TTS_VOICES = ["alloy", "echo", "nova", "shimmer", "onyx", "fable", "ash", "coral", "sage"]

# Stone AI STT price: $0.02/min (OpenAI cost: $0.006/min, markup ~3.3x)
STT_PRICE_PER_MINUTE = 0.02


async def text_to_speech(
    text: str,
    voice: str = "alloy",
    openrouter_key: str | None = None,
) -> dict:
    """
    Generate speech from text via OpenRouter GPT Audio Mini.

    The model returns audio as base64 in the response.
    Returns: {"audio_b64": str, "content_type": "audio/mpeg", "tokens_in": int, "tokens_out": int}
    or {"error": str}
    """
    settings = get_settings()
    api_key = openrouter_key or settings.openrouter_api_key

    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": settings.webapp_url,
        "X-Title": "Stone AI",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "openai/gpt-4o-mini-tts",
        "messages": [{"role": "user", "content": text}],
        "modalities": ["audio"],
        "audio": {"voice": voice if voice in TTS_VOICES else "alloy", "format": "mp3"},
        "max_tokens": 8192,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(OPENROUTER_URL, headers=headers, json=payload)

            if resp.status_code != 200:
                error = resp.text[:500]
                logger.error(f"TTS error {resp.status_code}: {error}")
                return {"error": f"TTS error: {error[:200]}"}

            data = resp.json()
            choices = data.get("choices", [])
            if not choices:
                return {"error": "No audio in response"}

            message = choices[0].get("message", {})
            audio_data = message.get("audio", {})
            audio_b64 = audio_data.get("data")

            if not audio_b64:
                # Fallback: check if content has audio
                content = message.get("content", "")
                if content:
                    return {"error": "Model returned text instead of audio. Try a shorter text."}
                return {"error": "No audio data in response"}

            usage = data.get("usage", {})

            return {
                "audio_b64": audio_b64,
                "content_type": "audio/mpeg",
                "tokens_in": usage.get("prompt_tokens", 0),
                "tokens_out": usage.get("completion_tokens", 0),
            }

    except httpx.TimeoutException:
        return {"error": "TTS timeout — text may be too long"}
    except Exception as e:
        logger.error(f"TTS exception: {e}")
        return {"error": str(e)}


async def speech_to_text(audio_bytes: bytes, filename: str = "audio.webm") -> dict:
    """
    Transcribe audio via OpenAI Whisper API.

    Returns: {"text": str, "duration_seconds": float}
    or {"error": str}
    """
    settings = get_settings()

    if not settings.openai_api_key:
        return {"error": "OpenAI API key not configured for STT"}

    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            files = {"file": (filename, audio_bytes, "audio/webm")}
            data = {"model": "whisper-1"}  # auto-detect language

            resp = await client.post(
                OPENAI_STT_URL,
                headers=headers,
                files=files,
                data=data,
            )

            if resp.status_code != 200:
                error = resp.text[:500]
                logger.error(f"STT error {resp.status_code}: {error}")
                return {"error": f"STT error: {error[:200]}"}

            result = resp.json()
            text = result.get("text", "")
            duration = result.get("duration", 0)

            return {
                "text": text,
                "duration_seconds": duration,
            }

    except httpx.TimeoutException:
        return {"error": "STT timeout"}
    except Exception as e:
        logger.error(f"STT exception: {e}")
        return {"error": str(e)}
