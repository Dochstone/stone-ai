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
        "🤖 Доступ к <b>11 AI-моделям</b> в одном месте:\n"
        "GPT-4.1, Claude Opus 4, Grok 3, Gemini, DeepSeek и другие.\n\n"
        "✅ <b>6 моделей бесплатно</b> — 20 запросов в день\n"
        "⚡ <b>PLUS/MAX</b> — безлимит + Premium модели\n\n"
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
        "<b>Модели:</b>\n"
        "🆓 Lite (бесплатно): GPT-4o mini, Claude Haiku, Gemini Flash, "
        "DeepSeek R1, Llama 4, Mistral Large\n"
        "💎 Premium (подписка): GPT-4.1, Claude Opus 4, Grok 3, "
        "Gemini 2.5 Pro, Perplexity Pro\n\n"
        "<b>Оплата:</b> ⭐ Stars, 💎 TON, 💲 USDT\n\n"
        "По вопросам: @art_stone",
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
            "• Lite модели: 20 запросов/день\n"
            "• Premium модели: недоступны\n\n"
            "Хочешь больше? Открой приложение и выбери подписку ⚡"
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
        "⚡ <b>PLUS</b> — 469⭐/мес (~$7.50)\n"
        "• 100 Premium запросов/день\n"
        "• Безлимит Lite\n\n"
        "👑 <b>MAX</b> — 1499⭐/мес (~$24)\n"
        "• 500 Premium запросов/день\n"
        "• API доступ\n\n"
        "🎫 <b>Пассы:</b> от 6⭐ за 1 запрос",
        parse_mode="HTML",
        reply_markup=keyboard,
    )
    await callback.answer()


@router.callback_query(F.data == "help")
async def callback_help(callback):
    await cmd_help(callback.message)
    await callback.answer()
