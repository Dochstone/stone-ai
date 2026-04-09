"""Games — snake leaderboard with monthly prizes."""

import asyncio
import logging
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.game_score import GameScore
from app.models.user import User
from app.routers.achievements import check_and_update

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/games", tags=["games"])


MAX_VALID_SCORE = 100_000  # anti-cheat: realistic max for snake


class ScoreSubmit(BaseModel):
    game: str = "snake"
    score: int


@router.post("/score")
async def save_score(data: ScoreSubmit, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tg_id = user["id"]
    if data.score < 0 or data.score > MAX_VALID_SCORE:
        return {"saved": False, "score": 0, "is_new_record": False}
    month = datetime.utcnow().strftime("%Y-%m")

    result = await db.execute(
        select(GameScore).where(GameScore.user_tg_id == tg_id, GameScore.game == data.game, GameScore.month == month)
    )
    prev = result.scalar_one_or_none()

    if prev:
        if data.score > prev.score:
            prev.score = data.score
            await db.commit()
            if data.game == "snake":
                asyncio.create_task(check_and_update(tg_id, "snake_score", data.score))
            return {"saved": True, "score": data.score, "is_new_record": True}
        return {"saved": False, "score": prev.score, "is_new_record": False}

    db.add(GameScore(user_tg_id=tg_id, game=data.game, score=data.score, month=month))
    await db.commit()
    if data.game == "snake":
        asyncio.create_task(check_and_update(tg_id, "snake_score", data.score))
    return {"saved": True, "score": data.score, "is_new_record": True}


@router.get("/leaderboard")
async def leaderboard(game: str = "snake", month: str | None = None, limit: int = 20, db: AsyncSession = Depends(get_db)):
    if not month:
        month = datetime.utcnow().strftime("%Y-%m")

    query = (
        select(GameScore, User.first_name, User.username)
        .join(User, User.telegram_id == GameScore.user_tg_id, isouter=True)
        .where(GameScore.game == game, GameScore.month == month)
        .order_by(GameScore.score.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    rows = result.all()

    return {
        "leaderboard": [
            {
                "rank": i + 1,
                "name": row.first_name or row.username or "Аноним",
                "score": row.GameScore.score,
            }
            for i, row in enumerate(rows)
        ],
        "month": month,
        "game": game,
    }
