import { renderPriceDeep } from "@/lib/pricing";

export type FaqCategory = "start" | "generation" | "tools" | "pricing" | "payments" | "features";

export const FAQ_CATEGORIES: { id: FaqCategory; name: string; icon: string }[] = [
  { id: "start",      name: "Начало работы",          icon: "🚀" },
  { id: "generation", name: "Чат, картинки, видео",  icon: "🤖" },
  { id: "tools",      name: "Инструменты",            icon: "🛠" },
  { id: "pricing",    name: "Тарифы",                 icon: "💎" },
  { id: "payments",   name: "Оплата",                 icon: "💳" },
  { id: "features",   name: "Возможности",            icon: "✨" },
];

const _homeFaqData: { q: string; a: string; category: FaqCategory }[] = [
  {
    category: "start",
    q: "Как начать пользоваться Stone AI?",
    a: 'Откройте <a href="/dashboard/chat" class="text-accent hover:underline font-semibold">AI-чат</a> или <a href="/dashboard" class="text-accent hover:underline font-semibold">панель инструментов</a>. 10 бесплатных запросов каждый день к 8 моделям — GPT-4o mini, Claude Haiku 4.5, Gemini 2.0 Flash, DeepSeek V3, Llama 4 Maverick, Mistral Large, Nano Banana и Veo 3 (2 пробных видео). Регистрация не обязательна для чата. Для полного доступа к инструментам создайте аккаунт за 30 секунд через Google, Яндекс или email.',
  },
  {
    category: "start",
    q: "Как зарегистрироваться в Stone AI?",
    a: 'Откройте <a href="/profile" class="text-accent hover:underline font-semibold">страницу входа</a> и выберите один из 4 способов регистрации: <strong>Google</strong> (1 клик), <strong>Яндекс ID</strong> (1 клик), <strong>Email + пароль</strong> (30 секунд — придёт код на почту), <strong>Telegram</strong> (через бота @stonetgbot). После регистрации вы автоматически получаете <strong>100₽ бонуса</strong> на баланс и сразу доступ ко всем бесплатным моделям. Номер телефона и банковская карта при регистрации не требуются. Подписка и пополнение баланса — опционально, уже после того как вы попробуете.',
  },
  {
    category: "tools",
    q: "Что такое панель инструментов и какие инструменты доступны?",
    a: '<a href="/dashboard" class="text-accent hover:underline font-semibold">Панель инструментов</a> — ваш AI-кабинет с 15+ инструментами: <a href="/dashboard/templates" class="text-accent hover:underline">50+ AI-шаблонов</a> для маркетинга, SMM и SEO, <a href="/dashboard/presentations" class="text-accent hover:underline">генератор презентаций</a> с экспортом в PPTX, <a href="/dashboard/photo-session" class="text-accent hover:underline">AI-фотосессия</a> товаров (смена фона, фото на модели, пакетная обработка до 10 фото), <a href="/dashboard/seo" class="text-accent hover:underline">SEO-модуль</a> (статьи, мета-теги, <a href="/dashboard/seo/ab-test" class="text-accent hover:underline">A/B тестирование</a>), <a href="/dashboard/campaigns" class="text-accent hover:underline">генератор рекламных кампаний</a> для Яндекс Директ, <a href="/dashboard/bots" class="text-accent hover:underline">конструктор AI-ботов</a> с базой знаний, <a href="/dashboard/agent" class="text-accent hover:underline">AI-агент</a> для автономных задач, <a href="/dashboard/gallery" class="text-accent hover:underline">галерея генераций</a>, <a href="/dashboard/achievements" class="text-accent hover:underline">достижения</a> и <a href="/dashboard/games" class="text-accent hover:underline">игры</a>.',
  },
  {
    category: "pricing",
    q: "Что входит в подписку: как работают запросы, видео-поинты и лимиты?",
    a: 'Каждый тариф — это месячный пул лимитов, которые тратятся как «валюта» за использование моделей.<br><br><strong>Быстрые запросы (fast)</strong> — лимит для простых моделей: GPT-4o mini, Claude Haiku, Gemini Flash, DeepSeek V3, Mistral Small. 1 сообщение = 1 быстрый запрос. На Start их 600/мес (~20/день), Pro — 1 500/мес (~50/день), Elite — 4 500/мес (~150/день).<br><br><strong>Премиум-запросы</strong> — лимит для флагманских моделей: GPT-5.1/5.4, Claude Sonnet 4.5, Gemini 3 Pro, Grok 3. Одно сообщение тратит 1 единицу. Start — 150/мес, Pro — 112/мес, Elite — 336/мес.<br><br><strong>Opus-запросы</strong> — отдельный счётчик для Claude Opus 4.5 (самая мощная модель). Один запрос к Opus тратит <strong>5 единиц</strong> из opus-счётчика (коэффициент веса ×5). Pro — 28 Opus-запросов в мес, Elite — 56. На Start Opus недоступен.<br><br><strong>Картинки</strong> — отдельный счётчик. Start включает Nano Banana и GPT-5 Image Mini. Pro/Elite открывают GPT-5 Image, Nano Banana Pro и остальные pro image-модели. Start — 60/мес, Pro — 140/мес, Elite — 280/мес.<br><br><strong>Видео-поинты</strong> — гибкая валюта для видео. Разные модели и форматы стоят разного: короткий клип Kling 720P/5сек ≈ 1 поинт; Veo 3.1 Standard/8сек ≈ 3 поинта; Sora 2 Premium 1080P/10сек с audio ≈ 8-10 поинтов. Start — 13 поинтов (≈6-10 видео), Pro — 33 (≈15-25 видео), Elite — 80 (≈40-60 видео). Точная стоимость показывается перед каждой генерацией.<br><br><strong>Озвучка (TTS/STT)</strong> — отдельный счётчик. 1 запрос = до 4096 символов текста (~2 минуты аудио). Start — 3/мес (STT отсутствует), Pro — 20/мес + голосовой ассистент, Elite — 100/мес.<br><br><strong>Что безлимитно на любом платном тарифе:</strong> история чатов, проекты, стрики, достижения, игры, переключение моделей, экспорт, собственные боты (до 20), AI-агент, A/B-тесты.<br><br>Неиспользованные лимиты частично переносятся на следующий месяц (rollover). Полная таблица — на <a href="/pricing" class="text-accent hover:underline font-semibold">странице тарифов</a>.',
  },
  {
    category: "pricing",
    q: "Сколько стоят инструменты и подписка?",
    a: '4 предложения на <a href="/pricing" class="text-accent hover:underline font-semibold">странице цен</a>: <strong>Pay-per-Use (без подписки)</strong> — 10 чат-запросов/день, 7 моделей, 2 пробных видео-поинта; инструменты оплачиваются с баланса (шаблоны от 3₽, презентации 40₽, SEO 15₽). Баланс можно перенести в подписку. <strong>Start ({{price_mini_full}})</strong> — 20+ моделей, 600 быстрых + 150 премиум запросов/мес, 60 картинок, 13 видео-поинтов + триалы. <strong>Pro ({{price_max_full}})</strong> — все 65+ нейросетей вкл. Opus, 1 500 + 112 запросов, 140 картинок, 33 видео-поинта (Opus считается ×5). <strong>Elite ({{price_elite_full}})</strong> — 4 500 запросов, 80 видео-поинтов, API, приоритет. Бонус 100₽ при регистрации.',
  },
  {
    category: "payments",
    q: "Какие способы оплаты поддерживаются?",
    a: '4 способа оплаты: <strong>Карты РФ и СБП</strong> (Мир, Visa, Mastercard) через Platega — самый популярный способ. <strong>Криптовалюта</strong> (USDT, BTC, ETH, SOL) через Heleket — без KYC. <strong>TON Connect</strong> через Tonkeeper — нативно в Telegram. <strong>Telegram Stars</strong> — в боте @stonetgbot. Все цены в рублях, без VPN, без иностранных карт. Пополнение баланса от 100₽ на <a href="/topup" class="text-accent hover:underline font-semibold">странице пополнения</a>.',
  },
  {
    category: "pricing",
    q: "Какие модели доступны бесплатно?",
    a: 'Бесплатно 8 моделей: GPT-4o mini (OpenAI), Claude Haiku 4.5 (Anthropic), Gemini 2.0 Flash (Google), DeepSeek V3, Llama 4 Maverick (Meta), Mistral Large, Nano Banana (картинки), Veo 3 (2 пробных видео). 10 чат-запросов + 2 премиум в день — баланс не тратится. Плюс пробные видео-поинты: 2 поинта на любое видео навсегда. Инструменты (шаблоны, презентации, SEO, кампании) — с баланса, бонус 100₽ при регистрации. Полный список 65+ нейросетей — на <a href="/models" class="text-accent hover:underline font-semibold">странице моделей</a>.',
  },
  {
    category: "start",
    q: "Чем Stone AI отличается от ChatGPT Plus?",
    a: 'ChatGPT Plus стоит $20/мес (~1800₽) и даёт доступ только к моделям OpenAI. <a href="/pricing" class="text-accent hover:underline font-semibold">Stone AI Pro за {{price_max_full}}</a> — это 65+ нейросетей от 15 компаний: OpenAI, Anthropic, Google, Meta, xAI, DeepSeek, Mistral, Perplexity и других. Плюс инструменты которых нет в ChatGPT: <a href="/dashboard/campaigns" class="text-accent hover:underline">генератор рекламных кампаний</a>, <a href="/dashboard/photo-session" class="text-accent hover:underline">AI-фотосессия</a>, <a href="/dashboard/presentations" class="text-accent hover:underline">презентации с PPTX</a>, <a href="/dashboard/bots" class="text-accent hover:underline">конструктор ботов</a> с базой знаний. Подробное сравнение — в <a href="/blog/stone-ai-vs-chatgpt-plus" class="text-accent hover:underline">статье блога</a>.',
  },
  {
    category: "tools",
    q: "Как создать AI-бота с базой знаний?",
    a: 'Откройте <a href="/dashboard/bots" class="text-accent hover:underline font-semibold">конструктор ботов</a>. Нажмите «Создать», задайте имя, системный промпт (инструкции для бота), выберите модель и emoji-аватар. Загрузите документы в базу знаний (PDF, TXT, MD до 10 МБ) — бот будет отвечать на основе ваших данных через RAG-технологию. Бота можно сделать публичным, подключить к <a href="/chatbot" class="text-accent hover:underline">Telegram через BotFather</a> или встроить на сайт через виджет (<code>&lt;script src="https://stoneai.ru/widget.js" data-bot-id="ID"&gt;</code>). Максимум 20 ботов на аккаунт.',
  },
  {
    category: "tools",
    q: "Как работает AI-агент?",
    a: '<a href="/dashboard/agent" class="text-accent hover:underline font-semibold">AI-агент</a> автономно выполняет сложные задачи, разбивая их на 3-10 шагов. Опишите задачу — например «Проанализируй рынок AI-сервисов в России и составь отчёт» или «Напиши контент-план на месяц для Telegram-канала» — агент выполнит каждый шаг и покажет результат в реальном времени. Стоимость ~0.5₽ за шаг. Прогресс отслеживается визуально с цветными индикаторами.',
  },
  {
    category: "tools",
    q: "Как создать рекламную кампанию для Яндекс Директ?",
    a: 'Откройте <a href="/dashboard/campaigns" class="text-accent hover:underline font-semibold">генератор кампаний</a>. Введите нишу (например «Доставка цветов в Москве»), URL сайта, бюджет и регион. AI за 2-3 минуты создаст: анализ ниши и ЦА, 50-80 ключевых слов с оценкой частотности Wordstat и CPC, 5-10 рекламных групп, 100-200 минус-слов, объявления с заголовками (до 35 символов) и текстами (до 81 символ), рекомендации по оптимизации. Результат экспортируется в XLSX для загрузки в Яндекс Коммандер. После генерации доступны 8 AI-пресетов улучшения объявлений (📈CTR, 🎯CTA, 💪Оффер и др.) по 3₽ за клик. Стоимость кампании — 29₽. <a href="/yandex-direct" class="text-accent hover:underline">Подробнее →</a>',
  },
  {
    category: "tools",
    q: "Как создать AI-презентацию и экспортировать в PowerPoint?",
    a: 'Откройте <a href="/dashboard/presentations" class="text-accent hover:underline font-semibold">генератор презентаций</a>. Введите тему, выберите стиль оформления (6 тем: Modern, Minimal, Corporate, Creative, Bold, Dark), количество слайдов (3-30), аудиторию и уровень детализации. AI сгенерирует презентацию за 30 секунд. Каждый слайд можно редактировать. Экспорт в <strong>PPTX</strong> (PowerPoint) и <strong>PDF</strong>. Поддерживаются layouts: титульный, контентный, цитата, две колонки с изображением. Стоимость от 40₽. <a href="/presentations" class="text-accent hover:underline">Подробнее →</a>',
  },
  {
    category: "tools",
    q: "Как работает AI-фотосессия товаров?",
    a: '<a href="/dashboard/photo-session" class="text-accent hover:underline font-semibold">AI-фотосессия</a> — 4 режима: <strong>Смена фона (15₽)</strong> — загрузите фото товара, выберите пресет фона или опишите свой. <strong>Фото на модели (40₽)</strong> — AI поместит товар на модель. <strong>Карточка маркетплейса (20₽)</strong> — готовые форматы для OZON (1000×1000), Wildberries (900×1200), Avito. <strong>Пакетная обработка</strong> — до 10 фото одним запросом с единым фоном. Также можно <a href="/dashboard/seo/article" class="text-accent hover:underline">публиковать результаты в WordPress</a> через встроенную интеграцию.',
  },
  {
    category: "features",
    q: "Можно ли экспортировать презентации в PowerPoint?",
    a: 'Да! После генерации <a href="/dashboard/presentations" class="text-accent hover:underline font-semibold">презентации</a> нажмите «Скачать PPTX» — файл скачается в формате PowerPoint (.pptx) с правильными темами, цветами, шрифтами и форматированием. Также доступен экспорт в PDF через печать браузера. Поддерживаются все 6 тем оформления, 16:9 widescreen формат.',
  },
  {
    category: "features",
    q: "Как работают достижения, игры и бонусы?",
    a: 'В разделе <a href="/dashboard/achievements" class="text-accent hover:underline font-semibold">достижения</a> отслеживается прогресс использования платформы — 15+ ачивок за генерации, картинки, видео, стрики и другие действия. Геймификация мотивирует изучать все инструменты. В разделе <a href="/dashboard/games" class="text-accent hover:underline font-semibold">игры</a> — Змейка и 2048 с таблицей лидеров. Игры также появляются во время ожидания генерации видео/картинок.',
  },
  {
    category: "features",
    q: "Есть ли A/B тестирование текстов?",
    a: 'Да! <a href="/dashboard/seo/ab-test" class="text-accent hover:underline font-semibold">A/B тестирование</a> генерирует 3 варианта текста по вашему запросу: эмоциональный, экспертный и прямолинейный. AI оценивает каждый от 1 до 10 с комментарием и автоматически выбирает лучший. Вы можете скопировать любой вариант или выбрать победителя вручную. Находится в разделе <a href="/dashboard/seo" class="text-accent hover:underline">SEO-инструменты</a>.',
  },
  {
    category: "generation",
    q: "Как работает AI-чат и как выбрать модель?",
    a: 'В <a href="/dashboard/chat" class="text-accent hover:underline font-semibold">AI-чате</a> доступны все 45+ текстовых моделей: <strong>GPT-5.1, GPT-5.4</strong> (OpenAI), <strong>Claude Opus 4.5, Sonnet 4.5, Haiku 4.5</strong> (Anthropic), <strong>Gemini 3 Pro, 2.5 Pro</strong> (Google), <strong>DeepSeek R1, V3</strong>, <strong>Grok 3</strong>, <strong>Llama 4</strong>, <strong>Mistral Large</strong> и другие. Переключение моделей — один клик в выпадающем списке. Ответы идут <strong>стримингом</strong> (по словам), поддерживается <strong>DualChat</strong> — задаёте один вопрос и видите ответы 2 моделей параллельно для сравнения. История чатов сохраняется для каждой модели отдельно, можно закрепить чат, переименовать, удалить.',
  },
  {
    category: "generation",
    q: "Как генерировать картинки и какие модели для этого есть?",
    a: 'Генерация картинок доступна прямо в <a href="/dashboard/chat" class="text-accent hover:underline font-semibold">AI-чате</a> — переключите модель на image и опишите картинку текстом. <strong>6 моделей:</strong> <strong>Nano Banana Pro</strong> (фотореализм и редактирование существующих фото), <strong>GPT-5 Image</strong> (отлично работает с текстом на картинке), <strong>Flux 1.1 Pro / Schnell</strong> (быстрая и художественная), <strong>Midjourney V7</strong> (арт-стиль), <strong>SDXL</strong> (разные стили от фотореализма до аниме). Бесплатно — 2 пробные картинки при регистрации. В подписке Start — 60/мес, Pro — 140/мес, Elite — 280/мес. <a href="/blog/generate-images-ai-free" class="text-accent hover:underline">Гайд по генерации картинок →</a>',
  },
  {
    category: "generation",
    q: "Можно ли генерировать видео через нейросеть?",
    a: 'Да, доступны лучшие video-модели 2026. <strong>Sora 2</strong> (OpenAI) — до 10 секунд, фотореализм. <strong>Veo 3.1</strong> (Google) — быстрая генерация, стабильная физика. <strong>Kling v2</strong> — 5-10 сек, хорошая детализация. <strong>Luma Ray 2</strong>, <strong>Runway Gen-3</strong>, <strong>Pika 2</strong>, <strong>MiniMax</strong> — для разных стилей. Каждое видео тратит видео-поинты: короткие клипы 1-3 поинта, премиум 1080P/10 сек — 5-10 поинтов. Бесплатно — 2 пробных поинта навсегда. В Start — 13 поинтов + триалы, Pro — 33 поинта, Elite — 80 поинтов в месяц.',
  },
  {
    category: "generation",
    q: "Есть ли озвучка текста (TTS) и распознавание речи (STT)?",
    a: 'Да, оба направления. <strong>TTS (озвучка текста):</strong> 9 голосов OpenAI — Alloy (нейтральный), Echo (глубокий), Nova (мягкий), Shimmer (тёплый), Onyx (низкий), Fable (выразительный) и другие. Работает на русском и 50+ языках, до 4096 символов (~2 минуты аудио) за запрос. <strong>STT (речь в текст):</strong> нажмите микрофон в чате — Whisper AI переведёт до 30 секунд речи в текст за секунду. Лимиты: Start — 3 озвучки/мес, Pro — 20/мес, Elite — 100/мес. Голосовой ассистент включён в Pro и Elite.',
  },
  {
    category: "tools",
    q: "Можно ли встроить AI-бота на свой сайт?",
    a: 'Да! Создайте публичного бота в <a href="/dashboard/bots" class="text-accent hover:underline font-semibold">конструкторе ботов</a>, нажмите «Виджет» — код скопируется в буфер. Вставьте перед &lt;/body&gt; на вашем сайте: <code>&lt;script src="https://stoneai.ru/widget.js" data-bot-id="ID"&gt;&lt;/script&gt;</code>. Настройки через атрибуты: <code>data-color</code> (цвет кнопки), <code>data-position</code> (left/right), <code>data-text</code> (текст кнопки). Работает на WordPress, Tilda, Bitrix, любом HTML-сайте. Также можно подключить бота к Telegram через токен @BotFather.',
  },
];

/* renderPrice re-exports */
export const homeFaqData: typeof _homeFaqData = renderPriceDeep(_homeFaqData);
