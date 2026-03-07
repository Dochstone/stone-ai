"""Models endpoint — list available AI models."""

from fastapi import APIRouter
from app.services.ai_router import MODELS_INFO

router = APIRouter(prefix="/api", tags=["models"])


@router.get("/models")
async def list_models():
    """
    List all available AI models with metadata.

    Returns list of:
        { id, name, company, tier, icon, desc }
    """
    return {"models": MODELS_INFO}
