"""Stone AI — Vercel Serverless API.

All endpoints: /api/models, /api/user/me, /api/chat (SSE streaming).
Runs as a single Vercel Python serverless function.
"""

import json
import os

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

import httpx

# ─── App setup ───

app = FastAPI(title="Stone AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Config ───

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# ─── Model data ───

MODELS_INFO = [
    {"id": "gpt-4o-mini", "name": "GPT-4o mini", "company": "OpenAI", "tier": "lite", "icon": "\ud83e\udd16", "desc": "\u0411\u044b\u0441\u0442\u0440\u044b\u0439 \u0438 \u0434\u0435\u0448\u0451\u0432\u044b\u0439"},
    {"id": "claude-haiku-4.5", "name": "Claude Haiku 4.5", "company": "Anthropic", "tier": "lite", "icon": "\ud83e\udde0", "desc": "\u0411\u044b\u0441\u0442\u0440\u044b\u0439 Claude"},
    {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash", "company": "Google", "tier": "lite", "icon": "\ud83d\udc8e", "desc": "\u0421\u043a\u043e\u0440\u043e\u0441\u0442\u043d\u043e\u0439"},
    {"id": "deepseek-r1", "name": "DeepSeek R1", "company": "DeepSeek", "tier": "lite", "icon": "\ud83c\udf0a", "desc": "Reasoning"},
    {"id": "llama-4-maverick", "name": "Llama 4", "company": "Meta", "tier": "lite", "icon": "\ud83e\udd99", "desc": "Open-source 400B"},
    {"id": "mistral-large-25", "name": "Mistral Large", "company": "Mistral AI", "tier": "lite", "icon": "\ud83c\udf00", "desc": "\u0415\u0432\u0440\u043e\u043f\u0435\u0439\u0441\u043a\u0438\u0439"},
    {"id": "gpt-4.1", "name": "GPT-4.1", "company": "OpenAI", "tier": "premium", "icon": "\ud83e\udd16", "desc": "Flagship 2025"},
    {"id": "claude-opus-4", "name": "Claude Opus 4", "company": "Anthropic", "tier": "premium", "icon": "\ud83e\udde0", "desc": "\u041b\u0443\u0447\u0448\u0438\u0439 \u0432 \u043a\u043e\u0434\u0435"},
    {"id": "grok-3", "name": "Grok 3", "company": "xAI", "tier": "premium", "icon": "\u26a1", "desc": "\u0422\u0432\u043e\u0440\u0447\u0435\u0441\u043a\u0438\u0439"},
    {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro", "company": "Google", "tier": "premium", "icon": "\ud83d\udd2e", "desc": "\u041c\u0443\u043b\u044c\u0442\u0438\u043c\u043e\u0434\u0430\u043b\u044c\u043d\u044b\u0439"},
    {"id": "perplexity-sonar-pro", "name": "Perplexity Pro", "company": "Perplexity", "tier": "premium", "icon": "\ud83d\udd0d", "desc": "\u041f\u043e\u0438\u0441\u043a \u0432 \u0440\u0435\u0430\u043b\u044c\u043d\u043e\u043c \u0432\u0440\u0435\u043c\u0435\u043d\u0438"},
]

MODEL_MAP = {
    "gpt-4o-mini": "openai/gpt-4o-mini",
    "claude-haiku-4.5": "anthropic/claude-3-5-haiku-latest",
    "gemini-2.0-flash": "google/gemini-2.0-flash-001",
    "deepseek-r1": "deepseek/deepseek-r1",
    "llama-4-maverick": "meta-llama/llama-4-maverick",
    "mistral-large-25": "mistralai/mistral-large-latest",
    "gpt-4.1": "openai/gpt-4.1",
    "claude-opus-4": "anthropic/claude-opus-4",
    "grok-3": "x-ai/grok-3",
    "gemini-2.5-pro": "google/gemini-2.5-pro-preview",
    "perplexity-sonar-pro": "perplexity/sonar-pro",
}

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


# ─── Endpoints ───


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


@app.get("/api/models")
async def list_models():
    """Return all 11 AI models with metadata."""
    return {"models": MODELS_INFO}


@app.get("/api/user/me")
async def get_user(request: Request):
    """
    Return user profile data.
    In serverless mode, parses Telegram initData if available,
    otherwise returns sensible defaults for dev/demo.
    """
    # TODO: Parse Authorization header for real Telegram initData validation
    # For now, return demo user that lets the app work
    return {
        "user": {
            "tg_id": 0,
            "username": "",
            "first_name": "User",
        },
        "plan": "free",
        "usage": {
            "lite_today": 0,
            "premium_today": 0,
        },
        "limits": {
            "lite": 20,
            "premium": 0,
        },
        "stats": {
            "total_requests": 0,
        },
        "pass": None,
    }


@app.post("/api/chat")
async def chat(request: Request):
    """
    Stream AI response via SSE.
    Proxies to OpenRouter with the selected model.
    """
    body = await request.json()
    model_id = body.get("model_id", "gpt-4o-mini")
    messages = body.get("messages", [])
    system_prompt = body.get("system_prompt")

    # Check tier — block premium for free users (serverless MVP)
    tier = TIER_MAP.get(model_id, "premium")
    if tier == "premium":
        return JSONResponse(
            status_code=403,
            content={"detail": "Premium \u043c\u043e\u0434\u0435\u043b\u0438 \u0434\u043e\u0441\u0442\u0443\u043f\u043d\u044b \u043f\u043e \u043f\u043e\u0434\u043f\u0438\u0441\u043a\u0435 PLUS/MAX"},
        )

    if not OPENROUTER_API_KEY:
        return JSONResponse(
            status_code=500,
            content={"detail": "OpenRouter API key not configured"},
        )

    openrouter_model = MODEL_MAP.get(model_id, "openai/gpt-4o-mini")

    # Build messages
    api_messages = []
    if system_prompt:
        api_messages.append({"role": "system", "content": system_prompt})
    api_messages.extend(messages)

    async def generate():
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    OPENROUTER_URL,
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "HTTP-Referer": "https://stone-ai-1.vercel.app",
                        "X-Title": "Stone AI",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": openrouter_model,
                        "messages": api_messages,
                        "stream": True,
                        "max_tokens": 4096,
                    },
                ) as response:
                    if response.status_code != 200:
                        error_body = await response.aread()
                        error_msg = error_body.decode("utf-8", errors="replace")[:200]
                        yield f'data: {json.dumps({"error": f"API error {response.status_code}: {error_msg}"})}\n\n'
                        return

                    tokens_in = 0
                    tokens_out = 0

                    async for line in response.aiter_lines():
                        if not line.startswith("data: "):
                            continue
                        data_str = line[6:]
                        if data_str.strip() == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data_str)
                            choices = chunk.get("choices", [])
                            if choices:
                                delta = choices[0].get("delta", {})
                                content = delta.get("content")
                                if content:
                                    yield f'data: {json.dumps({"content": content})}\n\n'
                            usage = chunk.get("usage")
                            if usage:
                                tokens_in = usage.get("prompt_tokens", 0)
                                tokens_out = usage.get("completion_tokens", 0)
                        except json.JSONDecodeError:
                            continue

            # Send usage + done
            yield f'data: {json.dumps({"usage": {"tokens_in": tokens_in, "tokens_out": tokens_out}})}\n\n'
            yield "data: [DONE]\n\n"

        except httpx.TimeoutException:
            yield f'data: {json.dumps({"error": "\u041c\u043e\u0434\u0435\u043b\u044c \u043d\u0435 \u043e\u0442\u0432\u0435\u0442\u0438\u043b\u0430 \u2014 \u043f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437"})}\n\n'
        except Exception as e:
            yield f'data: {json.dumps({"error": f"\u041e\u0448\u0438\u0431\u043a\u0430: {str(e)}"})}\n\n'

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
