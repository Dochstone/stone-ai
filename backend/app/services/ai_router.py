"""AI Router — OpenRouter integration with streaming SSE.

Routes requests to 25+ AI models through a single OpenRouter API key.
Supports streaming responses via Server-Sent Events.
"""

import json
import httpx

from app.config import get_settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# ─── Unified Model Registry ───
# Single source of truth for all model metadata, pricing, and routing.

MODELS_REGISTRY = [
    # ─── Tier 1: Budget (Lite — free 10+5/day) ───
    {"id": "gpt-4o-mini", "name": "GPT-4o mini", "company": "OpenAI", "tier": 1, "openrouter_id": "openai/gpt-4o-mini", "icon": "🤖", "desc": "Быстрый и дешёвый", "category": "chat", "context_length": "128K", "price_input": 0.60, "price_output": 2.40, "price_weighted": 1.68, "active": True},
    {"id": "claude-haiku-4.5", "name": "Claude Haiku 4.5", "company": "Anthropic", "tier": 1, "openrouter_id": "anthropic/claude-haiku-4.5", "icon": "🧠", "desc": "Быстрый Claude", "category": "chat", "context_length": "200K", "price_input": 4.00, "price_output": 20.00, "price_weighted": 13.60, "active": True},
    {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash", "company": "Google", "tier": 1, "openrouter_id": "google/gemini-2.0-flash", "icon": "💎", "desc": "Скоростной", "category": "chat", "context_length": "1M", "price_input": 0.40, "price_output": 1.60, "price_weighted": 1.12, "active": True},
    {"id": "llama-4-maverick", "name": "Llama 4", "company": "Meta", "tier": 1, "openrouter_id": "meta-llama/llama-4-maverick", "icon": "🦙", "desc": "Open-source 400B", "category": "chat", "context_length": "1M", "price_input": 0.80, "price_output": 2.40, "price_weighted": 1.76, "active": True},
    {"id": "mistral-large-25", "name": "Mistral Large", "company": "Mistral AI", "tier": 1, "openrouter_id": "mistralai/mistral-large-latest", "icon": "🌀", "desc": "Европейский", "category": "chat", "context_length": "128K", "price_input": 8.00, "price_output": 24.00, "price_weighted": 17.60, "active": True},
    {"id": "gemma-3-27b", "name": "Gemma 3 27B", "company": "Google", "tier": 1, "openrouter_id": "google/gemma-3-27b-it", "icon": "💠", "desc": "Компактный и быстрый", "category": "chat", "context_length": "96K", "price_input": 0.40, "price_output": 1.40, "price_weighted": 1.00, "active": True},
    {"id": "qwen-3-235b", "name": "Qwen 3 235B", "company": "Alibaba", "tier": 1, "openrouter_id": "qwen/qwen-3-235b-a22b", "icon": "🐉", "desc": "Китайский флагман", "category": "chat", "context_length": "128K", "price_input": 0.80, "price_output": 4.00, "price_weighted": 2.72, "active": True},

    # ─── Tier 2: Mid-range (Premium, per-token) ───
    {"id": "deepseek-r1", "name": "DeepSeek R1", "company": "DeepSeek", "tier": 2, "openrouter_id": "deepseek/deepseek-r1", "icon": "🌊", "desc": "Reasoning", "category": "chat", "context_length": "64K", "price_input": 2.20, "price_output": 8.76, "price_weighted": 6.14, "active": True},
    {"id": "deepseek-v3", "name": "DeepSeek V3", "company": "DeepSeek", "tier": 2, "openrouter_id": "deepseek/deepseek-chat-v3", "icon": "🌊", "desc": "Быстрый чат", "category": "chat", "context_length": "128K", "price_input": 1.00, "price_output": 1.52, "price_weighted": 1.31, "active": True},
    {"id": "gpt-4.1-mini", "name": "GPT-4.1 mini", "company": "OpenAI", "tier": 2, "openrouter_id": "openai/gpt-4.1-mini", "icon": "🤖", "desc": "Сбалансированный", "category": "chat", "context_length": "1M", "price_input": 1.60, "price_output": 6.40, "price_weighted": 4.48, "active": True},
    {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "company": "Google", "tier": 2, "openrouter_id": "google/gemini-2.5-flash-preview", "icon": "💎", "desc": "Думающий Flash", "category": "chat", "context_length": "1M", "price_input": 0.60, "price_output": 2.40, "price_weighted": 1.68, "active": True},
    {"id": "claude-sonnet-4", "name": "Claude Sonnet 4", "company": "Anthropic", "tier": 2, "openrouter_id": "anthropic/claude-sonnet-4", "icon": "🧠", "desc": "Лучший в коде", "category": "code", "context_length": "200K", "price_input": 12.00, "price_output": 60.00, "price_weighted": 40.80, "active": True},
    {"id": "grok-3-mini", "name": "Grok 3 mini", "company": "xAI", "tier": 2, "openrouter_id": "x-ai/grok-3-mini-beta", "icon": "⚡", "desc": "Компактный Grok", "category": "chat", "context_length": "128K", "price_input": 1.20, "price_output": 2.00, "price_weighted": 1.68, "active": True},
    {"id": "phi-4", "name": "Phi 4", "company": "Microsoft", "tier": 2, "openrouter_id": "microsoft/phi-4", "icon": "🔬", "desc": "Код и математика", "category": "code", "context_length": "16K", "price_input": 0.40, "price_output": 1.40, "price_weighted": 1.00, "active": True},
    {"id": "qwen-qwq", "name": "QwQ 32B", "company": "Alibaba", "tier": 2, "openrouter_id": "qwen/qwq-32b-preview", "icon": "🐉", "desc": "Reasoning на китайском", "category": "chat", "context_length": "32K", "price_input": 0.30, "price_output": 0.60, "price_weighted": 0.48, "active": True},
    {"id": "command-r", "name": "Command R", "company": "Cohere", "tier": 2, "openrouter_id": "cohere/command-r", "icon": "🔗", "desc": "RAG и поиск", "category": "chat", "context_length": "128K", "price_input": 0.60, "price_output": 2.40, "price_weighted": 1.68, "active": True},
    {"id": "mistral-small", "name": "Mistral Small", "company": "Mistral AI", "tier": 2, "openrouter_id": "mistralai/mistral-small-latest", "icon": "🌀", "desc": "Лёгкий европейский", "category": "chat", "context_length": "128K", "price_input": 0.40, "price_output": 1.20, "price_weighted": 0.88, "active": True},

    # ─── Tier 3: Premium (top models) ───
    {"id": "gpt-4.1", "name": "GPT-4.1", "company": "OpenAI", "tier": 3, "openrouter_id": "openai/gpt-4.1", "icon": "🤖", "desc": "Flagship 2025", "category": "chat", "context_length": "1M", "price_input": 10.00, "price_output": 40.00, "price_weighted": 28.00, "active": True},
    {"id": "claude-opus-4", "name": "Claude Opus 4", "company": "Anthropic", "tier": 3, "openrouter_id": "anthropic/claude-opus-4", "icon": "🧠", "desc": "Лучший в коде", "category": "code", "context_length": "200K", "price_input": 60.00, "price_output": 300.00, "price_weighted": 204.00, "active": True},
    {"id": "grok-3", "name": "Grok 3", "company": "xAI", "tier": 3, "openrouter_id": "x-ai/grok-3", "icon": "⚡", "desc": "Творческий", "category": "chat", "context_length": "128K", "price_input": 12.00, "price_output": 60.00, "price_weighted": 40.80, "active": True},
    {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro", "company": "Google", "tier": 3, "openrouter_id": "google/gemini-2.5-pro", "icon": "🔮", "desc": "Мультимодальный", "category": "chat", "context_length": "1M", "price_input": 5.00, "price_output": 40.00, "price_weighted": 26.00, "active": True},
    {"id": "perplexity-sonar-pro", "name": "Perplexity Pro", "company": "Perplexity", "tier": 3, "openrouter_id": "perplexity/sonar-pro", "icon": "🔍", "desc": "Поиск в реальном времени", "category": "search", "context_length": "200K", "price_input": 12.00, "price_output": 60.00, "price_weighted": 40.80, "active": True},
    {"id": "gpt-5.1", "name": "GPT-5.1", "company": "OpenAI", "tier": 3, "openrouter_id": "openai/gpt-5.1", "icon": "🤖", "desc": "Новейший OpenAI", "category": "chat", "context_length": "1M", "price_input": 8.00, "price_output": 56.00, "price_weighted": 36.80, "active": True},

    # ─── Tier 4: Image generation ───
    {"id": "nano-banana-pro", "name": "Nano Banana Pro", "company": "Google", "tier": 4, "openrouter_id": "google/gemini-3-pro-image-preview", "icon": "🎨", "desc": "Генерация картинок Pro", "category": "image", "context_length": "64K", "price_input": 8.00, "price_output": 48.00, "price_weighted": 32.00, "active": True},
    {"id": "nano-banana", "name": "Nano Banana", "company": "Google", "tier": 4, "openrouter_id": "google/gemini-2.5-flash-preview:image", "icon": "🖼️", "desc": "Генерация картинок", "category": "image", "context_length": "1M", "price_input": 0.60, "price_output": 2.40, "price_weighted": 1.68, "active": True},
]

# ─── Derived mappings (backward compatible) ───

MODEL_MAP = {m["id"]: m["openrouter_id"] for m in MODELS_REGISTRY if m.get("active", True)}

TIER_MAP = {m["id"]: ("lite" if m["tier"] == 1 else "premium") for m in MODELS_REGISTRY if m.get("active", True)}

MODELS_INFO = [
    {
        "id": m["id"],
        "name": m["name"],
        "company": m["company"],
        "tier": "lite" if m["tier"] == 1 else "premium",
        "icon": m["icon"],
        "desc": m["desc"],
        "price_weighted": m["price_weighted"],
        "price_input": m["price_input"],
        "price_output": m["price_output"],
        "context_length": m["context_length"],
        "category": m["category"],
    }
    for m in MODELS_REGISTRY
    if m.get("active", True)
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
    byok_key: str | None = None,
    max_tokens: int = 4096,
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

    api_key = byok_key if byok_key else settings.openrouter_api_key

    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": settings.webapp_url,
        "X-Title": "Stone AI",
        "Content-Type": "application/json",
    }

    payload = {
        "model": openrouter_model,
        "messages": api_messages,
        "stream": True,
        "max_tokens": max_tokens,
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
