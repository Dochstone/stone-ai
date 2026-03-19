# CLAUDE.md — Stone AI Development Agent

Сверяйся с `STRATEGY.md`, `ROADMAP_NEXT.md` и `MODELS_50.md` перед работой.

## Контекст

Stone AI — платформа доступа к 50+ AI-моделям. Без VPN. Три продукта:
1. **Telegram Mini App** — основной (React + Vite + Zustand, FastAPI backend)
2. **Веб-сайт** — production (Next.js 14 + Tailwind, 35 компонентов, 24 страницы)
3. **Веб-чат** — /webchat (ChatGPT/Claude.ai стиль, sidebar + chat + categories)

## Бизнес-модель

- **Free**: 5 Lite-моделей, 15 запросов/день (10 base + 5 rewarded, показываем как "15 бесплатных")
- **Paid**: 50+ моделей (чат, картинки, видео, 3D, аудио), per-token billing (баланс в USD)
- **Видео/3D**: фиксированная цена за генерацию, списание ДО генерации, рефанд при ошибке
- **Аудио**: TTS per-token (OpenRouter), STT $0.02/мин (Whisper)
- **Наценка**: гибкая x2.5-6, средняя ~350%
- **4 метода оплаты**: Stars, TON Connect, Lava.ru (карты/СБП), Heleket (USDT/BTC/ETH)

## Архитектура

### Frontend — TG Mini App (frontend/)
- React + TypeScript + Vite + Zustand
- Inline CSS (НЕ Tailwind), палитры Matrix/Ocean/Sunset
- i18n: RU/EN/ZH

### Backend (backend/) — 14 роутеров, 9 сервисов
- Python 3.13, FastAPI + SQLAlchemy async + PostgreSQL
- **Биллинг**: `services/token_billing.py` — per-token billing
- **AI Chat**: `services/ai_router.py` — 50 моделей через OpenRouter
- **Видео**: `services/video_router.py` + `routers/video.py` — fal.ai (5 моделей)
- **3D**: `services/threed_router.py` + `routers/threed.py` — fal.ai (Tripo, TripoSR)
- **Аудио**: `services/audio_router.py` + `routers/audio.py` — TTS (OpenRouter) + STT (Whisper)
- **Лимиты**: `services/limiter.py` — FREE_DAILY_LIMIT=10, REWARDED_BONUS=5
- **Оплата**: `routers/payment.py` (Stars+TON), `routers/payment_ext.py` (Lava+Heleket)

### Website (website/) — 35 компонентов, 24 страницы
- Next.js 14 + Tailwind CSS + Dark theme
- Шрифт: Manrope, цвета: CSS variables (light: #FAF9F5/#1A1916, dark: #0C0C10/#E8E4DD)
- Accent: #D97757 (обе темы)
- Страницы: /, /webchat, /profile (6 табов), /models, /pricing, /video, /audio, /3d, /chat, /images, /documents, /search, /code, /translate, /blog, /docs, /referral, /topup
- WebChat: sidebar чатов + category tabs (Текст/Картинки/Видео/3D) + deep link ?model=X
- Deploy: Railway (STONEAICHAT project, services: stone-ai + website)

## Правила кода

- UI на русском, код на английском
- "Reasoning" → "Глубокий анализ" везде на сайте
- "15 бесплатных запросов" (не "10+5", не упоминать rewarded ads)
- Website: Tailwind, responsive, SSR/SSG, dark theme support
- Backend: async, Pydantic, атомарные балансы (with_for_update)

## Прогресс

- [x] Per-token billing, 50 моделей, 4 метода оплаты
- [x] Webchat: ChatGPT-стиль, sidebar, markdown, code highlight, TTS/STT
- [x] Видео-генерация (fal.ai): Kling, Runway, Pika, Stable Video, Luma
- [x] 3D-генерация (fal.ai): Tripo v2.5, TripoSR + model-viewer
- [x] Аудио: TTS (GPT Audio, 9 голосов), STT (Whisper, микрофон)
- [x] Профиль /profile: 6 табов (обзор, баланс, история, настройки, рефералы, API)
- [x] Лендинг: bento grid, product screenshot, trust marquee, demo showcase
- [x] Страницы /video, /audio, /3d + deep links
- [x] 57 описаний моделей + /models с раскрывающимися карточками
- [x] Тёмная тема (CSS variables, toggle в Nav)
- [x] 330 backend тестов

## Команды

```bash
cd frontend && npm run dev
cd backend && uvicorn app.main:app --reload --port 8000
cd website && npm run dev
```

## Deploy

```bash
# Website
cd website && railway link --project STONEAICHAT --service website && railway up --detach

# Backend
cd backend && railway link --project STONEAICHAT --service stone-ai && railway up --detach
```

## Env переменные (22 шт)

BOT_TOKEN, WEBAPP_URL, OPENROUTER_API_KEY, DATABASE_URL, SECRET_KEY,
TON_WALLET_ADDRESS, TONAPI_KEY, LAVA_SECRET_KEY, LAVA_SHOP_ID,
LAVA_WEBHOOK_KEY, HELEKET_API_KEY, HELEKET_MERCHANT, CRYPTOBOT_API_TOKEN,
FAL_API_KEY, OPENAI_API_KEY, ADMIN_TG_IDS, GOOGLE_CLIENT_ID,
GOOGLE_CLIENT_SECRET, YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET, ADSGRAM_BLOCK_ID

## Ключевые файлы

| Файл | Описание |
|------|----------|
| ROADMAP_NEXT.md | Roadmap с задачами и статусами |
| website/lib/models.ts | 57 моделей с описаниями и ценами |
| website/components/WebChat.tsx | Веб-чат (1400+ строк) |
| website/components/ProfilePage.tsx | Личный кабинет (6 табов) |
| backend/app/services/ai_router.py | 50 моделей OpenRouter |
| backend/app/services/video_router.py | Видео через fal.ai |
| backend/app/services/threed_router.py | 3D через fal.ai |
| backend/app/services/audio_router.py | TTS + STT |
| backend/app/services/token_billing.py | Per-token биллинг |
| backend/app/routers/chat.py | Chat + SSE streaming |
