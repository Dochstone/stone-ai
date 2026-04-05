"""Email service — send via email proxy on VPS (noreply@stoneai.ru)."""

import os
import random
import logging
import threading

import httpx

logger = logging.getLogger(__name__)

EMAIL_PROXY_URL = os.getenv("EMAIL_PROXY_URL", "http://45.11.93.113:5050/send")
EMAIL_PROXY_KEY = os.getenv("EMAIL_PROXY_KEY", "stoneai-email-secret-2026")


def generate_code() -> str:
    return str(random.randint(100000, 999999))


def _send_email(to_email: str, subject: str, html_body: str):
    try:
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
    <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
        <h2 style="color:#C4623D;margin-bottom:8px">Stone AI</h2>
        <p>Ваш код подтверждения:</p>
        <div style="background:#f5f5f5;border-radius:12px;padding:20px;text-align:center;margin:16px 0">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a1916">{code}</span>
        </div>
        <p style="color:#888;font-size:13px">Код действителен 10 минут. Если вы не запрашивали регистрацию — проигнорируйте это письмо.</p>
    </div>
    """
    send_email_background(to_email, f"Код подтверждения: {code}", html)


def send_reset_code(to_email: str, code: str):
    html = f"""
    <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:20px">
        <h2 style="color:#C4623D;margin-bottom:8px">Stone AI</h2>
        <p>Код для сброса пароля:</p>
        <div style="background:#f5f5f5;border-radius:12px;padding:20px;text-align:center;margin:16px 0">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1a1916">{code}</span>
        </div>
        <p style="color:#888;font-size:13px">Код действителен 10 минут. Если вы не запрашивали сброс пароля — проигнорируйте это письмо.</p>
    </div>
    """
    send_email_background(to_email, f"Сброс пароля: {code}", html)


def send_payment_confirmation(to_email: str, amount_rub: float, new_balance_rub: float, method: str = "Карта РФ / СБП"):
    """Send payment confirmation email after successful top-up."""
    html = f"""
    <div style="font-family:sans-serif;max-width:450px;margin:0 auto;padding:24px">
        <h2 style="color:#C4623D;margin-bottom:16px">Stone AI</h2>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;text-align:center;margin:16px 0">
            <div style="font-size:24px;margin-bottom:4px">✅</div>
            <div style="font-size:22px;font-weight:bold;color:#166534">{int(amount_rub)} ₽</div>
            <div style="font-size:13px;color:#4ade80;margin-top:4px">Баланс пополнен</div>
        </div>
        <table style="width:100%;font-size:14px;color:#555;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px 0;border-bottom:1px solid #eee">Способ оплаты</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600">{method}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #eee">Сумма</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600">{int(amount_rub)} ₽</td></tr>
            <tr><td style="padding:8px 0">Баланс после</td><td style="padding:8px 0;text-align:right;font-weight:600;color:#C4623D">{int(new_balance_rub)} ₽</td></tr>
        </table>
        <a href="https://stoneai.ru/dashboard" style="display:block;background:#C4623D;color:white;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:14px;margin-top:16px">
            Открыть панель инструментов
        </a>
        <p style="color:#aaa;font-size:11px;text-align:center;margin-top:16px">
            Stone AI — 65+ нейросетей в одном окне<br>
            <a href="https://stoneai.ru" style="color:#C4623D">stoneai.ru</a>
        </p>
    </div>
    """
    send_email_background(to_email, f"Баланс пополнен: +{int(amount_rub)} ₽ — Stone AI", html)


def send_subscription_activated(to_email: str, tier: str, price_rub: float):
    """Send subscription activation email."""
    tier_names = {"mini": "Start", "max": "Pro", "max-pro": "Elite"}
    tier_label = tier_names.get(tier, tier)
    html = f"""
    <div style="font-family:sans-serif;max-width:450px;margin:0 auto;padding:24px">
        <h2 style="color:#C4623D;margin-bottom:16px">Stone AI</h2>
        <div style="background:linear-gradient(135deg,#C4623D,#0E9A83);border-radius:12px;padding:24px;text-align:center;margin:16px 0">
            <div style="font-size:28px;margin-bottom:4px">💎</div>
            <div style="font-size:24px;font-weight:bold;color:white">{tier_label}</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:4px">Подписка активирована</div>
        </div>
        <div style="background:#f9fafb;border-radius:12px;padding:16px;margin:16px 0">
            <p style="font-size:14px;color:#333;margin:0 0 8px 0;font-weight:600">Что доступно:</p>
            <ul style="font-size:13px;color:#666;padding-left:20px;margin:0">
                <li style="margin:4px 0">65+ AI моделей без ограничений</li>
                <li style="margin:4px 0">Генерация картинок, видео, 3D</li>
                <li style="margin:4px 0">AI-презентации и фотосессия</li>
                <li style="margin:4px 0">Подписка действует 30 дней</li>
            </ul>
        </div>
        <a href="https://stoneai.ru/webchat" style="display:block;background:#C4623D;color:white;text-align:center;padding:14px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:14px;margin-top:16px">
            Начать использовать
        </a>
        <p style="color:#aaa;font-size:11px;text-align:center;margin-top:16px">
            Спасибо за покупку! Подписка действует 30 дней с момента активации.<br>
            <a href="https://stoneai.ru" style="color:#C4623D">stoneai.ru</a>
        </p>
    </div>
    """
    send_email_background(to_email, f"Подписка {tier_label} активирована — Stone AI", html)


def send_newsletter(to_email: str, subject: str, content_html: str):
    """Send newsletter email with unsubscribe link."""
    html = f"""
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <a href="https://stoneai.ru" style="text-decoration:none">
            <h2 style="color:#C4623D;margin-bottom:20px">Stone AI</h2>
        </a>
        <div style="font-size:14px;color:#333;line-height:1.7">
            {content_html}
        </div>
        <div style="margin-top:32px;padding-top:20px;border-top:1px solid #eee">
            <a href="https://stoneai.ru/dashboard/chat" style="display:inline-block;background:#C4623D;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:14px">
                Открыть Stone AI
            </a>
        </div>
        <p style="color:#bbb;font-size:11px;margin-top:24px;text-align:center">
            Stone AI — 65+ нейросетей в одном окне<br>
            <a href="https://stoneai.ru" style="color:#C4623D">stoneai.ru</a> ·
            <a href="https://stoneai.ru/profile?unsubscribe=1" style="color:#bbb">Отписаться</a>
        </p>
    </div>
    """
    send_email_background(to_email, subject, html)
