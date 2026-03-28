"""Telegram bot handlers — /start, /help, /plan commands."""

from aiogram import Router, F
from aiogram.types import Message, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton, WebAppInfo as WAI
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
        [InlineKeyboardButton(
            text="🌐 Открыть на сайте",
            url="https://stoneai.ru/webchat",
        )],
        [
            InlineKeyboardButton(
                text="💎 Тарифы",
                web_app=WebAppInfo(url=f"{webapp_url}?tab=plans"),
            ),
            InlineKeyboardButton(
                text="❓ Помощь",
                url="https://t.me/stoneaisupport",
            ),
        ],
    ])

    # Remove old reply keyboard if exists
    from aiogram.types import ReplyKeyboardRemove
    await message.answer(
        "<b>Stone AI — 65+ нейросетей в одном окне</b>\n\n"
        "GPT-5.4, Claude Opus, Gemini Pro, DeepSeek, Sora 2 — "
        "текст, картинки, видео, 3D и аудио.\n\n"
        "✅ <b>Бесплатно</b> — 15 запросов/день, 7 моделей\n"
        "⭐ <b>Подписка от 390₽/мес</b> — все 65+ моделей\n\n"
        "Нажми кнопку ниже, чтобы начать 👇",
        parse_mode="HTML",
        reply_markup=ReplyKeyboardRemove(),
    )

    await message.answer(
        "👇 Выберите действие:",
        reply_markup=keyboard,
    )


@router.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "<b>Stone AI — Помощь</b>\n\n"
        "<b>Команды:</b>\n"
        "/start — Главное меню\n"
        "/plan — Текущий тариф\n"
        "/help — Эта справка\n\n"
        "<b>Бесплатные модели (15 запросов/день):</b>\n"
        "GPT-4o mini, Claude Haiku, Gemini Flash, "
        "Llama 4, Mistral Large, DeepSeek V3, Nano Banana\n\n"
        "<b>Подписка от 390₽/мес:</b>\n"
        "Mini — 20+ моделей, 500 запросов\n"
        "Max — 65+ моделей, 2000 запросов, видео\n"
        "Max Pro — 10000 запросов, API\n\n"
        "<b>Оплата:</b> Telegram Stars, крипто (USDT/BTC/ETH), TON\n\n"
        "🌐 Сайт: stoneai.ru\n"
        "💬 Поддержка: @stoneaisupport",
        parse_mode="HTML",
    )


@router.message(Command("plan"))
async def cmd_plan(message: Message):
    """Show user's current subscription tier."""
    from app.database import async_session
    from sqlalchemy import select
    from app.models import User

    tg_id = message.from_user.id

    try:
        async with async_session() as db:
            result = await db.execute(select(User).where(User.telegram_id == tg_id))
            user = result.scalar_one_or_none()

            if not user:
                text = (
                    "<b>Тариф: FREE</b>\n\n"
                    "7 моделей, 15 запросов/день\n\n"
                    "Подписка от 390₽/мес открывает 65+ моделей."
                )
            else:
                tier = user.subscription_tier or "free"
                tier_name = {"mini": "Mini", "max": "Max", "max-pro": "Max Pro"}.get(tier, "Free")
                tier_emoji = {"mini": "💙", "max": "🧡", "max-pro": "⭐"}.get(tier, "🆓")

                text = f"<b>Тариф: {tier_emoji} {tier_name}</b>\n\n"

                if tier == "free":
                    text += "7 моделей, 15 запросов/день\n\n"
                    text += "Подписка от 390₽/мес открывает 65+ моделей."
                else:
                    if user.credits_reset_date:
                        text += f"Действует до: {user.credits_reset_date.strftime('%d.%m.%Y')}\n"
                    text += f"Запросов использовано: {user.monthly_fast_used or 0}\n"
                    if tier in ("max", "max-pro"):
                        text += f"Картинок: {user.monthly_images_used or 0}\n"
                        text += f"Видео: {user.monthly_videos_used or 0}\n"

    except Exception:
        text = (
            "<b>Тариф: 🆓 Free</b>\n\n"
            "7 моделей, 15 запросов/день\n\n"
            "Подписка от 390₽/мес."
        )

    settings = get_settings()
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="💎 Выбрать тариф",
            web_app=WebAppInfo(url=f"{settings.webapp_url}?tab=plans"),
        )],
        [InlineKeyboardButton(
            text="🌐 Оплатить на сайте",
            url="https://stoneai.ru/pricing",
        )],
    ])

    await message.answer(text, parse_mode="HTML", reply_markup=keyboard)


@router.callback_query(F.data == "plans")
async def callback_plans(callback):
    settings = get_settings()
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="💎 Открыть тарифы",
            web_app=WebAppInfo(url=f"{settings.webapp_url}?tab=plans"),
        )],
        [InlineKeyboardButton(
            text="🌐 Оплатить на сайте",
            url="https://stoneai.ru/pricing",
        )],
    ])

    await callback.message.answer(
        "<b>Тарифы Stone AI</b>\n\n"
        "🆓 <b>Free</b> — 0₽, 7 моделей, 15 запросов/день\n"
        "💙 <b>Mini</b> — 390₽/мес, 20+ моделей, 500 запросов\n"
        "🧡 <b>Max</b> — 890₽/мес, 65+ моделей, видео, 3D\n"
        "⭐ <b>Max Pro</b> — 1990₽/мес, безлимит, API\n\n"
        "Оплата: Stars, крипто, TON",
        parse_mode="HTML",
        reply_markup=keyboard,
    )
    await callback.answer()


@router.callback_query(F.data == "help")
async def callback_help(callback):
    await cmd_help(callback.message)
    await callback.answer()


# Reply keyboard button handlers
@router.message(F.text == "❓ Помощь")
async def reply_help(message: Message):
    await cmd_help(message)


@router.message(F.text == "🌐 Сайт")
async def reply_website(message: Message):
    await message.answer(
        "🌐 <b>Stone AI — Веб-версия</b>\n\n"
        "Полный чат с историей, все модели:\n"
        "👉 <a href='https://stoneai.ru/webchat'>stoneai.ru/webchat</a>\n\n"
        "Тарифы и оплата:\n"
        "👉 <a href='https://stoneai.ru/pricing'>stoneai.ru/pricing</a>",
        parse_mode="HTML",
        disable_web_page_preview=True,
    )
