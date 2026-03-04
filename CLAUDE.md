# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projects Overview

This home directory contains two separate projects:

### 1. `bots/mybot/` — Simple Claude-powered Telegram Bot
A minimal Telegram bot using `python-telegram-bot` + Anthropic Claude API. Single file (`bot.py`), uses `.env` for `ANTHROPIC_API_KEY` and `TELEGRAM_BOT_TOKEN`.

### 2. `.openclaw/workspace/tgstonebot/` — TG STONE E-Commerce Bot (Main Project)
A full-featured Telegram e-commerce bot for selling digital services (bot promotions, chat/channel accounts, audience growth, Telegram Stars, bot development). This is the primary codebase.

## TG STONE — Architecture

### Tech Stack
- **Language:** Python 3.13
- **Bot Framework:** pyTelegramBotAPI (telebot) — synchronous API
- **Database:** SQLAlchemy ORM, SQLite (dev) / PostgreSQL (prod)
- **Admin Dashboard:** Flask web app on port 8080
- **Payments:** CryptoBot API (USDT) + manual wallet transfers
- **Deployment:** Docker, Railway/Heroku (Procfile), or local polling

### Module Layout (`tgstonebot/`)
| File | Purpose |
|------|---------|
| `bot.py` | Main bot logic (~3500 lines): all message/callback handlers, order flows, admin commands, backup loop |
| `bot_fixed.py` | Alternative/backup version of bot.py |
| `dashboard.py` | Flask admin panel: order management, user balances, promos, partners, broadcasts |
| `models.py` | SQLAlchemy models: User, Order, CartItem, Transaction, PromoCode, ReferralTransaction, Partner |
| `crud.py` | Database CRUD operations + service catalog (ServiceCatalog class with all products/pricing) |
| `keyboards.py` | Telegram InlineKeyboardMarkup builders for all menus |
| `fsm.py` | Finite state machine for multi-step user flows (UserState enum + UserContext dict) |
| `payment.py` | CryptoBot API integration: invoice creation, status checks, refunds |
| `config.py` | All config via env vars. Required: `BOT_TOKEN`, `ADMIN_ID`. Optional: `DATABASE_URL`, `CRYPTO_BOT_TOKEN`, `DASHBOARD_PASSWORD`, etc. |
| `database.py` | `ManagedSession` context manager for safe DB transactions |

### Key Patterns
- **State management:** `fsm.py` uses a thread-safe dict with `threading.Lock`. User states tracked via `UserState` enum, context stored in `UserContext` dataclass.
- **Balance operations:** Atomic updates in `crud.py` using SQLAlchemy's `with_for_update()` to prevent race conditions.
- **Bot deployment modes:** Polling (local dev, default) vs Webhook (production, set `WEBHOOK_URL`). Auto-handles 409 conflicts with exponential backoff.
- **Service catalog:** Hardcoded in `crud.py` `ServiceCatalog` class — categories: top placements, chats, channels, inviting, stars, smm, botdev.
- **All UI text is in Russian.**

## Commands

### Run TG STONE Bot (local dev)
```bash
cd /home/admin/.openclaw/workspace/tgstonebot
pip install -r requirements.txt
# Copy .env.example to .env and fill in BOT_TOKEN + ADMIN_ID
python bot.py          # bot only (polling mode)
bash start.sh          # bot + dashboard together
```

### Run with Docker
```bash
cd /home/admin/.openclaw/workspace/tgstonebot
docker build -t tgstone .
docker run --env-file .env -p 8080:8080 tgstone
```

### Run Simple Claude Bot
```bash
cd /home/admin/bots/mybot
pip install python-telegram-bot anthropic python-dotenv
python bot.py
```

## OpenClaw Agent Framework

The `.openclaw/workspace/` directory follows an AI agent workspace pattern:
- `AGENTS.md` — Agent behavior rules, memory system, safety guidelines
- `SOUL.md` — Agent personality (concise, opinionated, resourceful)
- `IDENTITY.md` — Agent identity: STONE, Russian-speaking, business partner role
- `USER.md` — User profile: Стоун, MSK timezone, "vibe coding" style
- `BOOTSTRAP.md` — First-run initialization flow

**Default language is Russian** — the user (Стоун) communicates in Russian and all bot UI text is in Russian.
