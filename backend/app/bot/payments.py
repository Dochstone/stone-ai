"""Telegram Stars payment handlers — invoice creation and processing."""

from aiogram import Router, F, Bot
from aiogram.types import (
    Message,
    PreCheckoutQuery,
    LabeledPrice,
)

from app.config import get_settings

router = Router()

# Stars products — subscription plans
# Price in Stars: RUB price / ~1.3 RUB per Star
STARS_PRODUCTS = {
    "sub_mini": {"tier": "mini", "price": 300, "name": "Mini подписка (1 мес)"},
    "sub_max": {"tier": "max", "price": 685, "name": "Max подписка (1 мес)"},
    "sub_max_pro": {"tier": "max-pro", "price": 1531, "name": "Max Pro подписка (1 мес)"},
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

    # Subscription format: sub:<tier>:<user_id>
    if parts[0] == "sub" and len(parts) == 3:
        tier = parts[1]
        user_id = int(parts[2])
        tier_names = {"mini": "Mini", "max": "Max", "max-pro": "Max Pro"}

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "http://localhost:8000/api/payment/stars/subscribe",
                    params={"tg_id": user_id, "tier": tier, "payment_id": provider_id},
                )
                if resp.status_code == 200:
                    await message.answer(
                        f"✅ <b>Подписка {tier_names.get(tier, tier)} активирована!</b>\n\n"
                        f"Действует 30 дней\n"
                        "Все модели теперь доступны 🚀\n\n"
                        "Откройте приложение или stoneai.ru/webchat",
                        parse_mode="HTML",
                    )
                else:
                    await message.answer("⚠️ Платёж получен, но активация не удалась. Пишите @stoneaisupport")
        except Exception:
            await message.answer(
                f"⚠️ Платёж получен ({total_amount}⭐), но произошла ошибка.\n"
                "Мы активируем вручную. Пишите @stoneaisupport"
            )
        return

    # Legacy format: topup:<user_id>:<usd_amount>
    if parts[0] == "topup" and len(parts) == 3:
        user_id = int(parts[1])
        usd_amount = float(parts[2])

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    "http://localhost:8000/api/payment/stars/confirm",
                    params={"tg_id": user_id, "usd_amount": usd_amount, "payment_id": provider_id},
                )
                if resp.status_code == 200:
                    result = resp.json()
                    await message.answer(
                        f"✅ <b>Баланс пополнен на ${usd_amount:.2f}!</b>\n"
                        f"Текущий баланс: ${result['new_balance_usd']:.2f}",
                        parse_mode="HTML",
                    )
                else:
                    await message.answer("⚠️ Платёж получен, но активация не удалась. Пишите @stoneaisupport")
        except Exception:
            await message.answer(f"⚠️ Платёж получен ({total_amount}⭐), ошибка. Пишите @stoneaisupport")
        return

    await message.answer("⚠️ Ошибка обработки платежа. Обратитесь в @stoneaisupport")
