# StoneAI Full Transform — Задачи для Claude Code

> **Как использовать этот файл:**
> Задачи пронумерованы и упорядочены по зависимостям. Скармливайте Claude Code по 1-3 задачи за раз.
> Перед каждой задачей давайте контекст проекта (блок CONTEXT ниже).
> После выполнения — проверяйте, коммитьте, переходите к следующей.

---

## CONTEXT (давать Claude Code в начале каждой сессии)

```
Проект: StoneAI (stoneai.ru) — AI-платформа, агрегатор 65+ нейросетей.
Стек: Next.js 15 (App Router), React, TypeScript, Prisma ORM, PostgreSQL, Tailwind CSS.
Платежи: Platega.io (карты РФ, СБП, крипто) — интеграция в процессе. Также: Telegram Stars, TON, крипто.
Хостинг: [указать свой — Vercel / VPS / etc.]
Аналитика: Яндекс.Метрика.
Telegram-бот: @drifttt55bot.
Текущий функционал: AI чат (65+ моделей), генерация картинок, видео, 3D, аудио, AI поиск (Perplexity), анализ документов, код-ассистент, переводчик, публичный API.
Чат без регистрации: уже работает на /webchat.
```

---

## ФАЗА 0: БАЗА ДАННЫХ (делать первой!)

### Задача 0.1 — Prisma schema: новые таблицы

```
Добавь в schema.prisma следующие модели. Не трогай существующие модели — только добавь новые.

1. Project (бренды/проекты пользователя):
- id: String @id @default(cuid())
- userId: String (связь с User)
- name: String
- description: String? @db.Text
- audience: String? @db.Text (описание целевой аудитории)
- tone: String? (formal | friendly | professional | casual)
- products: Json? (массив {name, description, price})
- keywords: String[] (ключевые слова бренда)
- isDefault: Boolean @default(false)
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt

2. PromptTemplate (библиотека промптов):
- id: String @id @default(cuid())
- category: String (marketing | smm | seo | code | copywriting | business | education)
- title: String
- description: String?
- content: String @db.Text (текст промпта с плейсхолдерами {variable})
- variables: Json? (описание переменных для UI)
- usageCount: Int @default(0)
- isSystem: Boolean @default(true) (системный или пользовательский)
- createdBy: String? (userId для пользовательских)
- createdAt: DateTime @default(now())

3. SavedPrompt (избранные промпты пользователя):
- id: String @id @default(cuid())
- userId: String
- templateId: String? (ссылка на PromptTemplate)
- customContent: String? @db.Text (если свой промпт)
- title: String
- createdAt: DateTime @default(now())

4. Generation (галерея генераций):
- id: String @id @default(cuid())
- userId: String
- projectId: String? (связь с Project)
- type: String (image | video | audio | 3d | text | presentation)
- model: String (название модели)
- prompt: String @db.Text
- resultUrl: String? (URL файла в S3)
- resultText: String? @db.Text (для текстовых генераций)
- metadata: Json? (размеры, длительность и т.д.)
- isFavorite: Boolean @default(false)
- cost: Float? (стоимость генерации в рублях)
- createdAt: DateTime @default(now())

5. UserBalance (баланс для pay-per-use):
- id: String @id @default(cuid())
- userId: String @unique
- balance: Float @default(0)
- totalDeposited: Float @default(0)
- totalSpent: Float @default(0)
- updatedAt: DateTime @updatedAt

6. BalanceTransaction (история транзакций):
- id: String @id @default(cuid())
- userId: String
- amount: Float (положительный = пополнение, отрицательный = списание)
- type: String (deposit | generation | bonus | refund)
- description: String?
- generationId: String? (ссылка на Generation)
- externalId: String? (ID транзакции Platega)
- createdAt: DateTime @default(now())

7. GameScore (таблица лидеров мини-игры):
- id: String @id @default(cuid())
- userId: String
- game: String (snake | quiz | 2048)
- score: Int
- month: String (формат YYYY-MM, для ежемесячного сброса)
- createdAt: DateTime @default(now())
- @@unique([userId, game, month])

Добавь все необходимые связи (relations) между моделями и таблицей User.
После создания схемы — сгенерируй миграцию: npx prisma migrate dev --name add_platform_tables
```

---

## ФАЗА 1: ФУНДАМЕНТ

### Задача 1.1 — Pay-per-use: API баланса

```
Создай API routes для системы баланса пользователя. Platega.io уже интегрируется для приёма платежей (карты РФ, СБП, крипто). Мне нужна внутренняя логика баланса.

Создай файлы:

1. app/api/balance/route.ts — GET: получить баланс текущего пользователя (из UserBalance).

2. app/api/balance/deposit/route.ts — POST: инициировать пополнение баланса.
   - Принимает { amount: number, method: 'platega' | 'stars' | 'ton' }
   - Для method='platega': пока заглушка — возвращает { redirectUrl: '/payment/pending' }. Реальную интеграцию с Platega API я доделаю сам.
   - Для method='stars': существующая логика (оставь TODO).
   - Создаёт BalanceTransaction с type='deposit', status='pending'.

3. app/api/balance/spend/route.ts — POST: списать с баланса за генерацию.
   - Принимает { amount: number, description: string, generationId?: string }
   - Проверяет, что баланс >= amount. Если нет — возвращает 402 с { error: 'Insufficient balance', balance: currentBalance }.
   - Атомарно уменьшает баланс и создаёт BalanceTransaction с type='generation'.
   - Используй Prisma transaction для атомарности.

4. app/api/balance/webhook/platega/route.ts — POST: webhook от Platega.
   - Принимает callback от Platega (JSON с полями: orderId, status, amount).
   - Если status === 'success': увеличивает баланс, обновляет BalanceTransaction на type='deposit'.
   - Верификацию подписи Platega оставь как TODO — я добавлю ключ позже.

5. lib/balance.ts — утилиты:
   - getBalance(userId): Promise<number>
   - spendBalance(userId, amount, description, generationId?): Promise<{success, newBalance}>
   - hasBalance(userId, amount): Promise<boolean>

Все эндпоинты защищены авторизацией (getServerSession или твоя текущая auth-логика).
```

### Задача 1.2 — Приветственный бонус +100₽

```
Реализуй систему приветственного бонуса при регистрации.

1. В существующем обработчике регистрации (найди его в проекте — скорее всего app/api/auth/[...nextauth]/route.ts или аналог):
   - После успешного создания пользователя: создай UserBalance с balance=100, totalDeposited=100.
   - Создай BalanceTransaction: { amount: 100, type: 'bonus', description: 'Приветственный бонус' }.

2. Создай компонент components/WelcomeBonusBanner.tsx:
   - Показывается незарегистрированным пользователям.
   - Текст: "🎁 Зарегистрируйтесь и получите +100₽ на баланс для генераций"
   - Кнопка "Начать бесплатно — +100₽"
   - Стиль: аккуратный баннер в верхней части страницы, можно закрыть (сохранять в localStorage).
   - Используй Tailwind, стиль в духе текущего минимализма Stone AI.

3. Создай компонент components/BalanceDisplay.tsx:
   - Показывает текущий баланс в хедере (рядом с кнопкой аккаунта).
   - Формат: "💰 142₽" — кликабельно, ведёт на /dashboard/billing.
   - Запрашивает GET /api/balance при маунте.

Не меняй существующую навигацию — только добавь компоненты.
```

### Задача 1.3 — Мультиответы (x2 AI)

```
Создай компонент для получения ответов от двух AI-моделей одновременно.

1. Создай components/chat/DualChatView.tsx:
   - Два панели бок о бок (на десктопе) или табы (на мобайле <768px).
   - Каждая панель имеет свой селектор модели (выпадающий список из доступных моделей).
   - При отправке сообщения: отправляет один и тот же промпт в обе модели параллельно (Promise.allSettled).
   - Оба ответа стримятся (SSE) одновременно.
   - Под каждым ответом кнопка: "👍 Предпочитаю этот ответ" — при клике подсвечивает выбранный, логирует выбор (POST /api/analytics/preference с { model, promptHash }).
   - Кнопка переключения режима: "1 модель ↔ 2 модели" в тулбаре чата.

2. Создай app/api/analytics/preference/route.ts:
   - POST: сохраняет { userId, model1, model2, preferredModel, promptCategory }.
   - Таблицу ModelPreference добавь в Prisma (id, userId, model1, model2, preferred, createdAt).

3. Интегрируй DualChatView в существующий чат:
   - Найди текущий компонент чата в проекте.
   - Добавь toggle-кнопку "x2 AI" рядом с селектором модели.
   - При включении — заменяет стандартный вид на DualChatView.

Стримы используй через существующую логику SSE-стриминга проекта.
```

### Задача 1.4 — Геймификация: мини-игра при ожидании

```
Создай мини-игру "Змейка", которая показывается во время ожидания генерации.

1. Создай components/games/SnakeGame.tsx:
   - Классическая змейка на Canvas (300x300px).
   - Управление: стрелки/WASD на десктопе, свайпы на мобайле.
   - Счёт отображается в реальном времени.
   - По окончании игры: если пользователь залогинен — предложить сохранить результат.

2. Создай components/GenerationOverlay.tsx:
   - Оверлей, показываемый поверх интерфейса во время генерации (картинки/видео/аудио).
   - Содержит: прогресс-бар/спиннер + текст "Генерация... ~30 сек" + кнопка "🎮 Играть пока ждёшь" + кнопка "Свернуть в фон".
   - При клике на игру — показывает SnakeGame.
   - При клике "Свернуть" — оверлей скрывается, генерация продолжается, результат появится в галерее (toast-уведомление по завершении).

3. Создай app/api/games/score/route.ts:
   - POST: сохранить результат { game: 'snake', score: number }. Использует таблицу GameScore. Автоматически проставляет month в формате YYYY-MM.
   - GET: получить таблицу лидеров { game, month? }. По умолчанию текущий месяц. Возвращает топ-20 с username и score.

4. Создай components/games/Leaderboard.tsx:
   - Таблица лидеров: позиция, имя, счёт.
   - Топ-5 подсвечены золотом/серебром/бронзой.
   - Текст: "🏆 Топ-5 игроков месяца получают +100₽ на баланс!"
   - Переключатель: "За месяц" / "За всё время".

Стиль: минималистичный, в духе Stone AI. Canvas с тёмным фоном.
```

### Задача 1.5 — PWA

```
Настрой Progressive Web App для stoneai.ru.

1. Создай public/manifest.json:
   - name: "Stone AI — 65+ нейросетей"
   - short_name: "Stone AI"
   - start_url: "/webchat"
   - display: "standalone"
   - theme_color и background_color в стиле Stone AI
   - Иконки: 192x192 и 512x512 (создай placeholder-иконки SVG с текстом "S")

2. Добавь мета-теги в app/layout.tsx:
   - <link rel="manifest" href="/manifest.json">
   - <meta name="theme-color">
   - <meta name="apple-mobile-web-app-capable" content="yes">

3. Создай компонент components/PWAInstallPrompt.tsx:
   - Ловит событие beforeinstallprompt.
   - Показывает промпт после 3-го визита (считай визиты в localStorage).
   - Текст: "⚡ Добавьте Stone AI на главный экран для быстрого доступа"
   - Кнопки: "Установить" / "Не сейчас"
   - Если iOS (нет beforeinstallprompt): показывает инструкцию "Нажмите «Поделиться» → «На экран Домой»"
   - Закрытие сохраняется в localStorage на 7 дней.

Не добавляй service worker с кэшированием (может сломать SSE-стриминг). Только manifest + install prompt.
```

---

## ФАЗА 2: ПЕРСОНАЛИЗАЦИЯ

### Задача 2.1 — CRUD проектов (брендов)

```
Создай полный CRUD для проектов пользователя (бренды/бизнесы).

1. API routes:
   - app/api/projects/route.ts — GET (все проекты юзера), POST (создать)
   - app/api/projects/[id]/route.ts — GET, PUT, DELETE
   - app/api/projects/[id]/set-default/route.ts — POST (сделать проект дефолтным)

2. Страница app/dashboard/projects/page.tsx:
   - Список проектов пользователя в виде карточек.
   - Карточка: название, описание (обрезанное), тон, кол-во ключевых слов, бейдж "По умолчанию".
   - Кнопка "Создать проект".
   - Лимиты: проверяй на бэке. Free — 1 проект, Start — 3, Pro — 10, Elite — безлимит. Показывай "N из M" в UI.

3. Компонент components/projects/ProjectForm.tsx:
   - Форма: название*, описание (textarea), целевая аудитория (textarea), тон голоса (select: формальный/дружелюбный/профессиональный/свободный), продукты (динамический список: название + описание + цена), ключевые слова (теги с автодополнением).
   - Режим создания и редактирования.

4. Компонент components/projects/ProjectSelector.tsx:
   - Компактный селектор проекта для встраивания в хедер чата.
   - Dropdown с названиями проектов + "Без проекта".
   - При выборе — сохраняет selectedProjectId в localStorage и в React context.

5. Интеграция с чатом:
   - Найди место, где формируется system prompt для API запроса к модели.
   - Если выбран проект — prepend к system message:
   "Контекст проекта пользователя: Название: {name}. Описание: {description}. Целевая аудитория: {audience}. Тон общения: {tone}. Продукты/услуги: {products}. Ключевые слова: {keywords}. Учитывай этот контекст во всех ответах."
```

### Задача 2.2 — Библиотека промптов

```
Создай библиотеку готовых промптов с 1-клик вставкой в чат.

1. Сид данных — создай файл prisma/seed-prompts.ts:
   Добавь 50 промптов в таблицу PromptTemplate по категориям:
   - marketing (10): анализ конкурентов, УТП, оффер, позиционирование, SWOT, маркетинг-план, анализ ЦА, воронка продаж, KPI маркетинга, стратегия запуска
   - smm (10): пост VK, пост Telegram, контент-план на неделю, контент-план на месяц, сторис, reels-скрипт, хештеги, ответ на негативный отзыв, описание сообщества, идеи для вовлечения
   - seo (8): SEO-статья, мета-title + description, alt-тексты для изображений, FAQ-блок, структура сайта, анализ ключевых слов, ТЗ для копирайтера, оптимизация карточки товара
   - copywriting (8): заголовок по формуле 4U, текст для лендинга, email-рассылка, коммерческое предложение, описание товара, сторителлинг, welcome-серия писем, текст для рекламного баннера
   - code (7): ревью кода, рефакторинг, написание тестов, API документация, SQL запрос, regex, архитектура проекта
   - business (7): бизнес-план краткий, pitch для инвестора, анализ рынка, финмодель, скрипт продаж, ответ клиенту, описание вакансии

   Каждый промпт: title, description (1 строка), content (сам промпт с {переменными}), variables (JSON: [{name, label, placeholder}]).
   Пример:
   {
     category: "smm",
     title: "Пост для VK",
     description: "Вовлекающий пост для группы ВКонтакте",
     content: "Напиши пост для группы ВКонтакте. Тема: {topic}. Тон: {tone}. Целевая аудитория: {audience}. Пост должен содержать: цепляющий первый абзац, основную мысль, призыв к действию. Длина: 500-800 символов. Добавь 3-5 подходящих эмодзи.",
     variables: [
       { name: "topic", label: "Тема поста", placeholder: "Например: скидки на весеннюю коллекцию" },
       { name: "tone", label: "Тон", placeholder: "дружелюбный / экспертный / продающий" },
       { name: "audience", label: "Целевая аудитория", placeholder: "женщины 25-35, мамы" }
     ]
   }

2. Компонент components/prompts/PromptLibrary.tsx:
   - Боковая панель (drawer) или модальное окно.
   - Фильтр по категориям (табы сверху).
   - Поиск по названию/описанию.
   - Карточка промпта: title, description, категория-бейдж, кнопка "⭐ В избранное", кнопка "Использовать".
   - При клике "Использовать": если промпт имеет переменные — показать мини-форму для их заполнения. После заполнения — вставить готовый промпт в поле ввода чата.
   - Если переменных нет — вставить сразу.

3. Компонент components/prompts/PromptCard.tsx — карточка отдельного промпта.

4. Кнопка вызова библиотеки:
   - Добавь иконку "📚" или "Промпты" рядом с полем ввода в чате.
   - При клике открывает PromptLibrary.

5. Создай скрипт сида: npx prisma db seed (настрой в package.json).
```

### Задача 2.3 — Галерея генераций

```
Создай страницу галереи всех генераций пользователя.

1. API route app/api/generations/route.ts:
   - GET: список генераций текущего юзера. Параметры: type? (image|video|audio|3d|text), projectId?, isFavorite?, page, limit (по 20). Возвращает пагинированный список.
   - При каждой генерации в проекте (картинки, видео и т.д.) — добавь запись в таблицу Generation. Найди существующие обработчики генерации и добавь вызов prisma.generation.create() после успешной генерации.

2. API route app/api/generations/[id]/favorite/route.ts:
   - POST: toggle isFavorite.

3. Страница app/dashboard/gallery/page.tsx:
   - Grid-layout (3 колонки десктоп, 2 планшет, 1 мобайл).
   - Фильтры сверху: тип (все / картинки / видео / аудио / 3D / текст), проект (dropdown), только избранное (toggle).
   - Карточка генерации: превью (картинка/видео плеер/аудио плеер/текст-превью), модель (бейдж), промпт (обрезанный), дата, иконка избранного (сердечко).
   - Клик на карточку: модальное окно с полным размером, полный промпт, кнопки: скачать, в избранное, повторить генерацию (открывает чат с этим промптом), удалить.
   - Infinite scroll (IntersectionObserver) вместо пагинации.
   - Пустое состояние: "Здесь появятся ваши генерации. Попробуйте создать первую картинку!"
```

---

## ФАЗА 3: МАРКЕТИНГОВЫЕ ИНСТРУМЕНТЫ

### Задача 3.1 — Wizard-шаблоны: инфраструктура

```
Создай систему AI-шаблонов с wizard-формами для типовых маркетинговых задач.

1. Создай модель в Prisma (если ещё нет):
   model WizardTemplate {
     id          String   @id @default(cuid())
     slug        String   @unique
     category    String   // advertising | smm | seo | email | copywriting | marketplace | business
     title       String
     description String
     icon        String?  // emoji
     fields      Json     // JSON Schema: [{name, type, label, placeholder, required, options?}]
     systemPrompt String  @db.Text  // промпт с {field_name} плейсхолдерами
     defaultModel String  @default("gpt-4o-mini")
     outputFormat String  @default("text") // text | markdown | json
     costRub     Float    @default(3)  // стоимость одной генерации
     isActive    Boolean  @default(true)
     usageCount  Int      @default(0)
     createdAt   DateTime @default(now())
   }

2. Создай сид prisma/seed-wizard-templates.ts с 15 шаблонами (самые востребованные):
   - "Объявление Яндекс Директ" (fields: url, utp, keywords, budget; systemPrompt генерирует 5 заголовков до 56 символов + 3 текста до 81 символа)
   - "Пост для VK" (fields: topic, audience, tone, length)
   - "Пост для Telegram" (fields: topic, style, cta)
   - "Контент-план на месяц" (fields: niche, audience, platforms, postsPerWeek)
   - "SEO-статья" (fields: topic, keywords, length, structure)
   - "Рекламный оффер" (fields: product, audience, pain, benefit)
   - "Email-рассылка" (fields: goal, audience, product, tone)
   - "Карточка товара OZON/WB" (fields: productName, category, features, keywords)
   - "Описание для лендинга" (fields: product, audience, utp, blocks)
   - "Скрипт продаж" (fields: product, objections, price, competitor)
   - "Анализ конкурентов" (fields: myProduct, competitors, criteria)
   - "UTM-ссылка + объявление" (fields: url, source, campaign, adText)
   - "Ответ на отзыв" (fields: review, tone, product)
   - "Описание вакансии" (fields: position, requirements, conditions, company)
   - "Коммерческое предложение" (fields: service, client, price, deadline)

3. Компонент components/templates/TemplateWizard.tsx:
   - Принимает template (WizardTemplate) как prop.
   - Рендерит форму по fields JSON: text input, textarea, select, number.
   - Селектор модели: dropdown с 5-6 моделей (GPT-4o mini, GPT-5, Claude Sonnet, DeepSeek V3, Gemini Flash). Уникальная фишка Stone — выбор модели!
   - Кнопка "Сгенерировать" → проверяет баланс → собирает {field: value} → подставляет в systemPrompt → отправляет в API модели → показывает результат.
   - Результат: в rendered markdown с кнопками "Копировать", "Сохранить в галерею", "Регенерировать", "Попробовать другую модель".

4. Страница app/dashboard/templates/page.tsx:
   - Grid карточек шаблонов с фильтром по категориям.
   - Карточка: иконка, название, описание, категория-бейдж, стоимость, кнопка "Открыть".
   - Клик → app/dashboard/templates/[slug]/page.tsx → рендерит TemplateWizard.

5. API route app/api/templates/generate/route.ts:
   - POST: { templateId, fields: {}, modelId }
   - Подставляет поля в systemPrompt.
   - Если выбран проект — добавляет контекст бренда.
   - Проверяет и списывает баланс (spendBalance).
   - Отправляет запрос к модели.
   - Сохраняет результат в Generation.
   - Инкрементирует usageCount шаблона.
```

### Задача 3.2 — UTM-генератор (бесплатный лид-магнит)

```
Создай бесплатный UTM-генератор как отдельную публичную страницу (SEO-магнит).

1. Страница app/tools/utm-builder/page.tsx (PUBLIC, без авторизации):
   - SEO: title "UTM-генератор онлайн — создать UTM-метку бесплатно | Stone AI"
   - meta description для индексации.

2. Компонент components/tools/UTMBuilder.tsx:
   - Step 1: поле URL страницы (обязательное).
   - Пресеты рекламных систем (кнопки): Google Ads, Яндекс Директ, ВКонтакте, Telegram, MyTarget. При выборе — автозаполнение utm_source и utm_medium.
   - Step 2: поля UTM-параметров:
     * utm_source* (откуда: google, yandex, vk, telegram)
     * utm_medium* (тип: cpc, cpm, email, social)
     * utm_campaign* (название кампании)
     * utm_content (объявление/баннер)
     * utm_term (ключевое слово)
   - Step 3: опции — транслитерация кириллицы (toggle), сокращение ссылки (select: нет / is.gd / clck.ru).
   - Результат: готовая ссылка с кнопкой "Копировать".

3. Справочник динамических переменных:
   - Табы: Google Ads / Яндекс Директ / VK / MyTarget.
   - Таблица: переменная → описание (например: {campaign_id} → ID кампании).
   - Кнопка вставки переменной в соответствующее поле.

4. Сохранение в localStorage:
   - История последних 20 ссылок.
   - Возможность сохранить как "шаблон" (название + значения полей).

5. CTA-банер внизу: "Нужны AI-объявления для этой ссылки? → Создать с помощью AI" — ведёт на /dashboard/templates (или /register для незарегистрированных).

Весь функционал работает на клиенте (никаких API не нужно кроме сокращения ссылок). Для is.gd: fetch('https://is.gd/create.php?format=json&url=...').
```

### Задача 3.3 — Конструктор чат-ботов (MVP)

```
Создай MVP конструктора AI чат-ботов.

Это большая задача — разбей на подзадачи, делай последовательно.

ПОДЗАДАЧА A — Prisma модели:
   model Chatbot {
     id          String   @id @default(cuid())
     userId      String
     name        String
     instructions String  @db.Text  // system prompt
     greeting    String?  // приветственное сообщение
     tone        String   @default("friendly") // formal | semi-formal | friendly
     language    String   @default("ru")
     color       String   @default("#2E86C1") // цвет виджета
     avatarUrl   String?
     isActive    Boolean  @default(true)
     strictMode  Boolean  @default(false) // отвечать только по инструкции
     model       String   @default("gpt-4o-mini")
     costPerMsg  Float    @default(1) // стоимость за сообщение в рублях
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
     user        User     @relation(fields: [userId])
     trainings   ChatbotTraining[]
     conversations ChatbotConversation[]
   }

   model ChatbotTraining {
     id        String   @id @default(cuid())
     chatbotId String
     type      String   // text | qa | url | file
     title     String?
     content   String   @db.Text
     isTrained Boolean  @default(false)
     chatbot   Chatbot  @relation(fields: [chatbotId])
     createdAt DateTime @default(now())
   }

   model ChatbotConversation {
     id         String   @id @default(cuid())
     chatbotId  String
     sessionId  String   // уникальный ID сессии посетителя
     messages   Json     // [{role, content, timestamp}]
     source     String   @default("web") // web | telegram
     chatbot    Chatbot  @relation(fields: [chatbotId])
     createdAt  DateTime @default(now())
     updatedAt  DateTime @updatedAt
   }

ПОДЗАДАЧА B — API routes:
   - app/api/chatbots/route.ts — GET (список), POST (создать)
   - app/api/chatbots/[id]/route.ts — GET, PUT, DELETE
   - app/api/chatbots/[id]/train/route.ts — POST: добавить обучающий материал (text/qa/url). Для URL: fetch страницу, извлеки текст через Readability или cheerio, сохрани в ChatbotTraining.
   - app/api/chatbots/[id]/chat/route.ts — POST: публичный эндпоинт (без auth). Принимает { sessionId, message }. Собирает контекст: instructions + все trainings (isTrained=true) + история сессии → отправляет в AI модель → сохраняет ответ в ChatbotConversation.messages → возвращает ответ. Списывает costPerMsg с баланса владельца бота.
   - app/api/chatbots/[id]/conversations/route.ts — GET: список диалогов (для владельца).

ПОДЗАДАЧА C — Dashboard UI:
   - app/dashboard/chatbots/page.tsx — список ботов, кнопка "Создать чатбота"
   - app/dashboard/chatbots/new/page.tsx — wizard создания (4 шага): тип бота → инструкции → стиль (приветствие, тон, цвет) → запуск
   - app/dashboard/chatbots/[id]/page.tsx — dashboard бота: настройки, обучение, виджет-код, диалоги
   - app/dashboard/chatbots/[id]/train/page.tsx — добавление обучающих данных (4 табы: текст, Q&A, файл, URL)
   - app/dashboard/chatbots/[id]/conversations/page.tsx — список и просмотр диалогов

ПОДЗАДАЧА D — Embeddable виджет:
   - Создай public/chatbot-widget.js — скрипт для встраивания на внешние сайты.
   - Скрипт создаёт iframe с URL: stoneai.ru/widget/chat/[botId]?session=xxx
   - Создай app/widget/chat/[id]/page.tsx — минимальный чат-интерфейс (без навигации Stone AI).
   - Стили виджета: кнопка-bubble в правом нижнем углу, раскрывающийся чат (350x500px).
   - Пользователю показывается код для вставки: <script src="https://stoneai.ru/chatbot-widget.js" data-bot-id="xxx"></script>
```

---

## ФАЗА 4: КОНТЕНТ-ФАБРИКА

### Задача 4.1 — AI-презентации

```
Создай генератор AI-презентаций с экспортом в PDF.

1. API route app/api/presentations/generate/route.ts:
   - POST: { topic, slidesCount (5-30), style (modern|minimal|corporate|creative|bold), audience, detailLevel (short|medium|detailed), language, modelId }
   - Формирует промпт: "Создай презентацию на тему {topic} из {slidesCount} слайдов. Для каждого слайда верни JSON: {title, bullets: [], notes: '', layout: 'title|content|two-column|image-text|quote'}. Аудитория: {audience}."
   - Парсит JSON-ответ модели → сохраняет в Generation.

2. Компонент components/presentations/PresentationPreview.tsx:
   - Рендерит слайды как HTML (16:9 aspect ratio).
   - 10 тем оформления (CSS: цвета, шрифты, layout). Каждая тема — отдельный CSS-файл.
   - Навигация: стрелки влево/вправо, миниатюры слайдов снизу.
   - Номер слайда внизу.

3. Экспорт в PDF:
   - Кнопка "Скачать PDF".
   - На бэкенде: используй Puppeteer (или @sparticuz/chromium для serverless).
   - Рендерит каждый слайд как HTML → скриншот 1920x1080 → собирает в PDF через pdf-lib.
   - API route: app/api/presentations/export/route.ts — POST: { generationId, format: 'pdf' }.

4. Страница app/dashboard/presentations/page.tsx:
   - Форма: тема, кол-во слайдов, стиль (визуальный выбор с превью), аудитория, детализация, язык.
   - Селектор модели (уникальная фишка Stone).
   - Кнопка "Сгенерировать" → показывает PresentationPreview → кнопки экспорта.

Стоимость: от 15₽ за презентацию (проверяй баланс).
```

### Задача 4.2 — SEO-модуль

```
Создай модуль для генерации и анализа SEO-контента.

1. Страница app/dashboard/seo/page.tsx — хаб с 3 инструментами:

   A) Генератор SEO-статей (app/dashboard/seo/article/page.tsx):
      - Форма: тема, основные ключевые слова (textarea, по одному на строку), длина (3000/5000/10000 символов), структура (автоматическая / свой план).
      - Селектор модели.
      - Генерация: системный промпт включает SEO-требования (H2/H3 заголовки, ключевые слова в первом абзаце, FAQ-блок, мета-описание).
      - Результат: рендер в markdown + кнопки "Копировать HTML", "Скачать .md", "Сохранить в галерею".

   B) Анализатор текста (app/dashboard/seo/analyze/page.tsx):
      - Textarea для вставки текста.
      - Кнопка "Анализировать" → отправляет в AI с промптом анализа.
      - Результат: оценка 1-10 по параметрам (релевантность, читабельность, структура, ключевые слова, длина, уникальность формулировок) + конкретные рекомендации.

   C) Мета-теги (app/dashboard/seo/meta/page.tsx):
      - Ввод: URL страницы или описание контента.
      - Генерирует: title (до 60 символов), description (до 160 символов), keywords, Open Graph теги.
      - Показывает превью в поиске Google (как будет выглядеть сниппет).

2. Каждый инструмент списывает с баланса (5₽ за статью, 3₽ за анализ, 2₽ за мета-теги).
```

---

## ФАЗА 5: БРЕНДИНГ И КАНАЛЫ

### Задача 5.1 — Telegram Mini App: генератор картинок

```
Создай Telegram Mini App для генерации картинок.

1. Создай app/tg-app/images/page.tsx:
   - Это отдельная страница, оптимизированная для Telegram WebApp (viewport мобильный).
   - Используй @twa-dev/sdk для интеграции с Telegram.
   - UI: поле ввода промпта → выбор модели (3 варианта: быстрая/качественная/фотореализм) → выбор соотношения сторон (1:1, 16:9, 9:16) → кнопка "Создать".
   - Результат: показывает картинку → кнопки "Скачать", "Поделиться", "Создать ещё".
   - Авторизация через Telegram initData (валидация на сервере).
   - 2 бесплатных генерации в день, затем оплата через Stars или Platega.

2. Зарегистрируй Mini App в BotFather для @drifttt55bot:
   - URL: https://stoneai.ru/tg-app/images
   - Добавь кнопку в меню бота.

Стиль: максимально простой, большие кнопки, минимум текста. Работать должно быстро.
```

### Задача 5.2 — Виджет чата на главной странице

```
Встрой компактный виджет AI-чата прямо в hero-секцию лендинга stoneai.ru.

Сейчас чат доступен только на /webchat. Нужно добавить интерактивный чат-виджет на главную страницу, чтобы пользователь мог задать вопрос не уходя с лендинга.

1. Создай компонент components/landing/HeroChatWidget.tsx:
   - Компактное окно чата (400x350px на десктопе, full-width на мобайле).
   - Модель по умолчанию: GPT-4o mini (бесплатная).
   - Плейсхолдер: "Задайте любой вопрос AI..."
   - Ответ стримится прямо в виджете.
   - Лимит: 3 сообщения без регистрации. После 3-го: "Зарегистрируйтесь для продолжения — 15 запросов/день бесплатно 🎁 +100₽"
   - Считай сообщения в localStorage.

2. Встрой HeroChatWidget в hero-секцию (рядом с текущим демо-блоком чата, или замени его).

3. Стиль: полупрозрачный фон, минимальные рамки, в стиле текущего дизайна. НЕ должен выглядеть как отдельный iframe.
```

---

## ФАЗА 6: ЭКОСИСТЕМА

### Задача 6.1 — Маркетплейс шаблонов (UGC)

```
Расширь систему шаблонов до маркетплейса, где пользователи могут продавать свои шаблоны.

1. Добавь поля в WizardTemplate (или создай отдельную модель MarketplaceTemplate):
   - authorId: String (userId автора)
   - price: Float (в рублях, 0 = бесплатный)
   - isPublished: Boolean @default(false)
   - isPremium: Boolean @default(false)
   - rating: Float? @default(0)
   - reviewCount: Int @default(0)
   - salesCount: Int @default(0)
   - tags: String[]

2. Модель Purchase:
   - id, buyerId, templateId, price, authorEarning (price * 0.7), platformFee (price * 0.3), createdAt.

3. Модель Review:
   - id, userId, templateId, rating (1-5), comment, createdAt.

4. API routes:
   - app/api/marketplace/route.ts — GET: публичный каталог шаблонов (фильтры: category, sort by: popular/new/rating, search).
   - app/api/marketplace/[id]/buy/route.ts — POST: покупка шаблона (списать с баланса покупателя, начислить 70% автору).
   - app/api/marketplace/[id]/review/route.ts — POST: оставить отзыв.
   - app/api/marketplace/publish/route.ts — POST: опубликовать свой шаблон.

5. Страницы:
   - app/marketplace/page.tsx — публичный каталог (красивый grid с карточками, фильтры, поиск).
   - app/dashboard/my-templates/page.tsx — управление своими шаблонами (создать, редактировать, статистика продаж).
   - Редактор шаблона: те же поля что в WizardTemplate + настройка цены + превью.

6. Страница автора: app/marketplace/author/[id]/page.tsx — профиль автора с его шаблонами и рейтингом.
```

### Задача 6.2 — Система ачивок

```
Создай систему достижений (ачивок) для геймификации.

1. Prisma модели:
   model Achievement {
     id          String   @id @default(cuid())
     slug        String   @unique
     title       String
     description String
     icon        String   // emoji
     category    String   // generation | social | streak | milestone
     condition   Json     // { type: 'count', target: 100, metric: 'images_generated' }
     rewardRub   Float    @default(0) // бонус на баланс
   }

   model UserAchievement {
     id            String   @id @default(cuid())
     userId        String
     achievementId String
     progress      Int      @default(0)
     isCompleted   Boolean  @default(false)
     completedAt   DateTime?
     @@unique([userId, achievementId])
   }

2. Сид ачивок (30 штук):
   Генерация: "Первая картинка", "10 картинок", "100 картинок", "Первое видео", "10 видео", "Первый 3D", "Мультиформатник (все типы)", "Полиглот (5+ моделей)"
   Социальные: "Первый реферал", "5 рефералов", "Первый отзыв", "Первый шаблон на маркетплейсе"
   Streak: "3 дня подряд", "7 дней подряд", "30 дней подряд"
   Milestone: "Зарегистрировался", "Первый проект", "Первый чат-бот", "Потратил 1000₽", "Заработал на маркетплейсе"

3. lib/achievements.ts:
   - checkAndUpdate(userId, metric, value): проверяет все ачивки для метрики, обновляет progress, если достигнут target → isCompleted=true, начисляет бонус.
   - Вызывай после каждой генерации, логина (для streak), покупки и т.д.

4. Компонент components/achievements/AchievementToast.tsx:
   - Toast-уведомление при получении ачивки: "🏆 Достижение! Первая картинка (+10₽)"
   - Анимация: fade-in сверху, держится 5 секунд.

5. Страница app/dashboard/achievements/page.tsx:
   - Grid ачивок: полученные (яркие) и заблокированные (серые).
   - Прогресс-бар для незавершённых.
   - Статистика: "12 из 30 получено".
```

---

## ЗАМЕТКИ ДЛЯ CLAUDE CODE

```
ОБЩИЕ ПРАВИЛА для всех задач:
- Используй TypeScript строго.
- Стилизация: Tailwind CSS (уже в проекте).
- Компоненты: React Server Components где возможно, Client Components только когда нужен интерактив (useState, useEffect, onClick).
- API routes: app/api/... с Route Handlers (Next.js 15).
- Авторизация: используй существующую auth-логику проекта (найди и переиспользуй).
- Валидация: zod для входных данных API.
- Error handling: try/catch, возвращай { error: string } с правильными HTTP-кодами.
- НЕ меняй существующий код без необходимости. Только добавляй новое.
- Если нужно модифицировать существующий компонент — сначала покажи что хочешь изменить, я подтвержу.
```
