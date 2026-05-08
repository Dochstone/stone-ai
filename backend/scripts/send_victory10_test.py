"""
One-off TEST email for VICTORY10 promo (9 May, -10%, 2 days).
Sends to a single address — for previewing the campaign before broadcast.

Usage on the server:
    cd /var/www/stone-ai/backend
    venv/bin/python scripts/send_victory10_test.py dochstone@gmail.com
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Load .env so EMAIL_PROXY_KEY etc. are available when run standalone.
try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

from app.services.email_service import _send_email, FOOTER  # noqa: E402

PROMO_CODE = "VICTORY10"
DEADLINE_TEXT = "до 11 мая 23:59 МСК"


def email_html(name: str | None = None) -> str:
    greeting = f"{name}, с праздником Победы!" if name else "С праздником Победы!"
    return f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff">
        <div style="background:linear-gradient(135deg,#c8102e,#7a0a1c);border-radius:20px;padding:28px 24px;text-align:center;color:white;margin-bottom:24px">
            <div style="font-size:36px;line-height:1">🎖️</div>
            <h1 style="margin:12px 0 6px;font-size:24px;font-weight:800;letter-spacing:-0.3px">9 Мая. День Победы</h1>
            <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.85)">−10% на любой тариф Stone AI</p>
        </div>

        <h2 style="color:#1f1f1f;margin:0 0 12px;font-size:18px">{greeting}</h2>
        <p style="font-size:15px;color:#444;line-height:1.65;margin:0 0 16px">
          В честь праздника даём <b>−10%</b> на любой тариф Stone AI — от Start до Elite.
          Промокод действует <b>{DEADLINE_TEXT}</b> и применяется один раз на аккаунт.
        </p>

        <div style="background:#fafafa;border:1px dashed #d8d4cf;border-radius:16px;padding:24px;text-align:center;margin:20px 0">
            <p style="color:#888;font-size:11px;margin:0 0 10px;letter-spacing:1px;text-transform:uppercase;font-weight:700">Промокод</p>
            <span style="font-size:30px;font-weight:800;letter-spacing:5px;color:#7a0a1c;font-family:'SF Mono',Menlo,monospace">{PROMO_CODE}</span>
            <p style="color:#999;font-size:12px;margin:10px 0 0">−10% · {DEADLINE_TEXT} · 1 применение</p>
        </div>

        <div style="text-align:center;margin:24px 0 8px">
            <a href="https://stoneai.ru/pricing"
               style="display:inline-block;background:#c8102e;color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">
                Применить промокод →
            </a>
        </div>
        <p style="font-size:13px;color:#888;line-height:1.5;text-align:center;margin:0">
            Введите код на странице тарифов после авторизации.
        </p>

        <p style="font-size:13px;color:#aaa;line-height:1.6;margin:24px 0 0;padding:12px;background:#fff8e6;border-radius:8px;border:1px solid #f3e2a8">
            <b>📧 Это тестовое письмо.</b> Проверка вёрстки и работы промокода перед массовой рассылкой.
        </p>

        {FOOTER}
    </div>
    """


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: send_victory10_test.py <email>", file=sys.stderr)
        return 2
    email = sys.argv[1].strip()
    print(f"Sending VICTORY10 test email to {email}...")
    ok = _send_email(email, "[ТЕСТ] −10% к 9 Мая · промокод VICTORY10 — Stone AI", email_html("Stone"))
    if ok:
        print("OK")
        return 0
    print("FAILED — check EMAIL_PROXY_KEY and email-proxy logs")
    return 1


if __name__ == "__main__":
    sys.exit(main())
