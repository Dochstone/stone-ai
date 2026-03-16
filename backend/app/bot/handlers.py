"""Telegram bot handlers — /start, /help, /plan commands."""

from aiogram import Router, F
from aiogram.types import Message, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command

from app.config import get_settings

router = Router()


@router.message(Command("start"))
async def cmd_start(message: Message):
    settings = get_settings()
    webapp_url = settings.webapp_url

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="🚀 Открыть Stone AI",
            web_app=WebAppInfo(url=webapp_url),
        )],
        [InlineKeyboardButton(text="📋 Тарифы", callback_data="plans")],
        [InlineKeyboardButton(text="❓ Помощь", callback_data="help")],
    ])

    await message.answer(
        "👋 <b>Добро пожаловать в Stone AI!</b>\n\n"
        "🤖 Доступ к <b>30+ AI-моделям</b> в одном месте:\n"
        "GPT-5.1, Claude Opus 4, Grok 3, Gemini 2.5, DeepSeek, Llama 4 и другие.\n\n"
        "✅ <b>7 моделей бесплатно</b> — 10 запросов в день (+5 за рекламу)\n"
        "⚡ <b>Premium</b> — оплата за токены\n\n"
        "Нажми кнопку ниже, чтобы начать 👇",
        parse_mode="HTML",
        reply_markup=keyboard,
    )


@router.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "🆘 <b>Stone AI — Помощь</b>\n\n"
        "<b>Команды:</b>\n"
        "/start — Главное меню\n"
        "/plan — Текущий тариф\n"
        "/help — Эта справка\n\n"
        "<b>Модели (30+):</b>\n"
        "🆓 Lite (бесплатно): GPT-4o mini, Claude Haiku, Gemini Flash, "
        "Llama 4, Mistral Large, Gemma 3, Qwen 3\n"
        "💎 Premium (per-token): GPT-4.1, GPT-5.1, Claude Opus 4, Claude Sonnet 4, "
        "Grok 3, Gemini 2.5 Pro, DeepSeek R1/V3, Perplexity Pro и другие\n\n"
        "<b>Оплата:</b> ⭐ Stars, 💎 TON, 💲 USDT\n\n"
        "По вопросам: https://t.me/StoneAIsupport",
        parse_mode="HTML",
    )


@router.message(Command("plan"))
async def cmd_plan(message: Message):
    """Show user's current plan from DB."""
    from app.database import async_session
    from app.services.limiter import get_user_plan, get_active_subscription, get_today_usage, LIMITS

    tg_id = message.from_user.id

    try:
        async with async_session() as db:
            plan = await get_user_plan(db, tg_id)
            sub = await get_active_subscription(db, tg_id)
            lite_today = await get_today_usage(db, tg_id, "lite")
            premium_today = await get_today_usage(db, tg_id, "premium")
            limits = LIMITS.get(plan, LIMITS["free"])

        plan_emoji = {"free": "🆓", "plus": "⚡", "max": "👑"}.get(plan, "🆓")
        plan_name = plan.upper()

        lite_limit = "∞" if limits["lite"] == -1 else str(limits["lite"])
        premium_limit = "∞" if limits["premium"] == -1 else str(limits["premium"])

        text = f"📊 <b>Твой тариф: {plan_emoji} {plan_name}</b>\n\n"
        text += f"• Lite модели: {lite_today}/{lite_limit} запросов сегодня\n"
        text += f"• Premium модели: {premium_today}/{premium_limit} запросов сегодня\n"

        if sub:
            text += f"\n📅 Подписка до: {sub.expires_at.strftime('%d.%m.%Y')}\n"
            text += f"💳 Оплата: {sub.payment_method.upper()}"
        elif plan == "free":
            text += "\n\nХочешь больше? Открой приложение и выбери подписку ⚡"

    except Exception:
        text = (
            "📊 <b>Твой тариф: 🆓 FREE</b>\n\n"
            "• Lite модели: 10 запросов/день (+5 за рекламу)\n"
            "• Premium модели: оплата за токены\n\n"
            "Хочешь больше? Пополни баланс в приложении ⚡"
        )

    await message.answer(text, parse_mode="HTML")


@router.callback_query(F.data == "plans")
async def callback_plans(callback):
    settings = get_settings()
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="💳 Открыть тарифы",
            web_app=WebAppInfo(url=f"{settings.webapp_url}?tab=plans"),
        )],
    ])

    await callback.message.answer(
        "💰 <b>Тарифы Stone AI</b>\n\n"
        "🆓 <b>FREE</b> — 7 Lite моделей бесплатно\n"
        "• 10 запросов/день (+5 за рекламу)\n\n"
        "💎 <b>Per-token</b> — пополни баланс\n"
        "• 25+ Premium моделей\n"
        "• Платишь только за использованные токены\n"
        "• От $0.001 за запрос\n\n"
        "⭐ Stars, 💎 TON, 💲 USDT",
        parse_mode="HTML",
        reply_markup=keyboard,
    )
    await callback.answer()


@router.callback_query(F.data == "help")
async def callback_help(callback):
    await cmd_help(callback.message)
    await callback.answer()
