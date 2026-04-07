/**
 * SEO programmatic data — comparisons, alternatives, professions.
 * Used to generate static pages for search engine traffic.
 */

// ─── Comparisons ───

export interface Comparison {
  slug: string;            // URL slug: "gpt-5-vs-claude-4"
  model1: string;          // model id from MODELS
  model2: string;
  title: string;           // SEO title
  description: string;     // meta description
  h1: string;
  verdict: string;         // short verdict text
  useCases: { model1: string[]; model2: string[] }; // best for
}

export const COMPARISONS: Comparison[] = [
  // ─── Flagship vs Flagship ───
  {
    slug: "gpt-5-vs-claude-opus-4",
    model1: "gpt-5.1", model2: "claude-opus-4",
    title: "GPT-5 vs Claude Opus 4: сравнение моделей 2026",
    description: "Подробное сравнение GPT-5.1 и Claude Opus 4 — тесты, цены, скорость, качество кода и текста. Какую модель выбрать?",
    h1: "GPT-5 vs Claude Opus 4 — какая модель лучше в 2026?",
    verdict: "GPT-5.1 быстрее и дешевле. Claude Opus 4 точнее в сложном коде и длинных рассуждениях. Для повседневных задач — GPT-5, для программирования — Opus.",
    useCases: { model1: ["Быстрые ответы", "Мультимодальность", "Генерация контента"], model2: ["Код и рефакторинг", "Глубокий анализ", "Длинные документы"] },
  },
  {
    slug: "gpt-5-vs-gemini-3-pro",
    model1: "gpt-5.1", model2: "gemini-3-pro",
    title: "GPT-5 vs Gemini 3 Pro: какую модель выбрать в 2026",
    description: "Сравнение GPT-5.1 от OpenAI и Gemini 3 Pro от Google. Тесты производительности, цены, контекстное окно, мультимодальность.",
    h1: "GPT-5 vs Gemini 3 Pro — детальное сравнение 2026",
    verdict: "Gemini 3 Pro выигрывает в контекстном окне (1M токенов) и мультимодальности. GPT-5 сильнее в генерации текста и креативных задачах.",
    useCases: { model1: ["Копирайтинг", "Креатив", "Чат-боты"], model2: ["Анализ документов", "Мультимодальный ввод", "Длинный контекст"] },
  },
  {
    slug: "claude-opus-4-vs-gemini-3-pro",
    model1: "claude-opus-4", model2: "gemini-3-pro",
    title: "Claude Opus 4 vs Gemini 3 Pro: сравнение 2026",
    description: "Anthropic Claude Opus 4 против Google Gemini 3 Pro. Код, рассуждения, цена, скорость. Подробное сравнение с примерами.",
    h1: "Claude Opus 4 vs Gemini 3 Pro — кто лучше?",
    verdict: "Claude Opus 4 — лучший для кода и точных рассуждений. Gemini 3 Pro — для работы с большими данными и мультимодальных задач.",
    useCases: { model1: ["Программирование", "Точные ответы", "Безопасность"], model2: ["Большие данные", "Видео/аудио анализ", "1M контекст"] },
  },
  // ─── Mid-range ───
  {
    slug: "gpt-4o-mini-vs-claude-haiku",
    model1: "gpt-4o-mini", model2: "claude-haiku-4.5",
    title: "GPT-4o mini vs Claude Haiku 4.5: бесплатные модели 2026",
    description: "Сравнение лучших бесплатных AI моделей. GPT-4o mini от OpenAI vs Claude Haiku 4.5 от Anthropic — скорость, качество, лимиты.",
    h1: "GPT-4o mini vs Claude Haiku 4.5 — лучшая бесплатная модель",
    verdict: "Обе бесплатны в Stone AI. GPT-4o mini быстрее отвечает. Claude Haiku точнее в нюансах и безопаснее. Для скорости — GPT, для качества — Haiku.",
    useCases: { model1: ["Быстрые ответы", "Простые задачи", "Чат"], model2: ["Точные ответы", "Анализ текста", "Безопасность"] },
  },
  {
    slug: "deepseek-r1-vs-gpt-4",
    model1: "deepseek-r1", model2: "gpt-4.1",
    title: "DeepSeek R1 vs GPT-4.1: reasoning модели 2026",
    description: "DeepSeek R1 — бесплатная reasoning модель против GPT-4.1. Математика, логика, код. Стоит ли платить за GPT?",
    h1: "DeepSeek R1 vs GPT-4.1 — нужно ли платить за GPT?",
    verdict: "DeepSeek R1 сопоставим с GPT-4.1 в математике и логике, но в 6 раз дешевле. GPT-4.1 лучше в мультимодальности и следовании инструкциям.",
    useCases: { model1: ["Математика", "Логика", "Reasoning"], model2: ["Инструкции", "Мультимодальность", "Контекст 1M"] },
  },
  {
    slug: "claude-sonnet-4-vs-gpt-4-1-mini",
    model1: "claude-sonnet-4", model2: "gpt-4.1-mini",
    title: "Claude Sonnet 4 vs GPT-4.1 mini: средний класс AI 2026",
    description: "Сравнение доступных премиум-моделей. Claude Sonnet 4 от Anthropic vs GPT-4.1 mini от OpenAI. Цена, скорость, качество.",
    h1: "Claude Sonnet 4 vs GPT-4.1 mini — что выбрать?",
    verdict: "GPT-4.1 mini в 6 раз дешевле при сопоставимом качестве для простых задач. Claude Sonnet 4 значительно лучше для кода и длинных текстов.",
    useCases: { model1: ["Код", "Длинные тексты", "Анализ"], model2: ["Экономия", "Быстрые ответы", "Простые задачи"] },
  },
  // ─── Image models ───
  {
    slug: "nano-banana-vs-gpt-5-image",
    model1: "nano-banana", model2: "gpt-5-image",
    title: "Nano Banana vs GPT-5 Image: генерация картинок 2026",
    description: "Бесплатная Nano Banana (Gemini) vs платная GPT-5 Image от OpenAI. Качество, стили, скорость генерации изображений.",
    h1: "Nano Banana vs GPT-5 Image — какая нейросеть рисует лучше?",
    verdict: "Nano Banana бесплатна и хороша для быстрых иллюстраций. GPT-5 Image даёт фотореалистичное качество и точнее следует промптам.",
    useCases: { model1: ["Бесплатные картинки", "Быстрые иллюстрации", "Мемы"], model2: ["Фотореализм", "Маркетинг", "Продуктовые фото"] },
  },
  // ─── Platform comparisons ───
  {
    slug: "stone-ai-vs-chatgpt-plus",
    model1: "gpt-5.1", model2: "gpt-4o-mini",
    title: "Stone AI vs ChatGPT Plus: сравнение подписок 2026",
    description: "Stone AI от 390₽/мес с 65+ моделями vs ChatGPT Plus за $20/мес с одним GPT. Полное сравнение цен, моделей, функций.",
    h1: "Stone AI vs ChatGPT Plus — почему платить меньше за большее?",
    verdict: "Stone AI: 65+ моделей (GPT, Claude, Gemini, Llama и др.) от 390₽/мес. ChatGPT Plus: только модели OpenAI за $20/мес (~1900₽). Stone AI выгоднее в 5 раз, даёт доступ ко всем провайдерам, генерацию картинок, видео, SEO-инструменты — всё в одном.",
    useCases: { model1: ["65+ моделей от всех провайдеров", "От 390₽/мес (в 5 раз дешевле)", "Картинки, видео, 3D, SEO", "Работает без VPN из России", "Telegram-бот + веб-чат"], model2: ["Только модели OpenAI", "$20/мес (~1900₽)", "Нет генерации видео", "Нужен VPN из России", "Только веб-интерфейс"] },
  },
  {
    slug: "stone-ai-vs-perplexity",
    model1: "perplexity-sonar-pro", model2: "perplexity-sonar",
    title: "Stone AI vs Perplexity: AI поиск и чат 2026",
    description: "Stone AI с 65+ моделями и AI-поиском vs Perplexity. Сравнение функций, цен, и возможностей для продуктивности.",
    h1: "Stone AI vs Perplexity — что лучше для работы?",
    verdict: "Perplexity — специализированный AI-поиск с цитированием. Stone AI — полная AI-студия: 65+ моделей для чата, картинки, видео, SEO-инструменты, агент. Perplexity Sonar доступен внутри Stone AI как одна из 65+ моделей. Stone AI универсальнее и дешевле.",
    useCases: { model1: ["65+ моделей + Perplexity Sonar", "Чат + картинки + видео + SEO", "От 390₽/мес за всё", "Без VPN из России"], model2: ["Только поиск в интернете", "Цитирование источников", "$20/мес за Pro", "Нет генерации контента"] },
  },
  {
    slug: "gemini-2-5-flash-vs-gpt-4o-mini",
    model1: "gemini-2.5-flash", model2: "gpt-4o-mini",
    title: "Gemini 2.5 Flash vs GPT-4o mini: быстрые модели 2026",
    description: "Две самые популярные быстрые модели. Gemini 2.5 Flash от Google vs GPT-4o mini от OpenAI. Скорость, контекст, цена.",
    h1: "Gemini 2.5 Flash vs GPT-4o mini — кто быстрее и лучше?",
    verdict: "Gemini 2.5 Flash: контекст 1M, thinking mode, дешевле. GPT-4o mini: стабильнее, лучше на русском. Для длинных текстов — Gemini, для чата — GPT.",
    useCases: { model1: ["1M контекст", "Thinking mode", "Документы"], model2: ["Русский язык", "Стабильность", "Чат"] },
  },
  {
    slug: "llama-4-vs-gpt-4o-mini",
    model1: "llama-4-maverick", model2: "gpt-4o-mini",
    title: "Llama 4 Maverick vs GPT-4o mini: open-source vs проприетарный",
    description: "Meta Llama 4 Maverick (400B, open-source) vs OpenAI GPT-4o mini. Стоит ли переходить на открытую модель?",
    h1: "Llama 4 vs GPT-4o mini — open-source побеждает?",
    verdict: "Llama 4 Maverick: 400B параметров, 1M контекст, бесплатна в Stone AI. GPT-4o mini проще и стабильнее. Llama впечатляет масштабом.",
    useCases: { model1: ["1M контекст", "Open-source", "Масштаб 400B"], model2: ["Стабильность", "Простота", "Русский язык"] },
  },
  {
    slug: "grok-3-vs-gpt-5",
    model1: "grok-3", model2: "gpt-5.1",
    title: "Grok 3 vs GPT-5: xAI против OpenAI 2026",
    description: "Grok 3 от Илона Маска (xAI) vs GPT-5.1 от OpenAI. Креативность, юмор, точность. Подробное сравнение.",
    h1: "Grok 3 vs GPT-5 — модель Маска против OpenAI",
    verdict: "Grok 3 креативнее и смелее в ответах. GPT-5 точнее и универсальнее. Для творчества — Grok, для работы — GPT.",
    useCases: { model1: ["Креатив", "Юмор", "Нестандартные ответы"], model2: ["Точность", "Универсальность", "Мультимодальность"] },
  },
];

// ─── Alternatives ───

export interface Alternative {
  slug: string;
  service: string;     // what service these are alternatives to
  title: string;
  description: string;
  h1: string;
  intro: string;
  reasons: string[];   // why look for alternatives
  models: string[];    // model ids from MODELS to recommend
}

export const ALTERNATIVES: Alternative[] = [
  {
    slug: "chatgpt",
    service: "ChatGPT",
    title: "Альтернативы ChatGPT в России 2026 — ТОП-10 нейросетей",
    description: "Лучшие альтернативы ChatGPT для России. Без VPN, на русском языке, дешевле. Stone AI, Claude, Gemini и другие.",
    h1: "Альтернативы ChatGPT в России — 10 лучших в 2026",
    intro: "ChatGPT Plus стоит $20/мес (~1900₽) и периодически недоступен из России. Мы собрали лучшие альтернативы которые работают без VPN, поддерживают русский язык и стоят дешевле.",
    reasons: ["Блокировка в России — нужен VPN", "Цена $20/мес — дорого", "Только модели OpenAI — нет выбора", "Нет генерации видео и 3D"],
    models: ["gpt-4o-mini", "claude-sonnet-4", "gemini-2.5-flash", "deepseek-r1", "llama-4-maverick", "grok-3"],
  },
  {
    slug: "midjourney",
    service: "Midjourney",
    title: "Альтернативы Midjourney 2026 — бесплатные нейросети для картинок",
    description: "Лучшие альтернативы Midjourney для генерации изображений. Бесплатные варианты, без Discord, на русском языке.",
    h1: "Альтернативы Midjourney — генерация картинок без Discord",
    intro: "Midjourney требует Discord и стоит от $10/мес. Мы нашли альтернативы которые работают в браузере, поддерживают русские промпты и доступны бесплатно.",
    reasons: ["Нужен Discord", "Платная ($10-60/мес)", "Нет русского интерфейса", "Медленная генерация"],
    models: ["nano-banana", "nano-banana-pro", "gpt-5-image", "gpt-5-image-mini"],
  },
  {
    slug: "sora",
    service: "Sora (OpenAI)",
    title: "Альтернативы Sora 2026 — генерация видео нейросетью",
    description: "Лучшие альтернативы OpenAI Sora для генерации видео. Veo 3, Luma Ray 2, Pika 2 и другие доступные модели.",
    h1: "Альтернативы Sora — генерация видео AI в 2026",
    intro: "Sora от OpenAI ограничена по доступу и дорогая. В Stone AI доступны 12+ видео-моделей включая Veo 3, Luma Ray 2, MiniMax — дешевле и без ограничений.",
    reasons: ["Ограниченный доступ", "Высокая цена", "Очереди на генерацию", "Нет в России"],
    models: ["gpt-4o-mini"],  // will show video models separately
  },
  {
    slug: "claude",
    service: "Claude (Anthropic)",
    title: "Альтернативы Claude 2026 — аналоги Anthropic AI",
    description: "Лучшие альтернативы Claude от Anthropic. GPT-5, Gemini 3, DeepSeek R1 и другие модели для кода и анализа.",
    h1: "Альтернативы Claude — что выбрать вместо Anthropic?",
    intro: "Claude Pro стоит $20/мес и ограничен в количестве запросов. В Stone AI Claude доступен наряду с 64 другими моделями от 390₽/мес.",
    reasons: ["Дорогая подписка $20/мес", "Лимиты на Opus", "Нет генерации картинок", "Только текст и код"],
    models: ["gpt-5.1", "gemini-3-pro", "deepseek-r1", "grok-3", "llama-4-maverick"],
  },
  {
    slug: "gemini",
    service: "Google Gemini",
    title: "Альтернативы Google Gemini 2026 — лучшие AI модели",
    description: "Лучшие альтернативы Google Gemini. Claude, GPT-5, DeepSeek и другие модели для работы и учёбы.",
    h1: "Альтернативы Google Gemini — ТОП моделей 2026",
    intro: "Gemini Advanced стоит $20/мес и привязан к экосистеме Google. В Stone AI вы получаете доступ к Gemini + 64 другим моделям от 390₽/мес.",
    reasons: ["Привязка к Google", "Дорогая ($20/мес)", "Ограниченные инструменты", "Нет видео-генерации"],
    models: ["claude-opus-4", "gpt-5.1", "deepseek-r1", "grok-3", "llama-4-maverick"],
  },
  {
    slug: "perplexity",
    service: "Perplexity AI",
    title: "Альтернативы Perplexity 2026 — AI поиск в интернете",
    description: "Альтернативы Perplexity AI для поиска в интернете. Stone AI с Perplexity Sonar + 65 другими моделями.",
    h1: "Альтернативы Perplexity — AI поиск без ограничений",
    intro: "Perplexity Pro стоит $20/мес. В Stone AI Perplexity Sonar доступен наряду с 64 другими моделями — чат, картинки, видео, SEO.",
    reasons: ["Только поиск", "Нет генерации контента", "Дорогая ($20/мес)", "Ограниченные модели"],
    models: ["perplexity-sonar", "perplexity-sonar-pro", "gpt-5.1", "claude-sonnet-4"],
  },
];

// ─── Professions ───

export interface Profession {
  slug: string;
  role: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  tasks: { icon: string; name: string; description: string; models: string[] }[];
  prompts: { title: string; prompt: string }[];
}

export const PROFESSIONS: Profession[] = [
  {
    slug: "marketer",
    role: "Маркетолог",
    title: "AI для маркетолога 2026 — нейросети для маркетинга",
    description: "Лучшие AI инструменты для маркетолога. Генерация контента, SEO-тексты, рекламные кампании, аналитика — всё в одном.",
    h1: "AI для маркетолога — автоматизация маркетинга нейросетью",
    intro: "AI заменяет рутину маркетолога: генерация постов, SEO-статьи, анализ конкурентов, рекламные кампании. Stone AI даёт доступ к 65+ нейросетям для всех задач маркетинга.",
    tasks: [
      { icon: "✍️", name: "Контент-маркетинг", description: "Посты для соцсетей, email-рассылки, лендинги", models: ["gpt-5.1", "claude-sonnet-4", "gemini-2.5-flash"] },
      { icon: "🔍", name: "SEO", description: "Ключевые слова, мета-теги, SEO-статьи, анализ конкурентов", models: ["gpt-4.1", "deepseek-r1"] },
      { icon: "📊", name: "Аналитика", description: "Анализ данных, отчёты, прогнозирование", models: ["deepseek-r1", "o4-mini"] },
      { icon: "🎨", name: "Визуал", description: "Баннеры, карточки товаров, фото для соцсетей", models: ["nano-banana", "gpt-5-image"] },
      { icon: "📹", name: "Видео-контент", description: "Промо-ролики, Reels, Stories", models: ["gpt-4o-mini"] },
    ],
    prompts: [
      { title: "SMM-пост", prompt: "Напиши пост для Instagram о [продукт]. Тон: дружелюбный. Добавь 5 хэштегов и призыв к действию." },
      { title: "SEO-статья", prompt: "Напиши SEO-статью на тему [тема] на 2000 слов. Используй ключевые слова: [ключи]. Структура: H2 заголовки, списки, FAQ." },
      { title: "Рекламный текст", prompt: "Напиши 5 вариантов рекламного текста для Яндекс.Директ. Продукт: [продукт]. Заголовок до 35 символов, текст до 81 символа." },
    ],
  },
  {
    slug: "developer",
    role: "Программист",
    title: "AI для программиста 2026 — нейросети для разработки",
    description: "Лучшие AI модели для программирования. Код, code review, дебаг, архитектура — Claude Opus, GPT-5, Devstral.",
    h1: "AI для программиста — ускорение разработки в 10 раз",
    intro: "AI-ассистент для программиста: генерация кода, рефакторинг, дебаг, документация. Claude Opus 4 и Devstral — лучшие модели для кода.",
    tasks: [
      { icon: "💻", name: "Генерация кода", description: "Функции, компоненты, API-эндпоинты на любом языке", models: ["claude-opus-4", "gpt-5.1", "devstral"] },
      { icon: "🔍", name: "Code Review", description: "Анализ кода, поиск багов, рекомендации", models: ["claude-opus-4", "deepseek-r1"] },
      { icon: "🐛", name: "Дебаг", description: "Поиск и исправление ошибок по стек-трейсу", models: ["claude-sonnet-4", "gpt-4.1"] },
      { icon: "📖", name: "Документация", description: "README, JSDoc, API-документация", models: ["gpt-4o-mini", "claude-haiku-4.5"] },
      { icon: "🏗️", name: "Архитектура", description: "Проектирование систем, выбор стека, миграции", models: ["claude-opus-4", "o3"] },
    ],
    prompts: [
      { title: "REST API", prompt: "Напиши REST API на FastAPI для [сущность]. Endpoints: CRUD + поиск. Используй SQLAlchemy async, Pydantic models." },
      { title: "React компонент", prompt: "Создай React компонент [название] с TypeScript. Props: [описание]. Используй Tailwind CSS, hooks." },
      { title: "Code Review", prompt: "Сделай code review этого кода. Найди баги, проблемы с производительностью, нарушения best practices:\n\n[код]" },
    ],
  },
  {
    slug: "copywriter",
    role: "Копирайтер",
    title: "AI для копирайтера 2026 — нейросети для написания текстов",
    description: "Лучшие нейросети для копирайтера. Статьи, посты, рекламные тексты, рерайт — быстро и качественно.",
    h1: "AI для копирайтера — пишите в 5 раз быстрее",
    intro: "AI не заменяет копирайтера, а ускоряет его. Генерация черновиков, рерайт, адаптация под тон бренда, проверка текстов — всё через AI.",
    tasks: [
      { icon: "📝", name: "Статьи и блоги", description: "SEO-статьи, обзоры, гайды, лонгриды", models: ["gpt-5.1", "claude-sonnet-4"] },
      { icon: "📧", name: "Email-маркетинг", description: "Рассылки, триггерные письма, воронки", models: ["gpt-4.1-mini", "claude-haiku-4.5"] },
      { icon: "📱", name: "Соцсети", description: "Посты, сторис, Reels-описания", models: ["gpt-4o-mini", "gemini-2.0-flash"] },
      { icon: "🔄", name: "Рерайт", description: "Уникализация текстов, адаптация стиля", models: ["claude-sonnet-4", "gemini-2.5-flash"] },
      { icon: "✅", name: "Редактура", description: "Проверка грамматики, стиля, тона", models: ["claude-opus-4", "gpt-4.1"] },
    ],
    prompts: [
      { title: "Статья-лонгрид", prompt: "Напиши статью на тему [тема] на 2500 слов. Стиль: экспертный, но доступный. Добавь примеры, цифры, цитаты. Структура: вступление, 5 разделов с H2, заключение." },
      { title: "Продающий пост", prompt: "Напиши продающий пост для [соцсеть] о [продукт]. Используй формулу AIDA. Тон: [тон]. Добавь CTA." },
      { title: "Рерайт", prompt: "Перепиши этот текст уникально, сохраняя смысл и ключевые слова. Сделай его более живым и читабельным:\n\n[текст]" },
    ],
  },
  {
    slug: "designer",
    role: "Дизайнер",
    title: "AI для дизайнера 2026 — нейросети для дизайна",
    description: "Нейросети для дизайнера: генерация изображений, мокапы, логотипы, фотосессии. Nano Banana, GPT-5 Image и другие.",
    h1: "AI для дизайнера — генерация визуала нейросетью",
    intro: "AI помогает дизайнеру: быстрые концепты, генерация фонов, мокапы, продуктовые фото. Stone AI даёт доступ к лучшим моделям генерации изображений.",
    tasks: [
      { icon: "🎨", name: "Концепты", description: "Быстрые визуальные концепты и мудборды", models: ["nano-banana", "gpt-5-image"] },
      { icon: "📸", name: "Продуктовые фото", description: "Фотосессия товара, смена фона, маркетплейс-карточки", models: ["nano-banana-pro", "gpt-5-image"] },
      { icon: "🖼️", name: "Иллюстрации", description: "Уникальные иллюстрации для сайтов и презентаций", models: ["nano-banana", "gpt-5-image-mini"] },
      { icon: "📹", name: "Видео", description: "Промо-ролики, анимации, моушн-дизайн", models: ["gpt-4o-mini"] },
      { icon: "🧊", name: "3D", description: "3D модели из текста или изображения", models: ["gpt-4o-mini"] },
    ],
    prompts: [
      { title: "Продуктовое фото", prompt: "Сгенерируй фото [товар] на белом фоне, студийное освещение, вид спереди, высокое разрешение, для маркетплейса." },
      { title: "Иллюстрация для блога", prompt: "Создай иллюстрацию в стиле flat design на тему [тема]. Цветовая палитра: [цвета]. Минималистичный стиль." },
      { title: "Баннер", prompt: "Сгенерируй баннер 1200x628 для рекламы [продукт]. Стиль: современный, минимализм. Основной цвет: [цвет]. Без текста." },
    ],
  },
  {
    slug: "student",
    role: "Студент",
    title: "AI для студента 2026 — бесплатные нейросети для учёбы",
    description: "Бесплатные AI модели для студентов. Рефераты, курсовые, подготовка к экзаменам, перевод — 15 запросов в день бесплатно.",
    h1: "AI для студента — бесплатные нейросети для учёбы",
    intro: "Stone AI даёт 15 бесплатных запросов в день к 8 моделям. Помощь с рефератами, курсовыми, подготовкой к экзаменам, переводом — без регистрации.",
    tasks: [
      { icon: "📚", name: "Рефераты и курсовые", description: "Структура, черновики, источники", models: ["gpt-4o-mini", "claude-haiku-4.5"] },
      { icon: "📖", name: "Конспекты", description: "Краткое изложение лекций и учебников", models: ["gemini-2.0-flash", "deepseek-v3"] },
      { icon: "🧮", name: "Математика", description: "Решение задач с пошаговым объяснением", models: ["deepseek-r1", "o4-mini"] },
      { icon: "🌍", name: "Перевод", description: "Перевод текстов и статей с любых языков", models: ["gpt-4o-mini", "llama-4-maverick"] },
      { icon: "✅", name: "Подготовка к экзаменам", description: "Тесты, вопросы-ответы, объяснение тем", models: ["claude-haiku-4.5", "gemini-2.0-flash"] },
    ],
    prompts: [
      { title: "План курсовой", prompt: "Составь план курсовой работы на тему [тема]. Включи: введение с актуальностью, 3 главы с подразделами, заключение, список литературы (10 источников)." },
      { title: "Объяснение темы", prompt: "Объясни тему [тема] простым языком, как будто объясняешь другу. Приведи 3 примера из жизни." },
      { title: "Решение задачи", prompt: "Реши задачу пошагово, объясняя каждый шаг:\n\n[условие задачи]" },
    ],
  },
];

// ─── Tool Hubs ───

export interface ToolHub {
  slug: string;
  category: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  modelIds: string[];  // model ids to show
}

export const TOOL_HUBS: ToolHub[] = [
  {
    slug: "image-generation",
    category: "Генерация изображений",
    title: "Генерация изображений нейросетью онлайн 2026 — Stone AI",
    description: "Генерация картинок AI онлайн бесплатно. Nano Banana, GPT-5 Image, DALL-E — 4 модели для создания изображений по описанию.",
    h1: "Генерация изображений нейросетью — 4 модели онлайн",
    intro: "Создавайте изображения по текстовому описанию с помощью нейросетей. 2 бесплатные генерации для новых пользователей. Поддержка русских промптов.",
    modelIds: ["nano-banana", "nano-banana-pro", "gpt-5-image", "gpt-5-image-mini"],
  },
  {
    slug: "video-generation",
    category: "Генерация видео",
    title: "Генерация видео нейросетью онлайн 2026 — Sora, Veo, Luma",
    description: "Генерация видео по тексту. 12 моделей: Sora 2, Veo 3, Luma Ray 2, MiniMax, Pika 2 и другие. От 390₽/мес.",
    h1: "Генерация видео нейросетью — 12 моделей в одном месте",
    intro: "Создавайте видео из текстового описания. Sora 2 Pro, Veo 3, Luma Ray 2, MiniMax Hailuo и 8 других моделей. 1 бесплатное видео для новых пользователей.",
    modelIds: ["gpt-4o-mini"],  // video models shown separately
  },
  {
    slug: "text-generation",
    category: "Текстовые нейросети",
    title: "Текстовые нейросети онлайн 2026 — AI чат на русском",
    description: "50+ текстовых AI моделей онлайн. GPT-5, Claude Opus, Gemini, DeepSeek, Llama — бесплатный чат на русском языке.",
    h1: "Текстовые нейросети — 50+ моделей для чата и работы",
    intro: "Доступ к 50+ текстовым AI моделям в одном интерфейсе. 15 бесплатных запросов в день к 8 моделям. Без VPN, на русском языке.",
    modelIds: ["gpt-4o-mini", "claude-haiku-4.5", "gemini-2.0-flash", "deepseek-v3", "llama-4-maverick", "gpt-5.1", "claude-opus-4"],
  },
  {
    slug: "code-generation",
    category: "AI для кода",
    title: "AI для написания кода 2026 — нейросети для программистов",
    description: "Лучшие AI модели для кода. Claude Opus 4, Devstral, GPT-5 — генерация, review, дебаг на любом языке программирования.",
    h1: "AI для кода — нейросети для программирования",
    intro: "Пишите код быстрее с AI. Claude Opus 4 — лучшая модель для кода. Devstral — специализированная код-модель от Mistral. GPT-5 — универсальный помощник.",
    modelIds: ["claude-opus-4", "devstral", "gpt-5.1", "deepseek-r1", "gpt-4.1"],
  },
];
