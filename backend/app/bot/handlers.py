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
    # TODO: fetch actual plan from DB
    await message.answer(
        "📊 <b>Твой тариф: FREE</b>\n\n"
        "• Lite модели: 20 запросов/день\n"
        "• Premium модели: недоступны\n\n"
        "Хочешь больше? Открой приложение и выбери подписку ⚡",
        parse_mode="HTML",
    )


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
