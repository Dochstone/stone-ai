"""Stone AI — Main application entry point.

FastAPI HTTP API server with Telegram bot webhook handler.
"""

import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.types import Update

from app.config import get_settings
from app.database import init_db

# Routers
from app.routers import chat, user, models, payment, byok, ads, admin, auth, referral, chats, video, threed
from app.routers import payment_ext

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

    # Set webhook for Telegram bot
    if bot:
        port = os.environ.get("PORT", "8000")
        railway_url = os.environ.get("RAILWAY_PUBLIC_DOMAIN", "")
        if railway_url:
            webhook_url = f"https://{railway_url}/webhook/{settings.bot_token}"
        else:
            webhook_url = f"https://stone-ai-production.up.railway.app/webhook/{settings.bot_token}"
        try:
            await bot.set_webhook(
                url=webhook_url,
                allowed_updates=["message", "callback_query", "pre_checkout_query"],
            )
            logger.info(f"✅ Webhook set: {webhook_url[:60]}...")
        except Exception as e:
            logger.error(f"❌ Failed to set webhook: {e}")
        logger.info("✅ Bot initialized in webhook mode")
    else:
        logger.warning("⚠️ Bot token not configured — running API only")

    yield

    # Shutdown
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
        "https://stone-ai-1.vercel.app",
        "https://stone-ai.vercel.app",
        "https://website-production-907e.up.railway.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
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
app.include_router(payment_ext.router)
app.include_router(ads.router)
app.include_router(byok.router)
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(referral.router)
app.include_router(chats.router)
app.include_router(video.router)
app.include_router(threed.router)


@app.get("/")
async def root():
    return {
        "name": "Stone AI API",
        "version": "1.0.0",
        "status": "running",
        "models": 25,
        "docs": "/docs",
    }


# ─── Webhook endpoint for Telegram bot ───
@app.post("/webhook/{token}")
async def telegram_webhook(token: str, request: Request):
    """Process incoming Telegram updates via webhook."""
    if not bot or not dp:
        return {"error": "Bot not configured"}

    if token != settings.bot_token:
        return {"error": "Invalid token"}

    try:
        data = await request.json()
        update = Update.model_validate(data, context={"bot": bot})
        await dp.feed_update(bot=bot, update=update)
    except Exception as e:
        logger.error(f"Webhook handler error: {e}")

    # Always return 200 OK to prevent Telegram from retrying
    return {"ok": True}


@app.get("/health")
async def health():
    return {"status": "ok"}


# ─── Run with: uvicorn app.main:app --reload ───
if __name__ == "__main__":
    import uvicorn

    logging.basicConfig(level=logging.INFO)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
