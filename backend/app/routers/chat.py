"""Chat endpoint — streaming AI responses via SSE."""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.ai_router import stream_chat_response, get_model_tier, DEFAULT_MODEL
from app.services.limiter import get_today_usage, record_usage, get_or_create_user
from app.services.credits import check_can_use_premium, deduct_credits, get_credit_cost

router = APIRouter(prefix="/api", tags=["chat"])

LITE_DAILY_LIMIT = 20


class ChatRequest(BaseModel):
    model_id: str = DEFAULT_MODEL
    messages: list[dict]
    system_prompt: str | None = None


@router.post("/chat")
async def chat(
    req: ChatRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tg_id = tg_user["id"]
    await get_or_create_user(db, tg_user)

    # Check BYOK
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    db_user = result.scalar_one_or_none()
    byok_key = None
    using_byok = bool(db_user and db_user.byok_enabled and db_user.byok_openrouter_key)
    if using_byok:
        byok_key = db_user.byok_openrouter_key

    tier = get_model_tier(req.model_id)
    credit_cost = 0

    if not using_byok:
        if tier == "lite":
            # Free with daily limit
            used_today = await get_today_usage(db, tg_id, "lite")
            if used_today >= LITE_DAILY_LIMIT:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": f"Лимит {LITE_DAILY_LIMIT} бесплатных запросов в день исчерпан. Попробуй завтра или используй кредиты для Premium моделей.",
                        "tier": "lite",
                        "used_today": used_today,
                        "limit": LITE_DAILY_LIMIT,
                    },
                )
        else:
            # Premium — requires credits
            check = await check_can_use_premium(db, tg_id, req.model_id)
            if not check["allowed"]:
                raise HTTPException(
                    status_code=402,
                    detail={
                        "error": check["reason"],
                        "tier": "premium",
                        "cost": check["cost"],
                        "balance": check["balance"],
                        "need_credits": True,
                    },
                )
            credit_cost = check["cost"]
            # Deduct credits before streaming
            await deduct_credits(db, tg_id, credit_cost)
            await db.commit()

    # Stream response
    async def generate():
        usage_data = {"tokens_in": 0, "tokens_out": 0}

        async for chunk in stream_chat_response(req.model_id, req.messages, req.system_prompt, byok_key=byok_key):
            yield chunk
            if '"usage"' in chunk:
                import json
                try:
                    data = json.loads(chunk.replace("data: ", "").strip())
                    if "usage" in data:
                        usage_data = data["usage"]
                except Exception:
                    pass

        await record_usage(
            db, tg_id, req.model_id,
            tokens_in=usage_data.get("tokens_in", 0),
            tokens_out=usage_data.get("tokens_out", 0),
        )
        await db.commit()

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


router = APIRouter(prefix="/api", tags=["chat"])


class ChatRequest(BaseModel):
    model_id: str = DEFAULT_MODEL
    messages: list[dict]  # [{"role": "user", "content": "..."}, ...]
    system_prompt: str | None = None


@router.post("/chat")
async def chat(
    req: ChatRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Stream chat completion.

    Request body:
        model_id: str — one of our model IDs
        messages: list — conversation history
        system_prompt: optional str — custom system prompt (PLUS/MAX only)

    Returns: SSE stream with JSON chunks
    """
    tg_id = tg_user["id"]

    # Ensure user exists in DB
    await get_or_create_user(db, tg_user)

    # Check if user has BYOK enabled — if yes, skip rate limits
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    db_user = result.scalar_one_or_none()
    byok_key = None
    using_byok = False

    if db_user and db_user.byok_enabled and db_user.byok_openrouter_key:
        byok_key = db_user.byok_openrouter_key
        using_byok = True

    if not using_byok:
        # Check rate limits only for platform key users
        check = await check_can_request(db, tg_id, req.model_id)
        if not check["allowed"]:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": check["reason"],
                    "plan": check["plan"],
                    "tier": check["tier"],
                    "used_today": check["used_today"],
                    "limit": check["limit"],
                },
            )
        plan = check["plan"]
    else:
        plan = "byok"

    # System prompt only for subscribers or BYOK users
    system_prompt = None
    if req.system_prompt and (using_byok or plan in ("plus", "max")):
        system_prompt = req.system_prompt

    # Stream response
    async def generate():
        usage_data = {"tokens_in": 0, "tokens_out": 0}

        async for chunk in stream_chat_response(req.model_id, req.messages, system_prompt, byok_key=byok_key):
            yield chunk
            if '"usage"' in chunk:
                import json
                try:
                    data = json.loads(chunk.replace("data: ", "").strip())
                    if "usage" in data:
                        usage_data = data["usage"]
                except Exception:
                    pass

        # Record usage after streaming (for BYOK users too — stats only)
        await record_usage(
            db, tg_id, req.model_id,
            tokens_in=usage_data.get("tokens_in", 0),
            tokens_out=usage_data.get("tokens_out", 0),
        )
        await db.commit()

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )

