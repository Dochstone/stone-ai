export type PlanId = "free" | "mini" | "max" | "max-pro";
export type PaidPlanId = Exclude<PlanId, "free">;

export interface PricingPlan {
  id: PlanId;
  name: string;
  price: string;
  oldPrice?: string;
  priceNum: number;
  premium: boolean;
  period: string;
  desc: string;
  badge: string;
  accent: boolean;
  features: string[];
  locked: string[];
  cta: string;
  icon: string;
  color: string;
  img: string;
  compactSummary?: string;
  // Modal-only extras
  modalIntro?: string;        // 1-2 sentence pitch shown before features
  modalAudience?: string;     // "Кому подходит" — short paragraph
  modalIncludes?: string[];   // detailed list shown in expandable section
  modalGuarantee?: string;    // money-back / refund / extras guarantee
}

export const PLAN_PRICES_RUB: Record<PaidPlanId, number> = {
  mini: 590,
  max: 1290,
  "max-pro": 2990,
};

export const PLAN_DISPLAY = {
  mini: { name: "Start", price: "590₽/мес" },
  max: { name: "Pro", price: "1 290₽/мес" },
  "max-pro": { name: "Elite", price: "2 990₽/мес" },
} as const;

export const UPGRADE_CTA_PRICE = PLAN_DISPLAY.mini.price;
export const FREE_CHAT_MODEL_COUNT = 7;

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Pay-per-Use",
    price: "от 3₽",
    priceNum: 0,
    premium: false,
    period: "/запрос",
    desc: "Без подписки — баланс кабинета",
    badge: "Гибкий",
    accent: false,
    features: [
      "10 быстрых + 2 премиум чат-запроса в день — бесплатно",
      "7 бесплатных моделей для чата",
      "2 картинки + 2 пробных видео-поинта",
      "AI-шаблоны от 3₽, SEO-статьи 15₽, презентации 40₽",
      "Фотосессия 15-40₽, кампании 29₽ — с баланса",
      "Можно перенести баланс в подписку в любой момент",
      "Бонус 100₽ при регистрации",
    ],
    locked: [],
    cta: "Пополнить баланс",
    icon: "💰",
    color: "#14B8A6",
    img: "/plan-payperuse.webp",
  },
  {
    id: "mini",
    name: "Start",
    price: "590₽",
    priceNum: 590,
    premium: false,
    period: "/мес",
    desc: "20+ моделей",
    badge: "Старт",
    accent: false,
    features: [
      "20+ моделей включая GPT-5.1 и Claude Sonnet",
      "600 быстрых запросов в месяц",
      "90 премиум запросов в месяц",
      "60 картинок · 13 видео-поинтов в месяц",
      "+ 1 пробное Standard и 1 Premium видео в месяц",
      "Инструменты оплачиваются с баланса",
    ],
    locked: ["Claude Opus", "3D-модели", "Озвучка"],
    cta: "Выбрать Start",
    icon: "⚡",
    color: "#22D3EE",
    img: "/plan-mini.jpg?v=2",
    compactSummary: "20+ моделей · 600 быстрых · 90 премиум · 60 картинок · 13 видео-поинтов",
  },
  {
    id: "max",
    name: "Pro",
    price: "1 290₽",
    priceNum: 1290,
    premium: false,
    period: "/мес",
    desc: "Все 65+ нейросети",
    badge: "Популярный",
    accent: true,
    features: [
      "Все 65+ нейросетей включая Opus",
      "1 500 быстрых запросов в месяц",
      "112 премиум + 28 Opus (вес учитывается: Opus = ×5)",
      "140 картинок · 33 видео-поинта в месяц",
      "Премиум-видео 1080P / 10 сек доступны",
      "20 озвучек, голосовой ассистент",
    ],
    locked: [],
    cta: "Выбрать Pro",
    icon: "🔥",
    color: "#A855F7",
    img: "/plan-max.jpg?v=2",
    compactSummary: "65+ нейросетей · 1 500 быстрых · 112 премиум · 28 Opus · 140 картинок · 33 видео-поинта",
    modalIntro: "Самый популярный тариф. Полный доступ ко всем 65+ моделям, включая Claude Opus и GPT-5.1. Хватит на ~50 рабочих сессий в месяц.",
    modalAudience: "Контент-маркетологи, разработчики, дизайнеры, копирайтеры. Те кто пользуется AI каждый день и хочет лучшие модели без переплаты.",
    modalIncludes: [
      "🤖 Все модели OpenAI, Anthropic, Google, DeepSeek, xAI, Meta, Mistral",
      "🎬 33 видео-поинта в месяц — от коротких клипов до 1080P/10 сек",
      "🎨 140 картинок: nano-banana-pro, GPT-5 Image, Flux 2",
      "🧠 Claude Opus 4.5 — лучшая модель для сложных задач (вес ×5)",
      "🎙 20 озвучек + голосовой ассистент в чате",
      "💾 Безлимитная история чатов, шаблоны, проекты",
      "📊 SEO-модуль: статьи, мета-теги, A/B тесты",
      "🛍 Фотосессия товаров для Wildberries / Ozon",
      "🤝 Конструктор AI-ботов с базой знаний (RAG)",
      "🎮 Геймификация, достижения, ежедневные стрики",
    ],
    modalGuarantee: "Если за первые 7 дней не подойдёт — вернём деньги без вопросов. Можно отменить подписку в любой момент в личном кабинете.",
  },
  {
    id: "max-pro",
    name: "Elite",
    price: "2 990₽",
    priceNum: 2990,
    premium: true,
    period: "/мес",
    desc: "Максимум возможностей",
    badge: "Легенда",
    accent: false,
    features: [
      "Все 65+ нейросетей + API доступ",
      "4 500 быстрых запросов в месяц",
      "336 премиум + 56 Opus (вес учитывается)",
      "280 картинок · 80 видео-поинтов в месяц",
      "Все варианты видео: 15 сек, 1080P, audio",
      "100 озвучек, приоритет, ранний доступ",
    ],
    locked: [],
    cta: "Стать Elite",
    icon: "💎",
    color: "#F43F5E",
    img: "/plan-maxpro.jpg?v=3",
    compactSummary: "65+ нейросетей · 4 500 быстрых · 336 премиум · 56 Opus · 280 картинок · 80 видео-поинтов · API",
    modalIntro: "Максимум для тех кто работает с AI как с инструментом производства. В 3 раза больше лимитов, доступ к API, приоритетная скорость и ранний доступ к новым моделям.",
    modalAudience: "Агентства, продакшн-студии, AI-стартапы, опытные разработчики. Когда AI — это часть рабочего процесса, а не разовое использование.",
    modalIncludes: [
      "🚀 Все модели + ранний доступ к новым (бета-релизы за неделю до публики)",
      "🎬 80 видео-поинтов — премиум 1080P, 10 сек, audio-режим",
      "🎨 280 картинок в месяц с приоритетом в очереди",
      "🧠 56 Opus-запросов (вес ×5) для сложного анализа и стратегии",
      "🔑 API доступ — интеграция с вашими скриптами и продуктами",
      "⚡ Приоритетная скорость ответов — без очереди в часы пик",
      "🎙 100 озвучек, voice cloning, голосовой ассистент",
      "🛍 Безлимитная фотосессия товаров и пакетная обработка до 50 фото",
      "📊 Полная SEO-аналитика + A/B тестирование + отчёты",
      "🤖 Конструктор ботов с расширенной базой знаний",
      "📞 Приоритетная поддержка — ответ в течение часа",
      "🎁 Эксклюзивные промокоды и бонусы каждый месяц",
    ],
    modalGuarantee: "30 дней на возврат если не подойдёт. Персональный менеджер для крупных запросов. Cкидка 25% при оплате за 3 месяца вперёд.",
  },
];

export const PLAN_LIMIT_LABELS = {
  free: {
    models: "7",
    chat: "10/день + 2 премиум",
    premium: "—",
    opus: "—",
    images: "2 на пробу",
    video: "2 поинта (lifetime)",
    threed: "Скоро",
    audio: "—",
    api: "—",
    priority: "—",
    early: "—",
  },
  mini: {
    models: "20+",
    chat: "600/мес",
    premium: "90/мес",
    opus: "—",
    images: "60/мес",
    video: "13 поинтов + 2 пробных",
    threed: "Скоро",
    audio: "—",
    api: "—",
    priority: "—",
    early: "—",
  },
  max: {
    models: "65+",
    chat: "1 500/мес",
    premium: "112 ед/мес (Opus = ×5)",
    opus: "28 ед/мес",
    images: "140/мес (banana-pro = ×5)",
    video: "33 поинта/мес",
    threed: "Скоро",
    audio: "20/мес",
    api: "—",
    priority: "—",
    early: "—",
  },
  "max-pro": {
    models: "65+",
    chat: "4 500/мес",
    premium: "336 ед/мес (Opus = ×5)",
    opus: "56 ед/мес",
    images: "280/мес (banana-pro = ×5)",
    video: "80 поинтов/мес",
    threed: "Скоро",
    audio: "100/мес",
    api: "✓",
    priority: "✓",
    early: "✓",
  },
} as const;

export const PLAN_SUMMARY = {
  mini: PRICING_PLANS.find((plan) => plan.id === "mini")?.compactSummary ?? "",
  max: PRICING_PLANS.find((plan) => plan.id === "max")?.compactSummary ?? "",
  "max-pro": PRICING_PLANS.find((plan) => plan.id === "max-pro")?.compactSummary ?? "",
} as const;
