"""Telegram Stars payment handlers — invoice creation and processing."""

from aiogram import Router, F, Bot
from aiogram.types import (
    Message,
    PreCheckoutQuery,
    LabeledPrice,
)

from app.config import get_settings

router = Router()

# Stars products (subscriptions and passes, kept for backwards compat)
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
        provider_token="",
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

    Supports both:
    - New format: "topup:<user_id>:<usd_amount>" (USD balance top-up)
    - Legacy format: "<product_id>:<user_id>" (subscriptions/passes)
    """
    payment = message.successful_payment
    payload = payment.invoice_payload
    provider_id = payment.telegram_payment_charge_id
    total_amount = payment.total_amount

    parts = payload.split(":")

    import httpx

    # New format: topup:<user_id>:<usd_amount>
    if parts[0] == "topup" and len(parts) == 3:
        user_id = int(parts[1])
        usd_amount = float(parts[2])

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "http://localhost:8000/api/payment/stars/confirm",
                    params={
                        "tg_id": user_id,
                        "usd_amount": usd_amount,
                        "payment_id": provider_id,
                    },
                )
                if resp.status_code == 200:
                    result = resp.json()
                    await message.answer(
                        f"✅ <b>Баланс пополнен на ${usd_amount:.2f}!</b>\n\n"
                        f"Текущий баланс: ${result['new_balance_usd']:.2f}\n"
                        "Откройте приложение — все модели доступны 🚀",
                        parse_mode="HTML",
                    )
                else:
                    await message.answer("⚠️ Платёж получен, но активация не удалась. Пишите https://t.me/StoneAIsupport")
        except Exception:
            await message.answer(
                f"⚠️ Платёж получен ({total_amount}⭐), но произошла ошибка.\n"
                "Мы зачислим вручную. Пишите https://t.me/StoneAIsupport"
            )
        return

    # Legacy format: <product_id>:<user_id>
    if len(parts) == 2:
        product_id, user_id = parts[0], int(parts[1])

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
                    elif "added_usd" in result:
                        await message.answer(
                            f"✅ <b>Баланс пополнен!</b>\n"
                            f"Текущий баланс: ${result['new_balance_usd']:.2f}",
                            parse_mode="HTML",
                        )
                else:
                    await message.answer("⚠️ Платёж получен, но активация не удалась. Пишите https://t.me/StoneAIsupport")
        except Exception:
            await message.answer(
                f"⚠️ Платёж получен ({total_amount}⭐), но произошла ошибка.\n"
                "Мы активируем вручную. Пишите https://t.me/StoneAIsupport"
            )
        return

    await message.answer("⚠️ Ошибка обработки платежа. Обратитесь в поддержку https://t.me/StoneAIsupport")
