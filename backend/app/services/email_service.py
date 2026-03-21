"""Email service — send verification codes and password resets via SMTP."""

import os
import random
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.beget.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "465"))
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "noreply@stoneai.ru")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")


def generate_code() -> str:
    return str(random.randint(100000, 999999))


def _send_email(to_email: str, subject: str, html_body: str):
    if not SMTP_PASSWORD:
        logger.error("SMTP_PASSWORD not set, cannot send email")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = f"Stone AI <{SMTP_EMAIL}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_verification_code(to_email: str, code: str) -> bool:
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
    return _send_email(to_email, f"Код подтверждения: {code}", html)


def send_reset_code(to_email: str, code: str) -> bool:
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
    return _send_email(to_email, f"Сброс пароля: {code}", html)
