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
    name: "Free",
    price: "0₽",
    priceNum: 0,
    premium: false,
    period: "",
    desc: "Чат с дневными лимитами",
    badge: "Бесплатно",
    accent: false,
    features: [
      "10 быстрых + 2 премиум чат-запроса в день",
      "7 бесплатных моделей для чата",
      "2 картинки + 2 пробных видео-поинта",
      "История чатов сохраняется",
      "Инструменты: шаблоны, презентации, SEO, кампании — с баланса",
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
