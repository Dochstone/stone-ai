"""Chat endpoint — streaming AI responses via SSE with per-token billing."""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services.ai_router import stream_chat_response, get_model_tier, DEFAULT_MODEL
from app.services.limiter import (
    get_or_create_user,
    check_can_request,
    record_usage,
    MAX_TOKENS_LITE,
    MAX_TOKENS_PAID,
)
from app.services.token_billing import calculate_cost, deduct_balance, get_weighted_price

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


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
    """
    Stream chat completion with per-token billing.

    Flow:
    1. Check limits (10+5 for lite, balance for premium)
    2. Stream response → collect actual token usage
    3. Calculate real cost from tokens
    4. Deduct USD AFTER streaming (not before)
    5. Send billing info as final SSE chunk
    """
    tg_id = tg_user["id"]
    await get_or_create_user(db, tg_user)

    # Check BYOK
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    db_user = result.scalar_one_or_none()
    byok_key = None
    using_byok = False

    if db_user and db_user.byok_enabled and db_user.byok_openrouter_key:
        byok_key = db_user.byok_openrouter_key
        using_byok = True

    billing_mode = "free"

    if not using_byok:
        check = await check_can_request(db, tg_id, req.model_id)
        if not check["allowed"]:
            status = 402 if check["tier"] == "premium" else 429
            raise HTTPException(
                status_code=status,
                detail={
                    "error": check["reason"],
                    "plan": check["plan"],
                    "tier": check["tier"],
                    "used_today": check["used_today"],
                    "limit": check["limit"],
                    "need_balance": check["billing"] == "per_token",
                },
            )
        plan = check["plan"]
        billing_mode = check["billing"]
    else:
        plan = "byok"

    # System prompt only for subscribers or BYOK users
    system_prompt = None
    if req.system_prompt and (using_byok or plan in ("plus", "max")):
        system_prompt = req.system_prompt

    # Dynamic max_tokens based on billing mode
    max_tokens = MAX_TOKENS_LITE if billing_mode == "free" else MAX_TOKENS_PAID

    # Stream response
    async def generate():
        usage_data = {"tokens_in": 0, "tokens_out": 0}
        had_error = False

        async for chunk in stream_chat_response(req.model_id, req.messages, system_prompt, byok_key=byok_key, max_tokens=max_tokens):
            yield chunk

            # Check for error in stream
            if '"error"' in chunk:
                had_error = True

            # Extract usage data from the usage chunk
            if '"usage"' in chunk:
                try:
                    data = json.loads(chunk.replace("data: ", "").strip())
                    if "usage" in data:
                        usage_data = data["usage"]
                except Exception:
                    pass

        tokens_in = usage_data.get("tokens_in", 0)
        tokens_out = usage_data.get("tokens_out", 0)

        # Calculate real cost and deduct if per_token billing
        real_cost = 0.0
        new_balance = 0.0

        if not using_byok and not had_error:
            if billing_mode == "per_token":
                real_cost = calculate_cost(req.model_id, tokens_in, tokens_out)
                if real_cost > 0:
                    deduct_result = await deduct_balance(db, tg_id, real_cost)
                    new_balance = deduct_result["new_balance"]
                    real_cost = deduct_result["deducted"]
                    logger.info(
                        f"Per-token billing: user={tg_id}, model={req.model_id}, "
                        f"tokens={tokens_in}+{tokens_out}, cost=${real_cost:.6f}, "
                        f"balance=${new_balance:.6f}"
                    )

            # Record usage with cost
            await record_usage(
                db, tg_id, req.model_id,
                tokens_in=tokens_in,
                tokens_out=tokens_out,
                cost_usd=real_cost,
            )

            # Send billing info as final SSE chunk (before [DONE])
            billing_data = {
                "billing": {
                    "tokens_in": tokens_in,
                    "tokens_out": tokens_out,
                    "cost_usd": real_cost,
                    "balance_usd": new_balance,
                    "model_price_per_m": get_weighted_price(req.model_id),
                    "billing_mode": billing_mode,
                }
            }
            yield f"data: {json.dumps(billing_data)}\n\n"

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
