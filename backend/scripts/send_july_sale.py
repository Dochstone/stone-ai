"""
Июльская акция: −25% на первый месяц подписки для всех зарегистрированных пользователей с email.

Промокод JULY25 действует до 7 июля 2026.

Запуск:
    cd /var/www/stone-ai/backend
    venv/bin/python scripts/send_july_sale.py            # dry-run
    venv/bin/python scripts/send_july_sale.py --send     # отправить письма
    venv/bin/python scripts/send_july_sale.py --stats    # показать статистику без отправки

Идемпотентность: каждому пользователю письмо отправляется не более одного раза.
Лог сохраняется в scripts/july_sale_sent.csv.
"""

from __future__ import annotations

import asyncio
import csv
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import func, select

from app.database import async_session
from app.models import User
from app.services.email_service import _send_email

PROMO_CODE = "JULY25"
SENT_LOG = Path(__file__).resolve().parent / "july_sale_sent.csv"

PRICES = {"mini": 990, "max": 1690, "max-pro": 3990}
DISCOUNT_PCT = 25


def _discounted(price: int) -> int:
    return round(price * (1 - DISCOUNT_PCT / 100))


def email_html(name: str | None, tier: str) -> str:
    greeting = f"{name}," if name else "Привет!"

    if tier == "mini":
        intro = f"{greeting} Вы на тарифе Start — самое время апгрейднуться до Pro с&nbsp;−{DISCOUNT_PCT}%."
    elif tier in ("max", "max-pro"):
        intro = f"{greeting} Специальное предложение для пользователей Stone AI."
    else:
        intro = f"{greeting} Вы уже пользуетесь Stone AI — самое время попробовать полную версию."

    start_new = _discounted(PRICES["mini"])
    pro_new   = _discounted(PRICES["max"])
    elite_new = _discounted(PRICES["max-pro"])

    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>-25% на Stone AI — до 7 июля</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ede8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0ede8;">
<tr><td align="center" style="padding:24px 16px;">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">

  <!-- HEADER -->
  <tr><td style="padding-bottom:16px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td><a href="https://stoneai.ru" style="text-decoration:none;"><span style="font-size:20px;font-weight:800;color:#C4623D;letter-spacing:-0.5px;">Stone AI</span></a></td>
      <td align="right"><span style="font-size:11px;color:#999;">AI-студия · 65+ нейросетей</span></td>
    </tr></table>
  </td></tr>

  <!-- HERO -->
  <tr><td style="border-radius:24px;overflow:hidden;background:linear-gradient(135deg,#1a0533 0%,#3b0764 30%,#C4623D 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:40px 32px 28px;text-align:center;">
        <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:100px;padding:6px 18px;margin-bottom:20px;">
          <span style="font-size:12px;font-weight:600;color:rgba(255,255,255,0.9);letter-spacing:1px;text-transform:uppercase;">☀️ Июльская акция</span>
        </div>
        <div style="font-size:96px;font-weight:900;color:#FFE066;line-height:1;margin-bottom:4px;letter-spacing:-4px;">-{DISCOUNT_PCT}%</div>
        <div style="font-size:22px;font-weight:700;color:white;margin-bottom:8px;">на любой тариф Stone AI</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.65);">только с промокодом · до 7 июля 2026</div>
        <div style="background:rgba(0,0,0,0.25);border-radius:100px;height:6px;margin:24px 40px 8px;overflow:hidden;">
          <div style="background:linear-gradient(90deg,#FFE066,#ff9900);height:6px;width:14%;border-radius:100px;"></div>
        </div>
        <div style="font-size:12px;color:rgba(255,255,255,0.5);">осталось 7 дней из 7</div>
      </td></tr>
      <tr><td style="padding:0 32px 0;">
        <img src="https://stoneai.ru/plan-max.jpg" alt="Stone AI Pro" width="496"
             style="width:100%;border-radius:16px 16px 0 0;display:block;object-fit:cover;max-height:200px;" />
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="height:12px;"></td></tr>

  <!-- INTRO -->
  <tr><td style="background:white;border-radius:20px;padding:28px 32px;">
    <h2 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#1a1a1a;line-height:1.3;">
      Доступ к GPT-5, Claude Opus и Sora 2 — за {pro_new:,} ₽/мес
    </h2>
    <p style="margin:0;font-size:15px;line-height:1.7;color:#555;">
      {intro} На этой неделе цена на Pro-тариф снижается на <b>{DISCOUNT_PCT}%</b>.
      65+ топовых нейросетей, 1&nbsp;500 чат-запросов, 140 картинок и 33 видео-поинта в месяц —
      всё в одном окне, без VPN, с оплатой в рублях.
    </p>
  </td></tr>

  <tr><td style="height:12px;"></td></tr>

  <!-- PROMO CODE -->
  <tr><td style="background:white;border-radius:20px;padding:28px 32px;text-align:center;">
    <p style="margin:0 0 16px;font-size:13px;color:#888;font-weight:500;text-transform:uppercase;letter-spacing:1px;">Ваш промокод</p>
    <div style="background:linear-gradient(135deg,#fdf4f0,#f5f0ff);border:2px dashed #C4623D;border-radius:16px;padding:24px 32px;">
      <div style="font-size:42px;font-weight:900;letter-spacing:10px;color:#C4623D;font-family:'Courier New',monospace;">{PROMO_CODE}</div>
      <div style="margin-top:10px;font-size:13px;color:#888;">−{DISCOUNT_PCT}% на любой тариф · действует до <b style="color:#C4623D;">7 июля 2026</b></div>
    </div>
    <p style="margin:16px 0 0;font-size:13px;color:#aaa;">Профиль → Тарифы → поле «Промокод» → Применить</p>
  </td></tr>

  <tr><td style="height:12px;"></td></tr>

  <!-- PRICING -->
  <tr><td style="background:white;border-radius:20px;padding:28px 32px;">
    <h3 style="margin:0 0 20px;font-size:16px;font-weight:700;color:#1a1a1a;">Цены с промокодом {PROMO_CODE}:</h3>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;background:#f9f9f9;border-radius:14px;">
      <tr>
        <td style="padding:16px 20px;">
          <div style="font-size:15px;font-weight:600;color:#333;">⚡ Start</div>
          <div style="font-size:12px;color:#999;margin-top:2px;">20+ моделей · 600 запросов/мес</div>
        </td>
        <td style="padding:16px 20px;text-align:right;white-space:nowrap;">
          <span style="font-size:14px;color:#bbb;text-decoration:line-through;">{PRICES["mini"]:,} ₽</span>
          <span style="font-size:22px;font-weight:800;color:#C4623D;margin-left:8px;">{start_new:,} ₽</span>
          <div style="font-size:11px;color:#999;">/мес</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;background:linear-gradient(135deg,#fff8f3,#fdf4ff);border:2px solid #C4623D;border-radius:14px;">
      <tr>
        <td style="padding:20px 20px 12px;">
          <div>
            <span style="font-size:15px;font-weight:700;color:#1a1a1a;">🔥 Pro</span>
            <span style="font-size:10px;font-weight:700;background:#C4623D;color:white;padding:3px 10px;border-radius:100px;margin-left:8px;vertical-align:middle;">ПОПУЛЯРНЫЙ</span>
          </div>
          <div style="font-size:12px;color:#888;margin-top:4px;">65+ нейросетей · Claude Opus · 1 500 запросов</div>
        </td>
        <td style="padding:20px 20px 12px;text-align:right;white-space:nowrap;">
          <span style="font-size:14px;color:#bbb;text-decoration:line-through;">{PRICES["max"]:,} ₽</span>
          <div style="font-size:28px;font-weight:900;color:#C4623D;line-height:1;">{pro_new:,} ₽</div>
          <div style="font-size:11px;color:#999;">/мес</div>
        </td>
      </tr>
      <tr><td colspan="2" style="padding:0 20px 16px;">
        <div style="background:rgba(196,98,61,0.08);border-radius:8px;padding:8px 12px;font-size:12px;color:#C4623D;font-weight:600;">
          💰 Экономия {PRICES["max"] - pro_new:,} ₽ в первый месяц
        </div>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9f9f9;border-radius:14px;">
      <tr>
        <td style="padding:16px 20px;">
          <div style="font-size:15px;font-weight:600;color:#333;">💎 Elite</div>
          <div style="font-size:12px;color:#999;margin-top:2px;">Всё + API · 4 500 запросов · приоритет</div>
        </td>
        <td style="padding:16px 20px;text-align:right;white-space:nowrap;">
          <span style="font-size:14px;color:#bbb;text-decoration:line-through;">{PRICES["max-pro"]:,} ₽</span>
          <span style="font-size:22px;font-weight:800;color:#C4623D;margin-left:8px;">{elite_new:,} ₽</span>
          <div style="font-size:11px;color:#999;">/мес</div>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="height:12px;"></td></tr>

  <!-- FEATURES -->
  <tr><td style="background:white;border-radius:20px;padding:28px 32px;">
    <h3 style="margin:0 0 20px;font-size:16px;font-weight:700;color:#1a1a1a;">Что входит в Pro-тариф:</h3>
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="50%" style="padding:0 6px 12px 0;vertical-align:top;">
          <div style="background:#f8f7ff;border-radius:14px;padding:16px;">
            <div style="font-size:28px;margin-bottom:8px;">🤖</div>
            <div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">65+ нейросетей</div>
            <div style="font-size:12px;color:#888;line-height:1.5;">GPT-5, Claude Opus, Gemini 2.5 Pro, DeepSeek, xAI Grok</div>
          </div>
        </td>
        <td width="50%" style="padding:0 0 12px 6px;vertical-align:top;">
          <div style="background:#fff8f3;border-radius:14px;padding:16px;">
            <div style="font-size:28px;margin-bottom:8px;">💬</div>
            <div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">1 500 запросов/мес</div>
            <div style="font-size:12px;color:#888;line-height:1.5;">+ 112 премиум + 28 Opus (самая умная модель)</div>
          </div>
        </td>
      </tr>
      <tr>
        <td width="50%" style="padding:0 6px 12px 0;vertical-align:top;">
          <div style="background:#f0fdf4;border-radius:14px;padding:16px;">
            <div style="font-size:28px;margin-bottom:8px;">🎨</div>
            <div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">140 картинок/мес</div>
            <div style="font-size:12px;color:#888;line-height:1.5;">GPT-5 Image, Flux Pro, Nano Banana Pro</div>
          </div>
        </td>
        <td width="50%" style="padding:0 0 12px 6px;vertical-align:top;">
          <div style="background:#fdf4ff;border-radius:14px;padding:16px;">
            <div style="font-size:28px;margin-bottom:8px;">🎬</div>
            <div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">33 видео-поинта/мес</div>
            <div style="font-size:12px;color:#888;line-height:1.5;">Sora 2, Veo 3, Kling — 1080P до 10 сек</div>
          </div>
        </td>
      </tr>
      <tr>
        <td width="50%" style="padding:0 6px 0 0;vertical-align:top;">
          <div style="background:#fff8f0;border-radius:14px;padding:16px;">
            <div style="font-size:28px;margin-bottom:8px;">🎙</div>
            <div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">Голосовой ассистент</div>
            <div style="font-size:12px;color:#888;line-height:1.5;">20 озвучек + voice chat прямо в браузере</div>
          </div>
        </td>
        <td width="50%" style="padding:0 0 0 6px;vertical-align:top;">
          <div style="background:#f0f9ff;border-radius:14px;padding:16px;">
            <div style="font-size:28px;margin-bottom:8px;">📊</div>
            <div style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:4px;">SEO + Фотосессия</div>
            <div style="font-size:12px;color:#888;line-height:1.5;">Статьи, мета-теги, фото товаров для WB/Ozon</div>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  <tr><td style="height:12px;"></td></tr>

  <!-- TESTIMONIALS -->
  <tr><td style="background:white;border-radius:20px;padding:28px 32px;">
    <h3 style="margin:0 0 20px;font-size:16px;font-weight:700;color:#1a1a1a;">Что говорят пользователи:</h3>

    <div style="border-left:3px solid #C4623D;padding:12px 16px;margin-bottom:14px;background:#fffaf8;border-radius:0 12px 12px 0;">
      <div style="font-size:13px;color:#333;line-height:1.6;margin-bottom:8px;">«Пользуюсь Stone AI вместо подписок на ChatGPT и Claude по отдельности. В итоге плачу меньше, а моделей в разы больше — и все в одном окне.»</div>
      <div style="font-size:12px;color:#C4623D;font-weight:600;">⭐⭐⭐⭐⭐ &nbsp;Дмитрий К., маркетолог</div>
    </div>

    <div style="border-left:3px solid #7c3aed;padding:12px 16px;margin-bottom:14px;background:#fdfaff;border-radius:0 12px 12px 0;">
      <div style="font-size:13px;color:#333;line-height:1.6;margin-bottom:8px;">«Наконец-то нормальная генерация видео на русском сервисе. Sora и Kling работают без VPN, качество 1080P — огонь.»</div>
      <div style="font-size:12px;color:#7c3aed;font-weight:600;">⭐⭐⭐⭐⭐ &nbsp;Анна В., контент-мейкер</div>
    </div>

    <div style="border-left:3px solid #0E9A83;padding:12px 16px;background:#f0fdf9;border-radius:0 12px 12px 0;">
      <div style="font-size:13px;color:#333;line-height:1.6;margin-bottom:8px;">«Claude Opus через Stone AI стоит в 5 раз дешевле чем напрямую. Для работы с большими текстами это просто находка.»</div>
      <div style="font-size:12px;color:#0E9A83;font-weight:600;">⭐⭐⭐⭐⭐ &nbsp;Сергей М., разработчик</div>
    </div>
  </td></tr>

  <tr><td style="height:12px;"></td></tr>

  <!-- MAIN CTA -->
  <tr><td style="background:linear-gradient(135deg,#C4623D,#7c3aed);border-radius:20px;padding:36px 32px;text-align:center;">
    <div style="font-size:24px;font-weight:800;color:white;margin-bottom:8px;">Готовы начать?</div>
    <div style="font-size:15px;color:rgba(255,255,255,0.8);margin-bottom:24px;line-height:1.5;">
      Введите <b style="color:#FFE066;">{PROMO_CODE}</b> при оформлении и получите<br>первый месяц Pro за <b style="color:#FFE066;">{pro_new:,} ₽</b>
    </div>
    <a href="https://stoneai.ru/pricing" style="display:inline-block;background:white;color:#C4623D;padding:16px 44px;border-radius:14px;text-decoration:none;font-weight:800;font-size:17px;letter-spacing:-0.3px;">
      Активировать -{DISCOUNT_PCT}% →
    </a>
    <div style="margin-top:16px;font-size:12px;color:rgba(255,255,255,0.55);">
      Нет обязательств · Отмена в любой момент · 7 дней на возврат
    </div>
  </td></tr>

  <tr><td style="height:12px;"></td></tr>

  <!-- GUARANTEE + FAQ -->
  <tr><td style="background:white;border-radius:20px;padding:28px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border-radius:14px;margin-bottom:20px;">
      <tr>
        <td style="padding:16px 20px;width:48px;font-size:32px;vertical-align:top;">🛡</td>
        <td style="padding:16px 20px 16px 0;vertical-align:top;">
          <div style="font-size:14px;font-weight:700;color:#166534;margin-bottom:4px;">Гарантия возврата 7 дней</div>
          <div style="font-size:13px;color:#16a34a;line-height:1.5;">Если Pro не подойдёт в первую неделю — вернём деньги без вопросов. Просто напишите в поддержку.</div>
        </td>
      </tr>
    </table>

    <div style="font-size:14px;font-weight:700;color:#1a1a1a;margin-bottom:14px;">Частые вопросы:</div>

    <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f5f5f5;">
      <div style="font-size:13px;font-weight:600;color:#333;margin-bottom:4px;">Как применить промокод?</div>
      <div style="font-size:13px;color:#777;line-height:1.5;">Войдите в аккаунт → раздел «Тарифы» → нажмите «Есть промокод» → введите {PROMO_CODE} → выберите тариф и оплатите.</div>
    </div>

    <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f5f5f5;">
      <div style="font-size:13px;font-weight:600;color:#333;margin-bottom:4px;">Скидка только на первый месяц?</div>
      <div style="font-size:13px;color:#777;line-height:1.5;">Да, промокод применяется один раз к первому платежу. Следующие месяцы по обычной цене — или отмените в любой момент.</div>
    </div>

    <div>
      <div style="font-size:13px;font-weight:600;color:#333;margin-bottom:4px;">До какого числа действует акция?</div>
      <div style="font-size:13px;color:#777;line-height:1.5;">Строго до <b>7 июля 2026</b> включительно. После этой даты промокод {PROMO_CODE} перестанет работать.</div>
    </div>
  </td></tr>

  <tr><td style="height:12px;"></td></tr>

  <!-- SECONDARY CTA -->
  <tr><td style="text-align:center;padding:8px 0;">
    <a href="https://stoneai.ru/pricing" style="display:inline-block;border:2px solid #C4623D;color:#C4623D;padding:14px 36px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;background:white;">
      Открыть Stone AI
    </a>
  </td></tr>

  <tr><td style="height:20px;"></td></tr>

  <!-- FOOTER -->
  <tr><td style="text-align:center;padding:24px 0 8px;border-top:1px solid #e5e0d8;">
    <a href="https://stoneai.ru" style="text-decoration:none;">
      <span style="font-size:16px;font-weight:800;color:#C4623D;">Stone AI</span>
    </a>
    <p style="font-size:12px;color:#aaa;margin:10px 0;line-height:1.7;">
      AI-студия нового поколения · 65+ нейросетей без VPN · оплата в рублях<br>
      <a href="https://stoneai.ru" style="color:#C4623D;text-decoration:none;">stoneai.ru</a>
      &nbsp;·&nbsp;
      <a href="https://t.me/stonetgbot" style="color:#999;text-decoration:none;">Telegram-бот</a>
      &nbsp;·&nbsp;
      <a href="https://t.me/StoneAIsupport" style="color:#999;text-decoration:none;">Поддержка</a>
    </p>
    <p style="font-size:11px;color:#ccc;margin:0;">
      <a href="https://stoneai.ru/profile" style="color:#ccc;text-decoration:underline;">Отписаться от рассылки</a>
    </p>
  </td></tr>

  <tr><td style="height:24px;"></td></tr>

</table>
</td></tr>
</table>
</body>
</html>"""


async def collect_users() -> list[tuple[int, str, str | None, str]]:
    """Returns (user_id, email, first_name, subscription_tier) for all active users with email."""
    async with async_session() as db:
        result = await db.execute(
            select(User.id, User.email, User.first_name, User.subscription_tier)
            .where(User.email.is_not(None))
            .where(User.is_banned.is_(False))
            .order_by(User.id)
        )
        return [(r.id, r.email, r.first_name, r.subscription_tier or "free") for r in result.all()]


async def collect_stats() -> None:
    """Print breakdown of users with email by subscription tier."""
    async with async_session() as db:
        result = await db.execute(
            select(
                func.coalesce(User.subscription_tier, "free").label("tier"),
                func.count().label("cnt"),
            )
            .where(User.email.is_not(None))
            .where(User.is_banned.is_(False))
            .group_by(User.subscription_tier)
            .order_by(func.count().desc())
        )
        rows = result.all()
    total = sum(r.cnt for r in rows)
    print(f"\nПользователи с email (всего {total}):")
    for r in rows:
        print(f"  {r.tier or 'free':12s} — {r.cnt}")
    print()


def load_sent_log() -> set[str]:
    if not SENT_LOG.exists():
        return set()
    with SENT_LOG.open("r", encoding="utf-8") as f:
        return {row[1] for row in csv.reader(f) if row and len(row) >= 2}


def append_sent_log(user_id: int, email: str) -> None:
    SENT_LOG.parent.mkdir(parents=True, exist_ok=True)
    with SENT_LOG.open("a", encoding="utf-8", newline="") as f:
        csv.writer(f).writerow([datetime.now(timezone.utc).isoformat(), email, user_id])


async def main(send: bool, stats_only: bool) -> None:
    if stats_only:
        await collect_stats()
        return

    if not os.getenv("EMAIL_PROXY_KEY"):
        print("ERROR: EMAIL_PROXY_KEY env var required", file=sys.stderr)
        sys.exit(2)

    users = await collect_users()
    sent_already = load_sent_log()
    pending = [(uid, email, name, tier) for uid, email, name, tier in users if email not in sent_already]

    print(f"Всего пользователей с email:  {len(users)}")
    print(f"Уже отправлено ранее:         {len(users) - len(pending)}")
    print(f"К отправке сейчас:            {len(pending)}")

    if not send:
        print("\n--dry-run-- передайте --send чтобы отправить письма")
        for uid, email, name, tier in pending[:10]:
            print(f"  → {email} (uid={uid}, name={name}, tier={tier})")
        if len(pending) > 10:
            print(f"  ... и ещё {len(pending) - 10}")
        return

    sent = 0
    failed = 0
    for uid, email, name, tier in pending:
        ok = _send_email(
            email,
            f"☀️ -{DISCOUNT_PCT}% на Stone AI — акция до 7 июля. Промокод внутри",
            email_html(name, tier),
        )
        if ok:
            append_sent_log(uid, email)
            sent += 1
        else:
            failed += 1
        if sent % 50 == 0 and sent > 0:
            print(f"  Прогресс: {sent}/{len(pending)} отправлено...")

    print(f"\nГотово. Отправлено: {sent}, ошибок: {failed}")


if __name__ == "__main__":
    asyncio.run(main(
        send="--send" in sys.argv,
        stats_only="--stats" in sys.argv,
    ))
