"""Knowledge base API — upload docs, manage chunks, RAG search."""

import logging
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.knowledge_base import KnowledgeDoc, KnowledgeChunk
from app.models.custom_bot import CustomBot
from app.services.rag import chunk_text, get_embeddings, search_chunks, build_rag_context

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


@router.post("/upload")
async def upload_document(
    bot_id: int = Form(...),
    file: UploadFile = File(...),
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document to bot's knowledge base."""
    tg_id = tg_user["id"]

    # Verify bot ownership
    result = await db.execute(
        select(CustomBot).where(CustomBot.id == bot_id, CustomBot.user_tg_id == tg_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(404, "Бот не найден")

    # Check limit: max 10 docs per bot
    doc_count = await db.scalar(
        select(func.count()).select_from(KnowledgeDoc).where(KnowledgeDoc.bot_id == bot_id)
    )
    if doc_count >= 10:
        raise HTTPException(400, "Максимум 10 документов на бота")

    # Read file
    content = await file.read()
    filename = file.filename or "document"

    if filename.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            from io import BytesIO
            reader = PdfReader(BytesIO(content))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            raise HTTPException(400, f"Ошибка чтения PDF: {str(e)[:100]}")
        doc_type = "pdf"
    elif filename.endswith(".txt") or filename.endswith(".md"):
        text = content.decode("utf-8", errors="ignore")
        doc_type = "txt"
    else:
        text = content.decode("utf-8", errors="ignore")
        doc_type = "txt"

    if len(text.strip()) < 10:
        raise HTTPException(400, "Документ пустой или слишком короткий")

    # Chunk text
    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(400, "Не удалось разбить документ на части")

    # Get embeddings
    embeddings = await get_embeddings(chunks)
    if not embeddings or not any(e for e in embeddings):
        raise HTTPException(503, "Не удалось создать embeddings. Попробуйте позже.")

    # File size check
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "Файл слишком большой (макс 10 МБ)")

    # Save doc
    doc = KnowledgeDoc(
        bot_id=bot_id,
        user_tg_id=tg_id,
        filename=filename[:255],
        doc_type=doc_type,
        chunk_count=len(chunks),
    )
    db.add(doc)
    await db.flush()

    # Save chunks
    for i, (chunk_text_content, embedding) in enumerate(zip(chunks, embeddings)):
        db.add(KnowledgeChunk(
            doc_id=doc.id,
            bot_id=bot_id,
            content=chunk_text_content,
            embedding=embedding,
            chunk_index=i,
        ))

    return {
        "doc_id": doc.id,
        "filename": filename,
        "chunks": len(chunks),
    }


@router.get("/docs/{bot_id}")
async def list_docs(
    bot_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List documents in bot's knowledge base."""
    result = await db.execute(
        select(KnowledgeDoc).where(KnowledgeDoc.bot_id == bot_id, KnowledgeDoc.user_tg_id == tg_user["id"])
        .order_by(KnowledgeDoc.created_at.desc())
    )
    docs = result.scalars().all()
    return {
        "docs": [
            {"id": d.id, "filename": d.filename, "doc_type": d.doc_type, "chunks": d.chunk_count, "created_at": d.created_at.isoformat() if d.created_at else None}
            for d in docs
        ]
    }


@router.delete("/docs/{doc_id}")
async def delete_doc(
    doc_id: int,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a document and its chunks."""
    result = await db.execute(
        select(KnowledgeDoc).where(KnowledgeDoc.id == doc_id, KnowledgeDoc.user_tg_id == tg_user["id"])
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(404, "Документ не найден")

    await db.execute(delete(KnowledgeChunk).where(KnowledgeChunk.doc_id == doc_id))
    await db.delete(doc)
    return {"ok": True}


class RAGSearchRequest(BaseModel):
    bot_id: int
    query: str


@router.post("/search")
async def rag_search(
    body: RAGSearchRequest,
    tg_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Search knowledge base and return context for RAG."""
    # Get bot (own or public)
    result = await db.execute(select(CustomBot).where(CustomBot.id == body.bot_id))
    bot = result.scalar_one_or_none()
    if not bot:
        raise HTTPException(404, "Бот не найден")
    if bot.user_tg_id != tg_user["id"] and not bot.is_public:
        raise HTTPException(403, "Нет доступа")

    # Get all chunks for this bot
    result = await db.execute(
        select(KnowledgeChunk).where(KnowledgeChunk.bot_id == body.bot_id)
    )
    all_chunks = [{"content": c.content, "embedding": c.embedding} for c in result.scalars().all()]

    if not all_chunks:
        return {"context": "", "chunks_found": 0}

    # Embed query
    query_embeddings = await get_embeddings([body.query])
    if not query_embeddings or not query_embeddings[0]:
        return {"context": "", "chunks_found": 0}

    # Search
    relevant = search_chunks(query_embeddings[0], all_chunks, top_k=5)
    context = build_rag_context(relevant)

    return {
        "context": context,
        "chunks_found": len(relevant),
        "top_score": round(relevant[0]["score"], 3) if relevant else 0,
    }
