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

/**
 * Price history — every tier has an `old` (pre-migration) and a `current` value.
 * `PLAN_PRICES_RUB` and all helpers always read from `current`. If a tier price
 * changes again, bump `current` here and add a new `old` entry.
 */
export const PRICES_OLD: Record<PaidPlanId, number> = {
  mini: 590,
  max: 1290,
  "max-pro": 2990,
};

export const PRICES_CURRENT: Record<PaidPlanId, number> = {
  mini: 990,
  max: 1690,
  "max-pro": 3990,
};

/** Back-compat alias — everything numeric should import this. */
export const PLAN_PRICES_RUB: Record<PaidPlanId, number> = PRICES_CURRENT;

/**
 * Time-bound promo campaign — auto-applies a fixed-rouble discount on a
 * single tier's monthly price during the window. Mirror of
 * `backend/app/pricing.py:PROMO_CAMPAIGN` — keep in sync.
 */
export const PROMO_CAMPAIGN = {
  tier: "max" as PaidPlanId,
  discountRub: 422,            // 1690 → 1268 (−25%)
  labelPct: 25,                // marketed as "−25%"
  validFrom: "2026-06-30T00:00:00+03:00",
  validUntil: "2026-07-07T23:59:59+03:00",
} as const;

export function isPromoActive(now: Date = new Date()): boolean {
  const start = new Date(PROMO_CAMPAIGN.validFrom).getTime();
  const end = new Date(PROMO_CAMPAIGN.validUntil).getTime();
  const t = now.getTime();
  return t >= start && t <= end;
}

export function effectivePlanPrice(id: PaidPlanId, period: "month" | "year" = "month"): number {
  if (period === "year") return PRICES_YEARLY[id];
  const base = PRICES_CURRENT[id];
  if (isPromoActive() && PROMO_CAMPAIGN.tier === id) {
    return Math.max(1, base - PROMO_CAMPAIGN.discountRub);
  }
  return base;
}

function formatRub(n: number): string {
  return n.toLocaleString("ru-RU").replace(/,/g, " ");
}

/** "990₽" — just the price with ₽ sign. */
export function planPrice(id: PaidPlanId): string {
  return `${formatRub(PRICES_CURRENT[id])}₽`;
}

/** "990₽/мес" — price with ruble and period. */
export function planPriceFull(id: PaidPlanId): string {
  return `${planPrice(id)}/мес`;
}

/** Raw integer price. */
export function planPriceNum(id: PaidPlanId): number {
  return PRICES_CURRENT[id];
}

/** Previous (pre-migration) price for optional struck-through display. */
export function planOldPrice(id: PaidPlanId): string {
  return `${formatRub(PRICES_OLD[id])}₽`;
}

/**
 * Yearly billing — explicit "X 990" style prices that average ~20% off
 * vs paying monthly for 12 months. Marketed as "−20%" on the toggle chip.
 */
export const YEARLY_DISCOUNT = 0.2; // marketing-rounded label only

export const PRICES_YEARLY: Record<PaidPlanId, number> = {
  mini: 9480,        // 790₽/мес × 12
  max: 16200,        // 1 350₽/мес × 12
  "max-pro": 38388,  // 3 199₽/мес × 12
};

export function planYearlyPriceNum(id: PaidPlanId): number {
  return PRICES_YEARLY[id];
}

/** "9 490₽" — total amount charged for a year. */
export function planYearlyPrice(id: PaidPlanId): string {
  return `${formatRub(PRICES_YEARLY[id])}₽`;
}

export function planYearlyPriceFull(id: PaidPlanId): string {
  return `${planYearlyPrice(id)}/год`;
}

/** "791₽" — yearly cost amortised per month (for "от X₽/мес" style copy). */
export function planYearlyMonthlyEquivalent(id: PaidPlanId): string {
  return `${formatRub(Math.round(PRICES_YEARLY[id] / 12))}₽`;
}

/** "11 880₽" — what the user would pay if billing monthly for 12 months. */
export function planYearlyOldPrice(id: PaidPlanId): string {
  return `${formatRub(PRICES_CURRENT[id] * 12)}₽`;
}

/** Real percent saved vs 12 monthly payments — for per-tier display if needed. */
export function planYearlyDiscountPct(id: PaidPlanId): number {
  const annual = PRICES_CURRENT[id] * 12;
  return Math.round(((annual - PRICES_YEARLY[id]) / annual) * 100);
}

export const PLAN_DISPLAY = {
  mini:      { name: "Start", price: planPriceFull("mini") },
  max:       { name: "Pro",   price: planPriceFull("max") },
  "max-pro": { name: "Elite", price: planPriceFull("max-pro") },
} as const;

/**
 * Replace {{price_*}} placeholders in a string with current tier prices.
 * Placeholders supported:
 *   {{price_mini}}      → "990₽"
 *   {{price_max}}       → "1 890₽"
 *   {{price_elite}}     → "3 990₽"
 *   {{price_mini_full}} → "990₽/мес"
 *   {{price_max_full}}  → "1 890₽/мес"
 *   {{price_elite_full}}→ "3 990₽/мес"
 */
export function renderPrice(text: string): string {
  return text
    .replace(/\{\{price_mini_full\}\}/g, planPriceFull("mini"))
    .replace(/\{\{price_max_full\}\}/g, planPriceFull("max"))
    .replace(/\{\{price_elite_full\}\}/g, planPriceFull("max-pro"))
    .replace(/\{\{price_mini\}\}/g, planPrice("mini"))
    .replace(/\{\{price_max\}\}/g, planPrice("max"))
    .replace(/\{\{price_elite\}\}/g, planPrice("max-pro"));
}

/** Recursively apply renderPrice to every string inside an object/array. */
export function renderPriceDeep<T>(value: T): T {
  if (typeof value === "string") return renderPrice(value) as unknown as T;
  if (Array.isArray(value)) return value.map((v) => renderPriceDeep(v)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(value as object)) {
      out[k] = renderPriceDeep((value as Record<string, unknown>)[k]);
    }
    return out as T;
  }
  return value;
}

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
    price: planPrice("mini"),
    priceNum: planPriceNum("mini"),
    premium: false,
    period: "/мес",
    desc: "20+ моделей",
    badge: "Старт",
    accent: false,
    features: [
      "20+ моделей включая GPT-5.1 и Claude Sonnet",
      "600 быстрых запросов в месяц",
      "150 премиум запросов в месяц",
      "60 картинок · 13 видео-поинтов в месяц",
      "+ 1 пробное Standard и 1 Premium видео в месяц",
      "Инструменты оплачиваются с баланса",
    ],
    locked: ["Claude Opus", "3D-модели", "Озвучка"],
    cta: "Выбрать Start",
    icon: "⚡",
    color: "#22D3EE",
    img: "/plan-mini.jpg?v=2",
    compactSummary: "20+ моделей · 600 быстрых · 150 премиум · 60 картинок · 13 видео-поинтов",
  },
  {
    id: "max",
    name: "Pro",
    price: planPrice("max"),
    priceNum: planPriceNum("max"),
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
      "Безлимитная история чатов и проекты",
      "AI-фотосессия товаров для маркетплейсов",
      "SEO-модуль: статьи, мета-теги, A/B тесты",
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
      "🎮 Геймификация, достижения, ежедневные стрики",
    ],
    modalGuarantee: "Если за первые 7 дней не подойдёт — вернём деньги без вопросов. Можно отменить подписку в любой момент в личном кабинете.",
  },
  {
    id: "max-pro",
    name: "Elite",
    price: planPrice("max-pro"),
    priceNum: planPriceNum("max-pro"),
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
      "Бета-доступ к новым моделям за неделю до релиза",
      "Пакетная фотосессия до 50 фото за раз",
      "Персональный менеджер и приоритетная поддержка",
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
      "📞 Приоритетная поддержка — ответ в течение часа",
      "🎁 Эксклюзивные промокоды и бонусы каждый месяц",
    ],
    modalGuarantee: "30 дней на возврат если не подойдёт. Персональный менеджер для крупных запросов. Cкидка 25% при оплате за 3 месяца вперёд.",
  },
];

export const PLAN_LIMIT_LABELS = {
  free: {
    models: "8 бесплатных",
    chat: "10/день",
    premium: "2/день",
    opus: "—",
    images: "2 пробных",
    video: "2 поинта",
    threed: "Скоро",
    audio: "—",
    api: "—",
    priority: "—",
    early: "—",
  },
  mini: {
    models: "20+",
    chat: "600/мес",
    premium: "150/мес",
    opus: "—",
    images: "60/мес",
    video: "13 поинтов + триалы",
    threed: "Скоро",
    audio: "—",
    api: "—",
    priority: "—",
    early: "—",
  },
  max: {
    models: "65+",
    chat: "1 500/мес",
    premium: "112 ед/мес",
    opus: "28 ед/мес",
    images: "140/мес",
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
    premium: "336 ед/мес",
    opus: "56 ед/мес",
    images: "280/мес",
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
