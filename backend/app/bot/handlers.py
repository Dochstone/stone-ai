"""Telegram bot handlers — /start, /help, /plan, /ref commands."""

from aiogram import Router, F
from aiogram.types import (
    Message, WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton,
    ReplyKeyboardRemove, FSInputFile, CallbackQuery,
)
from aiogram.filters import Command

from app.config import get_settings
from app.pricing import PLAN_PRICES_RUB

router = Router()
TIER_RANK = {"free": 0, "mini": 1, "max": 2, "max-pro": 3}


def _fmt_rub(n: int) -> str:
    """Format 1890 → '1 890₽' (ru locale with NBSP-style space)."""
    return f"{n:,}".replace(",", " ") + "₽"


PRICE_MINI = _fmt_rub(PLAN_PRICES_RUB["mini"])       # 990₽
PRICE_MAX = _fmt_rub(PLAN_PRICES_RUB["max"])         # 1 890₽
PRICE_ELITE = _fmt_rub(PLAN_PRICES_RUB["max-pro"])   # 3 990₽
PRICE_FROM_MIN = PRICE_MINI  # "от X₽" anchor


PLAN_SUMMARY_MINI = "20+ моделей · 600 быстрых · 150 премиум · 60 картинок · 13 видео-поинтов"
PLAN_SUMMARY_MAX = "65+ нейросетей · 1 500 быстрых · 112 премиум · 28 Opus · 140 картинок · 33 видео-поинта"
PLAN_SUMMARY_ELITE = "65+ нейросетей · 4 500 быстрых · 336 премиум · 56 Opus · 280 картинок · 80 видео-поинтов · API"


def _should_keep_subscription(source, target) -> bool:
    source_tier = getattr(source, "subscription_tier", None) or "free"
    target_tier = getattr(target, "subscription_tier", None) or "free"
    source_rank = TIER_RANK.get(source_tier, 0)
    target_rank = TIER_RANK.get(target_tier, 0)
    if source_rank != target_rank:
        return source_rank > target_rank
    source_expiry = getattr(source, "credits_reset_date", None)
    target_expiry = getattr(target, "credits_reset_date", None)
    if source_expiry and not target_expiry:
        return True
    if source_expiry and target_expiry:
        return source_expiry > target_expiry
    return False


def _copy_subscription_state(target, source) -> None:
    target.subscription_tier = source.subscription_tier
    target.subscription_started = source.subscription_started
    target.credits_reset_date = source.credits_reset_date
    target.credits_balance = source.credits_balance
    target.monthly_fast_used = source.monthly_fast_used
    target.monthly_premium_used = source.monthly_premium_used
    target.monthly_images_used = source.monthly_images_used
    target.monthly_videos_used = source.monthly_videos_used
    target.monthly_3d_used = source.monthly_3d_used
    target.monthly_audio_used = source.monthly_audio_used
    target.opus_requests_used = source.opus_requests_used
    target.video_points_used = source.video_points_used
    target.video_points_reset_date = source.video_points_reset_date
    target.trial_video_points_used = source.trial_video_points_used
    target.trial_start_standard_used = source.trial_start_standard_used
    target.trial_start_premium_used = source.trial_start_premium_used


@router.message(Command("start"))
async def cmd_start(message: Message):
    settings = get_settings()
    webapp_url = settings.webapp_url

    args = message.text.split(maxsplit=1)
    start_param = args[1].strip() if len(args) > 1 else None

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
                            web_user.total_tokens_used = (web_user.total_tokens_used or 0) + (tg_existing.total_tokens_used or 0)
                            if _should_keep_subscription(tg_existing, web_user):
                                _copy_subscription_state(web_user, tg_existing)
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

    # Persist Telegram acquisition source for /start src_* and referral payloads.
    try:
        from app.database import async_session
        from app.services.limiter import get_or_create_user

        tg_user = message.from_user
        async with async_session() as db:
            await get_or_create_user(
                db,
                {
                    "id": tg_user.id,
                    "username": tg_user.username,
                    "first_name": tg_user.first_name,
                    "language_code": tg_user.language_code or "ru",
                },
                start_param=start_param,
            )
            await db.commit()
    except Exception:
        import logging
        logging.getLogger(__name__).exception("Failed to persist Telegram start attribution")

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="🤖 Чат с AI",
            url="https://stoneai.ru/webchat",
        )],
        [
            InlineKeyboardButton(
                text="🖼️ Картинки",
                url="https://stoneai.ru/images",
            ),
            InlineKeyboardButton(
                text="🎥 Видео",
                url="https://stoneai.ru/video",
            ),
        ],
        [
            InlineKeyboardButton(
                text="🔍 Поиск AI",
                url="https://stoneai.ru/search",
            ),
            InlineKeyboardButton(
                text="🧠 Модели",
                url="https://stoneai.ru/models",
            ),
        ],
        [
            InlineKeyboardButton(
                text="💎 Тарифы",
                url="https://stoneai.ru/pricing",
            ),
            InlineKeyboardButton(
                text="🎁 Пригласи друга",
                callback_data="referral",
            ),
        ],
        [InlineKeyboardButton(
            text="❓ Помощь",
            url="https://t.me/stoneaisupport",
        )],
    ])

    welcome_text = (
        "<b>Stone AI — 65+ нейросетей в одном окне</b>\n\n"

        "🤖 <b>Текст и чат</b>\n"
        "GPT-5.4 · Claude Opus · Gemini 3 · DeepSeek R1\n\n"

        "🖼️ <b>Генерация картинок</b>\n"
        "Nano Banana Pro · Flux · GPT-5 Image · Midjourney\n\n"

        "🎥 <b>Генерация видео</b>\n"
        "Sora 2 · Veo 3 · Kling v2 · Luma Ray 2\n\n"

        "🔍 <b>Умный поиск</b>\n"
        "Perplexity Sonar · Deep Research\n\n"

        "🎙️ <b>Озвучка и аудио</b>\n"
        "Whisper STT · TTS\n\n"

        "━━━━━━━━━━━━━━━━━━━━\n"
        "✅ <b>Бесплатно:</b> 10 быстрых + 2 премиум/день + 2 картинки + 2 видео\n"
        f"⭐ <b>Подписка:</b> от {PRICE_FROM_MIN}/мес — все модели безлимитно\n"
        "💳 <b>Оплата:</b> карта РФ · СБП · Stars · крипто\n"
        "━━━━━━━━━━━━━━━━━━━━\n\n"
        "👇 Нажми кнопку — начни бесплатно:"
    )

    # Remove old reply keyboard
    await message.answer("⏳", reply_markup=ReplyKeyboardRemove())

    # Send welcome banner + text
    try:
        banner = FSInputFile("/var/www/stone-ai/media/images/bot-welcome.png")
        await message.answer_photo(
            photo=banner,
            caption=welcome_text,
            parse_mode="HTML",
            reply_markup=keyboard,
        )
    except Exception:
        # Fallback: text only if banner fails
        await message.answer(
            welcome_text,
            parse_mode="HTML",
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
        "<b>Бесплатно (10 быстрых + 2 премиум/день):</b>\n"
        "GPT-4o mini, Claude Haiku, Gemini Flash, "
        "Llama 4, Mistral Large, DeepSeek V3\n\n"
        "<b>+ пробные:</b> 2 картинки (Nano Banana) · 2 видео (Sora 2 / Veo 3 / Kling)\n\n"
        f"<b>Подписка от {PRICE_FROM_MIN}/мес:</b>\n"
        f"Start ({PRICE_MINI}) — {PLAN_SUMMARY_MINI}\n"
        f"Pro ({PRICE_MAX}) — {PLAN_SUMMARY_MAX}\n"
        f"Elite ({PRICE_ELITE}) — {PLAN_SUMMARY_ELITE}\n\n"
        "💡 Тяжёлые модели тратят больше единиц: Sonnet/GPT-5.1 = ×2, Opus = ×5\n\n"
        "<b>Оплата:</b> Telegram Stars, карты/СБП, крипто (USDT/BTC/ETH), TON\n\n"
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
                    "<b>Тариф: 🆓 Free</b>\n\n"
                    "6 быстрых моделей · 10 запросов/день + 2 премиум\n\n"
                    f"Подписка от {PRICE_FROM_MIN}/мес открывает 65+ моделей."
                )
            else:
                tier = user.subscription_tier or "free"
                tier_name = {"mini": "Start", "max": "Pro", "max-pro": "Elite"}.get(tier, "Free")
                tier_emoji = {"mini": "💙", "max": "🧡", "max-pro": "⭐"}.get(tier, "🆓")

                text = f"<b>Тариф: {tier_emoji} {tier_name}</b>\n\n"

                if tier == "free":
                    text += "6 быстрых моделей · 10 запросов/день + 2 премиум\n\n"
                    text += f"Подписка от {PRICE_FROM_MIN}/мес открывает 65+ моделей."
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
            "6 быстрых моделей · 10 запросов/день\n\n"
            f"Подписка от {PRICE_FROM_MIN}/мес."
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
        "🆓 <b>Free</b> — 10 быстрых + 2 премиум/день, 2 картинки и 2 видео пробных\n"
        f"💙 <b>Start</b> — {PRICE_MINI}/мес · {PLAN_SUMMARY_MINI}\n"
        f"🧡 <b>Pro</b> — {PRICE_MAX}/мес · {PLAN_SUMMARY_MAX}\n"
        f"⭐ <b>Elite</b> — {PRICE_ELITE}/мес · {PLAN_SUMMARY_ELITE}\n\n"
        "💡 Дорогие модели (Opus, Nano Banana Pro) тратят больше единиц.\n"
        "Оплата: Stars, карты/СБП, крипто, TON",
        parse_mode="HTML",
        reply_markup=keyboard,
    )
    await callback.answer()


@router.callback_query(F.data == "help")
async def callback_help(callback):
    await cmd_help(callback.message)
    await callback.answer()


async def _get_referral_text(tg_id: int) -> str:
    """Build referral info message for a user."""
    from app.database import async_session
    from sqlalchemy import select, func
    from app.models import User

    try:
        async with async_session() as db:
            result = await db.execute(select(User).where(User.telegram_id == tg_id))
            user = result.scalar_one_or_none()

            if not user:
                return (
                    "<b>🎁 Реферальная программа Stone AI</b>\n\n"
                    "Чтобы получить реферальный код, сначала откройте бота "
                    "и сделайте хотя бы 1 запрос."
                )

            # Generate code if not exists
            if not user.referral_code:
                import secrets
                user.referral_code = secrets.token_hex(4).upper()[:8]
                await db.commit()

            code = user.referral_code
            ref_link = f"https://t.me/stonetgbot?start=ref_{code}"

            # Count referrals
            count_result = await db.execute(
                select(func.count()).where(User.referrer_id == tg_id)
            )
            ref_count = count_result.scalar() or 0
            ref_balance = float(user.referral_balance or 0)

            return (
                "<b>🎁 Реферальная программа Stone AI</b>\n\n"
                "<b>Как это работает:</b>\n"
                "1. Поделись ссылкой с другом\n"
                "2. Друг получает <b>+5 бесплатных запросов</b>\n"
                "3. Ты получаешь <b>+5 запросов</b> + <b>10% с каждого пополнения</b> друга\n\n"
                "━━━━━━━━━━━━━━━━━━━━\n"
                f"🔗 <b>Твоя ссылка:</b>\n<code>{ref_link}</code>\n\n"
                f"👥 Приглашено друзей: <b>{ref_count}</b>\n"
                f"💰 Заработано: <b>${ref_balance:.2f}</b>\n"
                "━━━━━━━━━━━━━━━━━━━━\n\n"
                "👆 Нажми на ссылку чтобы скопировать"
            )
    except Exception:
        return (
            "<b>🎁 Реферальная программа Stone AI</b>\n\n"
            "Пригласи друга — получи <b>10% с его пополнений</b> "
            "и <b>+5 бесплатных запросов</b>.\n\n"
            "Откройте Stone AI чтобы получить реферальную ссылку."
        )


@router.message(Command("ref"))
async def cmd_ref(message: Message):
    text = await _get_referral_text(message.from_user.id)
    await message.answer(text, parse_mode="HTML")


@router.callback_query(F.data == "referral")
async def callback_referral(callback: CallbackQuery):
    text = await _get_referral_text(callback.from_user.id)
    await callback.message.answer(text, parse_mode="HTML")
    await callback.answer()
