"""Achievements — badges, streaks, milestones with rewards."""

import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func as sqlfunc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db, async_session
from app.middleware.auth import get_current_user
from app.models.achievement import Achievement, UserAchievement
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/achievements", tags=["achievements"])

# ─── Achievement definitions ───
ACHIEVEMENTS = [
    # Generation
    {"slug": "first_image", "title": "Первая картинка", "description": "Сгенерируйте первое изображение", "icon": "🎨", "category": "generation", "condition": {"type": "count", "target": 1, "metric": "images"}, "reward_rub": 5},
    {"slug": "images_10", "title": "Художник", "description": "Сгенерируйте 10 изображений", "icon": "🖼️", "category": "generation", "condition": {"type": "count", "target": 10, "metric": "images"}, "reward_rub": 10},
    {"slug": "images_50", "title": "Галерея", "description": "Сгенерируйте 50 изображений", "icon": "🏛️", "category": "generation", "condition": {"type": "count", "target": 50, "metric": "images"}, "reward_rub": 15},
    {"slug": "images_100", "title": "Мастер кисти", "description": "Сгенерируйте 100 изображений", "icon": "👨‍🎨", "category": "generation", "condition": {"type": "count", "target": 100, "metric": "images"}, "reward_rub": 15},
    {"slug": "first_video", "title": "Первое видео", "description": "Сгенерируйте первое видео", "icon": "🎬", "category": "generation", "condition": {"type": "count", "target": 1, "metric": "videos"}, "reward_rub": 5},
    {"slug": "videos_10", "title": "Режиссёр", "description": "Сгенерируйте 10 видео", "icon": "🎥", "category": "generation", "condition": {"type": "count", "target": 10, "metric": "videos"}, "reward_rub": 15},
    {"slug": "first_3d", "title": "Первая 3D-модель", "description": "Сгенерируйте первую 3D-модель", "icon": "🧊", "category": "generation", "condition": {"type": "count", "target": 1, "metric": "3d"}, "reward_rub": 5},
    {"slug": "first_audio", "title": "Первая озвучка", "description": "Используйте TTS впервые", "icon": "🔊", "category": "generation", "condition": {"type": "count", "target": 1, "metric": "audio"}, "reward_rub": 5},
    {"slug": "multiformat", "title": "Мультиформатник", "description": "Используйте все типы генерации", "icon": "🌟", "category": "generation", "condition": {"type": "all_types"}, "reward_rub": 15},
    {"slug": "models_5", "title": "Исследователь", "description": "Используйте 5 разных моделей", "icon": "🔬", "category": "generation", "condition": {"type": "count", "target": 5, "metric": "unique_models"}, "reward_rub": 10},
    {"slug": "models_15", "title": "Полиглот AI", "description": "Используйте 15 разных моделей", "icon": "🗣️", "category": "generation", "condition": {"type": "count", "target": 15, "metric": "unique_models"}, "reward_rub": 15},
    # Chat
    {"slug": "chat_100", "title": "Собеседник", "description": "Отправьте 100 сообщений", "icon": "💬", "category": "generation", "condition": {"type": "count", "target": 100, "metric": "messages"}, "reward_rub": 5},
    {"slug": "chat_500", "title": "Оратор", "description": "Отправьте 500 сообщений", "icon": "🎙️", "category": "generation", "condition": {"type": "count", "target": 500, "metric": "messages"}, "reward_rub": 10},
    {"slug": "chat_1000", "title": "Философ", "description": "Отправьте 1000 сообщений", "icon": "🧠", "category": "generation", "condition": {"type": "count", "target": 1000, "metric": "messages"}, "reward_rub": 15},
    # Streak
    {"slug": "streak_3", "title": "3 дня подряд", "description": "Заходите 3 дня подряд", "icon": "🔥", "category": "streak", "condition": {"type": "streak", "target": 3}, "reward_rub": 5},
    {"slug": "streak_7", "title": "Неделя подряд", "description": "Заходите 7 дней подряд", "icon": "⚡", "category": "streak", "condition": {"type": "streak", "target": 7}, "reward_rub": 10},
    {"slug": "streak_30", "title": "Месяц подряд", "description": "Заходите 30 дней подряд", "icon": "👑", "category": "streak", "condition": {"type": "streak", "target": 30}, "reward_rub": 15},
    # Milestone
    {"slug": "registered", "title": "Добро пожаловать", "description": "Зарегистрируйтесь в Stone AI", "icon": "🎉", "category": "milestone", "condition": {"type": "event", "metric": "registered"}, "reward_rub": 5},
    {"slug": "first_project", "title": "Бизнесмен", "description": "Создайте первый проект", "icon": "📁", "category": "milestone", "condition": {"type": "event", "metric": "first_project"}, "reward_rub": 5},
    {"slug": "first_template", "title": "Шаблонщик", "description": "Используйте первый AI-шаблон", "icon": "📝", "category": "milestone", "condition": {"type": "event", "metric": "first_template"}, "reward_rub": 5},
    {"slug": "spent_100", "title": "Инвестор", "description": "Потратьте 100₽ на генерации", "icon": "💰", "category": "milestone", "condition": {"type": "count", "target": 100, "metric": "spent_rub"}, "reward_rub": 10},
    {"slug": "spent_1000", "title": "Меценат", "description": "Потратьте 1000₽ на генерации", "icon": "💎", "category": "milestone", "condition": {"type": "count", "target": 1000, "metric": "spent_rub"}, "reward_rub": 15},
    # Social
    {"slug": "first_referral", "title": "Амбассадор", "description": "Пригласите первого друга", "icon": "🤝", "category": "social", "condition": {"type": "count", "target": 1, "metric": "referrals"}, "reward_rub": 10},
    {"slug": "referrals_5", "title": "Лидер мнений", "description": "Пригласите 5 друзей", "icon": "📣", "category": "social", "condition": {"type": "count", "target": 5, "metric": "referrals"}, "reward_rub": 15},
    {"slug": "snake_50", "title": "Змеелов", "description": "Наберите 50 очков в змейке", "icon": "🐍", "category": "milestone", "condition": {"type": "count", "target": 50, "metric": "snake_score"}, "reward_rub": 5},
    # Meta-achievements
    {"slug": "collector_10", "title": "Коллекционер", "description": "Откройте 10 достижений", "icon": "🏅", "category": "milestone", "condition": {"type": "count", "target": 10, "metric": "achievements_total"}, "reward_rub": 50},
    {"slug": "collector_20", "title": "Легенда", "description": "Откройте 20 достижений", "icon": "🏆", "category": "milestone", "condition": {"type": "count", "target": 20, "metric": "achievements_total"}, "reward_rub": 100},
]


@router.get("/")
async def list_achievements(user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tg_id = user["id"]

    # Get all achievements
    result = await db.execute(select(Achievement).order_by(Achievement.category))
    all_achs = result.scalars().all()

    # Get user progress
    result = await db.execute(select(UserAchievement).where(UserAchievement.user_tg_id == tg_id))
    user_achs = {ua.achievement_slug: ua for ua in result.scalars().all()}

    items = []
    completed = 0
    for a in all_achs:
        ua = user_achs.get(a.slug)
        is_done = ua.is_completed if ua else False
        if is_done:
            completed += 1
        items.append({
            "slug": a.slug, "title": a.title, "description": a.description,
            "icon": a.icon, "category": a.category,
            "target": a.condition.get("target", 1) if a.condition.get("type") != "event" else 1,
            "progress": ua.progress if ua else 0,
            "is_completed": is_done,
            "completed_at": ua.completed_at.isoformat() if ua and ua.completed_at else None,
            "reward_rub": a.reward_rub,
            "reward_claimed": ua.reward_claimed if ua else False,
        })

    return {"achievements": items, "total": len(all_achs), "completed": completed}


@router.post("/{slug}/claim")
async def claim_reward(slug: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Claim reward for a completed achievement."""
    tg_id = user["id"]

    # Find achievement
    result = await db.execute(select(Achievement).where(Achievement.slug == slug))
    ach = result.scalar_one_or_none()
    if not ach:
        raise HTTPException(404, "Достижение не найдено")

    # Find user progress
    result = await db.execute(
        select(UserAchievement).where(
            UserAchievement.user_tg_id == tg_id,
            UserAchievement.achievement_slug == slug,
        )
    )
    ua = result.scalar_one_or_none()

    if not ua or not ua.is_completed:
        raise HTTPException(400, "Достижение ещё не выполнено")

    if ua.reward_claimed:
        raise HTTPException(400, "Награда уже получена")

    if ach.reward_rub <= 0:
        raise HTTPException(400, "У этого достижения нет награды")

    # Credit reward
    reward_usd = ach.reward_rub / 95.0
    from sqlalchemy import update as sql_update
    await db.execute(
        sql_update(User).where(
            (User.telegram_id == tg_id) | (User.id == tg_id)
        ).values(balance_usd=User.balance_usd + reward_usd)
    )

    ua.reward_claimed = True
    await db.commit()

    logger.info(f"Achievement reward claimed: user={tg_id}, slug={slug}, reward={ach.reward_rub}₽")

    return {
        "slug": slug,
        "reward_rub": ach.reward_rub,
        "reward_usd": round(reward_usd, 4),
        "message": f"+{ach.reward_rub}₽ на баланс!",
    }


@router.post("/seed")
async def seed_achievements(db: AsyncSession = Depends(get_db)):
    """Seed achievements (idempotent)."""
    existing = await db.execute(select(sqlfunc.count()).select_from(Achievement))
    count = existing.scalar()
    if count >= len(ACHIEVEMENTS):
        return {"message": f"Already seeded ({count})", "count": count}

    await db.execute(Achievement.__table__.delete())
    for a in ACHIEVEMENTS:
        db.add(Achievement(**a))
    await db.commit()
    return {"message": f"Seeded {len(ACHIEVEMENTS)} achievements", "count": len(ACHIEVEMENTS)}


# ─── Achievement checker (call from other services) ───

async def check_and_update(tg_id: int, metric: str, value: int = 1) -> list[dict]:
    """Check and update achievements for a metric. Returns list of newly completed achievements."""
    tg_id = int(tg_id)
    value = int(value)
    unlocked = []
    try:
        async with async_session() as db:
            # Get matching achievements
            result = await db.execute(select(Achievement))
            all_achs = result.scalars().all()

            # Check multiformat + unique models
            from app.models.generation import Generation
            user_types: set[str] = set()
            required_types = {"image", "video", "3d", "audio"}
            unique_model_count = 0

            if metric in ("images", "videos", "3d", "audio"):
                types_result = await db.execute(
                    select(Generation.type).where(Generation.user_tg_id == tg_id).distinct()
                )
                user_types = {r for r in types_result.scalars().all()}

            if metric in ("messages", "images", "videos", "unique_models"):
                from app.models.usage import Usage
                models_result = await db.execute(
                    select(Usage.model_id).where(Usage.user_tg_id == tg_id).distinct()
                )
                unique_model_count = len(list(models_result.scalars().all()))

            for ach in all_achs:
                cond = ach.condition

                # Match achievement to metric
                if cond.get("type") == "all_types":
                    if metric not in ("images", "videos", "3d", "audio"):
                        continue
                elif cond.get("type") == "event" and cond.get("metric") == metric:
                    pass
                elif cond.get("type") == "count" and cond.get("metric") == metric:
                    pass
                elif cond.get("type") == "streak" and metric == "streak":
                    pass
                else:
                    continue

                # Get or create user achievement
                ua_result = await db.execute(
                    select(UserAchievement).where(
                        UserAchievement.user_tg_id == tg_id,
                        UserAchievement.achievement_slug == ach.slug,
                    )
                )
                ua = ua_result.scalar_one_or_none()

                if ua and ua.is_completed:
                    continue

                if not ua:
                    ua = UserAchievement(user_tg_id=tg_id, achievement_slug=ach.slug, progress=0)
                    db.add(ua)

                # Update progress
                target = cond.get("target", 1)
                if cond.get("type") == "event":
                    ua.progress = 1
                elif cond.get("type") == "all_types":
                    ua.progress = len(user_types)
                    target = len(required_types)
                elif cond.get("type") == "streak":
                    ua.progress = value
                elif cond.get("metric") == "unique_models":
                    ua.progress = unique_model_count
                elif cond.get("metric") == "achievements_total":
                    # Count completed achievements
                    count_result = await db.execute(
                        select(sqlfunc.count()).select_from(UserAchievement).where(
                            UserAchievement.user_tg_id == tg_id,
                            UserAchievement.is_completed == True,
                        )
                    )
                    ua.progress = count_result.scalar() or 0
                else:
                    ua.progress = value

                # Check completion
                if ua.progress >= target and not ua.is_completed:
                    ua.is_completed = True
                    ua.completed_at = datetime.utcnow()
                    ua.reward_claimed = False
                    unlocked.append({"slug": ach.slug, "title": ach.title, "icon": ach.icon, "reward_rub": ach.reward_rub})

            await db.commit()

            # If any unlocked, check meta-achievements (collector_10/20)
            if unlocked and metric != "achievements_total":
                meta_unlocked = await check_and_update(tg_id, "achievements_total", 0)
                unlocked.extend(meta_unlocked)

    except Exception as e:
        logger.warning(f"Achievement check error: {e}")
    return unlocked
