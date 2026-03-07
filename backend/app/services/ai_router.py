"""AI Router — OpenRouter integration with streaming SSE.

Routes requests to 11 AI models through a single OpenRouter API key.
Supports streaming responses via Server-Sent Events.
"""

import json
import httpx

from app.config import get_settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Our model ID → OpenRouter model ID
MODEL_MAP = {
    # ─── LITE (бесплатные) ───
    "gpt-4o-mini": "openai/gpt-4o-mini",
    "claude-haiku-4.5": "anthropic/claude-3-5-haiku-latest",
    "gemini-2.0-flash": "google/gemini-2.0-flash-001",
    "deepseek-r1": "deepseek/deepseek-r1",
    "llama-4-maverick": "meta-llama/llama-4-maverick",
    "mistral-large-25": "mistralai/mistral-large-latest",
    # ─── PREMIUM (подписка) ───
    "gpt-4.1": "openai/gpt-4.1",
    "claude-opus-4": "anthropic/claude-opus-4",
    "grok-3": "x-ai/grok-3",
    "gemini-2.5-pro": "google/gemini-2.5-pro-preview",
    "perplexity-sonar-pro": "perplexity/sonar-pro",
}

# Which tier each model belongs to
TIER_MAP = {
    "gpt-4o-mini": "lite",
    "claude-haiku-4.5": "lite",
    "gemini-2.0-flash": "lite",
    "deepseek-r1": "lite",
    "llama-4-maverick": "lite",
    "mistral-large-25": "lite",
    "gpt-4.1": "premium",
    "claude-opus-4": "premium",
    "grok-3": "premium",
    "gemini-2.5-pro": "premium",
    "perplexity-sonar-pro": "premium",
}

# Model metadata for /api/models endpoint
MODELS_INFO = [
    {"id": "gpt-4o-mini", "name": "GPT-4o mini", "company": "OpenAI", "tier": "lite", "icon": "🤖", "desc": "Быстрый и дешёвый"},
    {"id": "claude-haiku-4.5", "name": "Claude Haiku 4.5", "company": "Anthropic", "tier": "lite", "icon": "🧠", "desc": "Быстрый Claude"},
    {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash", "company": "Google", "tier": "lite", "icon": "💎", "desc": "Скоростной"},
    {"id": "deepseek-r1", "name": "DeepSeek R1", "company": "DeepSeek", "tier": "lite", "icon": "🌊", "desc": "Reasoning"},
    {"id": "llama-4-maverick", "name": "Llama 4", "company": "Meta", "tier": "lite", "icon": "🦙", "desc": "Open-source 400B"},
    {"id": "mistral-large-25", "name": "Mistral Large", "company": "Mistral AI", "tier": "lite", "icon": "🌀", "desc": "Европейский"},
    {"id": "gpt-4.1", "name": "GPT-4.1", "company": "OpenAI", "tier": "premium", "icon": "🤖", "desc": "Flagship 2025"},
    {"id": "claude-opus-4", "name": "Claude Opus 4", "company": "Anthropic", "tier": "premium", "icon": "🧠", "desc": "Лучший в коде"},
    {"id": "grok-3", "name": "Grok 3", "company": "xAI", "tier": "premium", "icon": "⚡", "desc": "Творческий"},
    {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro", "company": "Google", "tier": "premium", "icon": "🔮", "desc": "Мультимодальный"},
    {"id": "perplexity-sonar-pro", "name": "Perplexity Pro", "company": "Perplexity", "tier": "premium", "icon": "🔍", "desc": "Поиск в реальном времени"},
]

DEFAULT_MODEL = "gpt-4o-mini"
FALLBACK_MODEL = "gpt-4o-mini"


def get_openrouter_model(model_id: str) -> str:
    """Convert our model ID to OpenRouter model ID. Falls back to GPT-4o mini."""
    return MODEL_MAP.get(model_id, MODEL_MAP[FALLBACK_MODEL])


def get_model_tier(model_id: str) -> str:
    """Get tier for a model: 'lite' or 'premium'."""
    return TIER_MAP.get(model_id, "premium")


async def stream_chat_response(
    model_id: str,
    messages: list[dict],
    system_prompt: str | None = None,
):
    """
    Stream chat completion from OpenRouter.

    Yields SSE-formatted chunks: data: {"content": "..."}\n\n
    Final chunk: data: [DONE]\n\n

    Also yields usage info at the end: data: {"usage": {...}}\n\n
    """
    settings = get_settings()
    openrouter_model = get_openrouter_model(model_id)

    # Build messages array
    api_messages = []
    if system_prompt:
        api_messages.append({"role": "system", "content": system_prompt})
    api_messages.extend(messages)

    headers = {
        "Authorization": f"Bearer {settings.openrouter_api_key}",
        "HTTP-Referer": settings.webapp_url,
        "X-Title": "Stone AI",
        "Content-Type": "application/json",
    }

    payload = {
        "model": openrouter_model,
        "messages": api_messages,
        "stream": True,
        "max_tokens": 4096,
    }

    total_tokens_in = 0
    total_tokens_out = 0

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", OPENROUTER_URL, headers=headers, json=payload) as response:
                if response.status_code != 200:
                    error_body = await response.aread()
                    error_msg = error_body.decode("utf-8", errors="replace")
                    yield f'data: {json.dumps({"error": f"API error {response.status_code}: {error_msg}"})}\n\n'
                    return

                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue

                    data_str = line[6:]  # Remove "data: " prefix

                    if data_str.strip() == "[DONE]":
                        break

                    try:
                        chunk = json.loads(data_str)
                        # Extract content delta
                        choices = chunk.get("choices", [])
                        if choices:
                            delta = choices[0].get("delta", {})
                            content = delta.get("content")
                            if content:
                                yield f'data: {json.dumps({"content": content})}\n\n'

                        # Extract usage if present (usually in last chunk)
                        usage = chunk.get("usage")
                        if usage:
                            total_tokens_in = usage.get("prompt_tokens", 0)
                            total_tokens_out = usage.get("completion_tokens", 0)

                    except json.JSONDecodeError:
                        continue

        # Send usage data as final event
        yield f'data: {json.dumps({"usage": {"tokens_in": total_tokens_in, "tokens_out": total_tokens_out}})}\n\n'
        yield "data: [DONE]\n\n"

    except httpx.TimeoutException:
        yield f'data: {json.dumps({"error": "Модель не ответила — попробуйте ещё раз"})}\n\n'
    except Exception as e:
        yield f'data: {json.dumps({"error": f"Ошибка: {str(e)}"})}\n\n'


async def non_stream_chat(model_id: str, messages: list[dict], system_prompt: str | None = None) -> dict:
    """Non-streaming chat completion (for internal use)."""
    settings = get_settings()
    openrouter_model = get_openrouter_model(model_id)

    api_messages = []
    if system_prompt:
        api_messages.append({"role": "system", "content": system_prompt})
    api_messages.extend(messages)

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "HTTP-Referer": settings.webapp_url,
                "X-Title": "Stone AI",
            },
            json={
                "model": openrouter_model,
                "messages": api_messages,
                "max_tokens": 4096,
            },
        )
        response.raise_for_status()
        return response.json()
