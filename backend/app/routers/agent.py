"""AI Agent — autonomous multi-step task execution."""

from app.config import USD_TO_RUB
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


AGENT_SYSTEM = """You are an AI agent that breaks down tasks into steps and executes them.

For each step, respond with a JSON object:
{"step": <number>, "action": "<what you're doing>", "result": "<detailed result>", "done": <true/false>}

Rules:
- Break the task into 2-7 logical steps
- Each step should produce a concrete result
- When the task is complete, set "done": true and include a comprehensive final result
- Be thorough and provide useful, actionable output
- Always respond in the same language as the instruction"""


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

    steps = []
    messages = [
        {"role": "system", "content": AGENT_SYSTEM},
        {"role": "user", "content": instruction},
    ]
    total_cost = 0.0

    async with httpx.AsyncClient(timeout=60) as client:
        for step_num in range(1, max_steps + 1):
            try:
                resp = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openrouter_key}"},
                    json={
                        "model": get_openrouter_model(model_id),
                        "messages": messages,
                        "max_tokens": 2000,
                        "temperature": 0.3,
                    },
                )
                if resp.status_code != 200:
                    steps.append({"step": step_num, "action": "error", "result": f"API error: {resp.status_code}", "status": "failed"})
                    break

                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                total_cost += COST_PER_STEP_USD

                # Parse JSON from response with validation
                try:
                    json_match = content
                    if "```json" in content:
                        json_match = content.split("```json")[1].split("```")[0].strip()
                    elif "```" in content:
                        json_match = content.split("```")[1].split("```")[0].strip()
                    step_data = json.loads(json_match)
                    # Validate required fields
                    if not isinstance(step_data, dict):
                        raise ValueError("Not a dict")
                    step_data.setdefault("action", "processing")
                    step_data.setdefault("result", content)
                    step_data.setdefault("done", False)
                    # Sanitize: truncate overly long results
                    if isinstance(step_data.get("result"), str) and len(step_data["result"]) > 5000:
                        step_data["result"] = step_data["result"][:5000] + "..."
                    if isinstance(step_data.get("action"), str) and len(step_data["action"]) > 200:
                        step_data["action"] = step_data["action"][:200]
                except (json.JSONDecodeError, IndexError, ValueError):
                    step_data = {"step": step_num, "action": "processing", "result": content[:5000], "done": step_num >= max_steps}

                step_record = {
                    "step": step_num,
                    "action": str(step_data.get("action", "processing"))[:200],
                    "result": str(step_data.get("result", content))[:5000],
                    "status": "completed",
                }
                steps.append(step_record)

                messages.append({"role": "assistant", "content": content})

                # Update task in DB
                async with async_session() as db:
                    result = await db.execute(select(AgentTask).where(AgentTask.id == task_id))
                    task = result.scalar_one_or_none()
                    if task:
                        task.steps = steps
                        task.total_steps = step_num
                        task.total_cost_usd = total_cost
                        await db.commit()

                if step_data.get("done"):
                    break

                # Add follow-up prompt for next step
                messages.append({"role": "user", "content": "Continue to the next step."})

            except Exception as e:
                logger.error(f"Agent step {step_num} error: {e}")
                steps.append({"step": step_num, "action": "error", "result": str(e), "status": "failed"})
                break

    # Final update
    async with async_session() as db:
        result = await db.execute(select(AgentTask).where(AgentTask.id == task_id))
        task = result.scalar_one_or_none()
        if task:
            task.steps = steps
            task.total_steps = len(steps)
            task.total_cost_usd = total_cost
            task.status = "completed" if steps and steps[-1].get("status") == "completed" else "failed"
            task.result = steps[-1].get("result", "") if steps else "No results"
            task.completed_at = datetime.utcnow()

            # Deduct cost from user balance
            user = await db.execute(select(User).where(User.telegram_id == user_tg_id))
            u = user.scalar_one_or_none()
            if u:
                u.balance_usd = round(max(0, float(u.balance_usd or 0) - total_cost), 6)

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

    # Check balance
    user_result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = user_result.scalar_one_or_none()
    min_cost = body.max_steps * COST_PER_STEP_USD
    if user and float(user.balance_usd or 0) < min_cost:
        raise HTTPException(402, f"Недостаточно средств. Нужно ~{int(min_cost * USD_TO_RUB)}₽")

    # Check active tasks limit
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
        select(AgentTask).where(
            AgentTask.id == task_id,
            AgentTask.user_tg_id == tg_user["id"],
        )
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
