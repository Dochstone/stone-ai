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
from app.routers import chat, user, models, payment, byok, ads, admin, auth, referral, chats, video, threed, audio, prompts, projects, generations, games, achievements, presentations, photo_session
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
        webhook_domain = os.environ.get("RAILWAY_PUBLIC_DOMAIN", "") or os.environ.get("WEBHOOK_DOMAIN", "stoneai.ru")
        webhook_url = f"https://{webhook_domain}/webhook/{settings.bot_token}"
        try:
            await bot.set_webhook(
                url=webhook_url,
                allowed_updates=["message", "callback_query", "pre_checkout_query"],
            )
            logger.info(f"✅ Webhook set: {webhook_url[:60]}...")
            # Set bot commands menu
            from aiogram.types import BotCommand
            await bot.set_my_commands([
                BotCommand(command="start", description="🚀 Открыть Stone AI"),
                BotCommand(command="plan", description="💎 Мой тариф"),
                BotCommand(command="help", description="❓ Помощь"),
            ])
        except Exception as e:
            logger.error(f"❌ Failed to set webhook: {e}")
        logger.info("✅ Bot initialized in webhook mode")
    else:
        logger.warning("⚠️ Bot token not configured — running API only")

    # Start daily rollover background task
    import asyncio
    from datetime import datetime, timedelta, timezone as tz
    from sqlalchemy import select

    async def daily_rollover_loop():
        MSK = tz(timedelta(hours=3))
        while True:
            now = datetime.now(MSK)
            tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            sleep_sec = (tomorrow - now).total_seconds()
            logger.info(f"Daily rollover: next run in {sleep_sec/3600:.1f}h ({tomorrow.isoformat()})")
            await asyncio.sleep(sleep_sec)
            try:
                from app.services.daily_limits import process_daily_rollover
                from app.database import async_session
                from app.models import User
                async with async_session() as db:
                    count = await process_daily_rollover(db)
                logger.info(f"✅ Daily rollover completed: {count} users")

                # Expire subscriptions past credits_reset_date
                async with async_session() as db:
                    expired = await db.execute(
                        select(User).where(
                            User.subscription_tier != "free",
                            User.subscription_tier.isnot(None),
                            User.credits_reset_date < datetime.utcnow(),
                        )
                    )
                    expired_users = expired.scalars().all()
                    for u in expired_users:
                        old_tier = u.subscription_tier
                        u.subscription_tier = "free"
                        u.credits_balance = 0
                        logger.info(f"Subscription expired: user={u.id}, tier={old_tier}")
                    if expired_users:
                        await db.commit()
                        logger.info(f"✅ Expired {len(expired_users)} subscriptions")
            except Exception as e:
                logger.error(f"❌ Daily rollover error: {e}")

    rollover_task = asyncio.create_task(daily_rollover_loop())

    async def agent_cleanup_loop():
        """Mark stuck agent tasks (running > 10 min) as failed."""
        while True:
            await asyncio.sleep(300)  # every 5 min
            try:
                from app.database import async_session
                from app.models.agent_task import AgentTask
                async with async_session() as db:
                    cutoff = datetime.utcnow() - timedelta(minutes=10)
                    result = await db.execute(
                        select(AgentTask).where(
                            AgentTask.status == "running",
                            AgentTask.created_at < cutoff,
                        )
                    )
                    stuck = result.scalars().all()
                    for t in stuck:
                        t.status = "failed"
                        t.result = "Превышено время выполнения (10 мин)"
                        t.completed_at = datetime.utcnow()
                    if stuck:
                        await db.commit()
                        logger.info(f"Agent cleanup: {len(stuck)} stuck tasks marked failed")

                    # Also cleanup stuck campaigns
                    from app.models.campaign import Campaign
                    camp_result = await db.execute(
                        select(Campaign).where(
                            Campaign.status == "running",
                            Campaign.created_at < cutoff,
                        )
                    )
                    stuck_camps = camp_result.scalars().all()
                    for c in stuck_camps:
                        c.status = "failed"
                        c.result = {**(c.result or {}), "error": "Превышено время выполнения (10 мин)"}
                        c.completed_at = datetime.utcnow()
                    if stuck_camps:
                        await db.commit()
                        logger.info(f"Campaign cleanup: {len(stuck_camps)} stuck campaigns marked failed")
            except Exception as e:
                logger.error(f"Cleanup error: {e}")

    cleanup_task = asyncio.create_task(agent_cleanup_loop())

    yield

    # Shutdown
    rollover_task.cancel()
    cleanup_task.cancel()
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
        "https://stoneai.ru",
        "https://www.stoneai.ru",
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
app.include_router(audio.router)
app.include_router(prompts.router)
app.include_router(projects.router)
app.include_router(generations.router)
app.include_router(games.router)
app.include_router(achievements.router)
app.include_router(presentations.router)
app.include_router(photo_session.router)
from app.routers import bots, agent, analytics, knowledge, campaigns, wordpress, telegram_bots
app.include_router(bots.router)
app.include_router(agent.router)
app.include_router(analytics.router)
app.include_router(knowledge.router)
app.include_router(campaigns.router)
app.include_router(wordpress.router)
app.include_router(telegram_bots.router)


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
    """Basic health check."""
    return {"status": "ok"}


# ─── Run with: uvicorn app.main:app --reload ───
if __name__ == "__main__":
    import uvicorn

    logging.basicConfig(level=logging.INFO)
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
