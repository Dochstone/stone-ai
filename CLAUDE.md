# CLAUDE.md — Stone AI Development Agent

Сверяйся с `STRATEGY.md`, `TZ_IMPLEMENTATION.md` и `MODELS_50.md` перед работой.

## Контекст

Stone AI — платформа доступа к 50+ AI-моделям. Без VPN, прямо в Telegram. Два продукта:
1. **Telegram Mini App** — основной (React + Vite + Zustand, FastAPI backend)
2. **Веб-сайт** — [В РАЗРАБОТКЕ] (Next.js + Tailwind, общий backend)

## Бизнес-модель

- **Free**: 5 Lite-моделей, 10 req/день + 5 за rewarded video, баннерная реклама
- **Paid**: 50 моделей, per-token billing (баланс в USD)
- **Наценка**: гибкая x2.5-6, средняя ~350%, max +30-50% vs ishushka
- **Цены**: средневзвешенная за 1М токенов (input×0.4 + output×0.6), детали по клику
- **Списание**: ПОСЛЕ стриминга по реальным токенам
- **DeepSeek R1**: Premium (платный)
- **BYOK**: отложен, НЕ упоминать
- **4 метода оплаты**: Stars, TON Connect, Lava.ru (карты/СБП), Heleket (USDT/BTC/ETH)

## Архитектура

### Frontend — TG Mini App (frontend/)
- React + TypeScript + Vite + Zustand
- Inline CSS (НЕ Tailwind), палитры Matrix/Ocean/Sunset
- Экраны: Home, Chat, Plans, Profile, FAQ, ModelDetail
- i18n: RU/EN/ZH
- Хуки оплаты: `usePayment.ts` (Stars), `useTonPayment.ts` (TON), `useRewardedAd.ts`
- balanceUsd в store (НЕ credits)

### Backend (backend/)
- Python 3.13, FastAPI + SQLAlchemy async + PostgreSQL
- **Биллинг**: `services/token_billing.py` — per-token, TOKEN_PRICES, calculate_cost(), deduct_balance()
- **AI**: `services/ai_router.py` — MODEL_MAP 50 моделей (OpenRouter)
- **Лимиты**: `services/limiter.py` — FREE_DAILY_LIMIT=10, REWARDED_BONUS=5
- **Оплата роутеры**: 
  - `routers/payment.py` — Stars + TON + rewarded ads
  - `routers/payment_ext.py` — Lava (карты/СБП) + Heleket (крипто)
- **Оплата сервисы**:
  - `services/ton.py` — TON Connect API
  - `services/lava.py` — Lava.ru
  - `services/heleket.py` — Heleket (USDT/BTC/ETH)
- **Legacy**: `services/credits.py` — УДАЛИТЬ (заменён на token_billing.py)
- **Модели**: User.balance_usd (Numeric 12,6), Transaction, Usage
- **Бот**: `bot/payments.py` (Stars обработчик), `bot/handlers.py`

### Website (website/) — [СОЗДАЁТСЯ]
- Next.js 14 + Tailwind CSS
- **СВЕТЛЫЙ дизайн** в стиле chatbotai.co (НЕ Matrix-тёмный!)
- Референс: `StoneAI_Landing_v2.jsx`

## Правила кода

- UI на русском, код на английском
- Frontend TG: inline CSS, палитры, maxWidth 480px
- Website: Tailwind, светлый, responsive, SSR/SSG
- Backend: async, Pydantic, атомарные балансы (with_for_update)
- Цены: строго по `MODELS_50.md`
- Оплата: всё в USD, НЕ в кредитах

## Прогресс

- [x] Этап 1: Per-token billing (token_billing.py, balance_usd)
- [x] Этап 2: Модели (25→50 по MODELS_50.md)
- [x] Этап 3: Реклама + rewarded ads
- [x] Тесты: 130 тестов, все зелёные
- [x] Оплата: Stars + TON + Lava + Heleket
- [ ] Очистка: убрать legacy credits из payment_ext.py
- [x] Этап 4: Frontend PlansScreen (баланс $, per-token)
- [x] Этап 5: Frontend HomeScreen (50 моделей, фильтры)
- [x] Этап 6: Frontend ChatScreen (стоимость запроса)
- [x] Этап 7-8: Сайт лендинг + /models + /pricing
- [ ] Этап 9: Сайт — 6 страниц инструментов (/chat, /images, /documents, /search, /code, /translate)

## Команды

```bash
cd frontend && npm run dev
cd backend && uvicorn app.main:app --reload --port 8000
cd website && npm run dev
```

## Ключевые файлы

| Файл | Описание |
|------|----------|
| STRATEGY.md | Стратегия, финмодель, конкуренты |
| TZ_IMPLEMENTATION.md | ТЗ на 9 этапов |
| MODELS_50.md | 50 моделей: slug, цены, множители |
| StoneAI_Landing_v2.jsx | Референс дизайна сайта |
| backend/app/services/token_billing.py | Per-token биллинг |
| backend/app/services/ai_router.py | 50 моделей OpenRouter |
| backend/app/services/heleket.py | Heleket крипто-оплата |
| backend/app/services/lava.py | Lava карты/СБП |
| backend/app/services/ton.py | TON Connect |
| backend/app/routers/payment.py | Stars + TON + rewarded |
| backend/app/routers/payment_ext.py | Lava + Heleket |
| backend/app/routers/chat.py | Chat + billing SSE |
