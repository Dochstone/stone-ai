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
