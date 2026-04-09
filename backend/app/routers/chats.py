"""Chat history — persistent sessions and messages."""

import asyncio
import logging
import secrets
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.chat_session import ChatSession, ChatMessage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chats", tags=["chats"])


class CreateSessionRequest(BaseModel):
    model_id: str
    title: str | None = None


class SaveMessageRequest(BaseModel):
    session_id: int
    role: str
    content: str
    tokens_in: int = 0
    tokens_out: int = 0
    cost_usd: float = 0.0


@router.get("")
async def list_sessions(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=200),
):
    """List user's chat sessions, newest first."""
    tg_id = tg_user["id"]
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_tg_id == tg_id)
        .order_by(ChatSession.updated_at.desc())
        .limit(limit)
    )
    sessions = result.scalars().all()

    return {
        "sessions": [
            {
                "id": s.id,
                "model_id": s.model_id,
                "title": s.title,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None,
            }
            for s in sessions
        ]
    }


@router.post("")
async def create_session(
    body: CreateSessionRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new chat session."""
    session = ChatSession(
        user_tg_id=tg_user["id"],
        model_id=body.model_id,
        title=body.title or "Новый чат",
    )
    db.add(session)
    await db.flush()
    await db.commit()

    return {
        "id": session.id,
        "model_id": session.model_id,
        "title": session.title,
    }


@router.get("/{session_id}/messages")
async def get_messages(
    session_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(50, ge=1, le=500),
):
    """Get messages in a session (last N, default 50)."""
    # Verify ownership
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_tg_id == tg_user["id"],
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Chat not found")

    # Get last N messages via subquery (ordered desc, then reversed)
    total = await db.scalar(
        select(func.count()).select_from(ChatMessage).where(ChatMessage.session_id == session_id)
    )
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.desc())
        .limit(limit)
    )
    messages = list(reversed(result.scalars().all()))

    return {
        "session": {
            "id": session.id,
            "model_id": session.model_id,
            "title": session.title,
        },
        "total_messages": total,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "tokens_in": m.tokens_in,
                "tokens_out": m.tokens_out,
                "cost_usd": m.cost_usd,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in messages
        ],
    }


@router.post("/{session_id}/messages")
async def save_message(
    session_id: int,
    body: SaveMessageRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Save a message to a session. Auto-updates title from first user message."""
    # Verify ownership
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_tg_id == tg_user["id"],
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Chat not found")

    msg = ChatMessage(
        session_id=session_id,
        role=body.role,
        content=body.content,
        tokens_in=body.tokens_in,
        tokens_out=body.tokens_out,
        cost_usd=body.cost_usd,
    )
    db.add(msg)

    # Auto-title from first user message (temporary, will be replaced by AI title)
    if body.role == "user" and session.title == "Новый чат":
        session.title = body.content[:50].strip()

    # Generate smart title after first assistant response
    msg_count = await db.scalar(
        select(func.count()).select_from(ChatMessage).where(ChatMessage.session_id == session_id)
    )
    if body.role == "assistant" and msg_count <= 2 and session.title != "Новый чат":
        # Generate smart title in background (don't block response)
        asyncio.create_task(_generate_title(session.id, session.title))

    session.updated_at = datetime.utcnow()
    await db.flush()
    await db.commit()

    return {"id": msg.id, "session_title": session.title}


async def _generate_title(session_id: int, user_msg: str):
    """Background task: generate smart chat title via AI."""
    import httpx
    import os
    from app.database import async_session
    try:
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        if not openrouter_key or len(user_msg) <= 5:
            return
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={"Authorization": f"Bearer {openrouter_key}"},
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": "Generate a short chat title (2-5 words, Russian) for this conversation. Reply with ONLY the title, nothing else."},
                        {"role": "user", "content": user_msg[:200]},
                    ],
                    "max_tokens": 20,
                },
            )
            if resp.status_code == 200:
                data = resp.json()
                title = data["choices"][0]["message"]["content"].strip().strip('"').strip("*").strip("_").strip("`")
                if 1 < len(title) < 80:
                    async with async_session() as db:
                        result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
                        s = result.scalar_one_or_none()
                        if s:
                            s.title = title
                            await db.commit()
    except Exception as e:
        logger.warning(f"Auto-title failed: {e}")


class RenameSessionRequest(BaseModel):
    title: str


@router.patch("/{session_id}")
async def rename_session(
    session_id: int,
    body: RenameSessionRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Rename a chat session."""
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_tg_id == tg_user["id"],
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Chat not found")

    session.title = body.title[:100].strip()
    await db.flush()
    await db.commit()

    return {"status": "ok", "title": session.title}


@router.delete("/{session_id}")
async def delete_session(
    session_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a chat session and all its messages."""
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_tg_id == tg_user["id"],
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Chat not found")

    await db.execute(delete(ChatMessage).where(ChatMessage.session_id == session_id))
    await db.delete(session)
    await db.commit()

    return {"status": "ok"}


@router.delete("")
async def delete_all_sessions(
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete all chat sessions and messages for current user."""
    tg_id = tg_user["id"]
    # Get all session IDs
    result = await db.execute(
        select(ChatSession.id).where(ChatSession.user_tg_id == tg_id)
    )
    session_ids = [r for r in result.scalars().all()]
    if session_ids:
        await db.execute(delete(ChatMessage).where(ChatMessage.session_id.in_(session_ids)))
        await db.execute(delete(ChatSession).where(ChatSession.user_tg_id == tg_id))
    await db.commit()
    return {"status": "ok", "deleted": len(session_ids)}


@router.post("/{session_id}/share")
async def share_session(
    session_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a share link for a chat session."""
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_tg_id == tg_user["id"],
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Chat not found")

    if not session.share_token:
        session.share_token = secrets.token_urlsafe(16)
        await db.flush()
        await db.commit()

    return {"share_token": session.share_token, "share_url": f"https://stoneai.ru/shared/{session.share_token}"}


@router.delete("/{session_id}/share")
async def unshare_session(
    session_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove share link."""
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_tg_id == tg_user["id"],
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Chat not found")

    session.share_token = None
    await db.flush()
    await db.commit()
    return {"status": "ok"}


@router.get("/shared/{share_token}")
async def get_shared_chat(
    share_token: str,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — view a shared chat without auth."""
    result = await db.execute(
        select(ChatSession).where(ChatSession.share_token == share_token)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(404, "Shared chat not found")

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = result.scalars().all()

    return {
        "title": session.title,
        "model_id": session.model_id,
        "messages": [
            {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat() if m.created_at else None}
            for m in messages
        ],
    }
