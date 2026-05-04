"""Health analysis endpoint — specialized medical triage and image review."""

import asyncio
import json
import logging
import re
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.routers.achievements import check_and_update
from app.services.ai_router import stream_chat_response
from app.services.limiter import (
    check_can_request,
    get_or_create_user,
    get_max_input_tokens_for,
    get_max_tokens_for,
    record_usage,
)
from app.services.safety import check_banned, check_blocked, inject_safety, log_violation

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/health", tags=["health"])

DEFAULT_HEALTH_MODEL = "gpt-5.5"
ALLOWED_HEALTH_MODELS = {"claude-opus-4.5", "gpt-5.5", "gemini-3.1-pro-preview"}
HEALTH_SCENARIOS = ("general", "skin", "eyes", "mouth", "nails", "moles")
HEALTH_RESPONSE_MODES = ("short", "balanced", "detailed", "doctor")

SCENARIO_GUIDES: dict[str, str] = {
    "general": (
        "Сфокусируйся на общих симптомах и жалобах. "
        "Если фото неинформативно, прямо скажи об этом и предложи уточнить симптомы."
    ),
    "skin": (
        "Фокус: кожа, высыпания, покраснение, шелушение, отёк, ранки, пигментация, воспаление, зуд. "
        "Отдельно оцени, похоже ли это на раздражение, аллергию, инфекцию, дерматит или акне."
    ),
    "eyes": (
        "Фокус: покраснение глаз, слезотечение, отёк век, выделения, травма, ощущение инородного тела, "
        "снижение зрения, боль, светобоязнь."
    ),
    "mouth": (
        "Фокус: губы, язык, дёсны, миндалины, слизистая, налёт, язвочки, трещины, отёк, боль при глотании, запах."
    ),
    "nails": (
        "Фокус: ногти, изменение цвета, формы, ломкость, расслоение, полосы, утолщение, воспаление вокруг ногтя, грибок."
    ),
    "moles": (
        "Фокус: родинки и пигментные пятна. Оцени асимметрию, края, цвет, диаметр, динамику изменений, кровоточивость, зуд."
    ),
}

CAN_ANALYZE = [
    "кожа, сыпь, покраснение, раздражение",
    "глаза и веки",
    "рот, язык, дёсны, горло",
    "ногти и кожа вокруг них",
    "родинки, пигментные пятна, подозрительные изменения",
    "общие симптомы, если пользователь описал их текстом",
]

CANNOT_ANALYZE = [
    "поставить точный диагноз по одному фото",
    "назначать лекарства, дозировки или схемы лечения",
    "заменять очный осмотр врача",
    "гарантировать, что ничего серьёзного нет",
    "интерпретировать анализы без контекста",
]

RED_FLAG_PATTERNS: tuple[re.Pattern[str], ...] = (
    re.compile(r"\b(chest pain|pain in chest|pressure in chest|shortness of breath|difficulty breathing|trouble breathing)\b", re.I),
    re.compile(r"\b(сильн[а-я ]*боль|боль в груди|трудно дышать|одышк[аеи]|затруднено дыхание)\b", re.I),
    re.compile(r"\b(vision loss|sudden vision change|eye pain|light sensitivity)\b", re.I),
    re.compile(r"\b(резкое ухудшение зрения|боль в глазу|светобоязнь)\b", re.I),
    re.compile(r"\b(bleeding heavily|heavy bleeding|blood vomiting|vomiting blood|black stool)\b", re.I),
    re.compile(r"\b(сильное кровотечение|рвота с кровью|чёрный стул)\b", re.I),
    re.compile(r"\b(fainting|passing out|seizure|confusion|unresponsive)\b", re.I),
    re.compile(r"\b(обморок|судорог[аи]|спутанность|не реагирует)\b", re.I),
    re.compile(r"\b(fever over 39|high fever|rapidly spreading rash|facial swelling)\b", re.I),
    re.compile(r"\b(температура выше 39|быстро распространяющ(ая|ий)ся сыпь|отёк лица)\b", re.I),
)


class HealthAnalyzeRequest(BaseModel):
    scenario: Literal["general", "skin", "eyes", "mouth", "nails", "moles"] = "general"
    model_id: str = DEFAULT_HEALTH_MODEL
    response_mode: Literal["short", "balanced", "detailed", "doctor"] = "balanced"
    messages: list[dict]

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, v):
        if len(v) > 20:
            raise ValueError("Too many messages (max 20)")
        for msg in v:
            content = msg.get("content")
            if isinstance(content, str) and len(content) > 100_000:
                raise ValueError("Message too long (max 100K chars)")
        return v

    @field_validator("model_id")
    @classmethod
    def validate_model_id(cls, v):
        if v not in ALLOWED_HEALTH_MODELS:
            return DEFAULT_HEALTH_MODEL
        return v


def _normalize_text(text: str) -> str:
    return " ".join(text.lower().split())


def _extract_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for item in content:
            if not isinstance(item, dict):
                continue
            if item.get("type") == "text" and isinstance(item.get("text"), str):
                parts.append(item["text"])
        return " ".join(parts)
    return ""


def _latest_user_text(messages: list[dict]) -> str:
    for msg in reversed(messages):
        if msg.get("role") == "user":
            return _extract_text(msg.get("content", ""))
    return ""


def _build_health_system_prompt(scenario: str) -> str:
    can_analyze = "\n".join(f"- {item}" for item in CAN_ANALYZE)
    cannot_analyze = "\n".join(f"- {item}" for item in CANNOT_ANALYZE)
    scenario_guide = SCENARIO_GUIDES.get(scenario, SCENARIO_GUIDES["general"])

    prompt = f"""
Ты медицинский AI-ассистент для предварительной оценки симптомов по фото и короткому описанию.
Ты НЕ врач, НЕ ставишь диагноз, НЕ назначаешь лечение и НЕ заменяешь очный осмотр.

Фокус сценария:
{scenario_guide}

Что можно анализировать:
{can_analyze}

Что нельзя:
{cannot_analyze}

Правила ответа:
- Сначала дай короткий вывод в 1-2 предложениях.
- Затем используй строгую структуру:
  1. Кратко
  2. Что видно
  3. Что это может быть
  4. Что делать сейчас
  5. Когда срочно к врачу
  6. К какому врачу обратиться
- Пиши короткими абзацами и буллетами, без воды.
- Описывай только то, что действительно видно или логично следует из сообщения пользователя.
- Если фото недостаточно чёткое, прямо скажи об этом.
- Давай 2-3 наиболее вероятные причины, от более частых к менее частым.
- Если уверенности мало, честно скажи, что данных недостаточно.
- Не используй пугающий тон без необходимости.
- Если есть признаки срочности, сразу укажи, что нужна неотложная помощь.
- Для врача пиши более клинически и конкретно, но без постановки диагноза.
- Если уместно, добавь 1-2 уточняющих вопроса в конце.
- Пиши на русском языке, чётко и практично.

Красные флаги для срочного обращения:
- боль в груди, одышка, выраженный отёк, нарушение сознания;
- сильное кровотечение, рвота с кровью, чёрный стул;
- резкое ухудшение зрения, сильная боль в глазу;
- быстро распространяющаяся сыпь с температурой;
- внезапное ухудшение состояния, обморок, судороги.
"""
    return inject_safety(prompt.strip())


def _build_response_mode_instruction(response_mode: str) -> str:
    if response_mode == "short":
        return (
            "Формат ответа: очень коротко и по делу. "
            "3-6 буллетов максимум. "
            "Без длинных пояснений, только суть."
        )
    if response_mode == "doctor":
        return (
            "Формат ответа: для врача. "
            "Пиши клинически, сухо и структурно. "
            "Используй краткие медицинские формулировки, отмечай ключевые признаки, "
            "красные флаги, наиболее вероятные варианты и что важно уточнить очно. "
            "Без эмоциональных фраз и без лишних пояснений для пациента."
        )
    if response_mode == "detailed":
        return (
            "Формат ответа: подробно и структурно. "
            "Можно добавить краткое объяснение причин, признаки, риски и что уточнить у врача. "
            "Не уходи в воду."
        )
    return (
        "Формат ответа: стандартно. "
        "Коротко, структурно, без лишней воды."
    )


def _detect_red_flag(text: str) -> str | None:
    normalized = _normalize_text(text)
    if not normalized:
        return None
    for pattern in RED_FLAG_PATTERNS:
        if pattern.search(normalized):
            return (
                "По описанию есть признаки, при которых лучше не ждать ответ ИИ. "
                "Нужна срочная очная помощь: обратитесь в неотложку или вызовите скорую, "
                "особенно если боль, одышка, кровотечение или ухудшение состояния усиливаются."
            )
    return None


@router.post("/analyze")
async def analyze_health(
    req: HealthAnalyzeRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tg_id = tg_user["id"]
    db_id = tg_user.get("db_id")
    await get_or_create_user(db, tg_user)

    if await check_banned(tg_id):
        raise HTTPException(403, "Ваш аккаунт заблокирован за нарушение правил.")

    if db_id:
        result = await db.execute(select(User).where(User.id == db_id))
    else:
        result = await db.execute(select(User).where(User.telegram_id == tg_id))
    db_user = result.scalar_one_or_none()

    byok_key = None
    using_byok = False
    if db_user and db_user.byok_enabled and db_user.byok_openrouter_key:
        byok_key = db_user.byok_openrouter_key
        using_byok = True

    last_text = _latest_user_text(req.messages)
    blocked = check_blocked(last_text)
    if blocked:
        asyncio.create_task(
            log_violation(
                tg_id,
                "health",
                last_text,
                blocked,
                username=db_user.username if db_user else None,
                email=db_user.email if db_user else None,
            )
        )

        async def blocked_gen():
            yield f'data: {json.dumps({"content": blocked})}\n\n'
            yield "data: [DONE]\n\n"

        return StreamingResponse(blocked_gen(), media_type="text/event-stream")

    emergency = _detect_red_flag(last_text)
    if emergency:
        async def emergency_gen():
            yield f'data: {json.dumps({"content": emergency})}\n\n'
            yield "data: [DONE]\n\n"

        return StreamingResponse(emergency_gen(), media_type="text/event-stream")

    model_id = req.model_id if req.model_id in ALLOWED_HEALTH_MODELS else DEFAULT_HEALTH_MODEL

    if not using_byok:
        check = await check_can_request(db, tg_id, model_id)
        if not check["allowed"]:
            is_locked = check.get("error") == "model_locked"
            status = 403 if is_locked else 429
            raise HTTPException(
                status_code=status,
                detail={
                    "error": check.get("error", check.get("reason", "limit")),
                    "message": check.get("reason", "Лимит исчерпан"),
                    "plan": check.get("plan", "free"),
                    "tier": check.get("tier", "free"),
                    "required_tier": check.get("required_tier"),
                    "used_today": check.get("used_today", 0),
                    "limit": check.get("limit", 0),
                    "need_balance": False,
                    "upgrade_url": "/pricing",
                },
            )

        delay = check.get("delay", 0)
        if delay > 0:
            await asyncio.sleep(delay)

        plan = check["plan"]
        billing_mode = check["billing"]
    else:
        plan = "byok"
        billing_mode = "byok"

    user_tier = (db_user.subscription_tier or "free") if db_user else "free"
    max_tokens = get_max_tokens_for(model_id, user_tier)
    max_input_tokens = get_max_input_tokens_for(model_id, user_tier)

    system_prompt = _build_health_system_prompt(req.scenario) + "\n\n" + _build_response_mode_instruction(req.response_mode)

    async def generate():
        usage_data = {"tokens_in": 0, "tokens_out": 0}
        had_error = False

        async for chunk in stream_chat_response(
            model_id,
            req.messages,
            system_prompt,
            byok_key=byok_key,
            max_tokens=max_tokens,
            max_input_tokens=max_input_tokens,
        ):
            yield chunk

            try:
                chunk_data = json.loads(chunk.replace("data: ", "", 1).strip())
                if isinstance(chunk_data, dict) and "error" in chunk_data:
                    had_error = True
                if isinstance(chunk_data, dict) and "usage" in chunk_data:
                    usage_data = chunk_data["usage"]
            except (json.JSONDecodeError, ValueError):
                pass

        if not using_byok and not had_error:
            tokens_in = usage_data.get("tokens_in", 0)
            tokens_out = usage_data.get("tokens_out", 0)

            billing_data = {
                "billing": {
                    "tokens_in": tokens_in,
                    "tokens_out": tokens_out,
                    "cost_usd": 0.0,
                    "balance_usd": float(db_user.balance_usd or 0) if db_user else 0.0,
                    "billing_mode": billing_mode,
                }
            }
            yield f"data: {json.dumps(billing_data)}\n\n"

            async def _record_usage_bg():
                try:
                    from app.database import async_session
                    from app.services.provider_costs import calculate_chat_provider_cost

                    provider_cost = calculate_chat_provider_cost(model_id, tokens_in, tokens_out)
                    async with async_session() as bg_db:
                        await record_usage(
                            bg_db,
                            tg_id,
                            model_id,
                            tokens_in=tokens_in,
                            tokens_out=tokens_out,
                            cost_usd=0.0,
                            provider_cost_usd=provider_cost,
                        )
                        await bg_db.commit()
                except Exception as e:
                    logger.error(f"Failed to record health usage: {e}")

            asyncio.create_task(_record_usage_bg())

            if db_user:
                asyncio.create_task(check_and_update(tg_id, "messages", db_user.total_requests or 1))

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
