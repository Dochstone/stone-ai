# Stone AI — Техническое задание (ТЗ)

> Версия: 1.0 | 16 марта 2026
> Статус: К реализации
> Стратегия: STRATEGY.md

---

## Оглавление

1. [Этап 1: Backend — Per-token billing](#этап-1)
2. [Этап 2: Backend — Расширение до 50 моделей](#этап-2)
3. [Этап 3: Backend — Реклама и rewarded ads](#этап-3)
4. [Этап 4: Frontend TG — Новый PlansScreen + баланс в $](#этап-4)
5. [Этап 5: Frontend TG — HomeScreen на 50 моделей](#этап-5)
6. [Этап 6: Frontend TG — ChatScreen с показом расхода](#этап-6)
7. [Этап 7: Сайт — Next.js лендинг](#этап-7)
8. [Этап 8: Сайт — /models и /pricing](#этап-8)

---

<a id="этап-1"></a>
## Этап 1: Backend — Per-token billing (КРИТИЧЕСКИЙ)

### Цель
Заменить фиксированную кредитную систему (N кредитов за запрос) на per-token оплату ($ за реально использованные токены). Баланс пользователя в USD, не в кредитах.

### Текущее состояние
- `credits.py` — фикс `CREDIT_COSTS = {"claude-opus-4": 34, "gpt-4.1": 15, ...}`
- `User.credits` — integer поле, баланс в кредитах
- Списание ПЕРЕД стримингом (deduct_credits → stream → record_usage)
- Проблема: пользователь платит одинаково за "привет" и за 100-страничный анализ

### Что делать

#### 1.1 Новый файл: `services/token_billing.py`

Заменяет `credits.py`. Содержит:

```python
# Цены Stone AI за 1М токенов (input / output) — гибкая наценка
TOKEN_PRICES: dict[str, dict] = {
    # Tier 1: Бюджетные (Lite бесплатно 10+5/день)
    "gpt-4o-mini":       {"input": 0.60,  "output": 2.40,  "weighted": 1.68},
    "claude-haiku-4.5":  {"input": 4.00,  "output": 20.00, "weighted": 13.60},
    "gemini-2.0-flash":  {"input": 0.40,  "output": 1.60,  "weighted": 1.12},
    "llama-4-maverick":  {"input": 0.80,  "output": 2.40,  "weighted": 1.76},
    "mistral-large-25":  {"input": 8.00,  "output": 24.00, "weighted": 17.60},
    
    # Tier 2: Средние
    "deepseek-r1":       {"input": 2.20,  "output": 8.76,  "weighted": 6.14},
    "deepseek-v3":       {"input": 1.00,  "output": 1.52,  "weighted": 1.31},
    "gpt-4.1-mini":      {"input": 1.60,  "output": 6.40,  "weighted": 4.48},
    "gemini-2.5-flash":  {"input": 0.60,  "output": 2.40,  "weighted": 1.68},
    "claude-sonnet-4":   {"input": 12.00, "output": 60.00, "weighted": 40.80},
    "grok-3-mini":       {"input": 1.20,  "output": 2.00,  "weighted": 1.68},
    
    # Tier 3: Premium
    "claude-opus-4":     {"input": 60.00, "output": 300.00, "weighted": 204.00},  # x2.5 OR → ish $100 +30%
    "gpt-4.1":           {"input": 10.00, "output": 40.00,  "weighted": 28.00},
    "gpt-5.1":           {"input": 8.00,  "output": 56.00,  "weighted": 36.80},
    "gemini-2.5-pro":    {"input": 5.00,  "output": 40.00,  "weighted": 26.00},
    "grok-3":            {"input": 12.00, "output": 60.00,  "weighted": 40.80},
    "perplexity-sonar-pro": {"input": 12.00, "output": 60.00, "weighted": 40.80},
    
    # Tier 4: Изображения (per-token, отображается как per-image)
    "nano-banana-pro":   {"input": 8.00,  "output": 48.00, "weighted": 32.00},
    "nano-banana":       {"input": 0.60,  "output": 2.40,  "weighted": 1.68},
}

# Гибкая наценка (для справки, уже вшита в TOKEN_PRICES):
# Дешёвые (<$1 OR) → x5-6
# Средние ($1-5 OR) → x3-4.5 
# Дорогие ($5-15 OR) → x3-4
# Топовые (>$15 OR) → x2.5-2.8
# Цель: max +30-50% vs ishushka
```

**Функции:**

```python
def calculate_cost(model_id: str, tokens_in: int, tokens_out: int) -> float:
    """
    Рассчитать стоимость запроса в USD.
    
    Returns:
        float — стоимость в USD (например 0.0042)
    """
    prices = TOKEN_PRICES.get(model_id)
    if not prices:
        return 0.0
    cost = (tokens_in * prices["input"] + tokens_out * prices["output"]) / 1_000_000
    return round(cost, 6)


def get_weighted_price(model_id: str) -> float:
    """Средневзвешенная цена за 1М токенов (40/60 input/output). Для отображения юзеру."""
    prices = TOKEN_PRICES.get(model_id)
    return prices["weighted"] if prices else 0.0


async def check_balance(db: AsyncSession, tg_id: int, estimated_cost: float) -> dict:
    """
    Проверить достаточность баланса перед запросом.
    estimated_cost — примерная стоимость (на основе средних 2K токенов).
    
    Returns:
        {"allowed": bool, "balance": float, "estimated_cost": float, "reason": str | None}
    """
    ...


async def deduct_balance(db: AsyncSession, tg_id: int, amount: float) -> bool:
    """
    Списать USD с баланса. Атомарная операция с with_for_update().
    Вызывается ПОСЛЕ получения ответа от AI (не до, как было с кредитами).
    
    Returns:
        True если успешно, False если недостаточно средств
    """
    ...


async def add_balance(db: AsyncSession, tg_id: int, amount_usd: float) -> float:
    """Пополнить баланс в USD. Возвращает новый баланс."""
    ...
```

#### 1.2 Изменения в модели User (`models/user.py`)

```python
# УБРАТЬ:
credits: Mapped[int]  # старое поле, больше не нужно

# ДОБАВИТЬ:
balance_usd: Mapped[float] = mapped_column(Numeric(12, 6), server_default=text("0"))
# 6 знаков после запятой — хватит для микротранзакций ($0.000042)
```

**Миграция:**
```sql
ALTER TABLE users ADD COLUMN balance_usd NUMERIC(12,6) DEFAULT 0;
-- Конвертация существующих кредитов: 1 кредит → $0.011 (кредит стоил $1.10/100)
UPDATE users SET balance_usd = credits * 0.011 WHERE credits > 0;
```

#### 1.3 Изменения в `routers/chat.py`

**Текущий flow:**
1. Проверить лимиты
2. Списать кредиты (ПЕРЕД стримингом)
3. Стримить ответ
4. Записать usage

**Новый flow:**
1. Проверить лимиты (10+5 для Lite)
2. Для Premium: проверить баланс (estimated_cost = weighted_price * 2000 / 1M)
3. Стримить ответ → получить реальные tokens_in, tokens_out
4. Рассчитать реальную стоимость: `calculate_cost(model_id, tokens_in, tokens_out)`
5. Списать USD с баланса (ПОСЛЕ стриминга)
6. Записать usage с реальной стоимостью
7. Отправить клиенту финальный SSE-чанк: `{"cost": 0.0042, "tokens": 2150, "balance": 1.23}`

**Ключевое изменение**: списание ПОСЛЕ стриминга, не ДО. Это справедливо (пользователь платит за реальный расход), но создаёт риск — пользователь может отменить запрос и не заплатить. Решение: проверять баланс >= estimated_cost перед запросом, списывать реальную сумму после.

**Обработка ошибок**: если AI вернул ошибку — не списывать. Если баланс стал отрицательным (реальная стоимость > estimated) — списать до нуля, зафиксировать долг в логах.

```python
# Новый финальный SSE-чанк (добавить к существующим):
yield f'data: {json.dumps({
    "billing": {
        "tokens_in": tokens_in,
        "tokens_out": tokens_out,
        "cost_usd": real_cost,
        "balance_usd": new_balance,
        "model_price_per_m": get_weighted_price(model_id),
    }
})}\n\n'
```

#### 1.4 Изменения в `routers/payment.py`

**Убрать:**
- CREDIT_PRICE_STANDARD, CREDIT_PRICE_VIP, credits_for_usd()
- Всю логику конвертации USD → кредиты

**Заменить на:**
- Прямое пополнение баланса в USD
- Invoice description: "Пополнение баланса: $10.00"
- Убрать VIP тир (не нужен при per-token)

```python
# Новый flow оплаты Stars:
# 1. Юзер вводит сумму в $ (минимум $1)
# 2. Backend конвертирует: stars = ceil(usd / 0.013)
# 3. Создаёт invoice через Telegram Bot API
# 4. После оплаты: add_balance(db, tg_id, usd_amount)
# 5. Возвращает: {"status": "ok", "added_usd": 10.00, "new_balance_usd": 15.42}
```

#### 1.5 Изменения в `services/limiter.py`

```python
# БЫЛО:
LIMITS = {
    "free": {"lite": 20, "premium": 0},
    ...
}

# СТАЛО:
FREE_DAILY_LIMIT = 10          # базовых запросов
REWARDED_BONUS = 5             # +5 за просмотр рекламы
MAX_TOKENS_LITE = 2048         # max output для бесплатных
MAX_TOKENS_PAID = 8192         # max output для платных
```

**Новая логика check_can_request:**
```
if tier == "lite":
    if used_today < FREE_DAILY_LIMIT:
        → allowed (бесплатно)
    elif used_today < FREE_DAILY_LIMIT + user.rewarded_bonus_today:
        → allowed (за счёт rewarded)
    else:
        → если balance_usd > 0: allowed (per-token, списать)
        → иначе: denied ("Лимит исчерпан. Посмотрите рекламу или пополните баланс")
        
if tier == "premium":
    estimated = weighted_price * 2000 / 1M
    if balance_usd >= estimated:
        → allowed (per-token, списать после)
    else:
        → denied ("Недостаточно средств. Баланс $X, примерная стоимость $Y")
```

**DeepSeek R1**: перевести из `lite` в `premium` в `TIER_MAP` в `ai_router.py`.

#### 1.6 Новый endpoint: POST `/api/rewarded-ad-complete`

```python
@router.post("/api/rewarded-ad-complete")
async def rewarded_ad_complete(tg_user: dict = Depends(get_current_user), db = Depends(get_db)):
    """
    Вызывается фронтендом после подтверждения просмотра rewarded video.
    Даёт +5 бесплатных запросов на сегодня.
    
    Защита от абьюза:
    - Максимум 1 раз в день (проверять user.rewarded_today)
    - Проверять ad_token от рекламной SDK (если есть)
    
    Returns: {"bonus": 5, "new_limit": 15, "used_today": 8}
    """
```

#### 1.7 DB миграция

```sql
-- 1. Добавить balance_usd
ALTER TABLE users ADD COLUMN balance_usd NUMERIC(12,6) DEFAULT 0;

-- 2. Конвертировать кредиты в USD
UPDATE users SET balance_usd = credits * 0.011 WHERE credits > 0;

-- 3. Добавить rewarded bonus tracking
ALTER TABLE users ADD COLUMN rewarded_today INT DEFAULT 0;

-- 4. Добавить cost_usd в usage (уже есть, убедиться что заполняется)
-- usage.cost_usd уже существует в модели

-- 5. (Опционально) Оставить credits для обратной совместимости, но не использовать
```

#### 1.8 Тесты

| Тест | Ожидание |
|------|----------|
| Lite запрос #1-10 | Бесплатно, balance_usd не меняется |
| Lite запрос #11 | Denied: "Лимит 10 исчерпан" |
| Rewarded ad → Lite запрос #11-15 | Бесплатно |
| Premium запрос с balance $0 | Denied: "Недостаточно средств" |
| Premium запрос Claude Opus, 2K tokens | balance -= ~$0.36, SSE: {"billing": {"cost_usd": 0.36}} |
| Premium запрос GPT-4o mini (через per-token) | balance -= ~$0.003 |
| Пополнение $10 через Stars | balance += $10.00, invoice $10 |
| Запрос с ошибкой от AI | balance НЕ меняется |

---

<a id="этап-2"></a>
## Этап 2: Backend — Расширение до 50 моделей

### Цель
Расширить MODEL_MAP и MODELS_INFO в `ai_router.py` с 11 до 50+ моделей.

### Что делать

#### 2.1 Обновить `services/ai_router.py`

**MODEL_MAP** — добавить все модели из стратегии (4 тира):

```python
MODEL_MAP = {
    # Tier 1: Бюджетные (7 моделей)
    "gpt-4o-mini": "openai/gpt-4o-mini",
    "claude-haiku-4.5": "anthropic/claude-haiku-4.5",
    "gemini-2.0-flash": "google/gemini-2.0-flash",
    "llama-4-maverick": "meta-llama/llama-4-maverick",
    "mistral-large-25": "mistralai/mistral-large-latest",
    "gemma-3-27b": "google/gemma-3-27b",
    "qwen-3-235b": "qwen/qwen-3-235b",
    
    # Tier 2: Средние (10+ моделей)
    "deepseek-r1": "deepseek/deepseek-r1",
    "deepseek-v3": "deepseek/deepseek-v3",
    "gpt-4.1-mini": "openai/gpt-4.1-mini",
    "gemini-2.5-flash": "google/gemini-2.5-flash",
    "claude-sonnet-4": "anthropic/claude-sonnet-4",
    "grok-3-mini": "x-ai/grok-3-mini",
    "phi-4": "microsoft/phi-4",
    "qwen-qwq": "qwen/qwq-32b",
    "command-r7": "cohere/command-r7",
    "mistral-small": "mistralai/mistral-small-creative",
    
    # Tier 3: Premium (6+ моделей)
    "claude-opus-4": "anthropic/claude-opus-4",
    "gpt-4.1": "openai/gpt-4.1",
    "gpt-5.1": "openai/gpt-5.1",
    "gemini-2.5-pro": "google/gemini-2.5-pro",
    "grok-3": "x-ai/grok-3",
    "perplexity-sonar-pro": "perplexity/sonar-pro",
    
    # Tier 4: Изображения
    "nano-banana-pro": "google/gemini-3-pro-image-preview",
    "nano-banana": "google/gemini-2.5-flash-preview:image",
    # + DALL-E, Flux (через отдельные endpoints, не OpenRouter)
    
    # ... ещё 20+ моделей добавлять по мере появления на OpenRouter
}
```

**TIER_MAP** — обновить:
```python
# Tier 1 = "lite" (бесплатно 10+5/день)
# Tier 2-4 = "premium" (per-token)
# DeepSeek R1 теперь premium!
```

**MODELS_INFO** — расширить с метаданными для фронтенда:
```python
MODELS_INFO = [
    {
        "id": "gpt-4o-mini",
        "name": "GPT-4o mini",
        "company": "OpenAI",
        "tier": "lite",           # отображается на фронте
        "icon": "🤖",
        "desc": "Быстрый и дешёвый",
        "price_weighted": 1.68,    # НОВОЕ: средневзвешенная за 1М
        "price_input": 0.60,       # НОВОЕ: input за 1М
        "price_output": 2.40,      # НОВОЕ: output за 1М
        "context_length": 128000,  # НОВОЕ: контекст
        "category": "chat",        # НОВОЕ: chat | image | code | search
    },
    # ... 50+ записей
]
```

#### 2.2 Обновить endpoint GET `/api/models`

Возвращает полный каталог с ценами. Поддерживает фильтрацию:

```
GET /api/models                         → все модели
GET /api/models?tier=lite               → только бесплатные
GET /api/models?tier=premium            → только платные
GET /api/models?company=OpenAI          → фильтр по провайдеру
GET /api/models?category=image          → только генерация картинок
```

---

<a id="этап-3"></a>
## Этап 3: Backend — Реклама и rewarded ads

### Цель
Интеграция рекламной SDK для монетизации free-юзеров.

### Что делать

#### 3.1 Выбор рекламной платформы
- **Telegram Ads** — если появится SDK для Mini Apps
- **Google AdMob** — через WebView (не идеально для TG Mini App)
- **Yandex Advertising Network** — для РФ аудитории, хороший CPM
- **Собственные баннеры** — партнёрские ссылки (AI-курсы, VPN, хостинги)

Рекомендация: начать с **собственных баннеров** (не требует SDK), затем подключить **Yandex** для rewarded video.

#### 3.2 Backend endpoints

```python
GET  /api/ads/banner          → вернуть текущий баннер (JSON: image_url, click_url, text)
POST /api/ads/click           → зарегистрировать клик
POST /api/ads/impression      → зарегистрировать показ
POST /api/rewarded-ad-complete → +5 запросов (описан в Этапе 1)
```

#### 3.3 Админ-панель для баннеров

В `dashboard.py` добавить раздел управления баннерами:
- Загрузка изображения
- Ссылка для клика
- Период показа (от/до)
- Статистика показов/кликов/CTR

---

<a id="этап-4"></a>
## Этап 4: Frontend TG — Новый PlansScreen

### Цель
Заменить экран кредитов на экран с балансом в USD и per-token ценами.

### Текущее состояние
- `PlansScreen.tsx` — показывает баланс в кредитах, CREDIT_PRICE_STANDARD = 1.1
- Кнопки быстрых сумм: $5, $10, $25, $50
- Превью: "Получишь X кредитов"

### Что делать

#### 4.1 Новый PlansScreen

**Заголовок**: "Баланс" (не "Кредиты")

**Баланс-карточка**:
```
ТВОЙ БАЛАНС
$15.42
≈ 43 запроса к GPT-4.1 | ≈ 3 запроса к Claude Opus
```

**Пополнение**:
- Кнопки: $1, $5, $10, $25
- Произвольная сумма (input)
- Превью: "Пополнить $10.00 за ⭐ 770"
- Методы оплаты: Stars / Карта (скоро)

**Модели и цены** (вместо PREMIUM_MODELS):
- Список всех 50 моделей с ценой за 1М токенов (средневзвешенная)
- Фильтры: Все / Бесплатные / Платные
- По клику на модель → показать детали: input/output цена, context length
- Калькулятор: "Сколько стоит 100 запросов к GPT-4.1?" → "$5.00"

**FAQ-блок** обновить:
- "Как работает оплата?" → "Платите за реально использованные токены"
- "Что такое токен?" → "~750 слов = 1000 токенов"
- Убрать всё про кредиты

#### 4.2 Обновить useStore.ts

```typescript
// БЫЛО:
credits: number
creditCosts: Record<string, number>

// СТАЛО:
balanceUsd: number
modelPrices: Record<string, { input: number; output: number; weighted: number }>
lastRequestCost: number | null  // стоимость последнего запроса
```

#### 4.3 Обновить usePayment.ts

Убрать конвертацию USD → кредиты. Пополнение напрямую в USD.

---

<a id="этап-5"></a>
## Этап 5: Frontend TG — HomeScreen на 50 моделей

### Цель
Обновить сетку моделей для 50+ штук с фильтрами.

### Что делать

#### 5.1 Новый HomeScreen

**Промо-баннер**: обновить текст — "50+ AI-моделей", убрать старые описания.

**Usage карточка**:
```
Бесплатных сегодня: 7/10  [+5 за рекламу]
Баланс: $15.42
```

**Фильтры** (горизонтальный скролл тегов):
```
[Все] [Бесплатные] [OpenAI] [Anthropic] [Google] [Meta] [xAI] [Картинки]
```

**Сетка моделей**:
- 3 колонки (как сейчас)
- На карточке: иконка, название, компания, цена за 1М (или "FREE"), badge PRO/FREE
- По клику: если Lite → сразу в чат. Если Premium → ModelDetailScreen с ценой.

#### 5.2 Баннер рекламы

Для free-юзеров внизу HomeScreen показывать баннер партнёра (300x50px).
Для платящих — скрывать.

#### 5.3 Кнопка "+5 запросов за рекламу"

Когда лимит 10 исчерпан:
```
[🎬 Смотреть рекламу → +5 запросов]
```
По нажатию → показать rewarded video → POST /api/rewarded-ad-complete → обновить лимит.

---

<a id="этап-6"></a>
## Этап 6: Frontend TG — ChatScreen с показом расхода

### Цель
Показывать стоимость каждого запроса в реальном времени.

### Что делать

#### 6.1 После каждого ответа показывать:

```
                              [ответ ассистента]
                   🧠 Claude Opus 4 · 1,847 токенов · $0.34
```

Данные берутся из финального SSE-чанка `{"billing": {...}}`.

#### 6.2 Баннерная реклама

Для free-юзеров: тонкий баннер над инпутом (не мешает вводу).
Исчезает после любого пополнения баланса.

#### 6.3 Уведомление о низком балансе

Если balance < estimated_cost следующего запроса:
```
⚠ Баланс $0.12 — может не хватить на Claude Opus. Пополнить →
```

---

<a id="этап-7"></a>
## Этап 7: Сайт — Next.js лендинг

### Цель
Создать сайт stoneai.app (или stone-ai.ru) на Next.js.

### Технические решения

```
website/
├── app/
│   ├── layout.tsx          # Общий layout: nav + footer
│   ├── page.tsx            # Главная (лендинг)
│   ├── models/
│   │   └── page.tsx        # Каталог 50 моделей
│   ├── pricing/
│   │   └── page.tsx        # Тарифы + калькулятор
│   ├── terms/
│   │   └── page.tsx        # Оферта
│   ├── privacy/
│   │   └── page.tsx        # Конфиденциальность
│   └── refund/
│       └── page.tsx        # Возвраты
├── components/
│   ├── Nav.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── ToolCards.tsx        # 6 AI-инструментов
│   ├── ModelGrid.tsx        # Сетка моделей с фильтрами
│   ├── PricingCalc.tsx      # Калькулятор per-token
│   ├── ReviewSlider.tsx     # Отзывы
│   ├── FaqAccordion.tsx     # FAQ
│   └── TrustMarquee.tsx     # Бегущая строка логотипов
├── lib/
│   ├── models.ts            # Данные 50 моделей (shared с backend)
│   └── pricing.ts           # Калькулятор цен
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

### Стек
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Деплой: Vercel (vercel.json уже есть)
- Дизайн: стиль chatbotai.co (светлый, яркий, градиенты — файл StoneAI_Landing_v2.jsx)

### Страницы

**Главная** (page.tsx):
1. Nav (fixed, blur backdrop)
2. Hero: заголовок + subtitle + CTA + stats
3. Trust marquee (логотипы компаний)
4. Tool cards (6 инструментов, горизонтальный скролл)
5. Model showcase (тёмная секция, 11 top моделей)
6. Features comparison (Free vs Paid таблица)
7. Pricing (2 колонки: Free / Per-token)
8. Reviews (4 отзыва)
9. FAQ (6 вопросов, SEO long-tail)
10. CTA final (тёмный блок с кнопкой)
11. Footer (ссылки + копирайт)

---

<a id="этап-8"></a>
## Этап 8: Сайт — /models и /pricing

### /models

- SSG страница с 50+ моделями
- Данные из `lib/models.ts` (общий с backend)
- Фильтры: провайдер, тир, категория, сортировка по цене
- Каждая модель — карточка с: иконкой, названием, компанией, ценой за 1М (средневзвешенной), context length, badge FREE/PRO
- По клику — разворачивается: input/output цены, описание, кнопка "Попробовать в Telegram"

### /pricing

- Калькулятор per-token: выбери модель → введи кол-во запросов → получи стоимость
- Сравнение с конкурентами: Stone AI vs ChatGPT Plus vs chatbotai.co
- Таблица "Сколько стоит месяц использования" при разных объёмах
- CTA: "Пополнить баланс" → ссылка на TG-бот
- Free tier описание: "10 запросов бесплатно, +5 за рекламу"

---

## Порядок реализации

| # | Этап | Зависимости | Срок | Приоритет |
|---|------|------------|------|-----------|
| 1 | Backend: per-token billing | — | 3-4 дня | 🔴 Критический |
| 2 | Backend: 50 моделей | Этап 1 | 1-2 дня | 🔴 Критический |
| 3 | Backend: реклама + rewarded | Этап 1 | 2-3 дня | 🟡 Важный |
| 4 | Frontend: PlansScreen | Этапы 1,2 | 2-3 дня | 🔴 Критический |
| 5 | Frontend: HomeScreen | Этапы 2,3 | 2-3 дня | 🔴 Критический |
| 6 | Frontend: ChatScreen | Этап 1 | 1-2 дня | 🟡 Важный |
| 7 | Сайт: лендинг | — (параллельно) | 3-5 дней | 🔴 Критический |
| 8 | Сайт: /models + /pricing | Этапы 2,7 | 2-3 дня | 🟡 Важный |

**Общий срок**: 2-3 недели при работе одного разработчика.
**Параллелизация**: Этапы 1-3 (backend) и Этап 7 (сайт) можно делать параллельно.
