"""Chat history — persistent sessions and messages."""

import logging
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
):
    """Get all messages in a session."""
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

    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    messages = result.scalars().all()

    return {
        "session": {
            "id": session.id,
            "model_id": session.model_id,
            "title": session.title,
        },
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

    # Auto-title from first user message
    if body.role == "user" and session.title == "Новый чат":
        session.title = body.content[:50].strip()

    session.updated_at = datetime.utcnow()
    await db.flush()

    return {"id": msg.id, "session_title": session.title}


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

    return {"status": "ok"}
