# Задача: Реализовать систему дневных лимитов для Stone AI

## Контекст проекта

Stone AI — агрегатор 65+ нейросетей (GPT-5, Claude, Gemini, DeepSeek и др.) с единым API для Telegram-бота и веб-чата. Бэкенд: Node.js / TypeScript, база данных: PostgreSQL.

## Что нужно сделать

Заменить текущую систему месячных лимитов на **дневные лимиты с переносом остатка**. Цель — контролировать расход токенов и защитить маржу, не ухудшая UX.

## Бизнес-логика

### Тарифная сетка дневных лимитов

| Тариф | Цена | Быстрые/день | Премиум/день | Opus/день | Перенос | Макс. накопление |
|-------|------|-------------|-------------|----------|---------|-----------------|
| Free | 0₽ | 15 | 0 | 0 | нет | — |
| Mini | 390₽/мес | 20 | 1 | 0 | 30% | +5 |
| Max | 890₽/мес | 70 | 4 | 1 | 50% | +15 |
| Max Pro | 1990₽/мес | 350 | 18 | 3 | 50% | +50 |

### Категории моделей

Каждая AI-модель относится к одной из трёх категорий. Создай конфиг-файл `src/config/model-tiers.ts`:

```
FAST (быстрые, дешёвые):
- gpt-4o-mini, gpt-4.1-nano
- claude-haiku-4.5
- gemini-2.0-flash, gemini-2.5-flash
- deepseek-v3, deepseek-v3.2
- llama-4-maverick
- mistral-large
- qwen-3-235b, qwen-qwq-32b

PREMIUM (средние по цене):
- gpt-5.1, gpt-4.1-mini
- claude-sonnet-4, claude-sonnet-4.5
- gemini-2.5-pro
- deepseek-r1
- grok-3-mini

OPUS (самые дорогие):
- claude-opus-4
- gpt-5-pro (если появится)
- o3
```

### Алгоритм проверки лимита

При каждом запросе пользователя:

1. Определить тариф пользователя
2. Определить категорию запрашиваемой модели (FAST / PREMIUM / OPUS)
3. Проверить дневной лимит для этой категории:
   - Если `daily_remaining > 0` → выполнить запрос, декрементировать счётчик
   - Если `daily_remaining == 0` → проверить `rollover_balance`
     - Если `rollover > 0` → использовать из переноса, декрементировать
     - Если `rollover == 0` → отклонить запрос
4. OPUS проверяется как подлимит PREMIUM (Opus-запрос уменьшает и premium_remaining, и opus_remaining)
5. При отклонении — вернуть информативный ответ (см. ниже)

### Система переноса (rollover)

Ежедневно в 00:00 MSK запускается крон-задача:

```
Для каждого платного пользователя:
  unused_fast = daily_limit_fast - used_today_fast
  unused_premium = daily_limit_premium - used_today_premium

  rollover_fast = min(floor(unused_fast * rollover_rate), max_accumulation)
  rollover_premium = min(floor(unused_premium * rollover_rate), max_accumulation)

  Сбросить daily counters на 0
  Установить rollover_fast и rollover_premium
```

Перенос не накапливается бесконечно — потолок задан в `max_accumulation`. Перенос НЕ применяется к Opus (лимит Opus строго дневной, без rollover).

### Ответ при исчерпании лимита

Вернуть JSON:

```json
{
  "error": "daily_limit_exceeded",
  "category": "premium",
  "message": "Дневной лимит премиум-моделей исчерпан. Обновится через 6ч 23мин.",
  "reset_at": "2026-03-29T00:00:00+03:00",
  "suggestions": [
    {
      "type": "downgrade_model",
      "message": "Попробуйте GPT-4o mini — у вас осталось 45 быстрых запросов",
      "remaining": 45
    },
    {
      "type": "upgrade_plan",
      "message": "На тарифе Max Pro — 18 премиум-запросов в день",
      "plan": "max_pro",
      "url": "/pricing"
    }
  ]
}
```

## Техническая реализация

### 1. Миграция БД (PostgreSQL)

Создай миграцию, которая добавляет таблицу `daily_usage`:

```sql
CREATE TABLE daily_usage (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Использовано сегодня
  fast_used INT NOT NULL DEFAULT 0,
  premium_used INT NOT NULL DEFAULT 0,
  opus_used INT NOT NULL DEFAULT 0,
  
  -- Перенос с предыдущего дня
  fast_rollover INT NOT NULL DEFAULT 0,
  premium_rollover INT NOT NULL DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_usage_user_date ON daily_usage(user_id, date DESC);
```

### 2. Структура файлов

Создай следующие файлы:

```
src/
├── config/
│   ├── model-tiers.ts      # Маппинг модель → категория
│   └── plan-limits.ts      # Лимиты по тарифам (таблица выше)
├── services/
│   └── daily-limits/
│       ├── index.ts         # Экспорт
│       ├── checker.ts       # Проверка лимита перед запросом
│       ├── counter.ts       # Инкремент/декремент счётчиков
│       ├── rollover.ts      # Логика переноса остатка
│       └── reset.ts         # Крон-задача сброса
├── middleware/
│   └── rate-limit.ts        # Express middleware для проверки лимита
└── types/
    └── daily-limits.ts      # TypeScript типы
```

### 3. Middleware

Создай Express middleware `rateLimitMiddleware`, который:
- Вызывается ПЕРЕД отправкой запроса к AI-провайдеру
- Извлекает `user_id` из JWT-токена
- Определяет категорию модели из `req.body.model_id`
- Вызывает `DailyLimitChecker.check(userId, modelCategory)`
- При успехе — `next()`, при отказе — возвращает 429 с JSON (см. выше)
- После успешного ответа от AI — вызывает `DailyLimitCounter.increment(userId, modelCategory)`

### 4. Крон-задача

Используй `node-cron` или аналог. Расписание: `0 0 * * *` по MSK (21:00 UTC).

Задача:
1. Для каждого платного пользователя с записью `daily_usage` за сегодня
2. Рассчитать rollover по формуле из раздела "Система переноса"
3. Создать запись `daily_usage` на следующий день с `fast_rollover` и `premium_rollover`
4. Логировать: сколько пользователей обработано, сколько rollover выдано

### 5. API-эндпоинт для фронтенда

Добавь эндпоинт `GET /api/user/limits`, который возвращает:

```json
{
  "plan": "max",
  "date": "2026-03-28",
  "reset_at": "2026-03-29T00:00:00+03:00",
  "fast": {
    "limit": 70,
    "used": 23,
    "rollover": 5,
    "available": 52
  },
  "premium": {
    "limit": 4,
    "used": 2,
    "rollover": 1,
    "available": 3
  },
  "opus": {
    "limit": 1,
    "used": 0,
    "available": 1
  }
}
```

## Важные детали

### Атомарность
Используй `UPDATE ... SET fast_used = fast_used + 1 WHERE fast_used < limit RETURNING *` для атомарного инкремента. Это предотвращает race conditions при параллельных запросах.

### Таймзона
Все дневные лимиты работают по MSK (UTC+3). При расчёте текущего дня всегда используй `SET timezone = 'Europe/Moscow'` или конвертируй в коде.

### Обратная совместимость
- Не удаляй старую таблицу/логику месячных лимитов сразу
- Добавь feature flag `DAILY_LIMITS_ENABLED=true` в env
- Если флаг выключен — используется старая логика
- Когда всё протестировано — убрать старую логику отдельным PR

### Тесты
Напиши unit-тесты для:
- `DailyLimitChecker` — проверка каждого тарифа, каждой категории модели
- Rollover — корректный расчёт переноса, потолок накопления
- Edge cases: переход через полночь MSK, новый пользователь без записи `daily_usage`, смена тарифа посреди дня
- Opus как подлимит Premium

### Логирование
Логируй в stdout (для сбора в мониторинг):
- Каждое срабатывание лимита: `{ event: "limit_hit", user_id, category, plan }`
- Каждый rollover: `{ event: "rollover", user_id, fast_rollover, premium_rollover }`
- Ошибки крон-задачи

## Порядок работы

1. Начни с изучения текущей структуры проекта и существующей логики лимитов
2. Создай миграцию БД
3. Реализуй конфиги `model-tiers.ts` и `plan-limits.ts`
4. Реализуй `DailyLimitChecker` и `DailyLimitCounter`
5. Реализуй middleware
6. Реализуй rollover и крон-задачу
7. Реализуй API-эндпоинт `/api/user/limits`
8. Напиши тесты
9. Добавь feature flag
10. Проверь, что всё работает с существующими роутами бота и веб-чата
