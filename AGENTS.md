# AGENTS.md — Stone AI Project Context

## Overview

Stone AI — multi-platform AI SaaS platform. Unified interface to 65+ AI models (text, image, video, 3D, audio) with complex monetization and multi-auth.

**Repo:** github.com/Dochstone/stone-ai
**Domain:** stoneai.ru
**Server:** 45.11.93.113 (root SSH)
**Telegram Bot:** @drifttt55bot
**Telegram Channel:** @stoneAIC

## Tech Stack

| Layer | Tech | Path | Deploy |
|-------|------|------|--------|
| Backend | FastAPI 0.115 + SQLAlchemy 2.0 + aiogram 3.15 | `/backend/` | PM2 on VPS (`/var/www/stone-ai/backend/`) |
| Frontend (TG Mini App) | React 18 + Vite 6 + Zustand + TypeScript | `/frontend/` | Vercel |
| Website | Next.js 14 (App Router) + Tailwind 3 | `/website/` | PM2 on VPS (standalone) |
| Mobile | Capacitor 8 (Android) | `/mobile/` | GitHub Actions → APK |
| Database | PostgreSQL (asyncpg) | — | Railway |
| Email | Flask email-proxy (port 5050) | `/email-proxy.py` | PM2 on VPS |

## Architecture

```
Telegram Mini App (React/Vite)  ←→  FastAPI Backend  ←→  PostgreSQL
Website (Next.js)               ←→  FastAPI Backend  ←→  OpenRouter (50+ LLMs)
Mobile (Capacitor/Android)      ←→  (wraps web app)      FAL.ai (video/3D)
Telegram Bot (aiogram)          ←→  (part of backend)    Kling AI (video)
                                                          OpenAI Whisper (STT)
```

## Backend (`/backend/`)

### Structure
```
backend/app/
├── main.py              # FastAPI entry, lifespan, webhook, 30 routers
├── config.py            # Settings from env, pricing constants
├── database.py          # SQLAlchemy AsyncSession
├── models/              # 23 ORM models (user, chat, transaction, etc.)
├── routers/             # 30 API routers
│   ├── auth.py          # Email/OAuth/Telegram auth
│   ├── chat.py          # Streaming SSE chat
│   ├── image.py         # Image generation
│   ├── video.py         # Video generation
│   ├── audio.py         # Whisper STT
│   ├── threed.py        # 3D generation
│   ├── payment.py       # Stars/TON payments
│   ├── payment_ext.py   # Lava/Heleket/Platega
│   ├── agent.py         # AI agent (multi-step)
│   ├── knowledge.py     # RAG/Knowledge base
│   ├── bots.py          # Custom bot builder
│   ├── admin.py         # Admin panel
│   └── ...              # 18 more routers
├── services/            # 19 business logic modules
│   ├── ai_router.py     # OpenRouter integration
│   ├── token_billing.py # Per-token cost in USD
│   ├── daily_limits.py  # Tier-based usage limits
│   ├── video_router.py  # FAL.ai + Kling
│   ├── rag.py           # Embeddings + search
│   ├── lava.py          # Russian card payments
│   ├── heleket.py       # Crypto payments
│   └── ...
├── middleware/           # Auth (TG + JWT) + rate limit
└── bot/                 # Telegram bot handlers + payments
```

### Key Features
- **50+ LLMs** via OpenRouter (streaming SSE)
- **Image/Video/3D/Audio generation** (async submit/poll/download)
- **AI Agent** (multi-step autonomous tasks, max 10 steps)
- **RAG** (PDF/PPTX/Excel upload, chunking, embeddings, search)
- **Custom Bots** (system prompt + knowledge base)
- **5 Payment methods:** Telegram Stars, Lava.ru (cards/SBP), Heleket (crypto), Platega, TON Connect
- **Auth:** Telegram initData (HMAC-SHA256), email+bcrypt+JWT, Google/Yandex OAuth
- **Background tasks:** daily rollover (midnight MSK), video worker (10s poll), agent cleanup (5min)

### Subscription Tiers
| Tier | Price | Daily Fast | Daily Premium | Daily Opus |
|------|-------|-----------|--------------|------------|
| Free | 0 | 10 | 2 | 0 |
| Mini (Start) | 590₽ | 20 | 3 | 0 |
| Max (Pro) | 1290₽ | 50 | 4 weekly | 1 weekly |
| Max-Pro (Elite) | 2990₽ | 150 | 12 weekly | 2 weekly |

### Database (PostgreSQL)
23 tables: users, chat_sessions, chat_messages, transactions, subscriptions, daily_usage, image_tasks, video_tasks, threed_tasks, agent_tasks, generations, custom_bots, knowledge_docs, knowledge_chunks, campaigns, achievements, violations, tg_web_sessions, prompt_templates, etc.

## Frontend — Telegram Mini App (`/frontend/`)

### Structure
```
frontend/src/
├── App.tsx                    # Screen routing, palette backgrounds
├── components/
│   ├── HomeScreen/            # Model grid, 13 filter tabs, usage stats
│   ├── ChatScreen/            # Chat with SSE streaming, model selector
│   ├── PlansScreen/           # 4 tiers, 4 payment methods, animations
│   ├── ProfileScreen/         # Stats, palette/language selector
│   ├── FaqScreen/             # Expandable Q&A
│   ├── ModelDetailScreen/     # Full-screen model info
│   ├── AdBanner/              # Adsgram ads
│   └── ui/                    # Card, Tag, GlowBtn, MatrixRain, OceanBg, SunsetBg, Nav
├── hooks/
│   ├── useChat.ts             # SSE streaming, billing updates
│   ├── useUser.ts             # Profile, models, balance
│   ├── useTonPayment.ts       # TON wallet flow
│   ├── usePayment.ts          # Telegram Stars
│   └── useRewardedAd.ts       # Adsgram rewarded video
├── store/useStore.ts          # Zustand (screen, palette, user, chat, models)
├── api/client.ts              # HTTP client, auth: tma {initData}
├── i18n/                      # RU/EN/ZH translations (300+ keys)
└── utils/                     # telegram.ts, markdown.ts
```

- 3 animated palettes: Matrix (green), Ocean (blue), Sunset (orange)
- localStorage persistence (chats per model, palette, language)
- Accent color: #D97757

## Website (`/website/`)

### Structure
- **70+ pages** (App Router), **77 components**, **14 lib files**
- Key pages: /, /models, /pricing, /chat, /dashboard/*, /video, /audio, /3d, /images, /blog, /docs, /admin
- Dashboard: chat, templates, marketplace, bots, projects, gallery, SEO tools, agent, games, achievements
- WebChat.tsx (137KB) — main chat component with full generation support
- AuthForm.tsx — email/password, Google, Yandex, Telegram polling
- ProfilePage.tsx (60KB) — user profile management
- Pricing.tsx (43KB) — complex plan comparison

### Tech
- Next.js 14 (App Router), React 18, TypeScript 5.4, Tailwind 3
- Font: Manrope (400-800), dark/light mode via CSS variables
- PWA: service worker, offline fallback, install prompts
- Analytics: Google Analytics + Yandex.Metrika
- TON wallet: @tonconnect/ui-react 2.4.4
- Presentations: pptxgenjs

## Mobile (`/mobile/`)
- Capacitor 8.3.0 wrapper around web app
- App ID: ru.stoneai.app
- Plugins: SplashScreen, StatusBar, Keyboard
- CI/CD: GitHub Actions (android-build.yml, android-release.yml)

## Server (45.11.93.113)

### PM2 Services
| ID | Name | Type | Path |
|----|------|------|------|
| 4 | stone-ai-backend | Python (FastAPI) | /var/www/stone-ai/backend/ |
| 0 | stone-ai-website | Node (Next.js standalone) | /var/www/stone-ai/website/ |
| 1 | email-proxy | Python (Flask :5050) | /var/www/stone-ai/ |

### SSH Access
- Server SSH key → GitHub (git@github.com:dochstone/stone-ai.git)
- Deploy: `ssh root@45.11.93.113` → `cd /var/www/stone-ai && git pull && pm2 restart all`

## Code Standards

- Language: Russian communication, English code/commits
- Commits: `<type>(<area>): <description>` (feat, fix, refactor, perf, etc.)
- TypeScript: strict typing, no `any`, named exports, async/await
- React: functional components + hooks, no index keys
- CSS: use design tokens, mobile-first
- Backend: validate at boundaries (zod/pydantic), proper HTTP status codes
- No TODO/FIXME without explanation

## Roadmap (as of April 2026)

### Done
- Per-token billing (USD), 50+ models, rewarded ads, PlansScreen, HomeScreen, ChatScreen
- Video/3D/Audio generation, model pages, deep links, model descriptions
- Pricing page, dark theme toggle, demo content, SEO optimization

### TODO
| # | Task | Priority |
|---|------|----------|
| 12 | Dark theme for website | Next |
| 13 | Rebrand (new name) | Next |
| 14 | WhatsApp integration | Later |
| 15 | WeChat integration | Future |

See `ROADMAP_NEXT.md` and `TZ_IMPLEMENTATION.md` for full details.

## API Endpoints Reference

### Auth
- `POST /api/auth/register` — email registration (sends 6-digit code)
- `POST /api/auth/verify-email` — verify code & create account
- `POST /api/auth/login` — email + password → JWT
- `POST /api/auth/forgot-password` — send reset code
- `POST /api/auth/reset-password` — verify code & set new password
- `POST /api/auth/logout` — clear cookie
- `POST /api/auth/google` — Google OAuth exchange
- `POST /api/auth/yandex` — Yandex OAuth exchange
- `POST /api/auth/telegram-webapp` — auto-login via TG initData
- `POST /api/auth/telegram-link` — link TG to email account
- `POST /api/auth/telegram-web-start` — generate web login session
- `GET /api/auth/telegram-web-check?session={id}` — poll login status

### Chat
- `POST /api/chat` — authenticated streaming SSE chat
- `POST /api/chat/guest` — guest chat (2 req/IP, fast models only)
- `GET /api/chats` — list user's sessions
- `GET /api/chat/{session_id}` — get history
- `POST /api/chat/{session_id}/rename` — rename session
- `DELETE /api/chat/{session_id}` — delete session

### Generation (async submit → poll → download)
- `POST /api/image/generate` → `GET /api/image/status/{task_id}` → `GET /api/image/result/{task_id}`
- `POST /api/video/generate` → `GET /api/video/status/{task_id}` → `GET /api/video/result/{task_id}`
- `POST /api/threed/generate` → `GET /api/threed/status/{task_id}`
- `POST /api/audio/transcribe` — Whisper STT
- `GET /api/video/models` — list video models

### Payments
- `POST /api/payment/stars/create-invoice` — Telegram Stars top-up
- `POST /api/payment/stars/confirm` — confirm Stars payment
- `POST /api/payment/lava/create-order` — Russian cards (Visa/MC/MIR/SBP)
- `POST /api/payment/lava/webhook` — Lava callback
- `POST /api/payment/crypto/create-order` — crypto (USDT, BTC, ETH, TON, SOL)
- `POST /api/payment/crypto/webhook` — Heleket callback
- `POST /api/payment/ton/create-order` — TON payment
- `POST /api/payment/ton/verify` — poll TON confirmation
- `GET /api/payment/ton/price` — TON/USD rate

### Subscriptions
- `POST /api/subscription/buy` — purchase (mini/max/max-pro)
- `GET /api/subscription/status` — current subscription
- `POST /api/pass/daily` — 1-day fast model pass
- `POST /api/pass/weekly` — 1-week premium pass

### User
- `GET /api/user/me` — profile, plan, balance, limits, stats
- `GET /api/user/usage-history?limit=20` — usage records
- `GET /api/models` — list all 50+ models

### AI Agent
- `POST /api/agent/run` — execute multi-step task
- `GET /api/agent/history` — task history
- `GET /api/agent/task/{task_id}` — task details & steps

### Knowledge Base (RAG)
- `POST /api/knowledge/upload` — upload doc (PDF/TXT/PPTX/Excel)
- `GET /api/knowledge/list/{bot_id}` — list bot's docs
- `DELETE /api/knowledge/doc/{doc_id}` — delete doc
- `POST /api/knowledge/search` — semantic search

### Custom Bots
- `POST /api/bots/create` — create bot with system prompt
- `POST /api/bots/{bot_id}/chat` — chat with bot
- `GET /api/bots/{bot_id}/settings` — get settings
- `PUT /api/bots/{bot_id}/settings` — update settings

### Ads
- `GET /api/ads?placement=X` — fetch ad for placement
- `POST /api/ads/{id}/view` — track view
- `POST /api/ads/{id}/click` — track click
- `POST /api/payment/rewarded-ad-complete` — claim ad bonus

### Admin
- `GET /api/admin/users?search=...` — search users
- `POST /api/admin/ban` — ban user
- `GET /api/admin/violations` — flagged content

### Misc
- `GET /` — API info
- `GET /health` — health check
- `POST /webhook/{token}` — Telegram bot webhook

## Code Patterns

### Streaming Chat (SSE)
Backend sends Server-Sent Events with chunks:
```
data: {"content": "token"}           # text token
data: {"usage": {"tokens_in": 100, "tokens_out": 50}}  # usage stats
data: {"billing": {"balance_usd": 9.50, "cost_usd": 0.12}}  # billing update
data: [DONE]                         # stream end
```
Frontend reads via `EventSource` pattern in `useChat.ts` / `api/client.ts`.

### Async Generation (submit/poll/download)
```
1. POST /api/{type}/generate → returns {task_id}
2. GET /api/{type}/status/{task_id} → returns {status: "pending"|"processing"|"done"|"failed"}
3. GET /api/{type}/result/{task_id} → returns URL/data
```
Backend video worker polls FAL.ai/Kling every 10s in background loop.

### Auth Middleware
- TG Mini App: `X-TG-Init-Data` header → HMAC-SHA256 validation → user lookup by telegram_id
- Web: `Authorization: Bearer {jwt}` or `access_token` cookie → JWT decode → user lookup by id
- Guest: no auth, IP-based rate limit (2 req/IP)

### Daily Limits & Billing
```python
# Check flow:
1. check_daily_limit(user, model) → allowed/denied
2. If allowed: stream response, count tokens
3. deduct_balance(user, tokens_in, tokens_out, model) → cost_usd
4. Record usage in daily_usage table
5. Send billing chunk in SSE stream
```
Rollover: unused requests carry over at 30-50% rate, capped per tier. Reset at midnight MSK.

### State Management (Frontend TG App)
Zustand store with sections: screen, palette, user, chat, models.
Persistence: localStorage for chats (per model, max 100 msgs), palette, language.

### Payment Flow (all providers)
```
1. Frontend: POST /api/payment/{provider}/create-order → {payment_url, order_id}
2. User pays on external page / in-app
3. Provider sends webhook → backend verifies signature → credits balance
4. Frontend polls or receives confirmation
```

## Environment Variables

```env
# Required
OPENROUTER_API_KEY=sk-or-v1-...
BOT_TOKEN=123456:ABC...
DATABASE_URL=postgresql+asyncpg://...
SECRET_KEY=...

# AI Providers
FAL_API_KEY=...
OPENAI_API_KEY=...
KLING_ACCESS_KEY=...
KLING_SECRET_KEY=...

# Payments
LAVA_SECRET_KEY=...
LAVA_SHOP_ID=...
HELEKET_API_KEY=...
HELEKET_MERCHANT=...
PLATEGA_MERCHANT_ID=...
PLATEGA_SECRET=...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
YANDEX_CLIENT_ID=...
YANDEX_CLIENT_SECRET=...

# Config
WEBAPP_URL=https://stone-ai-1.vercel.app
ADMIN_TG_IDS=...
```
