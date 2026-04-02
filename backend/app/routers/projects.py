"""Projects CRUD — user brands/businesses for AI context."""

import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, update, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.project import Project
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/projects", tags=["projects"])

PLAN_LIMITS = {"free": 1, "per_token": 1, "mini": 3, "start": 3, "max": 10, "pro": 10, "max-pro": 999, "elite": 999}


class ProductItem(BaseModel):
    name: str
    description: str = ""
    price: str | None = None


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    audience: str | None = None
    tone: str | None = None
    products: list[ProductItem] | None = None
    keywords: list[str] | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    audience: str | None = None
    tone: str | None = None
    products: list[ProductItem] | None = None
    keywords: list[str] | None = None


def _project_dict(p: Project) -> dict:
    return {
        "id": p.id, "name": p.name, "description": p.description,
        "audience": p.audience, "tone": p.tone,
        "products": p.products, "keywords": p.keywords,
        "is_default": p.is_default,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


async def _get_user_plan(db: AsyncSession, tg_id: int) -> str:
    result = await db.execute(select(User).where(User.telegram_id == tg_id))
    user = result.scalar_one_or_none()
    return (user.subscription_tier or "free") if user else "free"


@router.get("/")
async def list_projects(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tg_id = user["id"]
    result = await db.execute(
        select(Project).where(Project.user_tg_id == tg_id)
        .order_by(Project.is_default.desc(), Project.created_at.desc())
    )
    projects = result.scalars().all()
    plan = await _get_user_plan(db, tg_id)
    limit = PLAN_LIMITS.get(plan, 1)
    return {
        "projects": [_project_dict(p) for p in projects],
        "plan": plan,
        "limit": limit,
        "count": len(projects),
    }


@router.post("/")
async def create_project(data: ProjectCreate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tg_id = user["id"]
    count_q = select(func.count()).select_from(Project).where(Project.user_tg_id == tg_id)
    current_count = (await db.execute(count_q)).scalar()

    plan = await _get_user_plan(db, tg_id)
    limit = PLAN_LIMITS.get(plan, 1)
    if current_count >= limit:
        raise HTTPException(403, f"Лимит проектов для тарифа: {limit}")

    project = Project(
        user_tg_id=tg_id,
        name=data.name,
        description=data.description,
        audience=data.audience,
        tone=data.tone,
        products=[p.model_dump() for p in data.products] if data.products else None,
        keywords=data.keywords or [],
        is_default=(current_count == 0),
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return _project_dict(project)


@router.get("/{project_id}")
async def get_project(project_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tg_id = user["id"]
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_tg_id == tg_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Проект не найден")
    return _project_dict(project)


@router.put("/{project_id}")
async def update_project(project_id: str, data: ProjectUpdate, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tg_id = user["id"]
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_tg_id == tg_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Проект не найден")

    update_data = data.model_dump(exclude_unset=True)
    if "products" in update_data and update_data["products"]:
        update_data["products"] = [p.model_dump() if hasattr(p, "model_dump") else p for p in update_data["products"]]
    for key, value in update_data.items():
        setattr(project, key, value)
    await db.commit()
    await db.refresh(project)
    return _project_dict(project)


@router.delete("/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tg_id = user["id"]
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_tg_id == tg_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Проект не найден")
    await db.delete(project)
    await db.commit()
    return {"ok": True}


@router.post("/{project_id}/set-default")
async def set_default(project_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tg_id = user["id"]
    await db.execute(update(Project).where(Project.user_tg_id == tg_id).values(is_default=False))
    result = await db.execute(select(Project).where(Project.id == project_id, Project.user_tg_id == tg_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(404, "Проект не найден")
    project.is_default = True
    await db.commit()
    return {"ok": True}


def build_project_context(project: Project) -> str:
    """Build system prompt context from project data."""
    parts = ["Контекст бренда пользователя — учитывай во всех ответах:"]
    parts.append(f"Компания: {project.name}")
    if project.description:
        parts.append(f"Описание: {project.description}")
    if project.audience:
        parts.append(f"Целевая аудитория: {project.audience}")
    if project.tone:
        tone_map = {
            "formal": "Формальный, деловой",
            "friendly": "Дружелюбный, неформальный",
            "professional": "Профессиональный, экспертный",
            "casual": "Свободный, разговорный",
        }
        parts.append(f"Тон общения: {tone_map.get(project.tone, project.tone)}")
    if project.products:
        names = [p.get("name", "") for p in project.products if isinstance(p, dict)]
        if names:
            parts.append(f"Продукты/услуги: {', '.join(names)}")
    if project.keywords:
        parts.append(f"Ключевые слова: {', '.join(project.keywords)}")
    return "\n".join(parts)
