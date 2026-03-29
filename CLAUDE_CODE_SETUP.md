# Stone AI — Настройка Claude Code

> Пошаговая инструкция: от установки до начала реализации

---

## Шаг 1: Установка Claude Code

### Требования
- Claude Pro подписка ($20/мес) или Claude Max ($100/мес)
- macOS / Linux / Windows

### Установка (одна команда)

**macOS / Linux:**
```bash
curl -fsSL https://cli.claude.com/install.sh | sh
```

**macOS (через Homebrew):**
```bash
brew install --cask claude-code
```

**Windows (PowerShell от администратора):**
```powershell
winget install Anthropic.ClaudeCode
```

### Проверка
```bash
claude --version
```

### Авторизация
```bash
claude
# Откроется браузер → войди в Claude → выбери "Claude Pro" или "API key"
```

---

## Шаг 2: Подготовка проекта

### Структура папок

Клонируй проект или создай структуру:

```
stone-ai/
├── CLAUDE.md              ← Главный файл для Claude Code (уже создан)
├── STRATEGY.md            ← Стратегия развития (уже создан)
├── TZ_IMPLEMENTATION.md   ← Техническое задание (уже создан)
├── frontend/              ← Telegram Mini App (существующий)
│   └── src/
├── backend/               ← FastAPI сервер (существующий)
│   └── app/
└── website/               ← [БУДЕТ СОЗДАН] Next.js сайт
```

### Положи файлы из нашего чата в корень

Ты скачал 3 файла:
1. `CLAUDE.md` — инструкция для Claude Code агента
2. `STRATEGY.md` — полная стратегия с финмоделью
3. `TZ_IMPLEMENTATION.md` — техническое задание по этапам

Положи их в корень `stone-ai/`:
```bash
cp ~/Downloads/CLAUDE.md stone-ai/
cp ~/Downloads/STRATEGY.md stone-ai/
cp ~/Downloads/TZ_IMPLEMENTATION.md stone-ai/
```

---

## Шаг 3: Первый запуск Claude Code

```bash
cd stone-ai
claude
```

Claude Code автоматически прочитает `CLAUDE.md` и будет знать:
- Архитектуру проекта (React + Vite frontend, FastAPI backend)
- Правила кодирования (inline CSS в TG-аппе, Tailwind на сайте)
- Текущий приоритет (Phase 1 — per-token billing)
- Где какой файл лежит

### Первое что сказать:

```
Прочитай STRATEGY.md и TZ_IMPLEMENTATION.md. Начинаем Этап 1: 
замена кредитной системы на per-token billing. 
Начни с создания services/token_billing.py по ТЗ.
```

Claude Code:
1. Прочитает оба документа
2. Изучит текущий `credits.py`
3. Создаст `token_billing.py` с TOKEN_PRICES, calculate_cost, check_balance, deduct_balance
4. Предложит изменения в `chat.py`, `limiter.py`, `payment.py`
5. Напишет SQL-миграцию

---

## Шаг 4: Рабочий процесс

### Как давать задачи

Следуй ТЗ по этапам. Каждый этап — отдельная сессия:

```
# Этап 1: Per-token billing
Реализуй Этап 1 из TZ_IMPLEMENTATION.md — per-token billing.
Создай token_billing.py, обнови user model, измени chat.py.

# Этап 2: 50 моделей
Реализуй Этап 2 из TZ_IMPLEMENTATION.md — расширение до 50 моделей.
Обнови ai_router.py с полным MODEL_MAP из STRATEGY.md.

# Этап 7: Сайт
Создай Next.js проект в папке website/ по Этапу 7 из ТЗ.
Используй дизайн из StoneAI_Landing_v2.jsx как референс.
```

### Полезные команды Claude Code

```bash
# Запуск в конкретной папке
cd stone-ai/backend && claude

# Запуск в режиме планирования (не пишет код, только план)
# Внутри Claude Code нажми Shift+Tab+Tab для Plan Mode

# Быстрый запрос без интерактивной сессии
claude -p "Покажи все файлы в backend/app/services/"

# Передача контекста через pipe
git diff | claude "Проверь эти изменения на ошибки"
```

### Коммиты через Claude Code

```
Закоммить изменения с сообщением: 
"feat: replace credit system with per-token billing"
```

Claude Code сам выполнит git add + git commit.

---

## Шаг 5: Кастомные команды

Создай папку `.claude/commands/` в корне проекта:

```bash
mkdir -p .claude/commands
```

### .claude/commands/implement.md
```markdown
Реализуй следующий этап из TZ_IMPLEMENTATION.md:
$ARGUMENTS

Правила:
- Следуй ТЗ точно
- Проверяй STRATEGY.md для бизнес-логики
- Пиши тесты
- Коммить после каждого завершённого подэтапа
```

### .claude/commands/review.md
```markdown
Проверь текущие изменения (git diff) на:
- Соответствие ТЗ (TZ_IMPLEMENTATION.md)
- Соответствие архитектуре (CLAUDE.md)
- Ошибки в бизнес-логике (STRATEGY.md — финмодель)
- Безопасность (атомарные операции с балансом)
$ARGUMENTS
```

### Использование

```
/implement Этап 1.1 — token_billing.py
/implement Этап 1.3 — обновить chat.py
/review backend changes
```

---

## Шаг 6: Настройки

### .claude/settings.json

```json
{
  "permissions": {
    "allow": [
      "bash(npm run *)",
      "bash(python *)",
      "bash(git *)",
      "bash(cd *)",
      "bash(cat *)",
      "bash(ls *)",
      "bash(mkdir *)",
      "bash(cp *)"
    ]
  },
  "env": {
    "CLAUDE_CODE_THINKING": "always"
  }
}
```

Это разрешает Claude Code запускать команды без подтверждения каждый раз и включает режим "думать всегда" (лучше для сложных задач).

---

## Шаг 7: Порядок реализации

Следуй этому порядку, давая задачи Claude Code:

```
Сессия 1 (backend):
  /implement Этап 1 — per-token billing (token_billing.py, user model, chat.py, limiter.py, payment.py)

Сессия 2 (backend):
  /implement Этап 2 — расширение до 50 моделей (ai_router.py, models endpoint)

Сессия 3 (backend):
  /implement Этап 3 — реклама и rewarded ads (endpoints, admin)

Сессия 4 (frontend TG):
  /implement Этап 4 — новый PlansScreen (баланс в $, per-token цены)

Сессия 5 (frontend TG):
  /implement Этап 5 — HomeScreen на 50 моделей с фильтрами

Сессия 6 (frontend TG):
  /implement Этап 6 — ChatScreen с показом расхода

Сессия 7 (website — параллельно с 1-3):
  /implement Этап 7 — Next.js лендинг (использовать StoneAI_Landing_v2.jsx)

Сессия 8 (website):
  /implement Этап 8 — /models и /pricing страницы
```

---

## Советы

### 1. Работай в Plan Mode сначала
Перед каждым этапом переключись в Plan Mode (Shift+Tab+Tab) и попроси Claude Code показать план, не код. Проверь что план совпадает с ТЗ, потом переключись обратно.

### 2. Коммить часто
После каждого подэтапа (1.1, 1.2, 1.3...) говори Claude Code:
```
Закоммить: "feat(billing): add token_billing.py with TOKEN_PRICES"
```

### 3. Тестируй на ходу
После Этапа 1 попроси:
```
Запусти backend и проверь: создай тестовый запрос к /api/chat 
с model_id=gpt-4o-mini, убедись что billing чанк приходит в SSE.
```

### 4. Если Claude Code ошибается
Не повторяй одно и то же — скажи:
```
Стоп. Перечитай TZ_IMPLEMENTATION.md секцию 1.3. 
Ты сделал X, а нужно Y. Исправь.
```

### 5. Контекст между сессиями
Claude Code не помнит предыдущие сессии, но `CLAUDE.md` даёт контекст. Если нужно продолжить работу, начни с:
```
Я работаю над Этапом 2 из TZ_IMPLEMENTATION.md. 
Этап 1 (token_billing) уже завершён. Продолжи.
```
