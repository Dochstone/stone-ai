"""Models endpoint — list available AI models with optional filtering."""

from fastapi import APIRouter, Query
from app.services.ai_router import MODELS_INFO

router = APIRouter(prefix="/api", tags=["models"])


@router.get("/models")
async def list_models(
    tier: str | None = Query(None, description="Filter by tier: lite or premium"),
    company: str | None = Query(None, description="Filter by company name"),
    category: str | None = Query(None, description="Filter by category: chat, image, code, search"),
):
    """
    List available AI models with metadata.

    Optional filters:
        ?tier=lite          — only free models
        ?company=OpenAI     — filter by provider
        ?category=image     — filter by category
    """
    models = MODELS_INFO

    if tier:
        models = [m for m in models if m["tier"] == tier]
    if company:
        models = [m for m in models if m["company"].lower() == company.lower()]
    if category:
        models = [m for m in models if m["category"] == category]

    return {"models": models}
