"""Knowledge base for RAG — document chunks with embeddings."""

from datetime import datetime
from sqlalchemy import String, DateTime, Integer, BigInteger, Text, JSON, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class KnowledgeDoc(Base):
    """A document uploaded to a bot's knowledge base."""
    __tablename__ = "knowledge_docs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    bot_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    user_tg_id: Mapped[int] = mapped_column(BigInteger, index=True, nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    doc_type: Mapped[str] = mapped_column(String(20), nullable=False)  # pdf, txt, url
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class KnowledgeChunk(Base):
    """A chunk of text with embedding vector."""
    __tablename__ = "knowledge_chunks"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    doc_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    bot_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[list | None] = mapped_column(JSON, nullable=True)  # float[] vector
    chunk_index: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
