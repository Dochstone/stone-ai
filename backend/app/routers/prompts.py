"""Prompt library — curated templates + user saved prompts."""

from app.config import USD_TO_RUB
import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.prompt_template import PromptTemplate, SavedPrompt, TemplateLike
from app.routers.achievements import check_and_update

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["prompts"])


# ─── Public: list templates ───

@router.get("/prompts/templates")
async def list_templates(
    category: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(PromptTemplate).where(PromptTemplate.is_system == True)
    if category:
        query = query.where(PromptTemplate.category == category)
    if search:
        query = query.where(PromptTemplate.title.ilike(f"%{search}%"))
    query = query.order_by(PromptTemplate.usage_count.desc())
    result = await db.execute(query)
    templates = result.scalars().all()
    return {
        "templates": [
            {
                "id": t.id, "category": t.category, "title": t.title,
                "description": t.description, "content": t.content,
                "variables": t.variables, "usage_count": t.usage_count,
                "default_model": t.default_model, "cost_rub": t.cost_rub, "icon": t.icon,
            }
            for t in templates
        ]
    }


@router.post("/prompts/templates/{template_id}/use")
async def track_usage(template_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PromptTemplate).where(PromptTemplate.id == template_id))
    tpl = result.scalar_one_or_none()
    if not tpl:
        raise HTTPException(404, "Template not found")
    tpl.usage_count += 1
    await db.commit()
    return {"ok": True}


# ─── Saved prompts (auth required) ───

class SavePromptRequest(BaseModel):
    template_id: str | None = None
    title: str
    custom_content: str | None = None


@router.get("/prompts/saved")
async def get_saved(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tg_id = user["id"]
    result = await db.execute(
        select(SavedPrompt).where(SavedPrompt.user_tg_id == tg_id).order_by(SavedPrompt.created_at.desc())
    )
    saved = result.scalars().all()
    return {
        "saved": [
            {"id": s.id, "template_id": s.template_id, "title": s.title, "custom_content": s.custom_content}
            for s in saved
        ]
    }


@router.post("/prompts/saved")
async def save_prompt(body: SavePromptRequest, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tg_id = user["id"]
    sp = SavedPrompt(user_tg_id=tg_id, template_id=body.template_id, title=body.title, custom_content=body.custom_content)
    db.add(sp)
    await db.commit()
    return {"id": sp.id, "ok": True}


@router.delete("/prompts/saved/{prompt_id}")
async def delete_saved(prompt_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tg_id = user["id"]
    result = await db.execute(
        select(SavedPrompt).where(SavedPrompt.id == prompt_id, SavedPrompt.user_tg_id == tg_id)
    )
    sp = result.scalar_one_or_none()
    if not sp:
        raise HTTPException(404, "Not found")
    await db.delete(sp)
    await db.commit()
    return {"ok": True}


# ─── Marketplace ───

@router.get("/prompts/marketplace")
async def marketplace_list(
    category: str | None = None,
    search: str | None = None,
    sort: str = "popular",
    limit: int = 12,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """Public marketplace — community templates."""
    query = select(PromptTemplate).where(PromptTemplate.is_public == True)
    if category:
        query = query.where(PromptTemplate.category == category)
    if search:
        query = query.where(
            PromptTemplate.title.ilike(f"%{search}%") | PromptTemplate.description.ilike(f"%{search}%")
        )
    if sort == "newest":
        query = query.order_by(PromptTemplate.created_at.desc())
    else:
        query = query.order_by(PromptTemplate.likes.desc(), PromptTemplate.usage_count.desc())
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    templates = result.scalars().all()

    count_q = select(func.count()).select_from(PromptTemplate).where(PromptTemplate.is_public == True)
    if category:
        count_q = count_q.where(PromptTemplate.category == category)
    if search:
        count_q = count_q.where(
            PromptTemplate.title.ilike(f"%{search}%") | PromptTemplate.description.ilike(f"%{search}%")
        )
    total = (await db.execute(count_q)).scalar() or 0

    return {
        "templates": [
            {
                "id": t.id, "category": t.category, "title": t.title,
                "description": t.description, "content": t.content,
                "variables": t.variables, "usage_count": t.usage_count,
                "likes": t.likes, "author_name": t.author_name,
                "author_tg_id": t.author_tg_id,
                "default_model": t.default_model, "cost_rub": t.cost_rub,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in templates
        ],
        "total": total,
    }


class PublishTemplateRequest(BaseModel):
    title: str
    description: str
    content: str
    variables: list[dict] | None = None
    category: str


@router.post("/prompts/publish")
async def publish_template(
    body: PublishTemplateRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Publish a user template to the marketplace."""
    if len(body.title.strip()) < 3:
        raise HTTPException(400, "Название должно содержать минимум 3 символа")
    if len(body.content.strip()) < 10:
        raise HTTPException(400, "Шаблон должен содержать минимум 10 символов")

    valid_categories = {"marketing", "smm", "seo", "copywriting", "code", "business"}
    if body.category not in valid_categories:
        raise HTTPException(400, f"Категория должна быть одной из: {', '.join(valid_categories)}")

    tg_id = user["id"]
    author_name = user.get("first_name") or user.get("username") or "Аноним"

    tpl = PromptTemplate(
        category=body.category,
        title=body.title.strip(),
        description=body.description.strip(),
        content=body.content.strip(),
        variables=body.variables,
        is_system=False,
        is_public=True,
        author_tg_id=tg_id,
        author_name=author_name,
    )
    db.add(tpl)
    await db.commit()
    await db.refresh(tpl)

    return {"id": tpl.id, "ok": True}


@router.post("/prompts/templates/{template_id}/like")
async def like_template(
    template_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle like on a template."""
    tg_id = user["id"]

    result = await db.execute(select(PromptTemplate).where(PromptTemplate.id == template_id))
    tpl = result.scalar_one_or_none()
    if not tpl:
        raise HTTPException(404, "Шаблон не найден")

    existing = await db.execute(
        select(TemplateLike).where(TemplateLike.template_id == template_id, TemplateLike.user_tg_id == tg_id)
    )
    like = existing.scalar_one_or_none()

    if like:
        await db.delete(like)
        tpl.likes = max(0, tpl.likes - 1)
        liked = False
    else:
        db.add(TemplateLike(template_id=template_id, user_tg_id=tg_id))
        tpl.likes += 1
        liked = True

    await db.commit()
    return {"ok": True, "liked": liked, "likes": tpl.likes}


class RateRequest(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=500)


@router.post("/prompts/templates/{template_id}/rate")
async def rate_template(
    template_id: str,
    body: RateRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rate a template 1-5 stars."""
    tg_id = user["id"]
    from app.models.prompt_template import TemplateRating

    result = await db.execute(select(PromptTemplate).where(PromptTemplate.id == template_id))
    tpl = result.scalar_one_or_none()
    if not tpl:
        raise HTTPException(404, "Шаблон не найден")

    existing = await db.execute(
        select(TemplateRating).where(TemplateRating.template_id == template_id, TemplateRating.user_tg_id == tg_id)
    )
    rating = existing.scalar_one_or_none()

    if rating:
        rating.rating = body.rating
        rating.comment = body.comment
    else:
        db.add(TemplateRating(template_id=template_id, user_tg_id=tg_id, rating=body.rating, comment=body.comment))

    # Calc average
    avg_result = await db.execute(
        select(func.avg(TemplateRating.rating), func.count()).select_from(TemplateRating).where(TemplateRating.template_id == template_id)
    )
    row = avg_result.one()
    avg_rating = round(float(row[0] or 0), 1)
    rating_count = int(row[1] or 0)

    return {"ok": True, "avg_rating": avg_rating, "rating_count": rating_count, "your_rating": body.rating}


@router.get("/prompts/templates/{template_id}/ratings")
async def get_ratings(
    template_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Get ratings for a template."""
    from app.models.prompt_template import TemplateRating
    result = await db.execute(
        select(TemplateRating).where(TemplateRating.template_id == template_id).order_by(TemplateRating.created_at.desc()).limit(20)
    )
    ratings = result.scalars().all()
    avg_result = await db.execute(
        select(func.avg(TemplateRating.rating), func.count()).select_from(TemplateRating).where(TemplateRating.template_id == template_id)
    )
    row = avg_result.one()
    return {
        "avg_rating": round(float(row[0] or 0), 1),
        "rating_count": int(row[1] or 0),
        "ratings": [{"rating": r.rating, "comment": r.comment, "created_at": r.created_at.isoformat() if r.created_at else None} for r in ratings],
    }


@router.delete("/prompts/marketplace/{template_id}")
async def delete_marketplace_template(
    template_id: str,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove own template from marketplace."""
    tg_id = user["id"]
    result = await db.execute(
        select(PromptTemplate).where(PromptTemplate.id == template_id, PromptTemplate.author_tg_id == tg_id)
    )
    tpl = result.scalar_one_or_none()
    if not tpl:
        raise HTTPException(404, "Шаблон не найден или нет доступа")
    await db.delete(tpl)
    await db.commit()
    return {"ok": True}


@router.get("/prompts/marketplace/my")
async def my_marketplace_templates(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List templates published by the current user."""
    tg_id = user["id"]
    result = await db.execute(
        select(PromptTemplate)
        .where(PromptTemplate.author_tg_id == tg_id, PromptTemplate.is_public == True)
        .order_by(PromptTemplate.created_at.desc())
    )
    templates = result.scalars().all()
    return {
        "templates": [
            {
                "id": t.id, "category": t.category, "title": t.title,
                "description": t.description, "content": t.content,
                "variables": t.variables, "usage_count": t.usage_count,
                "likes": t.likes, "author_name": t.author_name,
                "created_at": t.created_at.isoformat() if t.created_at else None,
            }
            for t in templates
        ]
    }


@router.get("/prompts/marketplace/liked")
async def my_liked_templates(
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List template IDs the current user has liked."""
    tg_id = user["id"]
    result = await db.execute(
        select(TemplateLike.template_id).where(TemplateLike.user_tg_id == tg_id)
    )
    return {"liked_ids": [row[0] for row in result.all()]}


# ─── DB migration helper ───

@router.post("/prompts/migrate-marketplace")
async def migrate_marketplace(db: AsyncSession = Depends(get_db)):
    """Run ALTER TABLE to add marketplace columns. Safe to call multiple times."""
    from sqlalchemy import text
    migrations = [
        "ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS author_tg_id BIGINT",
        "ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false",
        "ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0",
        "ALTER TABLE prompt_templates ADD COLUMN IF NOT EXISTS author_name VARCHAR(100)",
        """CREATE TABLE IF NOT EXISTS template_likes (
            id VARCHAR(36) PRIMARY KEY,
            template_id VARCHAR(36) NOT NULL,
            user_tg_id BIGINT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(template_id, user_tg_id)
        )""",
        "CREATE INDEX IF NOT EXISTS ix_template_likes_template_id ON template_likes(template_id)",
        "CREATE INDEX IF NOT EXISTS ix_template_likes_user_tg_id ON template_likes(user_tg_id)",
    ]
    for sql in migrations:
        await db.execute(text(sql))
    await db.commit()
    return {"ok": True, "message": "Marketplace migration complete"}


@router.post("/prompts/seed-marketplace")
async def seed_marketplace(db: AsyncSession = Depends(get_db)):
    """Seed marketplace with starter templates. Idempotent."""
    from sqlalchemy import text
    import uuid as _uuid, json as _json

    existing = await db.execute(text("SELECT COUNT(*) FROM prompt_templates WHERE is_public=true"))
    count = existing.scalar()
    if count and count >= 10:
        return {"ok": True, "message": f"Already seeded ({count})", "count": count}

    seeds = [
        ("marketing", "Анализ ЦА", "Портрет целевой аудитории", "Проведи анализ ЦА для продукта: {product}. Ниша: {niche}.\n\nОпиши: демография, психография, боли, триггеры покупки, возражения.", [{"name": "product", "label": "Продукт", "placeholder": "Онлайн-курс"}, {"name": "niche", "label": "Ниша", "placeholder": "EdTech"}]),
        ("marketing", "5 рекламных офферов", "Цепляющие офферы для рекламы", "Создай 5 офферов для: {product}.\nАудитория: {audience}.\nБоль: {pain}.\nКаждый до 150 символов с CTA.", [{"name": "product", "label": "Продукт", "placeholder": "CRM"}, {"name": "audience", "label": "Аудитория", "placeholder": "Бизнес"}, {"name": "pain", "label": "Боль", "placeholder": "Теряют заявки"}]),
        ("marketing", "SWOT-анализ", "Сильные/слабые стороны бизнеса", "SWOT для {company}. Отрасль: {industry}. Конкуренты: {competitors}.\nПо 5-7 пунктов + 3 рекомендации.", [{"name": "company", "label": "Компания", "placeholder": "Магазин"}, {"name": "industry", "label": "Отрасль", "placeholder": "E-commerce"}, {"name": "competitors", "label": "Конкуренты", "placeholder": "WB, Ozon"}]),
        ("smm", "Контент-план на месяц", "30 идей постов с типами и форматами", "Контент-план 30 дней для {platform}. Ниша: {niche}. {frequency} постов/нед.\nДля каждого: тема, тип, формат.", [{"name": "platform", "label": "Платформа", "placeholder": "Telegram"}, {"name": "niche", "label": "Ниша", "placeholder": "Фитнес"}, {"name": "frequency", "label": "Постов/нед", "placeholder": "5"}]),
        ("smm", "Пост для Telegram", "Вовлекающий пост с CTA", "Пост для Telegram. Тема: {topic}. Тон: {tone}.\n300-600 символов, хук, польза, CTA, эмодзи, хештеги.", [{"name": "topic", "label": "Тема", "placeholder": "AI тренды"}, {"name": "tone", "label": "Тон", "placeholder": "экспертный"}]),
        ("seo", "LSI семантическое ядро", "Ключи + LSI + FAQ для статьи", "Семантическое ядро для: {topic}.\nОсновной ключ, ВЧ(5), СЧ(10), НЧ(15), LSI(20), FAQ(10).", [{"name": "topic", "label": "Тема", "placeholder": "Как выбрать CRM"}]),
        ("copywriting", "Текст для лендинга", "Продающий текст по AIDA", "Продающий текст. Продукт: {product}. ЦА: {audience}. Преимущество: {benefit}.\nЗаголовок 4U, проблема, решение, 5 выгод, CTA.", [{"name": "product", "label": "Продукт", "placeholder": "SaaS"}, {"name": "audience", "label": "ЦА", "placeholder": "Маркетологи"}, {"name": "benefit", "label": "Преимущество", "placeholder": "Экономит 10ч/нед"}]),
        ("copywriting", "Welcome email-серия", "3 письма для новых подписчиков", "Welcome-серия 3 письма для {business}. ЦА: {audience}.\n1: приветствие+бонус. 2: ценность+кейс. 3: оффер+дедлайн.", [{"name": "business", "label": "Бизнес", "placeholder": "Онлайн-школа"}, {"name": "audience", "label": "ЦА", "placeholder": "Ученики"}]),
        ("code", "Код-ревью", "Анализ кода с рекомендациями", "Код-ревью. Язык: {language}.\n{code}\nПроверь: баги, производительность, безопасность, читаемость + fix.", [{"name": "language", "label": "Язык", "placeholder": "Python"}, {"name": "code", "label": "Код", "placeholder": "Вставьте код"}]),
        ("business", "Питч инвестору", "Презентация проекта за 1 мин", "Питч на 1 минуту. Проект: {project}. Рынок: {market}. Стадия: {stage}.\nПроблема, решение, рынок, модель, трекшн, команда, запрос.", [{"name": "project", "label": "Проект", "placeholder": "AI-платформа"}, {"name": "market", "label": "Рынок", "placeholder": "MarTech"}, {"name": "stage", "label": "Стадия", "placeholder": "MVP"}]),
        ("business", "Скрипт холодного звонка", "Скрипт для первого контакта", "Скрипт звонка. Продукт: {product}. ЛПР: {lpr}. Цель: {goal}.\nПриветствие, квалификация, боль, презентация, 3 возражения, закрытие.", [{"name": "product", "label": "Продукт", "placeholder": "CRM"}, {"name": "lpr", "label": "ЛПР", "placeholder": "Директор"}, {"name": "goal", "label": "Цель", "placeholder": "Назначить демо"}]),
        ("code", "REST API документация", "Swagger-style документация", "Документация REST API. Сервис: {service}. Эндпоинты: {endpoints}.\nДля каждого: метод, URL, параметры, тело, ответ, ошибки. Markdown.", [{"name": "service", "label": "Сервис", "placeholder": "Заказы"}, {"name": "endpoints", "label": "Эндпоинты", "placeholder": "GET /orders, POST /orders"}]),
    ]

    added = 0
    for cat, title, desc, content, variables in seeds:
        await db.execute(text(
            "INSERT INTO prompt_templates (id, category, title, description, content, variables, usage_count, is_system, is_public, likes, author_name) "
            "VALUES (:id, :cat, :title, :desc, :content, :vars, 0, false, true, 0, 'Stone AI')"
        ), {"id": str(_uuid.uuid4()), "cat": cat, "title": title, "desc": desc, "content": content, "vars": _json.dumps(variables, ensure_ascii=False)})
        added += 1

    await db.commit()
    return {"ok": True, "message": f"Seeded {added} marketplace templates", "count": added}


# ─── Wizard: generate from template ───

class DirectGenerateRequest(BaseModel):
    prompt: str
    model_id: str = "gpt-4.1-mini"
    cost_rub: float = 10.0


class WizardGenerateRequest(BaseModel):
    template_id: str
    fields: dict[str, str]
    model_id: str = "gpt-4.1-mini"


@router.post("/templates/generate")
async def wizard_generate(
    body: WizardGenerateRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fill template variables and generate AI response. Deducts from balance."""
    from app.models.user import User
    from app.services.ai_router import stream_chat_response

    tg_id = user["id"]
    db_id = user.get("db_id")

    # Get template
    result = await db.execute(select(PromptTemplate).where(PromptTemplate.id == body.template_id))
    tpl = result.scalar_one_or_none()
    if not tpl:
        raise HTTPException(404, "Шаблон не найден")

    # Fill variables
    prompt = tpl.content
    for key, val in body.fields.items():
        prompt = prompt.replace(f"{{{key}}}", val)

    # Check balance — cost in rubles, balance in USD
    cost_rub = tpl.cost_rub or 10.0
    cost_usd = cost_rub / USD_TO_RUB.0  # approximate rate

    # Expensive models cost 3x
    EXPENSIVE_MODELS = {"gpt-4.1", "claude-sonnet-4", "claude-sonnet-4.5", "deepseek-r1"}
    if body.model_id in EXPENSIVE_MODELS:
        cost_rub *= 3
        cost_usd = cost_rub / USD_TO_RUB.0

    if db_id:
        u_result = await db.execute(select(User).where(User.id == db_id))
    else:
        u_result = await db.execute(select(User).where(User.telegram_id == tg_id))
    db_user = u_result.scalar_one_or_none()

    tier = (db_user.subscription_tier or "free") if db_user else "free"
    balance = float(db_user.balance_usd or 0) if db_user else 0

    # Free users: 1 free wizard generation per day, then need balance
    if tier == "free" and balance < cost_usd:
        raise HTTPException(402, {
            "error": "insufficient_balance",
            "message": f"Недостаточно средств. Нужно ~{cost_rub:.0f}₽, баланс {balance * USD_TO_RUB:.0f}₽",
            "cost_rub": cost_rub,
            "balance_rub": round(balance * USD_TO_RUB, 2),
        })

    # Generate via AI (non-streaming for templates)
    messages = [{"role": "user", "content": prompt}]
    full_response = ""
    async for chunk in stream_chat_response(body.model_id, messages, None, max_tokens=4096):
        if chunk.startswith("data: "):
            payload = chunk[6:].strip()
            if payload == "[DONE]":
                continue
            try:
                import json
                data = json.loads(payload)
                content = data.get("content") or (data.get("choices", [{}])[0].get("delta", {}).get("content"))
                if content:
                    full_response += content
            except Exception:
                pass

    if not full_response:
        raise HTTPException(502, "Ошибка генерации")

    # Deduct balance
    if db_user and cost_usd > 0:
        from sqlalchemy import update as sql_update
        await db.execute(
            sql_update(User).where(User.id == db_user.id).values(balance_usd=User.balance_usd - cost_usd)
        )

    # Increment usage
    tpl.usage_count += 1
    await db.commit()

    # Achievement: first template used
    asyncio.create_task(check_and_update(tg_id, "first_template", 1))

    new_balance = max(0, balance - cost_usd)

    return {
        "result": full_response,
        "model": body.model_id,
        "template": tpl.title,
        "cost_rub": cost_rub,
        "balance_rub": round(new_balance * USD_TO_RUB, 2),
    }


@router.post("/generate/direct")
async def direct_generate(
    body: DirectGenerateRequest,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Direct AI generation with prompt — used by SEO module and other tools."""
    from app.models.user import User
    from app.services.ai_router import stream_chat_response

    tg_id = user["id"]
    db_id = user.get("db_id")

    # Expensive models cost 3x
    EXPENSIVE_MODELS = {"gpt-4.1", "claude-sonnet-4", "claude-sonnet-4.5", "deepseek-r1"}
    actual_cost_rub = body.cost_rub * 3 if body.model_id in EXPENSIVE_MODELS else body.cost_rub
    cost_usd = actual_cost_rub / USD_TO_RUB.0

    if db_id:
        u_result = await db.execute(select(User).where(User.id == db_id))
    else:
        u_result = await db.execute(select(User).where(User.telegram_id == tg_id))
    db_user = u_result.scalar_one_or_none()

    balance = float(db_user.balance_usd or 0) if db_user else 0
    tier = (db_user.subscription_tier or "free") if db_user else "free"

    if tier == "free" and balance < cost_usd:
        raise HTTPException(402, {
            "error": "insufficient_balance",
            "message": f"Недостаточно средств. Нужно ~{actual_cost_rub:.0f}₽",
            "balance_rub": round(balance * USD_TO_RUB, 2),
        })

    messages = [{"role": "user", "content": body.prompt}]
    full_response = ""
    async for chunk in stream_chat_response(body.model_id, messages, None, max_tokens=8192):
        if chunk.startswith("data: "):
            payload = chunk[6:].strip()
            if payload == "[DONE]":
                continue
            try:
                import json
                data = json.loads(payload)
                content = data.get("content") or (data.get("choices", [{}])[0].get("delta", {}).get("content"))
                if content:
                    full_response += content
            except Exception:
                pass

    if not full_response:
        raise HTTPException(502, "Ошибка генерации")

    if db_user and cost_usd > 0:
        from sqlalchemy import update as sql_update
        await db.execute(sql_update(User).where(User.id == db_user.id).values(balance_usd=User.balance_usd - cost_usd))
        await db.commit()

    new_balance = max(0, balance - cost_usd)
    return {"result": full_response, "model": body.model_id, "cost_rub": actual_cost_rub, "balance_rub": round(new_balance * USD_TO_RUB, 2)}


# ─── Seed: 50 curated prompts ───

SEED_PROMPTS = [
    # === MARKETING (10) ===
    {"category": "marketing", "title": "Анализ целевой аудитории", "description": "Детальный портрет ЦА для продукта",
     "content": "Проведи детальный анализ целевой аудитории для продукта: {product}. Ниша: {niche}.\n\nОпиши:\n1. Демография (возраст, пол, доход, география)\n2. Психография (ценности, страхи, мотивации)\n3. Поведение (где проводят время, какие медиа потребляют)\n4. Боли и проблемы\n5. Возражения при покупке\n6. Триггеры к покупке\n\nФормат: структурированный отчёт.",
     "variables": [{"name": "product", "label": "Продукт/услуга", "placeholder": "Онлайн-курс по дизайну"}, {"name": "niche", "label": "Ниша", "placeholder": "EdTech"}]},
    {"category": "marketing", "title": "Рекламный оффер", "description": "5 вариантов цепляющего оффера",
     "content": "Создай 5 вариантов рекламного оффера для: {product}.\nЦА: {audience}.\nБоль: {pain}.\nПреимущество: {benefit}.\n\nКаждый оффер: цепляет с первого слова, содержит выгоду с цифрами, призыв к действию, до 150 символов. Отметь лучший.",
     "variables": [{"name": "product", "label": "Продукт", "placeholder": "CRM для бизнеса"}, {"name": "audience", "label": "Аудитория", "placeholder": "Владельцы малого бизнеса"}, {"name": "pain", "label": "Боль", "placeholder": "Теряют клиентов"}, {"name": "benefit", "label": "Преимущество", "placeholder": "Авто-напоминания"}]},
    {"category": "marketing", "title": "SWOT-анализ", "description": "Сильные/слабые стороны, возможности и угрозы",
     "content": "Проведи SWOT-анализ для: {company}.\nОтрасль: {industry}.\nКонкуренты: {competitors}.\n\nЗаполни матрицу (по 5-7 пунктов каждый): Strengths, Weaknesses, Opportunities, Threats.\nВ конце: 3 стратегические рекомендации.",
     "variables": [{"name": "company", "label": "Компания", "placeholder": "Интернет-магазин одежды"}, {"name": "industry", "label": "Отрасль", "placeholder": "Fashion e-commerce"}, {"name": "competitors", "label": "Конкуренты", "placeholder": "Wildberries, Lamoda"}]},
    {"category": "marketing", "title": "Маркетинг-план", "description": "План продвижения на 3 месяца",
     "content": "Составь маркетинг-план на 3 месяца для: {product}.\nБюджет: {budget}.\nЦА: {audience}.\nЦель: {goal}.\n\nВключи: каналы продвижения, бюджет по каналам, KPI, таймлайн, контент-стратегию.",
     "variables": [{"name": "product", "label": "Продукт", "placeholder": "Мобильное приложение"}, {"name": "budget", "label": "Бюджет", "placeholder": "100 000₽/мес"}, {"name": "audience", "label": "ЦА", "placeholder": "Студенты 18-25"}, {"name": "goal", "label": "Цель", "placeholder": "1000 установок"}]},
    {"category": "marketing", "title": "УТП (уникальное торговое предложение)", "description": "Формулировка УТП",
     "content": "Сформулируй УТП для: {product}.\nКонкуренты: {competitors}.\nГлавное отличие: {difference}.\n\nСоздай 5 формулировок УТП по разным методикам (выгода + срок, проблема → решение, цифры, сравнение, гарантия). Отметь лучшее.",
     "variables": [{"name": "product", "label": "Продукт", "placeholder": "Доставка еды"}, {"name": "competitors", "label": "Конкуренты", "placeholder": "Яндекс Еда, Delivery Club"}, {"name": "difference", "label": "Отличие", "placeholder": "Доставка за 15 минут"}]},
    {"category": "marketing", "title": "Воронка продаж", "description": "Этапы воронки с конверсиями",
     "content": "Спроектируй воронку продаж для: {product}.\nКанал привлечения: {channel}.\nСредний чек: {price}.\n\nОпиши каждый этап: осведомлённость → интерес → рассмотрение → покупка → удержание. Для каждого: действие клиента, инструменты, ожидаемая конверсия, контент.",
     "variables": [{"name": "product", "label": "Продукт", "placeholder": "SaaS-сервис"}, {"name": "channel", "label": "Канал", "placeholder": "Контекстная реклама"}, {"name": "price", "label": "Средний чек", "placeholder": "5000₽/мес"}]},
    {"category": "marketing", "title": "Скрипт продаж", "description": "Скрипт телефонного/чат-разговора",
     "content": "Напиши скрипт продаж для: {product}.\nЦена: {price}.\nОсновные возражения: {objections}.\n\nВключи: приветствие, выявление потребности, презентацию, работу с возражениями (3-5 штук), закрытие сделки. Формат: диалог.",
     "variables": [{"name": "product", "label": "Продукт", "placeholder": "Абонемент в фитнес"}, {"name": "price", "label": "Цена", "placeholder": "3000₽/мес"}, {"name": "objections", "label": "Возражения", "placeholder": "Дорого, нет времени, подумаю"}]},
    {"category": "marketing", "title": "Анализ конкурентов", "description": "Сравнение с 3-5 конкурентами",
     "content": "Проведи анализ конкурентов для: {product}.\nКонкуренты: {competitors}.\n\nПо каждому: позиционирование, ценовая политика, сильные/слабые стороны, каналы продвижения, УТП.\nСводная таблица сравнения. Рекомендации: что забрать, от чего отстроиться.",
     "variables": [{"name": "product", "label": "Мой продукт", "placeholder": "Онлайн-школа"}, {"name": "competitors", "label": "Конкуренты (3-5)", "placeholder": "Skillbox, Нетология, GeekBrains"}]},
    {"category": "marketing", "title": "Позиционирование бренда", "description": "Стратегия позиционирования",
     "content": "Разработай позиционирование для: {brand}.\nНиша: {niche}.\nЦА: {audience}.\n\nОпиши: миссию, видение, ценности, тон голоса, архетип бренда, ключевые сообщения, слоган (5 вариантов). Визуальный стиль: цвета, настроение.",
     "variables": [{"name": "brand", "label": "Бренд", "placeholder": "EcoStyle"}, {"name": "niche", "label": "Ниша", "placeholder": "Эко-косметика"}, {"name": "audience", "label": "ЦА", "placeholder": "Женщины 25-40, ЗОЖ"}]},
    {"category": "marketing", "title": "Стратегия запуска продукта", "description": "Go-to-market план",
     "content": "Разработай стратегию запуска для: {product}.\nДата: {date}.\nБюджет: {budget}.\n\nВключи: pre-launch (2 нед), launch day, post-launch (2 нед). Каналы, контент, PR, инфлюенсеры, акции. Таймлайн по дням.",
     "variables": [{"name": "product", "label": "Продукт", "placeholder": "Мобильное приложение"}, {"name": "date", "label": "Дата запуска", "placeholder": "1 мая 2026"}, {"name": "budget", "label": "Бюджет", "placeholder": "200 000₽"}]},

    # === SMM (10) ===
    {"category": "smm", "title": "Пост для VK", "description": "Вовлекающий пост для ВКонтакте",
     "content": "Напиши пост для VK.\nТема: {topic}.\nТон: {tone}.\nЦА: {audience}.\n\nСодержит: цепляющий хук, основная мысль, CTA, 3-5 эмодзи. 500-800 символов. Предложи 5 хештегов.",
     "variables": [{"name": "topic", "label": "Тема", "placeholder": "Скидки на весеннюю коллекцию"}, {"name": "tone", "label": "Тон", "placeholder": "дружелюбный"}, {"name": "audience", "label": "ЦА", "placeholder": "Женщины 25-35"}]},
    {"category": "smm", "title": "Пост для Telegram", "description": "Пост для Telegram-канала",
     "content": "Напиши пост для Telegram-канала.\nТема: {topic}.\nСтиль: {style}.\nCTA: {cta}.\n\nФормат: короткий (до 500 символов), с форматированием (жирный, курсив), эмодзи. Без хештегов.",
     "variables": [{"name": "topic", "label": "Тема", "placeholder": "Новая функция продукта"}, {"name": "style", "label": "Стиль", "placeholder": "экспертный / разговорный"}, {"name": "cta", "label": "Призыв", "placeholder": "Попробовать бесплатно"}]},
    {"category": "smm", "title": "Контент-план на месяц", "description": "30 идей постов",
     "content": "Составь контент-план на 30 дней для {platform}.\nНиша: {niche}.\nЧастота: {frequency} постов/неделю.\n\nДля каждого: дата, тип (инфо/развлекательный/продающий/вовлечение), тема, формат (текст/карусель/reels/сторис).\nБаланс: 40% польза, 30% вовлечение, 20% продажи, 10% развлечение.",
     "variables": [{"name": "platform", "label": "Платформа", "placeholder": "VK / Telegram"}, {"name": "niche", "label": "Ниша", "placeholder": "Фитнес-студия"}, {"name": "frequency", "label": "Постов/неделю", "placeholder": "5"}]},
    {"category": "smm", "title": "Reels/Shorts скрипт", "description": "Сценарий короткого видео",
     "content": "Напиши сценарий Reels/Shorts видео (до 60 сек).\nТема: {topic}.\nЦель: {goal}.\n\nФормат: хук (3 сек) → проблема → решение → CTA. Укажи: текст на экране, действия, музыка/звук. Хронометраж по секундам.",
     "variables": [{"name": "topic", "label": "Тема", "placeholder": "3 ошибки в рекламе"}, {"name": "goal", "label": "Цель", "placeholder": "Подписка на канал"}]},
    {"category": "smm", "title": "Хештеги", "description": "Подборка хештегов для поста",
     "content": "Подбери хештеги для поста на тему: {topic}.\nПлатформа: {platform}.\nНиша: {niche}.\n\nДай 30 хештегов: 10 высокочастотных (>100k), 10 среднечастотных (10k-100k), 10 низкочастотных (<10k). Группируй по типу.",
     "variables": [{"name": "topic", "label": "Тема поста", "placeholder": "Утренняя йога"}, {"name": "platform", "label": "Платформа", "placeholder": "Instagram / VK"}, {"name": "niche", "label": "Ниша", "placeholder": "Йога и медитация"}]},
    {"category": "smm", "title": "Ответ на негативный отзыв", "description": "Корректный ответ на негатив",
     "content": "Напиши ответ на негативный отзыв.\nОтзыв: \"{review}\"\nКомпания: {company}.\nТон: {tone}.\n\n3 варианта ответа: формальный, эмпатичный, с юмором (если уместно). Каждый: признание проблемы, извинение, решение, приглашение в личку.",
     "variables": [{"name": "review", "label": "Текст отзыва", "placeholder": "Ужасный сервис, ждал 2 часа!"}, {"name": "company", "label": "Компания", "placeholder": "Кафе «Уют»"}, {"name": "tone", "label": "Тон", "placeholder": "дружелюбный"}]},
    {"category": "smm", "title": "Описание сообщества", "description": "Текст «О группе» для соцсети",
     "content": "Напиши описание для сообщества.\nНазвание: {name}.\nНиша: {niche}.\nЧто даёт подписчикам: {value}.\n\nОписание до 500 символов. Включи: что за сообщество, для кого, какую пользу даёт, CTA (подписаться). Используй эмодзи.",
     "variables": [{"name": "name", "label": "Название", "placeholder": "Digital Marketing Pro"}, {"name": "niche", "label": "Ниша", "placeholder": "Интернет-маркетинг"}, {"name": "value", "label": "Ценность", "placeholder": "Кейсы, шаблоны, разборы"}]},
    {"category": "smm", "title": "Идеи для вовлечения", "description": "10 идей для повышения ER",
     "content": "Предложи 10 идей постов для повышения вовлечённости.\nНиша: {niche}.\nПлатформа: {platform}.\nАудитория: {audience}.\n\nДля каждой идеи: формат, описание, ожидаемый ER. Включи: опросы, квизы, UGC, челленджи, мемы, закулисье.",
     "variables": [{"name": "niche", "label": "Ниша", "placeholder": "Ресторан"}, {"name": "platform", "label": "Платформа", "placeholder": "VK"}, {"name": "audience", "label": "Аудитория", "placeholder": "Молодёжь 20-30"}]},
    {"category": "smm", "title": "Сторис-серия", "description": "Серия из 5-7 сторис",
     "content": "Создай серию из 7 сторис для {platform}.\nТема: {topic}.\nЦель: {goal}.\n\nДля каждой сторис: визуал (описание), текст на экране (до 50 символов), интерактив (опрос/стикер/ссылка). Должна быть логическая цепочка с CTA в конце.",
     "variables": [{"name": "platform", "label": "Платформа", "placeholder": "Instagram / VK"}, {"name": "topic", "label": "Тема", "placeholder": "Запуск нового продукта"}, {"name": "goal", "label": "Цель", "placeholder": "Предзаказ"}]},
    {"category": "smm", "title": "UGC-кампания", "description": "Стратегия пользовательского контента",
     "content": "Разработай UGC-кампанию для: {brand}.\nПродукт: {product}.\nБюджет: {budget}.\n\nОпиши: механику (как мотивировать создавать контент), хештег кампании, призы, правила, примеры контента, план промоушена.",
     "variables": [{"name": "brand", "label": "Бренд", "placeholder": "Nike"}, {"name": "product", "label": "Продукт", "placeholder": "Кроссовки Air Max"}, {"name": "budget", "label": "Бюджет", "placeholder": "50 000₽"}]},

    # === SEO (8) ===
    {"category": "seo", "title": "SEO-статья", "description": "Оптимизированная статья для блога",
     "content": "Напиши SEO-статью.\nТема: {topic}.\nКлючевые слова: {keywords}.\nДлина: {length} символов.\n\nТребования: title (до 60 символов), meta description (до 160), H2/H3 заголовки, ключевое слово в первом абзаце, FAQ (5 вопросов), списки и таблицы.",
     "variables": [{"name": "topic", "label": "Тема", "placeholder": "Как выбрать CRM"}, {"name": "keywords", "label": "Ключевые слова", "placeholder": "CRM для бизнеса, лучшие CRM"}, {"name": "length", "label": "Длина (символов)", "placeholder": "5000"}]},
    {"category": "seo", "title": "Мета-теги", "description": "Title + Description + Keywords",
     "content": "Сгенерируй мета-теги для страницы.\nТема: {topic}.\nЦелевой запрос: {keyword}.\n\nСоздай:\n- Title (до 60 символов, ключевое слово в начале)\n- Description (до 160 символов, с CTA)\n- Keywords (10 штук)\n- Open Graph title и description\n\nПокажи превью в поиске Google.",
     "variables": [{"name": "topic", "label": "О чём страница", "placeholder": "Доставка цветов в Москве"}, {"name": "keyword", "label": "Целевой запрос", "placeholder": "доставка цветов Москва"}]},
    {"category": "seo", "title": "FAQ-блок", "description": "5-10 вопросов-ответов для SEO",
     "content": "Создай FAQ-блок (Schema.org FAQPage) для страницы: {topic}.\n\n10 вопросов, которые задают пользователи. Ответы: 2-3 предложения, с ключевыми словами. Формат: JSON-LD разметка + читаемый текст.",
     "variables": [{"name": "topic", "label": "Тема страницы", "placeholder": "Ремонт квартир в Москве"}]},
    {"category": "seo", "title": "Описание товара для SEO", "description": "Карточка товара для маркетплейса",
     "content": "Напиши SEO-описание товара.\nНазвание: {product}.\nКатегория: {category}.\nОсобенности: {features}.\n\nВключи: заголовок, bullet-points (5-7), полное описание (500-800 символов), ключевые слова для поиска. Оптимизировано под {marketplace}.",
     "variables": [{"name": "product", "label": "Товар", "placeholder": "Беспроводные наушники"}, {"name": "category", "label": "Категория", "placeholder": "Электроника"}, {"name": "features", "label": "Особенности", "placeholder": "ANC, 30ч батарея, Bluetooth 5.3"}, {"name": "marketplace", "label": "Маркетплейс", "placeholder": "OZON / Wildberries"}]},
    {"category": "seo", "title": "Анализ ключевых слов", "description": "Семантическое ядро для сайта",
     "content": "Составь семантическое ядро для сайта: {site}.\nНиша: {niche}.\n\nСгруппируй по кластерам (5-8 групп). Для каждого: основной запрос, LSI-запросы, длинный хвост. Укажи примерную частотность и коммерческость (инфо/коммерч/навигация).",
     "variables": [{"name": "site", "label": "Сайт/тема", "placeholder": "Школа английского"}, {"name": "niche", "label": "Ниша", "placeholder": "Онлайн-образование, языки"}]},
    {"category": "seo", "title": "ТЗ для копирайтера", "description": "Техзадание на SEO-текст",
     "content": "Составь ТЗ на SEO-текст.\nТема: {topic}.\nКлюч: {keyword}.\nОбъём: {length} символов.\n\nВключи: title, description, структуру (H2/H3), ключевые слова с частотностью, LSI-слова, требования к уникальности, стоп-слова, примеры конкурентов из топа.",
     "variables": [{"name": "topic", "label": "Тема", "placeholder": "Пластиковые окна"}, {"name": "keyword", "label": "Основной ключ", "placeholder": "купить пластиковые окна"}, {"name": "length", "label": "Объём", "placeholder": "5000 символов"}]},
    {"category": "seo", "title": "Alt-тексты для изображений", "description": "SEO-описания картинок",
     "content": "Напиши alt-тексты для изображений на странице: {page}.\nТематика: {topic}.\n\n10 alt-текстов. Каждый: описательный, с ключевым словом, до 125 символов. Не начинай с «Изображение» или «Фото».",
     "variables": [{"name": "page", "label": "Страница", "placeholder": "Главная сайта кофейни"}, {"name": "topic", "label": "Тематика", "placeholder": "Кофе, кофейня, бариста"}]},
    {"category": "seo", "title": "Структура сайта", "description": "Карта страниц для SEO",
     "content": "Разработай структуру сайта для: {business}.\nНиша: {niche}.\n\nСоздай иерархию: главная → разделы → подразделы → страницы. Для каждой: URL, целевой запрос, тип контента. Учти: хлебные крошки, перелинковку, sitemap.",
     "variables": [{"name": "business", "label": "Бизнес", "placeholder": "Стоматология"}, {"name": "niche", "label": "Ниша", "placeholder": "Медицина, стоматология"}]},

    # === COPYWRITING (8) ===
    {"category": "copywriting", "title": "Заголовок по формуле 4U", "description": "10 вариантов цепляющих заголовков",
     "content": "Напиши 10 заголовков по формуле 4U (Useful, Urgent, Unique, Ultra-specific) для: {product}.\nЦА: {audience}.\n\nКаждый заголовок: содержит выгоду, срочность, уникальность и конкретику. До 80 символов. Отметь топ-3.",
     "variables": [{"name": "product", "label": "Продукт", "placeholder": "Курс по Excel"}, {"name": "audience", "label": "ЦА", "placeholder": "Офисные сотрудники 25-45"}]},
    {"category": "copywriting", "title": "Текст для лендинга", "description": "Все секции landing page",
     "content": "Напиши текст для лендинга.\nПродукт: {product}.\nЦА: {audience}.\nОффер: {offer}.\n\nСекции: Hero (заголовок + подзаголовок + CTA), проблема, решение, преимущества (5), как это работает (3 шага), отзывы (3 шаблона), цена, FAQ (5), финальный CTA.",
     "variables": [{"name": "product", "label": "Продукт", "placeholder": "SaaS-аналитика"}, {"name": "audience", "label": "ЦА", "placeholder": "Маркетологи"}, {"name": "offer", "label": "Оффер", "placeholder": "14 дней бесплатно"}]},
    {"category": "copywriting", "title": "Email-рассылка", "description": "Письмо для email-кампании",
     "content": "Напиши email-рассылку.\nЦель: {goal}.\nПродукт: {product}.\nТон: {tone}.\n\nВключи: тему письма (5 вариантов, до 50 символов), прехедер, тело письма (200-400 слов), CTA-кнопку. Формат: HTML-friendly.",
     "variables": [{"name": "goal", "label": "Цель", "placeholder": "Вернуть неактивных"}, {"name": "product", "label": "Продукт", "placeholder": "Подписка на сервис"}, {"name": "tone", "label": "Тон", "placeholder": "дружелюбный"}]},
    {"category": "copywriting", "title": "Коммерческое предложение", "description": "КП для B2B",
     "content": "Напиши коммерческое предложение.\nУслуга: {service}.\nКлиент: {client}.\nЦена: {price}.\n\nСтруктура: обращение, проблема клиента, наше решение, что входит, этапы работ, кейсы (2), цена, гарантии, CTA, контакты. На 1-2 страницы.",
     "variables": [{"name": "service", "label": "Услуга", "placeholder": "Разработка сайта"}, {"name": "client", "label": "Клиент", "placeholder": "Ресторан «Итальяно»"}, {"name": "price", "label": "Цена", "placeholder": "от 150 000₽"}]},
    {"category": "copywriting", "title": "Описание товара", "description": "Продающее описание для магазина",
     "content": "Напиши продающее описание товара.\nНазвание: {product}.\nОсобенности: {features}.\nЦА: {audience}.\n\nВключи: эмоциональный заголовок, короткое описание (2-3 предложения), 5-7 bullet-points с выгодами, кому подходит, с чем сочетать.",
     "variables": [{"name": "product", "label": "Товар", "placeholder": "Кожаная сумка"}, {"name": "features", "label": "Особенности", "placeholder": "Натуральная кожа, 5 отделений"}, {"name": "audience", "label": "ЦА", "placeholder": "Деловые женщины 30-50"}]},
    {"category": "copywriting", "title": "Сторителлинг", "description": "История для бренда/продукта",
     "content": "Напиши историю бренда/продукта в формате сторителлинга.\nБренд: {brand}.\nЦенность: {value}.\nАудитория: {audience}.\n\nСтруктура: герой (клиент) → проблема → встреча с решением → трансформация → новая жизнь. 500-800 слов. Эмоциональный, живой язык.",
     "variables": [{"name": "brand", "label": "Бренд", "placeholder": "EcoHome"}, {"name": "value", "label": "Ценность", "placeholder": "Экологичный быт"}, {"name": "audience", "label": "Аудитория", "placeholder": "Молодые семьи"}]},
    {"category": "copywriting", "title": "Welcome-серия писем", "description": "3 письма для новых подписчиков",
     "content": "Напиши welcome-серию из 3 писем.\nПродукт: {product}.\nЦА: {audience}.\n\nПисьмо 1 (сразу): приветствие + бонус + что ожидать.\nПисьмо 2 (через 2 дня): история бренда + кейс.\nПисьмо 3 (через 5 дней): оффер + срочность.\n\nДля каждого: тема, прехедер, тело, CTA.",
     "variables": [{"name": "product", "label": "Продукт", "placeholder": "Онлайн-курс"}, {"name": "audience", "label": "ЦА", "placeholder": "Начинающие дизайнеры"}]},
    {"category": "copywriting", "title": "Текст для рекламного баннера", "description": "Короткий текст для баннера/креатива",
     "content": "Напиши тексты для рекламного баннера.\nПродукт: {product}.\nФормат: {format}.\nЦель: {goal}.\n\n5 вариантов. Каждый: заголовок (до 30 символов), подзаголовок (до 50), CTA (до 20). Без воды, только выгода и действие.",
     "variables": [{"name": "product", "label": "Продукт", "placeholder": "Доставка пиццы"}, {"name": "format", "label": "Формат", "placeholder": "VK таргет / Яндекс баннер"}, {"name": "goal", "label": "Цель", "placeholder": "Заказ с промокодом"}]},

    # === CODE (7) ===
    {"category": "code", "title": "Ревью кода", "description": "Анализ качества и предложения",
     "content": "Проведи code review:\n```{language}\n{code}\n```\n\nОцени: читаемость, производительность, безопасность, соответствие best practices. Предложи улучшения с примерами кода.",
     "variables": [{"name": "language", "label": "Язык", "placeholder": "python / javascript / go"}, {"name": "code", "label": "Код", "placeholder": "Вставьте код для ревью"}]},
    {"category": "code", "title": "Рефакторинг", "description": "Улучшение структуры кода",
     "content": "Отрефактори код:\n```{language}\n{code}\n```\n\nПрименяй: SOLID, DRY, чистые функции, понятные имена. Покажи было/стало с объяснением каждого изменения.",
     "variables": [{"name": "language", "label": "Язык", "placeholder": "typescript"}, {"name": "code", "label": "Код", "placeholder": "Вставьте код"}]},
    {"category": "code", "title": "Написание тестов", "description": "Unit-тесты для кода",
     "content": "Напиши тесты для:\n```{language}\n{code}\n```\n\nФреймворк: {framework}. Покрой: happy path, edge cases, ошибки. Используй describe/it структуру. Минимум 5 тестов.",
     "variables": [{"name": "language", "label": "Язык", "placeholder": "python"}, {"name": "code", "label": "Код", "placeholder": "Вставьте код"}, {"name": "framework", "label": "Фреймворк", "placeholder": "pytest / jest / vitest"}]},
    {"category": "code", "title": "API документация", "description": "OpenAPI/Swagger описание",
     "content": "Напиши документацию для API.\nЭндпоинт: {endpoint}.\nМетод: {method}.\nОписание: {description}.\n\nФормат: OpenAPI 3.0 YAML. Включи: параметры, request body, responses (200, 400, 401, 500), примеры запроса/ответа.",
     "variables": [{"name": "endpoint", "label": "Эндпоинт", "placeholder": "/api/users"}, {"name": "method", "label": "Метод", "placeholder": "POST"}, {"name": "description", "label": "Что делает", "placeholder": "Создаёт нового пользователя"}]},
    {"category": "code", "title": "SQL запрос", "description": "Оптимальный SQL для задачи",
     "content": "Напиши SQL запрос.\nЗадача: {task}.\nТаблицы: {tables}.\nБД: {db}.\n\nПокажи: запрос, объяснение, план выполнения (EXPLAIN), индексы которые помогут, альтернативный вариант если есть.",
     "variables": [{"name": "task", "label": "Задача", "placeholder": "Топ-10 клиентов по сумме заказов за месяц"}, {"name": "tables", "label": "Таблицы", "placeholder": "orders(id, user_id, amount, created_at), users(id, name)"}, {"name": "db", "label": "СУБД", "placeholder": "PostgreSQL"}]},
    {"category": "code", "title": "Regex", "description": "Регулярное выражение для задачи",
     "content": "Напиши регулярное выражение.\nЗадача: {task}.\nЯзык: {language}.\n\nДай: regex, объяснение каждой части, 5 примеров совпадений и 5 несовпадений, код использования.",
     "variables": [{"name": "task", "label": "Что найти/заменить", "placeholder": "Email адреса в тексте"}, {"name": "language", "label": "Язык", "placeholder": "Python / JavaScript"}]},
    {"category": "code", "title": "Архитектура проекта", "description": "Структура и design decisions",
     "content": "Спроектируй архитектуру.\nПроект: {project}.\nСтек: {stack}.\nТребования: {requirements}.\n\nОпиши: структуру папок, основные модули, паттерны (MVC/Clean/Hexagonal), взаимодействие компонентов, базу данных (ERD), API контракты.",
     "variables": [{"name": "project", "label": "Проект", "placeholder": "E-commerce платформа"}, {"name": "stack", "label": "Стек", "placeholder": "Next.js, FastAPI, PostgreSQL"}, {"name": "requirements", "label": "Требования", "placeholder": "1000 RPS, OAuth, real-time"}]},

    # === BUSINESS (7) ===
    {"category": "business", "title": "Бизнес-план (краткий)", "description": "Одностраничный бизнес-план",
     "content": "Составь краткий бизнес-план.\nИдея: {idea}.\nРынок: {market}.\nБюджет: {budget}.\n\nВключи: описание проекта, проблема/решение, целевая аудитория, бизнес-модель, конкуренты, маркетинг, финансы (доходы/расходы на 12 мес), риски.",
     "variables": [{"name": "idea", "label": "Идея", "placeholder": "Доставка здоровой еды"}, {"name": "market", "label": "Рынок", "placeholder": "Москва, B2C"}, {"name": "budget", "label": "Бюджет", "placeholder": "500 000₽"}]},
    {"category": "business", "title": "Pitch для инвестора", "description": "Текст питча на 3 минуты",
     "content": "Напиши pitch для инвестора.\nСтартап: {startup}.\nСтадия: {stage}.\nНужно: {amount}.\n\nСтруктура (3 мин): проблема (30 сек), решение (30 сек), рынок (20 сек), продукт (30 сек), тракшн (20 сек), команда (15 сек), финансы (15 сек), ask (10 сек).",
     "variables": [{"name": "startup", "label": "Стартап", "placeholder": "AI-ассистент для врачей"}, {"name": "stage", "label": "Стадия", "placeholder": "Pre-seed, MVP готов"}, {"name": "amount", "label": "Сколько нужно", "placeholder": "5 млн ₽"}]},
    {"category": "business", "title": "Анализ рынка", "description": "Обзор рынка и трендов",
     "content": "Проведи анализ рынка.\nНиша: {niche}.\nГеография: {geo}.\n\nОбъём рынка (TAM/SAM/SOM), ключевые игроки, тренды, барьеры входа, PESTEL-факторы, прогноз на 3 года. С цифрами где возможно.",
     "variables": [{"name": "niche", "label": "Ниша", "placeholder": "EdTech"}, {"name": "geo", "label": "География", "placeholder": "Россия"}]},
    {"category": "business", "title": "Финмодель", "description": "Финансовая модель на 12 месяцев",
     "content": "Составь финмодель на 12 месяцев.\nБизнес: {business}.\nСтартовый бюджет: {budget}.\nМодель дохода: {revenue_model}.\n\nТаблица помесячно: доходы (разбивка по каналам), расходы (разбивка: команда, маркетинг, инфра, прочее), EBITDA, кумулятивный P&L. Точка безубыточности.",
     "variables": [{"name": "business", "label": "Бизнес", "placeholder": "SaaS подписка"}, {"name": "budget", "label": "Бюджет", "placeholder": "1 млн ₽"}, {"name": "revenue_model", "label": "Модель", "placeholder": "Подписка 990₽/мес"}]},
    {"category": "business", "title": "Описание вакансии", "description": "Текст вакансии для HH/Habr",
     "content": "Напиши описание вакансии.\nДолжность: {position}.\nКомпания: {company}.\nЗарплата: {salary}.\n\nВключи: о компании (2-3 предложения), задачи (5-7), требования (must/nice-to-have), условия, процесс найма. Тон: {tone}.",
     "variables": [{"name": "position", "label": "Должность", "placeholder": "Frontend-разработчик"}, {"name": "company", "label": "Компания", "placeholder": "Финтех-стартап"}, {"name": "salary", "label": "Зарплата", "placeholder": "200-300 тыс ₽"}, {"name": "tone", "label": "Тон", "placeholder": "дружелюбный, без корпоративного буллшита"}]},
    {"category": "business", "title": "Ответ клиенту", "description": "Профессиональный ответ на запрос",
     "content": "Напиши ответ клиенту.\nЗапрос: \"{request}\"\nКонтекст: {context}.\nТон: {tone}.\n\n3 варианта ответа разной длины: короткий (2-3 предложения), средний (абзац), развёрнутый (с деталями). Все профессиональные и вежливые.",
     "variables": [{"name": "request", "label": "Запрос клиента", "placeholder": "Когда будет готов мой заказ?"}, {"name": "context", "label": "Контекст", "placeholder": "Задержка на 3 дня из-за поставщика"}, {"name": "tone", "label": "Тон", "placeholder": "вежливый, с извинением"}]},
    {"category": "business", "title": "Скрипт переговоров", "description": "Сценарий деловой встречи",
     "content": "Напиши скрипт переговоров.\nЦель: {goal}.\nС кем: {counterpart}.\nНаша позиция: {position}.\n\nВключи: подготовку (3 аргумента), вступление, основную часть, работу с возражениями, win-win предложение, закрытие. BATNA (лучшая альтернатива).",
     "variables": [{"name": "goal", "label": "Цель", "placeholder": "Снизить цену поставки на 15%"}, {"name": "counterpart", "label": "С кем", "placeholder": "Поставщик сырья"}, {"name": "position", "label": "Наша позиция", "placeholder": "Объём закупок вырос в 2 раза"}]},
]


@router.post("/prompts/seed")
async def seed_prompts(db: AsyncSession = Depends(get_db)):
    """Seed prompt templates (admin only, idempotent)."""
    existing = await db.execute(select(func.count()).select_from(PromptTemplate))
    count = existing.scalar()
    if count >= len(SEED_PROMPTS):
        return {"message": f"Already seeded ({count} templates)", "count": count}

    # Clear and reseed
    await db.execute(PromptTemplate.__table__.delete())
    for p in SEED_PROMPTS:
        db.add(PromptTemplate(**p))
    await db.commit()
    return {"message": f"Seeded {len(SEED_PROMPTS)} templates", "count": len(SEED_PROMPTS)}
