"""Generations gallery — list, favorite, delete user-generated content."""

import base64
import logging
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.generation import Generation

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/generations", tags=["generations"])


@router.get("/")
async def list_generations(
    type: str | None = None,
    project_id: str | None = None,
    is_favorite: bool | None = None,
    page: int = 1,
    limit: int = 20,
    user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tg_id = user["id"]
    query = select(Generation).where(Generation.user_tg_id == tg_id)
    if type:
        query = query.where(Generation.type == type)
    if project_id:
        query = query.where(Generation.project_id == project_id)
    if is_favorite is not None:
        query = query.where(Generation.is_favorite == is_favorite)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(Generation.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    return {
        "generations": [
            {
                "id": g.id, "type": g.type, "model": g.model,
                "prompt": g.prompt, "result_url": g.result_url,
                "result_text": g.result_text, "metadata": g.metadata_,
                "is_favorite": g.is_favorite, "cost": g.cost,
                "project_id": g.project_id,
                "created_at": g.created_at.isoformat() if g.created_at else None,
            }
            for g in items
        ],
        "total": total,
        "page": page,
        "pages": max(1, (total + limit - 1) // limit),
    }


@router.post("/{gen_id}/favorite")
async def toggle_favorite(gen_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tg_id = user["id"]
    result = await db.execute(select(Generation).where(Generation.id == gen_id, Generation.user_tg_id == tg_id))
    gen = result.scalar_one_or_none()
    if not gen:
        raise HTTPException(404, "Генерация не найдена")
    gen.is_favorite = not gen.is_favorite
    await db.commit()
    return {"is_favorite": gen.is_favorite}


@router.delete("/{gen_id}")
async def delete_generation(gen_id: str, user: dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tg_id = user["id"]
    result = await db.execute(select(Generation).where(Generation.id == gen_id, Generation.user_tg_id == tg_id))
    gen = result.scalar_one_or_none()
    if not gen:
        raise HTTPException(404, "Генерация не найдена")
    await db.delete(gen)
    await db.commit()
    return {"ok": True}


@router.get("/share/{gen_id}")
async def get_shared_image(gen_id: int, db: AsyncSession = Depends(get_db)):
    """Public endpoint — serve generated image by ID (no auth required)."""
    result = await db.execute(select(Generation).where(Generation.id == gen_id))
    gen = result.scalar_one_or_none()
    if not gen:
        raise HTTPException(404, "Not found")

    # Try result_text (base64 data URL) or result_url
    data_url = gen.result_text or gen.result_url
    if not data_url or not data_url.startswith("data:image"):
        raise HTTPException(404, "No image data")

    # Parse data:image/png;base64,XXXX
    try:
        header, b64data = data_url.split(",", 1)
        mime = header.split(":")[1].split(";")[0]  # e.g. image/png
        image_bytes = base64.b64decode(b64data)
    except Exception:
        raise HTTPException(500, "Invalid image data")

    return Response(content=image_bytes, media_type=mime, headers={
        "Cache-Control": "public, max-age=86400",
        "Content-Disposition": f"inline; filename=stoneai-{gen_id}.png",
    })
