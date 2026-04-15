"""
One-off broadcast: send LOYAL20 promo (-20% on tariff, 30 days, 2 uses)
to every active paid subscriber with an email address.

Usage on the server:
    cd /var/www/stone-ai/backend
    venv/bin/python scripts/send_loyal20.py            # dry-run (just lists)
    venv/bin/python scripts/send_loyal20.py --send     # actually emails

Idempotency: each user is sent at most once. The script writes a CSV log
to scripts/loyal20_sent.csv and skips emails already present there.
"""

from __future__ import annotations

import asyncio
import csv
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# Make `app.*` imports work when the script is launched from /backend.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select  # noqa: E402

from app.database import async_session  # noqa: E402
from app.models import User  # noqa: E402
from app.services.email_service import _send_email, FOOTER  # noqa: E402

PROMO_CODE = "LOYAL20"
SENT_LOG = Path(__file__).resolve().parent / "loyal20_sent.csv"


def email_html(name: str | None) -> str:
    greeting = f"{name}, спасибо что с нами!" if name else "Спасибо что вы с Stone AI!"
    return f"""
    <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#C4623D;margin-bottom:16px">{greeting}</h2>
        <p style="font-size:15px;color:#333;line-height:1.6">
          С 15 апреля мы немного скорректировали тарифы — это позволяет нам подключать новые
          модели (Claude Opus 4.5, Sora 2, Gemini 3 Pro) без сокращения лимитов.
        </p>
        <p style="font-size:15px;color:#333;line-height:1.6">
          В благодарность за то, что вы остаётесь с нами, забронируйте промокод
          <b>−20%</b> на любой тариф Stone AI:
        </p>
        <div style="background:linear-gradient(135deg,#faf5f0,#f0f7f5);border:1px solid #e8e0d8;border-radius:16px;padding:24px;text-align:center;margin:20px 0">
            <span style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#C4623D">{PROMO_CODE}</span>
            <p style="color:#888;font-size:12px;margin-top:8px">−20% · действует 30 дней · 2 применения (оставьте одно для друга)</p>
        </div>
        <p style="font-size:14px;color:#555;line-height:1.6">
          Применить можно прямо в личном кабинете Stone AI или передать другу — он получит
          такую же скидку при первой подписке.
        </p>
        <div style="text-align:center;margin:24px 0">
            <a href="https://stoneai.ru/pricing"
               style="background:#C4623D;color:white;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:bold">
                Применить промокод
            </a>
        </div>
        {FOOTER}
    </div>
    """


async def collect_subscribers() -> list[tuple[int, str, str | None]]:
    """Returns (user_id, email, first_name) for every paid subscriber with email."""
    async with async_session() as db:
        result = await db.execute(
            select(User.id, User.email, User.first_name)
            .where(User.subscription_tier.in_(["mini", "max", "max-pro"]))
            .where(User.email.is_not(None))
        )
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


async def main(send: bool) -> None:
    if not os.getenv("EMAIL_PROXY_KEY"):
        print("ERROR: EMAIL_PROXY_KEY env var required", file=sys.stderr)
        sys.exit(2)

    subs = await collect_subscribers()
    sent_already = load_sent_log()
    pending = [(uid, email, name) for uid, email, name in subs if email not in sent_already]

    print(f"Active subscribers with email: {len(subs)}")
    print(f"Already sent earlier: {len(subs) - len(pending)}")
    print(f"Will send now: {len(pending)}")

    if not send:
        print("\n--dry-run-- pass --send to actually email")
        for uid, email, name in pending[:10]:
            print(f"  would send → {email} (uid={uid}, name={name})")
        if len(pending) > 10:
            print(f"  ... and {len(pending) - 10} more")
        return

    sent = 0
    failed = 0
    for uid, email, name in pending:
        ok = _send_email(
            email,
            "Промокод −20% — Stone AI",
            email_html(name),
        )
        if ok:
            append_sent_log(uid, email)
            sent += 1
        else:
            failed += 1

    print(f"\nDone. Sent: {sent}, failed: {failed}")


if __name__ == "__main__":
    asyncio.run(main(send="--send" in sys.argv))
