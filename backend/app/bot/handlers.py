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
            text="Открыть приложение",
            web_app=WebAppInfo(url=webapp_url),
        )],
        [
            InlineKeyboardButton(
                text="Модели и цены",
                web_app=WebAppInfo(url=f"{webapp_url}?tab=plans"),
            ),
            InlineKeyboardButton(
                text="Пополнить баланс",
                web_app=WebAppInfo(url=f"{webapp_url}?tab=plans&action=topup"),
            ),
        ],
        [InlineKeyboardButton(
            text="Поддержка @stoneAIC",
            url="https://t.me/stoneAIC",
        )],
    ])

    await message.answer(
        "<b>Stone AI — 50+ AI-моделей без VPN</b>\n\n"
        "GPT-5, Claude, Gemini, Grok, DeepSeek и другие — "
        "прямо в Telegram.\n\n"
        "Платите только за токены — от $1.\n\n"
        "5 моделей бесплатно, 10 запросов в день.\n"
        "Нажмите кнопку ниже, чтобы начать:",
        parse_mode="HTML",
        reply_markup=keyboard,
    )


@router.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(
        "<b>Stone AI — Помощь</b>\n\n"
        "<b>Команды:</b>\n"
        "/start — Главное меню\n"
        "/plan — Текущий тариф и баланс\n"
        "/help — Эта справка\n\n"
        "<b>50+ моделей:</b>\n"
        "Бесплатные: GPT-4o mini, Claude Haiku, Gemini Flash, "
        "Llama 4 Maverick, Mistral Large\n"
        "Premium: GPT-5.1, Claude Opus 4, Gemini 2.5 Pro, "
        "Grok 3, DeepSeek R1, Perplexity Pro, Flux и другие\n\n"
        "<b>Оплата:</b> Stars, карты/СБП, USDT/BTC/ETH\n\n"
        "Поддержка: @stoneAIC",
        parse_mode="HTML",
    )


@router.message(Command("plan"))
async def cmd_plan(message: Message):
    """Show user's current plan and balance from DB."""
    from app.database import async_session
    from app.services.limiter import get_user_plan, get_active_subscription, get_today_usage, LIMITS, FREE_DAILY_LIMIT
    from sqlalchemy import select
    from app.models import User

    tg_id = message.from_user.id

    try:
        async with async_session() as db:
            plan = await get_user_plan(db, tg_id)
            sub = await get_active_subscription(db, tg_id)
            lite_today = await get_today_usage(db, tg_id, "lite")
            premium_today = await get_today_usage(db, tg_id, "premium")
            limits = LIMITS.get(plan, LIMITS["free"])

            result = await db.execute(select(User).where(User.telegram_id == tg_id))
            user = result.scalar_one_or_none()
            balance = float(user.balance_usd or 0) if user else 0.0
            rewarded = int(user.rewarded_today or 0) if user else 0

        plan_emoji = {"free": "FREE", "plus": "PLUS", "max": "MAX"}.get(plan, "FREE")

        lite_limit = FREE_DAILY_LIMIT + rewarded
        premium_limit = "безлимит" if limits["premium"] == -1 else str(limits["premium"])

        text = f"<b>Тариф: {plan_emoji}</b>\n\n"
        text += f"Баланс: <b>${balance:.2f}</b>\n"
        text += f"Бесплатных сегодня: {lite_today}/{lite_limit}\n"

        if plan != "free":
            text += f"Premium сегодня: {premium_today}/{premium_limit}\n"

        if sub:
            text += f"\nПодписка до: {sub.expires_at.strftime('%d.%m.%Y')}"
        elif balance == 0 and plan == "free":
            text += "\nПополните баланс для доступа ко всем 50 моделям."

    except Exception:
        text = (
            "<b>Тариф: FREE</b>\n\n"
            "Баланс: $0.00\n"
            "5 моделей бесплатно, 10 запросов/день\n\n"
            "Пополните баланс для доступа ко всем 50 моделям."
        )

    await message.answer(text, parse_mode="HTML")


@router.callback_query(F.data == "plans")
async def callback_plans(callback):
    settings = get_settings()
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="Открыть тарифы",
            web_app=WebAppInfo(url=f"{settings.webapp_url}?tab=plans"),
        )],
    ])

    await callback.message.answer(
        "<b>Цены Stone AI</b>\n\n"
        "<b>FREE</b> — 5 моделей бесплатно\n"
        "10 запросов/день (+5 за рекламу)\n\n"
        "<b>Per-token</b> — пополните баланс\n"
        "50+ моделей, безлимитные запросы\n"
        "От $0.24 за 1M токенов\n\n"
        "Оплата: Stars, карты, СБП, крипто",
        parse_mode="HTML",
        reply_markup=keyboard,
    )
    await callback.answer()


@router.callback_query(F.data == "help")
async def callback_help(callback):
    await cmd_help(callback.message)
    await callback.answer()
