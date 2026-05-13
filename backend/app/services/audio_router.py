"""Audio service — TTS via OpenRouter (GPT Audio Mini), STT via Groq Whisper (OpenAI fallback)."""

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
GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_STT_MODEL = "whisper-large-v3-turbo"  # $0.04/hr ≈ $0.000667/min, 9× cheaper than OpenAI

TTS_VOICES = ["alloy", "echo", "nova", "shimmer", "onyx", "fable", "ash", "coral", "sage"]

# Stone AI STT price: $0.02/min (Groq cost: $0.000667/min, markup ~30x)
STT_PRICE_PER_MINUTE = 0.02


async def text_to_speech(
    text: str,
    voice: str = "nova",
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
        "audio": {"voice": voice if voice in TTS_VOICES else "nova", "format": "mp3"},
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


async def _call_stt(
    url: str,
    api_key: str,
    model: str,
    audio_bytes: bytes,
    filename: str,
    content_type: str,
) -> dict:
    """Single STT request — OpenAI-compatible endpoint."""
    headers = {"Authorization": f"Bearer {api_key}"}
    files = {"file": (filename, audio_bytes, content_type)}
    data = {"model": model, "response_format": "verbose_json"}

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, headers=headers, files=files, data=data)
        if resp.status_code != 200:
            return {"error": f"STT {resp.status_code}: {resp.text[:200]}"}
        result = resp.json()
        return {
            "text": result.get("text", ""),
            "duration_seconds": result.get("duration", 0),
        }


async def speech_to_text(audio_bytes: bytes, filename: str = "audio.webm") -> dict:
    """
    Transcribe audio. Primary: Groq Whisper-large-v3-turbo (~$0.000667/min).
    Fallback: OpenAI Whisper-1 (~$0.006/min) when Groq key is missing or fails.

    Returns: {"text": str, "duration_seconds": float, "provider": "groq"|"openai"}
    or {"error": str}
    """
    settings = get_settings()
    content_type = "audio/webm"
    if filename.lower().endswith(".mp3"):
        content_type = "audio/mpeg"
    elif filename.lower().endswith(".wav"):
        content_type = "audio/wav"
    elif filename.lower().endswith(".m4a"):
        content_type = "audio/mp4"

    try:
        if settings.groq_api_key:
            result = await _call_stt(
                GROQ_STT_URL, settings.groq_api_key, GROQ_STT_MODEL,
                audio_bytes, filename, content_type,
            )
            if "error" not in result:
                result["provider"] = "groq"
                return result
            logger.warning(f"Groq STT failed, falling back to OpenAI: {result['error']}")

        if not settings.openai_api_key:
            return {"error": "STT providers not configured (need GROQ_API_KEY or OPENAI_API_KEY)"}

        result = await _call_stt(
            OPENAI_STT_URL, settings.openai_api_key, "whisper-1",
            audio_bytes, filename, content_type,
        )
        if "error" not in result:
            result["provider"] = "openai"
        return result

    except httpx.TimeoutException:
        return {"error": "STT timeout"}
    except Exception as e:
        logger.error(f"STT exception: {e}")
        return {"error": str(e)}
