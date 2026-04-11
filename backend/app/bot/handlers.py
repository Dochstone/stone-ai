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

    args = message.text.split(maxsplit=1)

    # Handle account linking deep link: /start link_{user_db_id}
    if len(args) > 1 and args[1].startswith("link_"):
        web_user_id = args[1][5:]
        if web_user_id.isdigit():
            try:
                from app.database import async_session
                from sqlalchemy import select
                from app.models import User
                from app.services.linked_providers import add_linked_providers

                tg_id = message.from_user.id
                async with async_session() as db:
                    # Find web user
                    result = await db.execute(select(User).where(User.id == int(web_user_id)))
                    web_user = result.scalar_one_or_none()
                    if web_user:
                        # Check if TG user already exists separately
                        result2 = await db.execute(select(User).where(User.telegram_id == tg_id))
                        tg_existing = result2.scalar_one_or_none()

                        if tg_existing and tg_existing.id != web_user.id:
                            # Merge TG user into web user
                            web_user.balance_usd = float(web_user.balance_usd or 0) + float(tg_existing.balance_usd or 0)
                            web_user.total_requests = (web_user.total_requests or 0) + (tg_existing.total_requests or 0)
                            await db.delete(tg_existing)

                        web_user.telegram_id = tg_id
                        web_user.username = message.from_user.username or web_user.username
                        web_user.first_name = message.from_user.first_name or web_user.first_name
                        add_linked_providers(web_user, "telegram")
                        await db.commit()

                        await message.answer(
                            "✅ <b>Telegram привязан к аккаунту!</b>\n\n"
                            f"Email: {web_user.email or '—'}\n"
                            "Теперь можете входить через Telegram.\n\n"
                            "👉 <a href='https://stoneai.ru/webchat'>Вернуться на сайт</a>",
                            parse_mode="HTML",
                        )
                        return
                    else:
                        await message.answer("❌ Аккаунт не найден.", parse_mode="HTML")
                        return
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Link error: {e}")

    # Handle web login deep link: /start web_{session_id}
    if len(args) > 1 and args[1].startswith("web_"):
        session_id = args[1][4:]  # strip "web_" prefix
        if len(session_id) >= 8:
            try:
                from app.routers.auth import confirm_tg_web_session
                tg_user = message.from_user
                user, token = await confirm_tg_web_session(
                    session_id,
                    tg_user.id,
                    {
                        "username": tg_user.username,
                        "first_name": tg_user.first_name,
                        "language_code": tg_user.language_code or "ru",
                    },
                )
                # Direct login link with token
                login_url = f"https://stoneai.ru/auth/telegram-callback?token={token}&email={user.email or ''}&name={tg_user.first_name or ''}&balance={float(user.balance_usd or 0)}"
                await message.answer(
                    "✅ <b>Авторизация подтверждена!</b>\n\n"
                    "Нажмите кнопку ниже чтобы войти на сайт:",
                    parse_mode="HTML",
                    reply_markup=InlineKeyboardMarkup(inline_keyboard=[
                        [InlineKeyboardButton(
                            text="🌐 Войти на сайт",
                            url=login_url,
                        )],
                    ]),
                )
                return
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Web login error: {e}")
                await message.answer(
                    "❌ Ссылка для входа истекла. Попробуйте ещё раз на сайте.",
                    parse_mode="HTML",
                )
                return

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
        "✅ <b>Бесплатно</b> — 10 запросов/день, 7 моделей\n"
        "⭐ <b>Подписка от 590₽/мес</b> — все 65+ моделей\n\n"
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
        "<b>Бесплатные модели (10 запросов/день):</b>\n"
        "GPT-4o mini, Claude Haiku, Gemini Flash, "
        "Llama 4, Mistral Large, DeepSeek V3, Nano Banana\n\n"
        "<b>Подписка от 590₽/мес:</b>\n"
        "Start — 20+ моделей, 500 запросов\n"
        "Pro — 65+ моделей, 2000 запросов, видео\n"
        "Elite — 10000 запросов, API\n\n"
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
                    "7 моделей, 10 запросов/день\n\n"
                    "Подписка от 590₽/мес открывает 65+ моделей."
                )
            else:
                tier = user.subscription_tier or "free"
                tier_name = {"mini": "Start", "max": "Pro", "max-pro": "Elite"}.get(tier, "Free")
                tier_emoji = {"mini": "💙", "max": "🧡", "max-pro": "⭐"}.get(tier, "🆓")

                text = f"<b>Тариф: {tier_emoji} {tier_name}</b>\n\n"

                if tier == "free":
                    text += "7 моделей, 10 запросов/день\n\n"
                    text += "Подписка от 590₽/мес открывает 65+ моделей."
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
            "7 моделей, 10 запросов/день\n\n"
            "Подписка от 590₽/мес."
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
        "🆓 <b>Free</b> — 0₽, 7 моделей, 10 запросов/день\n"
        "💙 <b>Start</b> — 590₽/мес, 20+ моделей, 500 запросов\n"
        "🧡 <b>Pro</b> — 1 290₽/мес, 65+ моделей, видео, 3D\n"
        "⭐ <b>Elite</b> — 2 990₽/мес, безлимит, API\n\n"
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
