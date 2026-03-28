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
        "/img [промпт] — Генерация картинки\n"
        "/video [промпт] — Генерация видео\n"
        "/plan — Текущий тариф\n"
        "/help — Эта справка\n\n"
        "<b>Или просто напиши текст</b> — AI ответит (GPT-4o mini)\n\n"
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


# ═══════════════════════════════════════════════════════════
# /img — генерация картинок прямо в чате
# ═══════════════════════════════════════════════════════════

@router.message(Command("img"))
async def cmd_img(message: Message):
    prompt = message.text.replace("/img", "", 1).strip()
    if not prompt:
        await message.answer(
            "🎨 <b>Генерация картинок</b>\n\n"
            "Напиши промпт после команды:\n"
            "<code>/img закат над горами, фотореализм</code>\n"
            "<code>/img логотип кофейни, минимализм</code>\n"
            "<code>/img кот в костюме космонавта</code>",
            parse_mode="HTML",
        )
        return

    # Check user access
    from app.database import async_session
    from sqlalchemy import select
    from app.models import User

    tg_id = message.from_user.id
    async with async_session() as db:
        result = await db.execute(select(User).where(User.telegram_id == tg_id))
        user = result.scalar_one_or_none()

    tier = user.subscription_tier or "free" if user else "free"
    balance = float(user.balance_usd or 0) if user else 0

    if tier == "free" and balance <= 0:
        img_used = user.daily_image_used or 0 if user else 0
        if img_used >= 2:
            await message.answer("🔒 Лимит картинок исчерпан (2/день). Подписка от 390₽/мес → /plan")
            return

    wait_msg = await message.answer("🎨 Генерирую картинку...")

    import httpx
    settings = get_settings()
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/images/generations",
                headers={"Authorization": f"Bearer {settings.openai_api_key}", "Content-Type": "application/json"},
                json={"model": "dall-e-3", "prompt": prompt, "n": 1, "size": "1024x1024", "quality": "hd", "style": "natural"},
            )
            if resp.status_code != 200:
                await wait_msg.edit_text("❌ Ошибка генерации. Попробуйте другой промпт.")
                return

            data = resp.json()
            image_url = data["data"][0].get("url")
            if not image_url:
                await wait_msg.edit_text("❌ Не удалось получить картинку.")
                return

            # Download and send as photo
            img_resp = await client.get(image_url, timeout=30.0)
            if img_resp.status_code == 200:
                from aiogram.types import BufferedInputFile
                photo = BufferedInputFile(img_resp.content, filename="stone-ai.png")
                await message.answer_photo(photo, caption=f"🎨 <b>{prompt}</b>\n\n<i>Stone AI · DALL-E 3</i>", parse_mode="HTML")
                await wait_msg.delete()

                # Update usage
                async with async_session() as db:
                    result = await db.execute(select(User).where(User.telegram_id == tg_id))
                    u = result.scalar_one_or_none()
                    if u:
                        u.daily_image_used = (u.daily_image_used or 0) + 1
                        u.total_requests = (u.total_requests or 0) + 1
                        await db.commit()
            else:
                await wait_msg.edit_text("❌ Ошибка загрузки картинки.")

    except Exception as e:
        await wait_msg.edit_text(f"❌ Ошибка: {str(e)[:100]}")


# ═══════════════════════════════════════════════════════════
# /video — генерация видео прямо в чате
# ═══════════════════════════════════════════════════════════

@router.message(Command("video"))
async def cmd_video(message: Message):
    prompt = message.text.replace("/video", "", 1).strip()
    if not prompt:
        await message.answer(
            "🎬 <b>Генерация видео</b>\n\n"
            "Напиши промпт после команды:\n"
            "<code>/video камера летит над горным озером</code>\n"
            "<code>/video закат на пляже, волны</code>",
            parse_mode="HTML",
        )
        return

    from app.database import async_session
    from sqlalchemy import select
    from app.models import User

    tg_id = message.from_user.id
    async with async_session() as db:
        result = await db.execute(select(User).where(User.telegram_id == tg_id))
        user = result.scalar_one_or_none()

    tier = user.subscription_tier or "free" if user else "free"
    if tier not in ("mini", "max", "max-pro") and (float(user.balance_usd or 0) if user else 0) <= 0:
        await message.answer("🔒 Генерация видео доступна по подписке от 390₽/мес → /plan")
        return

    wait_msg = await message.answer("🎬 Генерирую видео... (~2-3 мин)")

    import httpx
    settings = get_settings()
    try:
        # Submit to fal.ai MiniMax
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://queue.fal.run/fal-ai/minimax-video",
                headers={"Authorization": f"Key {settings.fal_api_key}", "Content-Type": "application/json"},
                json={"prompt": prompt},
            )
            if resp.status_code not in (200, 202):
                await wait_msg.edit_text("❌ Ошибка генерации видео.")
                return
            rid = resp.json().get("request_id")

        # Poll for result
        import asyncio
        for i in range(60):
            await asyncio.sleep(5)
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"https://queue.fal.run/fal-ai/minimax-video/requests/{rid}/status",
                    headers={"Authorization": f"Key {settings.fal_api_key}"},
                )
                s = resp.json()
                if s.get("status") == "COMPLETED":
                    # Get result
                    resp2 = await client.get(
                        f"https://queue.fal.run/fal-ai/minimax-video/requests/{rid}",
                        headers={"Authorization": f"Key {settings.fal_api_key}"},
                    )
                    result = resp2.json()
                    video_url = result.get("video", {}).get("url")
                    if video_url:
                        vid_resp = await client.get(video_url, timeout=60.0)
                        if vid_resp.status_code == 200:
                            from aiogram.types import BufferedInputFile
                            video_file = BufferedInputFile(vid_resp.content, filename="stone-ai.mp4")
                            await message.answer_video(video_file, caption=f"🎬 <b>{prompt}</b>\n\n<i>Stone AI · MiniMax</i>", parse_mode="HTML")
                            await wait_msg.delete()

                            async with async_session() as db:
                                result = await db.execute(select(User).where(User.telegram_id == tg_id))
                                u = result.scalar_one_or_none()
                                if u:
                                    u.monthly_videos_used = (u.monthly_videos_used or 0) + 1
                                    u.total_requests = (u.total_requests or 0) + 1
                                    await db.commit()
                            return
                    await wait_msg.edit_text("❌ Видео не сгенерировалось.")
                    return
                elif s.get("status") == "FAILED":
                    await wait_msg.edit_text("❌ Ошибка генерации видео.")
                    return

        await wait_msg.edit_text("⏱ Таймаут генерации. Попробуйте снова.")

    except Exception as e:
        await wait_msg.edit_text(f"❌ Ошибка: {str(e)[:100]}")
