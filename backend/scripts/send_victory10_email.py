"""
Broadcast: send VICTORY10 promo email (-10% on tariff, valid until 2026-05-11)
to every user with an email address.

Usage on the server:
    cd /var/www/stone-ai/backend
    venv/bin/python scripts/send_victory10_email.py             # dry-run
    venv/bin/python scripts/send_victory10_email.py --send      # actually emails
    venv/bin/python scripts/send_victory10_email.py --send --paid-only

Idempotency: each email is sent at most once. The script writes a CSV log
to scripts/send_victory10_email_sent.csv and skips emails already present there.
"""

from __future__ import annotations

import asyncio
import csv
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

try:
    from dotenv import load_dotenv  # type: ignore
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

from sqlalchemy import select  # noqa: E402

from app.database import async_session  # noqa: E402
from app.models import User  # noqa: E402
from app.services.email_service import _send_email, FOOTER  # noqa: E402

PROMO_CODE = "VICTORY10"
DEADLINE_TEXT = "до 11 мая 23:59 МСК"
SUBJECT = "−10% к 9 Мая · промокод VICTORY10 — Stone AI"
SENT_LOG = Path(__file__).resolve().parent / "send_victory10_email_sent.csv"


def email_html(name: str | None) -> str:
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

        {FOOTER}
    </div>
    """


async def collect_recipients(paid_only: bool) -> list[tuple[int, str, str | None]]:
    async with async_session() as db:
        q = select(User.id, User.email, User.first_name).where(
            User.email.is_not(None), User.email != ""
        )
        if paid_only:
            q = q.where(User.subscription_tier.in_(["mini", "max", "max-pro"]))
        result = await db.execute(q)
        return [(r.id, r.email, r.first_name) for r in result.all()]


def load_sent_log() -> set[str]:
    if not SENT_LOG.exists():
        return set()
    with SENT_LOG.open("r", encoding="utf-8") as f:
        return {row[1] for row in csv.reader(f) if row and len(row) >= 2}


def append_sent_log(user_id: int, email: str) -> None:
    SENT_LOG.parent.mkdir(parents=True, exist_ok=True)
    with SENT_LOG.open("a", encoding="utf-8", newline="") as f:
        csv.writer(f).writerow([datetime.now(timezone.utc).isoformat(), email, user_id])


async def main(send: bool, paid_only: bool) -> None:
    if not os.getenv("EMAIL_PROXY_KEY"):
        print("ERROR: EMAIL_PROXY_KEY not in env", file=sys.stderr)
        sys.exit(2)

    subs = await collect_recipients(paid_only)
    sent_already = load_sent_log()
    pending = [(uid, e, n) for uid, e, n in subs if e not in sent_already]

    scope = "PAID-ONLY" if paid_only else "ALL"
    print(f"Audience [{scope}]: {len(subs)} with email")
    print(f"Already sent earlier: {len(subs) - len(pending)}")
    print(f"Will send now: {len(pending)}")

    if not send:
        print("\n--dry-run-- pass --send to actually email")
        for uid, email, name in pending[:15]:
            print(f"  would send → {email} (uid={uid}, name={name})")
        if len(pending) > 15:
            print(f"  ... and {len(pending) - 15} more")
        return

    sent = 0
    failed = 0
    for uid, email, name in pending:
        ok = _send_email(email, SUBJECT, email_html(name))
        if ok:
            append_sent_log(uid, email)
            sent += 1
        else:
            failed += 1
        time.sleep(0.1)

    print(f"\nDone. Sent: {sent}, failed: {failed}")


if __name__ == "__main__":
    asyncio.run(main(send="--send" in sys.argv, paid_only="--paid-only" in sys.argv))
