"""Telegram Stars payment handlers — invoice creation and processing."""

from aiogram import Router, F, Bot
from aiogram.types import (
    Message,
    PreCheckoutQuery,
    LabeledPrice,
)

from app.config import get_settings

router = Router()

# Stars products (mirrored from routers/payment.py)
STARS_PRODUCTS = {
    "plus_stars": {"plan": "plus", "price": 469, "name": "PLUS подписка (1 мес)"},
    "max_stars": {"plan": "max", "price": 1499, "name": "MAX подписка (1 мес)"},
    "day_pass": {"price": 59, "name": "Day Pass (24ч)"},
    "week_pass": {"price": 229, "name": "Week Pass (7 дней)"},
    "single_query": {"price": 6, "name": "1 Premium запрос"},
}


async def create_invoice_link(bot: Bot, product_id: str, user_id: int) -> str:
    """Create a Telegram Stars invoice link for a product."""
    product = STARS_PRODUCTS.get(product_id)
    if not product:
        raise ValueError(f"Unknown product: {product_id}")

    link = await bot.create_invoice_link(
        title=f"Stone AI — {product['name']}",
        description=f"{product['name']} для Stone AI",
        payload=f"{product_id}:{user_id}",
        provider_token="",  # Empty for Telegram Stars
        currency="XTR",
        prices=[LabeledPrice(label=product["name"], amount=product["price"])],
    )
    return link


@router.pre_checkout_query()
async def process_pre_checkout(query: PreCheckoutQuery):
    """Always approve pre-checkout (validation happens after payment)."""
    await query.answer(ok=True)


@router.message(F.successful_payment)
async def process_successful_payment(message: Message):
    """
    Handle successful Stars payment.

    Activates the subscription or pass via the internal API.
    """
    payment = message.successful_payment
    payload = payment.invoice_payload  # "product_id:user_id"
    provider_id = payment.telegram_payment_charge_id
    total_amount = payment.total_amount

    parts = payload.split(":")
    if len(parts) != 2:
        await message.answer("⚠️ Ошибка обработки платежа. Обратитесь в поддержку.")
        return

    product_id, user_id = parts[0], int(parts[1])

    # Call internal confirm endpoint
    import httpx
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "http://localhost:8000/api/payment/stars/confirm",
                params={
                    "product_id": product_id,
                    "tg_id": user_id,
                    "payment_id": provider_id,
                },
            )
            if resp.status_code == 200:
                result = resp.json()
                if "plan" in result:
                    await message.answer(
                        f"✅ <b>Подписка {result['plan'].upper()} активирована!</b>\n\n"
                        f"Действует до {result['expires_at'][:10]}\n"
                        "Откройте приложение — Premium модели теперь доступны 🚀",
                        parse_mode="HTML",
                    )
                elif "pass_type" in result:
                    await message.answer(
                        f"✅ <b>{product_id.replace('_', ' ').title()} активирован!</b>\n\n"
                        f"Доступно запросов: {result['requests']}\n"
                        "Откройте приложение и выберите Premium модель 🚀",
                        parse_mode="HTML",
                    )
            else:
                await message.answer("⚠️ Платёж получен, но активация не удалась. Пишите @art_stone")
    except Exception as e:
        await message.answer(
            f"⚠️ Платёж получен ({total_amount}⭐), но произошла ошибка.\n"
            "Мы активируем вручную. Пишите @art_stone"
        )
