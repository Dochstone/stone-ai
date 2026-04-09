"""AI Agent — autonomous multi-step task execution with chain-of-thought planning."""

from app.config import USD_TO_RUB
import asyncio
import json
import logging
import os
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session
from app.middleware.auth import get_current_user
from app.models.agent_task import AgentTask
from app.models.user import User
from app.services.ai_router import get_openrouter_model
from app.middleware.rate_limit import agent_run_limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/agent", tags=["agent"])

COST_PER_STEP_USD = 0.005  # ~0.5 RUB per step


class RunAgentRequest(BaseModel):
    instruction: str = Field(max_length=2000)
    model_id: str = "gpt-4o-mini"
    max_steps: int = Field(default=5, ge=1, le=10)


AGENT_SYSTEM = (
    "You are an expert AI agent. Each response must be a single valid JSON object (no markdown, no backticks).\n\n"
    "Workflow:\n"
    "STEP 0 — PLAN: {\"step\":0, \"action\":\"Planning\", \"result\":\"1. ...\\n2. ...\", \"done\":false}\n"
    "STEPS 1-N — EXECUTION: {\"step\":N, \"action\":\"<name>\", \"result\":\"<detailed result>\", \"done\":false}\n"
    "FINAL STEP: {\"step\":N, \"action\":\"Summary\", \"result\":\"<comprehensive summary>\", \"done\":true}\n\n"
    "Be thorough with data, examples, and specifics. Respond in the same language as the user's instruction."
)


async def _call_openrouter(client: httpx.AsyncClient, key: str, model: str, messages: list) -> dict:
    """Call OpenRouter API with one retry on transient errors."""
    for attempt in range(2):
        try:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {key}"},
                json={"model": model, "messages": messages, "max_tokens": 4096, "temperature": 0.3},
            )
            if resp.status_code == 200:
                return resp.json()
            if attempt == 0 and resp.status_code >= 500:
                await asyncio.sleep(2)
                continue
            return {"error": resp.status_code}
        except httpx.TimeoutException:
            if attempt == 0:
                await asyncio.sleep(2)
                continue
            return {"error": "timeout"}
    return {"error": "retry_exhausted"}


def _parse_step(content: str, step_num: int, max_steps: int) -> dict:
    """Extract step JSON from LLM response."""
    try:
        text = content
        if "```json" in content:
            text = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            text = content.split("```")[1].split("```")[0].strip()
        data = json.loads(text)
        if not isinstance(data, dict):
            raise ValueError("Not a dict")
        data.setdefault("action", "processing")
        data.setdefault("result", content)
        data.setdefault("done", False)
        if isinstance(data.get("result"), str) and len(data["result"]) > 5000:
            data["result"] = data["result"][:5000] + "..."
        if isinstance(data.get("action"), str) and len(data["action"]) > 200:
            data["action"] = data["action"][:200]
        return data
    except (json.JSONDecodeError, IndexError, ValueError):
        return {"step": step_num, "action": "processing", "result": content[:5000], "done": step_num >= max_steps}


async def run_agent_task(task_id: int, instruction: str, model_id: str, max_steps: int, user_tg_id: int):
    """Background task to execute agent steps."""
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if not openrouter_key:
        async with async_session() as db:
            result = await db.execute(select(AgentTask).where(AgentTask.id == task_id))
            task = result.scalar_one_or_none()
            if task:
                task.status = "failed"
                task.result = "API key not configured"
                await db.commit()
        return

    from app.services.safety import inject_safety, check_blocked, log_violation
    blocked = check_blocked(instruction)
    if blocked:
        await log_violation(user_tg_id, "agent", instruction, blocked)
        async with async_session() as db:
            result = await db.execute(select(AgentTask).where(AgentTask.id == task_id))
            task = result.scalar_one_or_none()
            if task:
                task.status = "failed"
                task.result = blocked
                await db.commit()
        return

    steps = []
    messages = [
        {"role": "system", "content": inject_safety(AGENT_SYSTEM)},
        {"role": "user", "content": instruction},
    ]
    total_cost = 0.0
    or_model = get_openrouter_model(model_id)
    # max_steps + 1 to account for step 0 (plan)
    total_allowed = max_steps + 1

    async with httpx.AsyncClient(timeout=60) as client:
        for step_num in range(total_allowed):
            # Check if task was cancelled
            async with async_session() as db:
                res = await db.execute(select(AgentTask.status).where(AgentTask.id == task_id))
                current_status = res.scalar_one_or_none()
                if current_status == "cancelled":
                    return

            data = await _call_openrouter(client, openrouter_key, or_model, messages)

            if "error" in data:
                steps.append({"step": step_num, "action": "error", "result": f"API error: {data['error']}", "status": "failed"})
                break

            content = data["choices"][0]["message"]["content"]
            total_cost += COST_PER_STEP_USD
            step_data = _parse_step(content, step_num, total_allowed - 1)

            steps.append({
                "step": step_num,
                "action": str(step_data.get("action", "processing"))[:200],
                "result": str(step_data.get("result", content))[:5000],
                "status": "completed",
            })
            messages.append({"role": "assistant", "content": content})

            # Update progress in DB
            async with async_session() as db:
                result = await db.execute(select(AgentTask).where(AgentTask.id == task_id))
                task = result.scalar_one_or_none()
                if task:
                    task.steps = steps
                    task.total_steps = len(steps)
                    task.total_cost_usd = total_cost
                    await db.commit()

            if step_data.get("done"):
                break

            # Follow-up prompt with step reference
            next_step = step_num + 1
            messages.append({
                "role": "user",
                "content": f"Good. Now execute step {next_step} from your plan. Be thorough and provide actionable details.",
            })

    # Final update
    async with async_session() as db:
        result = await db.execute(select(AgentTask).where(AgentTask.id == task_id))
        task = result.scalar_one_or_none()
        if task and task.status != "cancelled":
            task.steps = steps
            task.total_steps = len(steps)
            task.total_cost_usd = total_cost
            task.status = "completed" if steps and steps[-1].get("status") == "completed" else "failed"
            task.result = steps[-1].get("result", "") if steps else "No results"
            task.completed_at = datetime.utcnow()

            user = await db.execute(select(User).where(User.telegram_id == user_tg_id))
            u = user.scalar_one_or_none()
            if u:
                u.balance_usd = round(max(0, float(u.balance_usd or 0) - total_cost), 6)
                u.total_requests = (u.total_requests or 0) + 1

            await db.commit()


@router.post("/run")
async def run_agent(
    body: RunAgentRequest,
    background_tasks: BackgroundTasks,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start an agent task."""
    tg_id = tg_user["id"]
    agent_run_limiter.check(str(tg_id))

    user_result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = user_result.scalar_one_or_none()
    min_cost = body.max_steps * COST_PER_STEP_USD
    if user and float(user.balance_usd or 0) < min_cost:
        raise HTTPException(402, f"Недостаточно средств. Нужно ~{int(min_cost * USD_TO_RUB)}₽")

    active = await db.scalar(
        select(func.count()).select_from(AgentTask).where(
            AgentTask.user_tg_id == tg_id,
            AgentTask.status == "running",
        )
    )
    if active >= 3:
        raise HTTPException(429, "Максимум 3 одновременных задачи")

    task = AgentTask(
        user_tg_id=tg_id,
        title=body.instruction[:100],
        instruction=body.instruction,
        model_id=body.model_id,
        status="running",
    )
    db.add(task)
    await db.flush()

    background_tasks.add_task(run_agent_task, task.id, body.instruction, body.model_id, body.max_steps, tg_id)
    return {"id": task.id, "status": "running"}


@router.post("/tasks/{task_id}/cancel")
async def cancel_task(
    task_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a running task."""
    result = await db.execute(
        select(AgentTask).where(AgentTask.id == task_id, AgentTask.user_tg_id == tg_user["id"])
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Задача не найдена")
    if task.status != "running":
        raise HTTPException(400, "Задача не выполняется")
    task.status = "cancelled"
    task.completed_at = datetime.utcnow()
    await db.commit()
    return {"status": "cancelled"}


@router.get("/tasks")
async def list_tasks(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List user's agent tasks."""
    result = await db.execute(
        select(AgentTask)
        .where(AgentTask.user_tg_id == tg_user["id"])
        .order_by(AgentTask.created_at.desc())
        .limit(20)
    )
    tasks = result.scalars().all()
    return {
        "tasks": [
            {
                "id": t.id,
                "title": t.title,
                "status": t.status,
                "total_steps": t.total_steps,
                "total_cost_usd": t.total_cost_usd,
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "completed_at": t.completed_at.isoformat() if t.completed_at else None,
            }
            for t in tasks
        ]
    }


@router.get("/tasks/{task_id}")
async def get_task(
    task_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get task details with steps."""
    result = await db.execute(
        select(AgentTask).where(AgentTask.id == task_id, AgentTask.user_tg_id == tg_user["id"])
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(404, "Задача не найдена")

    return {
        "id": task.id,
        "title": task.title,
        "instruction": task.instruction,
        "status": task.status,
        "steps": task.steps or [],
        "result": task.result,
        "model_id": task.model_id,
        "total_steps": task.total_steps,
        "total_cost_usd": task.total_cost_usd,
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "completed_at": task.completed_at.isoformat() if task.completed_at else None,
    }
