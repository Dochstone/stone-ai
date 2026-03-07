"""Stone AI — Main application entry point.

Runs FastAPI (HTTP API) + aiogram (Telegram bot) together.
"""

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties

from app.config import get_settings
from app.database import init_db

# Routers
from app.routers import chat, user, models, payment

# Bot handlers
from app.bot import handlers as bot_handlers
from app.bot import payments as bot_payments

logger = logging.getLogger(__name__)
settings = get_settings()

# ─── Bot setup ───
bot = None
dp = None

if settings.bot_token and not settings.bot_token.startswith("PLACEHOLDER"):
    bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher()
    dp.include_router(bot_handlers.router)
    dp.include_router(bot_payments.router)


# ─── App lifespan ───
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    logger.info("🚀 Stone AI starting up...")
    await init_db()
    logger.info("✅ Database initialized")

    # Start bot polling in background
    bot_task = None
    if bot and dp:
        bot_task = asyncio.create_task(dp.start_polling(bot))
        logger.info("✅ Bot polling started")
    else:
        logger.warning("⚠️ Bot token not configured — running API only")

    yield

    # Shutdown
    if bot_task:
        dp.shutdown()
        bot_task.cancel()
    if bot:
        await bot.session.close()
    logger.info("👋 Stone AI shut down")


# ─── FastAPI app ───
app = FastAPI(
    title="Stone AI",
    description="Multi-model AI chatbot API for Telegram Mini App",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow Mini App origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.webapp_url,
        "https://stone-ai.vercel.app",
        "http://localhost:5173",  # Vite dev
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(chat.router)
app.include_router(user.router)
app.include_router(models.router)
app.include_router(payment.router)


@app.get("/")
async def root():
    return {
        "name": "Stone AI API",
        "version": "1.0.0",
        "status": "running",
        "models": 11,
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


# ─── Run with: uvicorn app.main:app --reload ───
if __name__ == "__main__":
    import uvicorn

    logging.basicConfig(level=logging.INFO)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
