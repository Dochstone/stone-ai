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
        <a href="https://t.me/drifttt55bot" style="color:#999">Telegram</a> ·
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
    greeting = f"Привет, {name}!" if name else "Добро пожаловать!"
    html = f"""
    <div style="font-family:-apple-system,sans-serif;max-width:450px;margin:0 auto;padding:24px">
        <h2 style="color:#C4623D;margin-bottom:16px">Stone AI</h2>
        <div style="background:linear-gradient(135deg,#C4623D,#0E9A83);border-radius:16px;padding:28px;text-align:center;margin:16px 0">
            <div style="font-size:36px;margin-bottom:8px">🎉</div>
            <div style="font-size:22px;font-weight:bold;color:white">{greeting}</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:6px">Ваш аккаунт создан</div>
        </div>

        <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:16px 0">
            <p style="font-size:14px;color:#333;margin:0 0 12px 0;font-weight:700">Что вас ждёт:</p>
            <table style="width:100%;font-size:13px;color:#555">
                <tr><td style="padding:6px 0">💬</td><td style="padding:6px 8px"><b>10 бесплатных запросов</b> каждый день к 8 моделям</td></tr>
                <tr><td style="padding:6px 0">🧠</td><td style="padding:6px 8px"><b>2 запроса к премиум</b> моделям (GPT-5, Claude) в день</td></tr>
                <tr><td style="padding:6px 0">🎨</td><td style="padding:6px 8px"><b>2 картинки + 1 видео</b> для начала</td></tr>
                <tr><td style="padding:6px 0">🎁</td><td style="padding:6px 8px"><b>100₽ на баланс</b> — подарок за регистрацию</td></tr>
                <tr><td style="padding:6px 0">🏆</td><td style="padding:6px 8px"><b>27 достижений</b> с денежными наградами до 360₽</td></tr>
            </table>
        </div>

        <a href="https://stoneai.ru/dashboard/chat" style="display:block;background:#C4623D;color:white;text-align:center;padding:16px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;margin-top:16px">
            Начать общение с AI →
        </a>

        <div style="margin-top:20px;background:#fef3cd;border-radius:12px;padding:14px;text-align:center">
            <span style="font-size:13px;color:#856404">💡 Совет: попробуйте GPT-5, Claude и Gemini — сравните ответы!</span>
        </div>
        {FOOTER}
    </div>
    """
    if to_email:
        send_email_background(to_email, "Добро пожаловать в Stone AI! 🎉", html)
    if tg_id:
        greeting = f"Привет, {name}!" if name else "Добро пожаловать!"
        _send_telegram(tg_id, (
            f"🎉 <b>{greeting}</b>\n\n"
            f"Ваш аккаунт в Stone AI создан!\n\n"
            f"💬 10 бесплатных запросов/день\n"
            f"🧠 2 премиум запроса/день\n"
            f"🎨 2 картинки + 1 видео\n"
            f"🎁 100₽ на баланс\n"
            f"🏆 27 достижений до 360₽\n\n"
            f"👉 <a href='https://stoneai.ru/dashboard/chat'>Начать</a>"
        ))


def send_payment_confirmation(to_email: str, amount_rub: float, new_balance_rub: float, method: str = "Карта РФ / СБП", tg_id: int | None = None):
    """Send payment confirmation email after successful top-up."""
    html = f"""
    <div style="font-family:-apple-system,sans-serif;max-width:450px;margin:0 auto;padding:24px">
        <h2 style="color:#C4623D;margin-bottom:16px">Stone AI</h2>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:24px;text-align:center;margin:16px 0">
            <div style="font-size:28px;margin-bottom:4px">✅</div>
            <div style="font-size:26px;font-weight:bold;color:#166534">+{int(amount_rub)} ₽</div>
            <div style="font-size:14px;color:#4ade80;margin-top:4px">Баланс пополнен</div>
        </div>
        <table style="width:100%;font-size:14px;color:#555;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">Способ оплаты</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">{method}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #f0f0f0">Сумма</td><td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600">{int(amount_rub)} ₽</td></tr>
            <tr><td style="padding:10px 0">Баланс после</td><td style="padding:10px 0;text-align:right;font-weight:700;color:#C4623D">{int(new_balance_rub)} ₽</td></tr>
        </table>
        <a href="https://stoneai.ru/dashboard" style="display:block;background:#C4623D;color:white;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:14px;margin-top:16px">
            Открыть панель
        </a>
        {FOOTER}
    </div>
    """
    if to_email:
        send_email_background(to_email, f"Баланс пополнен: +{int(amount_rub)} ₽ — Stone AI", html)
    if tg_id:
        _send_telegram(tg_id, (
            f"✅ <b>Баланс пополнен!</b>\n\n"
            f"💵 +{int(amount_rub)}₽\n"
            f"💳 {method}\n"
            f"💰 Баланс: {int(new_balance_rub)}₽"
        ))


def send_subscription_activated(to_email: str, tier: str, price_rub: float, tg_id: int | None = None):
    """Send subscription activation email."""
    tier_names = {"mini": "Start", "max": "Pro", "max-pro": "Elite"}
    tier_label = tier_names.get(tier, tier)
    tier_features = {
        "mini": ["20+ моделей включая GPT-5 и Claude Sonnet", "600 запросов к быстрым моделям/мес", "3 премиум запроса в день", "60 картинок + 30 видео в месяц"],
        "max": ["Все 65+ нейросетей включая Opus", "1 500 быстрых запросов/мес", "28 премиум + 7 Opus в неделю", "35 картинок + 7 видео в неделю"],
        "max-pro": ["Все 65+ нейросетей + API", "4 500 быстрых запросов/мес", "84 премиум + 14 Opus в неделю", "70 картинок + 21 видео в неделю", "Приоритетная скорость"],
    }
    features = tier_features.get(tier, tier_features["mini"])
    features_html = "".join(f'<li style="margin:6px 0;color:#555">{f}</li>' for f in features)

    html = f"""
    <div style="font-family:-apple-system,sans-serif;max-width:450px;margin:0 auto;padding:24px">
        <h2 style="color:#C4623D;margin-bottom:16px">Stone AI</h2>
        <div style="background:linear-gradient(135deg,#C4623D,#0E9A83);border-radius:16px;padding:28px;text-align:center;margin:16px 0">
            <div style="font-size:32px;margin-bottom:6px">💎</div>
            <div style="font-size:26px;font-weight:bold;color:white">{tier_label}</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.85);margin-top:6px">Подписка активирована · {int(price_rub)}₽/мес</div>
        </div>
        <div style="background:#f9fafb;border-radius:12px;padding:18px;margin:16px 0">
            <p style="font-size:14px;color:#333;margin:0 0 10px 0;font-weight:700">Что включено в {tier_label}:</p>
            <ul style="font-size:13px;padding-left:20px;margin:0">{features_html}</ul>
        </div>
        <a href="https://stoneai.ru/dashboard/chat" style="display:block;background:#C4623D;color:white;text-align:center;padding:16px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:15px;margin-top:16px">
            Начать использовать {tier_label} →
        </a>
        <p style="color:#aaa;font-size:12px;text-align:center;margin-top:12px">
            Подписка действует 30 дней. Спасибо за доверие! ❤️
        </p>
        {FOOTER}
    </div>
    """
    if to_email:
        send_email_background(to_email, f"Подписка {tier_label} активирована! — Stone AI", html)
    if tg_id:
        _send_telegram(tg_id, (
            f"💎 <b>Подписка {tier_label} активирована!</b>\n\n"
            f"💵 {int(price_rub)}₽/мес\n\n"
            + "\n".join(f"✅ {f}" for f in features) +
            f"\n\n👉 <a href='https://stoneai.ru/dashboard/chat'>Начать</a>"
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
