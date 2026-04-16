"""Email service — send via email proxy on VPS (noreply@stoneai.ru)."""

import os
import random
import logging
import threading

import httpx

logger = logging.getLogger(__name__)

EMAIL_PROXY_URL = os.getenv("EMAIL_PROXY_URL", "http://45.11.93.113:5050/send")
EMAIL_PROXY_KEY = os.getenv("EMAIL_PROXY_KEY", "")


def _send_telegram(tg_id: int, text: str):
    """Send message via Telegram bot."""
    try:
        bot_token = os.getenv("BOT_TOKEN", "")
        if not bot_token:
            return
        r = httpx.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={"chat_id": tg_id, "text": text, "parse_mode": "HTML"},
            timeout=5,
        )
        if r.status_code == 200:
            logger.info(f"TG message sent to {tg_id}")
    except Exception as e:
        logger.warning(f"TG message failed for {tg_id}: {e}")


def notify_user(email: str | None, tg_id: int | None, subject: str, html_body: str, tg_text: str):
    """Send notification to user — email if available, Telegram as fallback."""
    if email:
        send_email_background(email, subject, html_body)
    if tg_id and (not email or tg_id > 0):
        t = threading.Thread(target=_send_telegram, args=(tg_id, tg_text), daemon=True)
        t.start()

FOOTER = """
<div style="margin-top:32px;padding-top:20px;border-top:1px solid #f0f0f0;text-align:center">
    <a href="https://stoneai.ru" style="text-decoration:none">
        <span style="color:#C4623D;font-weight:bold;font-size:14px">Stone AI</span>
    </a>
    <p style="color:#bbb;font-size:11px;margin-top:8px">
        AI-студия нового поколения · 65+ нейросетей<br>
        <a href="https://stoneai.ru" style="color:#C4623D">stoneai.ru</a> ·
        <a href="https://t.me/stonetgbot" style="color:#999">Telegram</a> ·
        <a href="https://t.me/StoneAIsupport" style="color:#999">Поддержка</a>
    </p>
</div>
"""


def generate_code() -> str:
    return str(random.randint(100000, 999999))


def _send_email(to_email: str, subject: str, html_body: str):
    try:
        if not EMAIL_PROXY_KEY:
            logger.error("EMAIL_PROXY_KEY is not configured")
            return False
        r = httpx.post(
            EMAIL_PROXY_URL,
            json={"to": to_email, "subject": subject, "html": html_body},
            headers={"X-API-Key": EMAIL_PROXY_KEY, "Content-Type": "application/json"},
            timeout=10,
        )
        if r.status_code == 200:
            logger.info(f"Email sent to {to_email}: {subject}")
            return True
        else:
            logger.error(f"Email proxy error {r.status_code}: {r.text}")
            return False
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_email_background(to_email: str, subject: str, html_body: str):
    """Send email in a background thread to avoid blocking the request."""
    t = threading.Thread(target=_send_email, args=(to_email, subject, html_body), daemon=True)
    t.start()


def send_verification_code(to_email: str, code: str):
    html = f"""
    <div style="font-family:-apple-system,sans-serif;max-width:450px;margin:0 auto;padding:24px">
        <h2 style="color:#C4623D;margin-bottom:16px">Stone AI</h2>
        <p style="font-size:15px;color:#333">Ваш код подтверждения:</p>
        <div style="background:linear-gradient(135deg,#faf5f0,#f0f7f5);border:1px solid #e8e0d8;border-radius:16px;padding:24px;text-align:center;margin:16px 0">
            <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#C4623D">{code}</span>
        </div>
        <p style="color:#999;font-size:12px">Код действителен 10 минут. Если вы не запрашивали — проигнорируйте это письмо.</p>
        {FOOTER}
    </div>
    """
    send_email_background(to_email, f"Код подтверждения: {code} — Stone AI", html)


def send_reset_code(to_email: str, code: str):
    html = f"""
    <div style="font-family:-apple-system,sans-serif;max-width:450px;margin:0 auto;padding:24px">
        <h2 style="color:#C4623D;margin-bottom:16px">Stone AI</h2>
        <p style="font-size:15px;color:#333">Код для сброса пароля:</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:16px;padding:24px;text-align:center;margin:16px 0">
            <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#dc2626">{code}</span>
        </div>
        <p style="color:#999;font-size:12px">Код действителен 10 минут. Если вы не запрашивали — проигнорируйте.</p>
        {FOOTER}
    </div>
    """
    send_email_background(to_email, f"Сброс пароля — Stone AI", html)


def send_welcome(to_email: str, name: str = "", tg_id: int | None = None):
    """Send welcome email after registration."""
    greeting = f"Привет, {name}!" if name else "Добро пожаловать в Stone AI!"
    intro = (
        f"Рад знакомству, {name}. " if name else "Очень рад, что вы с нами. "
    )
    html = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2a2a2a">
        <h2 style="color:#C4623D;margin:0 0 8px 0;font-size:22px">Stone AI</h2>
        <p style="font-size:13px;color:#888;margin:0 0 20px 0">AI-студия нового поколения · 65+ нейросетей в одном окне</p>

        <div style="background:linear-gradient(135deg,#C4623D,#0E9A83);border-radius:20px;padding:32px 24px;text-align:center;margin:0 0 20px 0">
            <div style="font-size:40px;margin-bottom:6px">🎉</div>
            <div style="font-size:24px;font-weight:bold;color:white;margin-bottom:6px">{greeting}</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.9);line-height:1.5">
                {intro}Ваш аккаунт готов — можно начинать.
            </div>
        </div>

        <p style="font-size:15px;line-height:1.6;color:#333;margin:20px 0 12px 0">
            Stone AI объединяет <b>65+ топовых нейросетей</b> в одном интерфейсе: GPT-5, Claude 4.5 Sonnet, Gemini 2.5, Midjourney, Runway, Suno и десятки других. Без VPN, с оплатой в рублях, с общим балансом на все модели.
        </p>

        <div style="background:#f9fafb;border-radius:14px;padding:20px;margin:20px 0">
            <p style="font-size:14px;color:#333;margin:0 0 14px 0;font-weight:700">🎁 Что уже на вашем балансе:</p>
            <table style="width:100%;font-size:13px;color:#444;line-height:1.5">
                <tr><td style="padding:7px 0;width:28px;vertical-align:top">💬</td><td style="padding:7px 6px"><b>10 быстрых запросов/день</b> к GPT-4o mini, Gemini Flash, Llama 3</td></tr>
                <tr><td style="padding:7px 0;vertical-align:top">🧠</td><td style="padding:7px 6px"><b>2 премиум-запроса/день</b> к GPT-5, Claude 4.5 Sonnet, Gemini 2.5 Pro</td></tr>
                <tr><td style="padding:7px 0;vertical-align:top">🎨</td><td style="padding:7px 6px"><b>2 картинки + 2 видео-поинта</b> — Midjourney, Flux, Runway Gen-3</td></tr>
                <tr><td style="padding:7px 0;vertical-align:top">🎁</td><td style="padding:7px 6px"><b>100 ₽ на баланс</b> в подарок — хватит на десятки дополнительных запросов</td></tr>
                <tr><td style="padding:7px 0;vertical-align:top">🏆</td><td style="padding:7px 6px"><b>27 достижений</b> с денежными наградами — до <b>360 ₽</b> дополнительно</td></tr>
            </table>
        </div>

        <div style="background:#fff8f3;border:1px solid #f0e1d3;border-radius:14px;padding:20px;margin:20px 0">
            <p style="font-size:14px;color:#333;margin:0 0 12px 0;font-weight:700">💡 С чего начать — три идеи на вечер:</p>
            <ol style="font-size:13px;color:#555;line-height:1.7;padding-left:20px;margin:0">
                <li><b>Сравните модели на одной задаче.</b> Задайте один и тот же вопрос GPT-5 и Claude — увидите, у кого язык живее, а кто глубже копает.</li>
                <li><b>Сделайте картинку в Midjourney V7</b> — опишите сцену в 2-3 предложениях, получите результат уровня профессиональной иллюстрации.</li>
                <li><b>Превратите фото в видео</b> через Runway Gen-3 или Kling — оживите любой кадр за 10 секунд.</li>
            </ol>
        </div>

        <a href="https://stoneai.ru/dashboard/chat" style="display:block;background:#C4623D;color:white;text-align:center;padding:16px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;margin:24px 0 8px 0">
            Открыть Stone AI →
        </a>
        <p style="text-align:center;font-size:12px;color:#888;margin:0 0 20px 0">
            Или зайдите через <a href="https://t.me/stonetgbot" style="color:#C4623D;text-decoration:none">Telegram-бот</a> — работает даже в мобильном
        </p>

        <div style="background:#f0f7f5;border-radius:12px;padding:14px 16px;margin:16px 0;font-size:12px;color:#555;line-height:1.6">
            <b style="color:#0E9A83">Нужна помощь?</b> Напишите в <a href="https://t.me/StoneAIsupport" style="color:#0E9A83">поддержку</a> — отвечаем в течение часа. А если что-то пошло не так с платежом или достижениями — сразу пингуйте, разберёмся.
        </div>
        {FOOTER}
    </div>
    """
    if to_email:
        send_email_background(to_email, "Добро пожаловать в Stone AI — начнём? 🎉", html)
    if tg_id:
        tg_greeting = f"Привет, {name}!" if name else "Добро пожаловать!"
        _send_telegram(tg_id, (
            f"🎉 <b>{tg_greeting}</b>\n\n"
            f"Stone AI — это 65+ нейросетей в одном окне. Оплата в рублях, без VPN.\n\n"
            f"🎁 <b>Уже на балансе:</b>\n"
            f"💬 10 быстрых запросов/день\n"
            f"🧠 2 премиум запроса (GPT-5, Claude)\n"
            f"🎨 2 картинки + 2 видео-поинта\n"
            f"💵 100₽ в подарок\n"
            f"🏆 До 360₽ за 27 достижений\n\n"
            f"💡 <b>С чего начать:</b> задайте один вопрос GPT-5 и Claude — сравните ответы. Это 30 секунд, но переворачивает представление о том, что умеет AI.\n\n"
            f"👉 <a href='https://stoneai.ru/dashboard/chat'>Открыть Stone AI</a>"
        ))


def send_payment_confirmation(to_email: str, amount_rub: float, new_balance_rub: float, method: str = "Карта РФ / СБП", tg_id: int | None = None):
    """Send payment confirmation email after successful top-up."""
    amount_int = int(amount_rub)
    balance_int = int(new_balance_rub)
    html = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2a2a2a">
        <h2 style="color:#C4623D;margin:0 0 20px 0;font-size:22px">Stone AI</h2>

        <p style="font-size:15px;line-height:1.5;color:#333;margin:0 0 16px 0">
            Спасибо за пополнение — деньги на балансе, можно продолжать.
        </p>

        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;padding:28px 20px;text-align:center;margin:20px 0">
            <div style="font-size:32px;margin-bottom:4px">✅</div>
            <div style="font-size:32px;font-weight:bold;color:#166534;line-height:1.2">+{amount_int} ₽</div>
            <div style="font-size:14px;color:#16a34a;margin-top:6px">Платёж прошёл успешно</div>
        </div>

        <table style="width:100%;font-size:14px;color:#444;border-collapse:collapse;margin:20px 0">
            <tr>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;color:#888">Способ оплаты</td>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">{method}</td>
            </tr>
            <tr>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;color:#888">Сумма</td>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">{amount_int} ₽</td>
            </tr>
            <tr>
                <td style="padding:12px 0;color:#888">Текущий баланс</td>
                <td style="padding:12px 0;text-align:right;font-weight:700;color:#C4623D;font-size:16px">{balance_int} ₽</td>
            </tr>
        </table>

        <div style="background:#fff8f3;border:1px solid #f0e1d3;border-radius:14px;padding:18px 20px;margin:20px 0">
            <p style="font-size:14px;color:#333;margin:0 0 10px 0;font-weight:700">💡 На что потратить эффективнее всего</p>
            <p style="font-size:13px;color:#555;line-height:1.6;margin:0">
                По балансу доступны <b>все 65+ моделей</b> — включая GPT-5, Claude 4.5 Opus, Midjourney V7 и Runway Gen-3. Дорогие модели (Opus, Veo 3) выгоднее использовать с подпиской <b>Pro</b> — там они стоят в 2-5 раз меньше.
            </p>
        </div>

        <a href="https://stoneai.ru/dashboard/chat" style="display:block;background:#C4623D;color:white;text-align:center;padding:16px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;margin:20px 0 8px 0">
            Продолжить в Stone AI →
        </a>
        <p style="text-align:center;font-size:12px;color:#888;margin:0 0 16px 0">
            <a href="https://stoneai.ru/dashboard" style="color:#888;text-decoration:underline">Посмотреть историю операций</a>
        </p>

        <p style="font-size:11px;color:#aaa;text-align:center;line-height:1.5;margin:20px 0 0 0">
            Чек и платёжные документы отправлены отдельным письмом от платёжной системы.<br>
            Если что-то не так с платежом — напишите в <a href="https://t.me/StoneAIsupport" style="color:#999">поддержку</a>.
        </p>
        {FOOTER}
    </div>
    """
    if to_email:
        send_email_background(to_email, f"Баланс пополнен: +{amount_int} ₽ — Stone AI", html)
    if tg_id:
        _send_telegram(tg_id, (
            f"✅ <b>Платёж принят, +{amount_int} ₽ на балансе</b>\n\n"
            f"💳 {method}\n"
            f"💰 Текущий баланс: <b>{balance_int} ₽</b>\n\n"
            f"💡 Совет: дорогие модели (Claude Opus, Veo 3) дешевле из подписки Pro — до 5× экономии.\n\n"
            f"👉 <a href='https://stoneai.ru/dashboard/chat'>Продолжить</a>"
        ))


def send_subscription_activated(to_email: str, tier: str, price_rub: float, tg_id: int | None = None):
    """Send subscription activation email."""
    tier_names = {"mini": "Start", "max": "Pro", "max-pro": "Elite"}
    tier_label = tier_names.get(tier, tier)
    tier_features = {
        "mini": [
            "20+ моделей, включая GPT-5 и Claude 4.5 Sonnet",
            "600 быстрых + 90 премиум-запросов в месяц",
            "60 картинок и 13 видео-поинтов + триалы новых моделей",
        ],
        "max": [
            "Все 65+ нейросетей, включая Claude 4.5 Opus и Gemini 2.5 Pro",
            "1 500 быстрых + 112 премиум-запросов в месяц",
            "140 картинок и 33 видео-поинта в месяц",
            "Дорогие модели в 2-5 раз дешевле, чем без подписки",
        ],
        "max-pro": [
            "Все 65+ нейросетей + доступ к API",
            "4 500 быстрых + 336 премиум-запросов в месяц",
            "280 картинок и 80 видео-поинтов в месяц",
            "Приоритет в очереди и ранний доступ к новым моделям",
        ],
    }
    tier_first_steps = {
        "mini": "Задайте задачу сразу трём моделям (GPT-5, Claude Sonnet, Gemini Flash) — увидите, какая лучше попадает в ваш стиль.",
        "max": "Запустите Claude 4.5 Opus на сложной задаче с длинным контекстом — почувствуете разницу с Sonnet и GPT-5 на мышлении.",
        "max-pro": "Подключите API-ключ и автоматизируйте рутину: суммаризация писем, перевод документов, генерация отчётов по расписанию.",
    }
    features = tier_features.get(tier, tier_features["mini"])
    first_step = tier_first_steps.get(tier, tier_first_steps["mini"])
    features_html = "".join(
        f'<li style="margin:8px 0;color:#444;line-height:1.5">{f}</li>' for f in features
    )

    html = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#2a2a2a">
        <h2 style="color:#C4623D;margin:0 0 20px 0;font-size:22px">Stone AI</h2>

        <div style="background:linear-gradient(135deg,#C4623D,#0E9A83);border-radius:20px;padding:32px 24px;text-align:center;margin:0 0 20px 0">
            <div style="font-size:40px;margin-bottom:8px">💎</div>
            <div style="font-size:28px;font-weight:bold;color:white;margin-bottom:6px">{tier_label}</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.9)">
                Подписка активна · {int(price_rub)} ₽/мес
            </div>
        </div>

        <p style="font-size:15px;line-height:1.6;color:#333;margin:0 0 20px 0">
            Подписка <b>{tier_label}</b> включена — теперь у вас расширенный лимит, дешевле цены на дорогие модели и доступ к функциям, которых нет на бесплатном тарифе.
        </p>

        <div style="background:#f9fafb;border-radius:14px;padding:20px;margin:20px 0">
            <p style="font-size:14px;color:#333;margin:0 0 12px 0;font-weight:700">Что теперь доступно:</p>
            <ul style="font-size:13px;padding-left:20px;margin:0">{features_html}</ul>
        </div>

        <div style="background:#fff8f3;border:1px solid #f0e1d3;border-radius:14px;padding:18px 20px;margin:20px 0">
            <p style="font-size:14px;color:#333;margin:0 0 10px 0;font-weight:700">💡 С чего начать</p>
            <p style="font-size:13px;color:#555;line-height:1.6;margin:0">{first_step}</p>
        </div>

        <a href="https://stoneai.ru/dashboard/chat" style="display:block;background:#C4623D;color:white;text-align:center;padding:16px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;margin:24px 0 8px 0">
            Начать использовать {tier_label} →
        </a>

        <div style="background:#f0f7f5;border-radius:12px;padding:14px 16px;margin:20px 0;font-size:12px;color:#555;line-height:1.6">
            <b style="color:#0E9A83">ℹ️ Об оплате:</b> подписка действует 30 дней и продлевается автоматически. Отменить можно в любой момент в <a href="https://stoneai.ru/dashboard" style="color:#0E9A83">профиле</a> — до конца периода всё останется активным.
        </div>

        <p style="color:#999;font-size:12px;text-align:center;margin:20px 0 0 0;line-height:1.6">
            Спасибо, что выбрали Stone AI ❤️<br>
            Вопросы — в <a href="https://t.me/StoneAIsupport" style="color:#999">поддержку</a>, отвечаем в течение часа.
        </p>
        {FOOTER}
    </div>
    """
    if to_email:
        send_email_background(to_email, f"Подписка {tier_label} активна — добро пожаловать 💎", html)
    if tg_id:
        _send_telegram(tg_id, (
            f"💎 <b>Подписка {tier_label} активна</b>\n\n"
            f"💵 {int(price_rub)} ₽/мес · продление автоматическое\n\n"
            f"<b>Теперь доступно:</b>\n"
            + "\n".join(f"✅ {f}" for f in features) +
            f"\n\n💡 <b>С чего начать:</b> {first_step}\n\n"
            f"👉 <a href='https://stoneai.ru/dashboard/chat'>Открыть Stone AI</a>"
        ))


def send_newsletter(to_email: str, subject: str, content_html: str):
    """Send newsletter email."""
    html = f"""
    <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <a href="https://stoneai.ru" style="text-decoration:none">
            <h2 style="color:#C4623D;margin-bottom:20px">Stone AI</h2>
        </a>
        <div style="font-size:14px;color:#333;line-height:1.7">
            {content_html}
        </div>
        <a href="https://stoneai.ru/dashboard/chat" style="display:inline-block;background:#C4623D;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px;margin-top:24px">
            Открыть Stone AI
        </a>
        {FOOTER}
    </div>
    """
    send_email_background(to_email, subject, html)
