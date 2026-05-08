"""
Broadcast: send VICTORY10 promo Telegram message to every user with a real
telegram_id (synthetic web ids — abs >= 1e12 — are skipped).

Usage on the server:
    cd /var/www/stone-ai/backend
    venv/bin/python scripts/send_victory10_tg.py            # dry-run
    venv/bin/python scripts/send_victory10_tg.py --send     # actually broadcast
    venv/bin/python scripts/send_victory10_tg.py --send --paid-only

Idempotency: each telegram_id is sent at most once. The script writes a CSV
log to scripts/send_victory10_tg_sent.csv and skips ids already present.

Telegram fails with "chat not found" for users who never wrote /start to
@stonetgbot — those are recorded as failed and won't be retried automatically.
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

import httpx  # noqa: E402
from sqlalchemy import select  # noqa: E402

from app.database import async_session  # noqa: E402
from app.models import User  # noqa: E402

PROMO_CODE = "VICTORY10"
SENT_LOG = Path(__file__).resolve().parent / "send_victory10_tg_sent.csv"

MESSAGE = """🎖️ <b>9 Мая. День Победы</b>

В честь праздника даём <b>−10% на любой тариф</b> Stone AI — от Start до Elite.

🎁 Промокод: <code>VICTORY10</code>

⏳ Действует до <b>11 мая 23:59 МСК</b> (2 дня)
🔁 Одно применение на аккаунт

👉 <a href="https://stoneai.ru/pricing">Применить промокод</a>"""


async def collect_recipients(paid_only: bool) -> list[int]:
    async with async_session() as db:
        q = select(User.telegram_id).where(User.telegram_id.is_not(None))
        if paid_only:
            q = q.where(User.subscription_tier.in_(["mini", "max", "max-pro"]))
        result = await db.execute(q)
        return [
            int(t) for t in result.scalars().all()
            if t and abs(int(t)) < 1_000_000_000_000
        ]


def load_sent_log() -> set[int]:
    if not SENT_LOG.exists():
        return set()
    with SENT_LOG.open("r", encoding="utf-8") as f:
        return {
            int(row[1]) for row in csv.reader(f)
            if row and len(row) >= 2 and row[1].lstrip("-").isdigit()
        }


def append_sent_log(tg_id: int, status: str) -> None:
    SENT_LOG.parent.mkdir(parents=True, exist_ok=True)
    with SENT_LOG.open("a", encoding="utf-8", newline="") as f:
        csv.writer(f).writerow([datetime.now(timezone.utc).isoformat(), tg_id, status])


async def main(send: bool, paid_only: bool) -> None:
    bot_token = os.getenv("BOT_TOKEN", "")
    if not bot_token:
        print("ERROR: BOT_TOKEN not in env", file=sys.stderr)
        sys.exit(2)

    recipients = await collect_recipients(paid_only)
    sent_already = load_sent_log()
    pending = [tg for tg in recipients if tg not in sent_already]

    scope = "PAID-ONLY" if paid_only else "ALL"
    print(f"Audience [{scope}]: {len(recipients)} with real telegram_id")
    print(f"Already sent earlier: {len(recipients) - len(pending)}")
    print(f"Will send now: {len(pending)}")

    if not send:
        print("\n--dry-run-- pass --send to actually broadcast")
        for tg_id in pending[:15]:
            print(f"  would send → {tg_id}")
        if len(pending) > 15:
            print(f"  ... and {len(pending) - 15} more")
        return

    ok_count = 0
    failed = 0
    chat_not_found = 0
    blocked = 0

    async with httpx.AsyncClient(timeout=10) as client:
        for tg_id in pending:
            try:
                r = await client.post(
                    f"https://api.telegram.org/bot{bot_token}/sendMessage",
                    json={
                        "chat_id": tg_id,
                        "text": MESSAGE,
                        "parse_mode": "HTML",
                        "disable_web_page_preview": False,
                    },
                )
                if r.status_code == 200:
                    append_sent_log(tg_id, "ok")
                    ok_count += 1
                else:
                    body = r.text.lower()
                    if "chat not found" in body:
                        chat_not_found += 1
                        append_sent_log(tg_id, "chat_not_found")
                    elif "blocked" in body or "deactivated" in body:
                        blocked += 1
                        append_sent_log(tg_id, "blocked")
                    else:
                        failed += 1
                        append_sent_log(tg_id, f"err_{r.status_code}")
            except Exception:
                failed += 1
                append_sent_log(tg_id, "exception")
            time.sleep(0.05)

    print(f"\nDone. Sent ok: {ok_count}, chat_not_found: {chat_not_found}, blocked: {blocked}, other failures: {failed}")


if __name__ == "__main__":
    asyncio.run(main(send="--send" in sys.argv, paid_only="--paid-only" in sys.argv))
