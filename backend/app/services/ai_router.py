"""AI Router — OpenRouter integration with streaming SSE.

Routes requests to 50 AI models through a single OpenRouter API key.
Supports streaming responses via Server-Sent Events.
"""

import json
import httpx

from app.config import get_settings

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# ─── Unified Model Registry (50 models) ───
# Single source of truth: metadata, pricing, and routing.
# Prices are Stone AI prices per 1M tokens (input/output).
# Source: MODELS_50.md

MODELS_REGISTRY = [
    # ═══ TIER 1: LITE — free 10+5/day (5 models) ═══
    {"id": "gpt-4o-mini",      "name": "GPT-4o mini",       "company": "OpenAI",    "tier": 1, "openrouter_id": "openai/gpt-4o-mini",            "icon": "🤖", "desc": "Быстрый и дешёвый",    "category": "chat",   "context_length": "128K", "price_input": 0.90,  "price_output": 3.60,   "price_weighted": 2.50,   "active": True},
    {"id": "claude-haiku-4.5", "name": "Claude Haiku 4.5",  "company": "Anthropic", "tier": 1, "openrouter_id": "anthropic/claude-haiku-4.5",     "icon": "🧠", "desc": "Быстрый Claude",       "category": "chat",   "context_length": "200K", "price_input": 3.20,  "price_output": 16.00,  "price_weighted": 11.00,  "active": True},
    {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash",  "company": "Google",    "tier": 1, "openrouter_id": "google/gemini-2.0-flash",             "icon": "💎", "desc": "Скоростной",           "category": "chat",   "context_length": "1M",   "price_input": 0.50,  "price_output": 2.00,   "price_weighted": 1.40,   "active": False},  # not on OpenRouter
    {"id": "llama-4-maverick", "name": "Llama 4 Maverick",  "company": "Meta",      "tier": 1, "openrouter_id": "meta-llama/llama-4-maverick",    "icon": "🦙", "desc": "Open-source 400B",     "category": "chat",   "context_length": "1M",   "price_input": 0.80,  "price_output": 2.40,   "price_weighted": 1.76,   "active": True},
    {"id": "mistral-large-25", "name": "Mistral Large",     "company": "Mistral",   "tier": 1, "openrouter_id": "mistralai/mistral-large",  "icon": "🌀", "desc": "Европейский флагман",  "category": "chat",   "context_length": "128K", "price_input": 8.00,  "price_output": 24.00,  "price_weighted": 17.60,  "active": True},

    # ═══ TIER 2: MID-RANGE (15 models) ═══
    {"id": "deepseek-r1",      "name": "DeepSeek R1",       "company": "DeepSeek",  "tier": 2, "openrouter_id": "deepseek/deepseek-r1-0528",      "icon": "🌊", "desc": "Reasoning",            "category": "reason", "context_length": "164K", "price_input": 2.20,  "price_output": 8.76,   "price_weighted": 6.00,   "active": True},
    {"id": "deepseek-v3",      "name": "DeepSeek V3",       "company": "DeepSeek",  "tier": 2, "openrouter_id": "deepseek/deepseek-chat",           "icon": "🌊", "desc": "Быстрый чат",          "category": "chat",   "context_length": "128K", "price_input": 1.12,  "price_output": 1.71,   "price_weighted": 1.50,   "active": True},
    {"id": "deepseek-v3.2",    "name": "DeepSeek V3.2",     "company": "DeepSeek",  "tier": 2, "openrouter_id": "deepseek/deepseek-v3.2",         "icon": "🌊", "desc": "Обновлённый V3",       "category": "chat",   "context_length": "128K", "price_input": 1.12,  "price_output": 1.71,   "price_weighted": 1.50,   "active": True},
    {"id": "gpt-4.1-mini",     "name": "GPT-4.1 mini",      "company": "OpenAI",    "tier": 2, "openrouter_id": "openai/gpt-4.1-mini",            "icon": "🤖", "desc": "Сбалансированный",     "category": "chat",   "context_length": "1M",   "price_input": 1.60,  "price_output": 6.40,   "price_weighted": 4.50,   "active": True},
    {"id": "gpt-4.1-nano",     "name": "GPT-4.1 nano",      "company": "OpenAI",    "tier": 2, "openrouter_id": "openai/gpt-4.1-nano",            "icon": "🤖", "desc": "Ультра-дешёвый",       "category": "chat",   "context_length": "1M",   "price_input": 0.50,  "price_output": 2.00,   "price_weighted": 1.40,   "active": True},
    {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash",  "company": "Google",    "tier": 2, "openrouter_id": "google/gemini-2.5-flash",        "icon": "💎", "desc": "Думающий Flash",       "category": "chat",   "context_length": "1M",   "price_input": 0.60,  "price_output": 2.40,   "price_weighted": 1.68,   "active": True},
    {"id": "claude-sonnet-4",  "name": "Claude Sonnet 4",   "company": "Anthropic", "tier": 2, "openrouter_id": "anthropic/claude-sonnet-4",      "icon": "🧠", "desc": "Мощный и доступный",   "category": "chat",   "context_length": "200K", "price_input": 9.00,  "price_output": 45.00,  "price_weighted": 30.00,  "active": True},
    {"id": "claude-sonnet-4.5","name": "Claude Sonnet 4.5",  "company": "Anthropic", "tier": 2, "openrouter_id": "anthropic/claude-sonnet-4.5",    "icon": "🧠", "desc": "Новейший Sonnet",      "category": "chat",   "context_length": "200K", "price_input": 9.00,  "price_output": 45.00,  "price_weighted": 30.00,  "active": True},
    {"id": "grok-3-mini",      "name": "Grok 4.3 mini",     "company": "xAI",       "tier": 2, "openrouter_id": "x-ai/grok-4.3",                 "icon": "⚡", "desc": "Компактный Grok",      "category": "chat",   "context_length": "131K", "price_input": 1.20,  "price_output": 2.00,   "price_weighted": 1.68,   "active": True},
    {"id": "qwen-3-235b",      "name": "Qwen 3 235B",       "company": "Alibaba",   "tier": 2, "openrouter_id": "qwen/qwen3-235b-a22b",           "icon": "🐉", "desc": "Китайский флагман",    "category": "chat",   "context_length": "40K",  "price_input": 0.60,  "price_output": 3.00,   "price_weighted": 2.00,   "active": True},
    {"id": "qwen-qwq",         "name": "Qwen QwQ 32B",      "company": "Alibaba",   "tier": 2, "openrouter_id": "qwen/qwq-32b",                   "icon": "🐉", "desc": "Reasoning на китайском","category": "chat",   "context_length": "131K", "price_input": 0.60,  "price_output": 3.00,   "price_weighted": 2.00,   "active": False},  # not on OpenRouter
    {"id": "minimax-m2.5",     "name": "MiniMax M2.5",      "company": "MiniMax",   "tier": 2, "openrouter_id": "minimax/minimax-m2.5",            "icon": "🔮", "desc": "1M контекст",          "category": "reason", "context_length": "1M",   "price_input": 0.90,  "price_output": 3.30,   "price_weighted": 2.34,   "active": True},
    {"id": "glm-5",            "name": "GLM-5",             "company": "Zhipu",     "tier": 2, "openrouter_id": "zhipu/glm-5",                     "icon": "🏮", "desc": "Китайский GPT",        "category": "chat",   "context_length": "128K", "price_input": 0.90,  "price_output": 7.65,   "price_weighted": 4.95,   "active": False},  # not on OpenRouter
    {"id": "command-r7",       "name": "Command R7",        "company": "Cohere",    "tier": 2, "openrouter_id": "cohere/command-r7b-12-2024",               "icon": "🔗", "desc": "RAG и поиск",          "category": "chat",   "context_length": "128K", "price_input": 0.24,  "price_output": 0.24,   "price_weighted": 0.24,   "active": True},
    {"id": "mistral-small",    "name": "Mistral Small",     "company": "Mistral",   "tier": 2, "openrouter_id": "mistralai/mistral-small-3.2-24b-instruct", "icon": "🌀", "desc": "Лёгкий европейский",   "category": "chat",   "context_length": "128K", "price_input": 0.50,  "price_output": 1.50,   "price_weighted": 1.10,   "active": True},

    # ═══ TIER 3: PREMIUM — top models (15 models) ═══
    {"id": "claude-opus-4",    "name": "Claude Opus 4",     "company": "Anthropic", "tier": 3, "openrouter_id": "anthropic/claude-opus-4",        "icon": "🧠", "desc": "Лучший в коде",        "category": "chat",   "context_length": "200K", "price_input": 37.50, "price_output": 187.50, "price_weighted": 130.00, "active": True},
    {"id": "claude-opus-4.5",  "name": "Claude Opus 4.5",   "company": "Anthropic", "tier": 3, "openrouter_id": "anthropic/claude-opus-4.5",      "icon": "🧠", "desc": "Opus 4.5",             "category": "chat",   "context_length": "200K", "price_input": 15.00, "price_output": 75.00,  "price_weighted": 51.00,  "active": True},
    {"id": "claude-opus-4-7",  "name": "Claude Opus 4.7",   "company": "Anthropic", "tier": 3, "openrouter_id": "anthropic/claude-opus-4-7",      "icon": "🧠", "desc": "Новейший Opus",         "category": "chat",   "context_length": "200K", "price_input": 15.00, "price_output": 75.00,  "price_weighted": 51.00,  "active": True},
    {"id": "gpt-4.1",          "name": "GPT-4.1",           "company": "OpenAI",    "tier": 3, "openrouter_id": "openai/gpt-4.1",                 "icon": "🤖", "desc": "Flagship 2025",        "category": "chat",   "context_length": "1M",   "price_input": 10.00, "price_output": 40.00,  "price_weighted": 28.00,  "active": True},
    {"id": "gpt-5.1",          "name": "GPT-5.1",           "company": "OpenAI",    "tier": 3, "openrouter_id": "openai/gpt-5.1",                 "icon": "🤖", "desc": "Новейший OpenAI",      "category": "chat",   "context_length": "400K", "price_input": 4.90,  "price_output": 39.20,  "price_weighted": 26.00,  "active": True},
    {"id": "gpt-5.4",          "name": "GPT-5.4",           "company": "OpenAI",    "tier": 3, "openrouter_id": "openai/gpt-5.4",                 "icon": "🤖", "desc": "Топовый GPT",          "category": "chat",   "context_length": "1M",   "price_input": 7.50,  "price_output": 45.00,  "price_weighted": 30.00,  "active": True},
    {"id": "gpt-5.5",          "name": "GPT-5.5",           "company": "OpenAI",    "tier": 3, "openrouter_id": "openai/gpt-5.5",                 "icon": "🤖", "desc": "Флагман OpenAI",       "category": "chat",   "context_length": "1M",   "price_input": 8.50,  "price_output": 51.00,  "price_weighted": 34.00,  "active": True},
    {"id": "gemini-2.5-pro",   "name": "Gemini 2.5 Pro",    "company": "Google",    "tier": 3, "openrouter_id": "google/gemini-2.5-pro",          "icon": "🔮", "desc": "Мультимодальный",      "category": "chat",   "context_length": "1M",   "price_input": 5.00,  "price_output": 40.00,  "price_weighted": 26.00,  "active": True},
    {"id": "gemini-3-pro",     "name": "Gemini 3.5 Flash",  "company": "Google",    "tier": 3, "openrouter_id": "google/gemini-3.5-flash",        "icon": "💎", "desc": "Новейший Gemini",      "category": "chat",   "context_length": "1M",   "price_input": 6.00,  "price_output": 36.00,  "price_weighted": 24.00,  "active": True},
    {"id": "gemini-3.1-pro-preview", "name": "Gemini 3.1 Pro Preview", "company": "Google", "tier": 3, "openrouter_id": "google/gemini-3.1-pro-preview", "icon": "💎", "desc": "Новый мультимодальный флагман", "category": "chat", "context_length": "1M", "price_input": 6.50, "price_output": 39.00, "price_weighted": 26.10, "active": False},  # not on OpenRouter
    {"id": "grok-3",           "name": "Grok 4.3",          "company": "xAI",       "tier": 3, "openrouter_id": "x-ai/grok-4.3",                  "icon": "⚡", "desc": "Творческий",           "category": "chat",   "context_length": "131K", "price_input": 10.50, "price_output": 52.50,  "price_weighted": 36.00,  "active": True},
    {"id": "perplexity-sonar-pro", "name": "Perplexity Pro", "company": "Perplexity","tier": 3, "openrouter_id": "perplexity/sonar-pro",           "icon": "🔍", "desc": "Поиск в реальном времени","category": "search","context_length": "200K", "price_input": 7.50,  "price_output": 37.50,  "price_weighted": 26.00,  "active": True},
    {"id": "kimi-k2.5",        "name": "Kimi K2.5",         "company": "Moonshot",  "tier": 3, "openrouter_id": "moonshotai/kimi-k2.5",             "icon": "🌙", "desc": "Китайский мультимодальный","category": "reason","context_length": "128K", "price_input": 0.80,  "price_output": 6.00,   "price_weighted": 3.92,   "active": True},
    {"id": "o4-mini",          "name": "o4-mini",           "company": "OpenAI",    "tier": 3, "openrouter_id": "openai/o4-mini",                 "icon": "🤖", "desc": "Reasoning compact",    "category": "reason", "context_length": "200K", "price_input": 4.40,  "price_output": 17.60,  "price_weighted": 12.32,  "active": True},
    {"id": "o3",               "name": "o3",                "company": "OpenAI",    "tier": 3, "openrouter_id": "openai/o3",                      "icon": "🤖", "desc": "Reasoning flagship",   "category": "reason", "context_length": "200K", "price_input": 7.00,  "price_output": 28.00,  "price_weighted": 19.60,  "active": True},
    {"id": "claude-haiku-4.5-think", "name": "Claude Haiku Think", "company": "Anthropic", "tier": 3, "openrouter_id": "anthropic/claude-haiku-4.5:thinking", "icon": "🧠", "desc": "Reasoning Haiku", "category": "reason", "context_length": "200K", "price_input": 3.50, "price_output": 17.50, "price_weighted": 11.90, "active": False},  # not on OpenRouter
    {"id": "gemini-2.5-flash-think", "name": "Gemini Flash Think", "company": "Google", "tier": 3, "openrouter_id": "google/gemini-2.5-flash", "icon": "💎", "desc": "Reasoning Flash", "category": "reason", "context_length": "1M", "price_input": 0.60, "price_output": 14.00, "price_weighted": 8.64, "active": True},
    {"id": "devstral",         "name": "Devstral",          "company": "Mistral",   "tier": 3, "openrouter_id": "mistralai/devstral-2512",              "icon": "🌀", "desc": "Код-специалист",       "category": "code",   "context_length": "128K", "price_input": 0.75,  "price_output": 3.00,   "price_weighted": 2.10,   "active": True},

    # ═══ TIER 4: IMAGE GENERATION (6 models) ═══
    {"id": "nano-banana-pro",  "name": "Nano Banana Pro",   "company": "Google",    "tier": 4, "openrouter_id": "google/gemini-3-pro-image-preview", "icon": "🎨", "desc": "Генерация Pro",    "category": "image",  "context_length": "65K",  "price_input": 8.00,  "price_output": 48.00,  "price_weighted": 32.00,  "active": True},
    {"id": "nano-banana",      "name": "Nano Banana",       "company": "Google",    "tier": 4, "openrouter_id": "google/gemini-2.5-flash-image", "icon": "🖼️", "desc": "Генерация картинок","category": "image","context_length": "1M",   "price_input": 0.60,  "price_output": 2.40,   "price_weighted": 1.68,   "active": True},
    {"id": "gpt-5-image",      "name": "GPT-5 Image",       "company": "OpenAI",    "tier": 4, "openrouter_id": "openai/gpt-5-image",             "icon": "🎨", "desc": "Генерация OpenAI",     "category": "image",  "context_length": "128K", "price_input": 7.50,  "price_output": 45.00,  "price_weighted": 30.00,  "active": True},
    {"id": "gpt-5-image-mini", "name": "GPT-5 Image Mini",  "company": "OpenAI",    "tier": 4, "openrouter_id": "openai/gpt-5-image-mini",        "icon": "🎨", "desc": "Генерация бюджетная",   "category": "image",  "context_length": "128K", "price_input": 2.40,  "price_output": 9.60,   "price_weighted": 6.72,   "active": True},
    {"id": "flux-schnell",     "name": "Flux Schnell",      "company": "BFL",       "tier": 4, "openrouter_id": "black-forest-labs/flux-schnell",  "icon": "🎨", "desc": "Быстрая генерация",    "category": "image",  "context_length": "—",    "price_input": 0.0,   "price_output": 0.0,    "price_weighted": 0.0,    "price_per_image": 0.012, "active": False},  # not on OpenRouter
    {"id": "stable-diffusion-xl","name": "SDXL",             "company": "Stability", "tier": 4, "openrouter_id": "stabilityai/sdxl",               "icon": "🎨", "desc": "Stable Diffusion XL",  "category": "image",  "context_length": "—",    "price_input": 0.0,   "price_output": 0.0,    "price_weighted": 0.0,    "price_per_image": 0.04,  "active": False},  # not on OpenRouter

    # ═══ TIER 5: FREE ON OPENROUTER — Stone AI charges flat fee (7 models) ═══
    {"id": "gemma-3-27b",      "name": "Gemma 3 27B",       "company": "Google",    "tier": 5, "openrouter_id": "google/gemma-3-27b-it",          "icon": "💠", "desc": "Компактный и быстрый", "category": "chat",   "context_length": "96K",  "price_input": 0.60,  "price_output": 1.60,   "price_weighted": 1.20,   "active": True},
    {"id": "gemma-3n-4b",      "name": "Gemma 3n 4B",       "company": "Google",    "tier": 5, "openrouter_id": "google/gemma-3n-e4b-it",            "icon": "💠", "desc": "Ультра-лёгкий",        "category": "chat",   "context_length": "32K",  "price_input": 0.20,  "price_output": 0.70,   "price_weighted": 0.50,   "active": True},
    {"id": "phi-4",            "name": "Phi-4",             "company": "Microsoft", "tier": 5, "openrouter_id": "microsoft/phi-4",                "icon": "🔬", "desc": "Код и математика",     "category": "chat",   "context_length": "16K",  "price_input": 0.60,  "price_output": 1.60,   "price_weighted": 1.20,   "active": True},
    {"id": "llama-3.3-70b",    "name": "Llama 3.3 70B",     "company": "Meta",      "tier": 5, "openrouter_id": "meta-llama/llama-3.3-70b-instruct",       "icon": "🦙", "desc": "Open-source 70B",      "category": "chat",   "context_length": "128K", "price_input": 0.60,  "price_output": 1.60,   "price_weighted": 1.20,   "active": True},
    {"id": "qwen-turbo",       "name": "Qwen Turbo",        "company": "Alibaba",   "tier": 5, "openrouter_id": "qwen/qwen-turbo",                "icon": "🐉", "desc": "Быстрый Qwen",         "category": "chat",   "context_length": "1M",   "price_input": 0.26,  "price_output": 0.91,   "price_weighted": 0.65,   "active": False},  # not on OpenRouter
    {"id": "nvidia-nemotron",  "name": "Nemotron 70B",      "company": "NVIDIA",    "tier": 5, "openrouter_id": "nvidia/nemotron-3-super-120b-a12b:free",  "icon": "💚", "desc": "NVIDIA reasoning",     "category": "chat",   "context_length": "128K", "price_input": 0.40,  "price_output": 1.40,   "price_weighted": 1.00,   "active": True},
    {"id": "mythomax-13b",     "name": "MythoMax 13B",      "company": "Gryphe",    "tier": 5, "openrouter_id": "gryphe/mythomax-l2-13b",         "icon": "📖", "desc": "Ролевой",              "category": "chat",   "context_length": "4K",   "price_input": 0.20,  "price_output": 0.70,   "price_weighted": 0.50,   "active": True},

    # ═══ TIER 6: SPECIAL (2 models) ═══
    {"id": "perplexity-sonar",      "name": "Perplexity Sonar",       "company": "Perplexity", "tier": 6, "openrouter_id": "perplexity/sonar",              "icon": "🔍", "desc": "Поиск базовый",       "category": "search", "context_length": "127K", "price_input": 4.00, "price_output": 4.00, "price_weighted": 4.00, "active": True},
    {"id": "perplexity-sonar-deep", "name": "Sonar Deep Research",    "company": "Perplexity", "tier": 6, "openrouter_id": "perplexity/sonar-deep-research", "icon": "🔍", "desc": "Глубокий поиск",      "category": "search", "context_length": "127K", "price_input": 6.00, "price_output": 24.00, "price_weighted": 16.80, "active": True},
]

# ─── Derived mappings (backward compatible) ───

MODEL_MAP = {m["id"]: m["openrouter_id"] for m in MODELS_REGISTRY if m.get("active", True)}

TIER_MAP = {m["id"]: ("lite" if m["tier"] == 1 else "premium") for m in MODELS_REGISTRY if m.get("active", True)}


def _model_weight(model_id: str) -> int:
    """Lazy import to avoid circular dep with daily_limits."""
    try:
        from app.services.daily_limits import get_model_weight
        return get_model_weight(model_id)
    except Exception:
        return 1


def _required_tier(model_id: str) -> str:
    """Return the minimum subscription tier that can use this model."""
    try:
        from app.services.subscription import get_required_tier
        return get_required_tier(model_id)
    except Exception:
        return "max"


def _access_label(required_tier: str) -> str:
    return {"free": "Free", "mini": "Start", "max": "Pro"}.get(required_tier, "Pro")


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
        "weight": _model_weight(m["id"]),
        "required_tier": _required_tier(m["id"]),
        "access_label": _access_label(_required_tier(m["id"])),
        **({"price_per_image": m["price_per_image"]} if "price_per_image" in m else {}),
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


# ─── Category mapping for Free-plan limiter ───
# "fast"    — tier 1 (lite) + tier 2 (mid-range) + tier 5 (free on OpenRouter)
# "premium" — tier 3 (premium) + tier 6 (perplexity search)
# "image"   — tier 4 (image generation)
# Video models are handled separately.


_MODEL_CATEGORY_MAP = {}
for _m in MODELS_REGISTRY:
    _cat = _m.get("category", "chat")
    if _cat == "image":
        _MODEL_CATEGORY_MAP[_m["id"]] = "image"
    elif _m["tier"] in (1, 2, 5):
        _MODEL_CATEGORY_MAP[_m["id"]] = "fast"
    else:
        _MODEL_CATEGORY_MAP[_m["id"]] = "premium"


def get_model_category(model_id: str) -> str:
    """Return 'fast', 'premium', 'image', or 'unknown'.

    Tier mapping:
      - fast    = tier 1 (lite) + tier 2 (mid-range) + tier 5 (free on OpenRouter)
      - premium = tier 3 (premium) + tier 6 (perplexity search)
      - image   = tier 4 (image generation)
    Video models are handled separately.
    """
    return _MODEL_CATEGORY_MAP.get(model_id, "premium")


async def stream_chat_response(
    model_id: str,
    messages: list[dict],
    system_prompt: str | None = None,
    byok_key: str | None = None,
    max_tokens: int = 4096,
    max_input_tokens: int | None = None,
):
    """
    Stream chat completion from OpenRouter.

    Yields SSE-formatted chunks: data: {"content": "..."}\n\n
    Final chunk: data: [DONE]\n\n

    Also yields usage info at the end: data: {"usage": {...}}\n\n
    """
    settings = get_settings()
    openrouter_model = get_openrouter_model(model_id)

    # Build messages array with context truncation
    # Rough estimate: 1 token ≈ 4 chars for English, 2 chars for Russian
    model_info = next((m for m in MODELS_REGISTRY if m["id"] == model_id), None)
    ctx_str = model_info["context_length"] if model_info else "128K"
    try:
        max_ctx = int(ctx_str.replace("K", "000").replace("M", "000000")) if isinstance(ctx_str, str) else 128000
    except (ValueError, AttributeError):
        max_ctx = 8000  # safe default for image/special models
    # Apply margin-protection cap on input — never exceed it even if model supports more context
    if max_input_tokens is not None:
        max_ctx = min(max_ctx, max_input_tokens + max_tokens + 2000)
    # Reserve tokens for output and system prompt
    max_input_chars = (max_ctx - max_tokens - 2000) * 3  # ~3 chars per token average

    api_messages = []
    if system_prompt:
        api_messages.append({"role": "system", "content": system_prompt})

    # Truncate: always keep last N messages that fit within context
    truncated = []
    char_count = 0
    for msg in reversed(messages):
        content = msg.get("content", "") or ""
        if isinstance(content, str):
            msg_len = len(content)
        elif isinstance(content, list):
            # Multimodal: estimate size of each part
            msg_len = sum(len(str(p.get("text", ""))) + len(str(p.get("image_url", {}).get("url", ""))[:100]) for p in content if isinstance(p, dict))
        else:
            msg_len = 100
        if char_count + msg_len > max_input_chars and len(truncated) >= 2:
            break
        truncated.append(msg)
        char_count += msg_len
    truncated.reverse()
    api_messages.extend(truncated)

    # Reasoning models (o3, o4-mini) don't support system role — convert to user
    REASONING_MODELS = {"o3", "o4-mini"}
    if model_id in REASONING_MODELS:
        converted = []
        for msg in api_messages:
            if msg["role"] == "system":
                converted.append({"role": "user", "content": f"[Instructions]: {msg['content']}"})
            else:
                converted.append(msg)
        api_messages = converted

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

    if model_id == "gemini-2.5-flash-think":
        payload["reasoning"] = {"effort": "high"}

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
                **({"reasoning": {"effort": "high"}} if model_id == "gemini-2.5-flash-think" else {}),
            },
        )
        response.raise_for_status()
        return response.json()
