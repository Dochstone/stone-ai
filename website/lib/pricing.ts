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
      "2 картинки + 1 видео на пробу",
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
      "60 картинок и 30 видео в месяц",
      "Инструменты оплачиваются с баланса",
    ],
    locked: ["Claude Opus", "3D-модели", "Озвучка"],
    cta: "Выбрать Start",
    icon: "⚡",
    color: "#22D3EE",
    img: "/plan-mini.jpg?v=2",
    compactSummary: "20+ моделей · 600 быстрых · 90 премиум · 60 картинок · 30 видео",
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
      "112 премиум + 28 Opus в месяц",
      "140 картинок и 28 видео в месяц",
      "5 3D-моделей и 20 озвучек",
      "Голосовой ассистент",
    ],
    locked: [],
    cta: "Выбрать Pro",
    icon: "🔥",
    color: "#A855F7",
    img: "/plan-max.jpg?v=2",
    compactSummary: "65+ нейросетей · 1 500 быстрых · 112 премиум · 28 Opus · 140 картинок · 28 видео",
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
      "336 премиум + 56 Opus в месяц",
      "280 картинок и 84 видео в месяц",
      "30 3D-моделей и 100 озвучек",
      "Приоритетная скорость ответов",
      "Ранний доступ к новым моделям",
    ],
    locked: [],
    cta: "Стать Elite",
    icon: "💎",
    color: "#F43F5E",
    img: "/plan-maxpro.jpg?v=3",
    compactSummary: "65+ нейросетей · 4 500 быстрых · 336 премиум · 56 Opus · 280 картинок · 84 видео · API",
  },
];

export const PLAN_LIMIT_LABELS = {
  free: {
    models: "7",
    chat: "10/день + 2 премиум",
    premium: "—",
    opus: "—",
    images: "2 на пробу",
    video: "1 на пробу",
    threed: "—",
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
    video: "30/мес",
    threed: "—",
    audio: "—",
    api: "—",
    priority: "—",
    early: "—",
  },
  max: {
    models: "65+",
    chat: "1 500/мес",
    premium: "112/мес",
    opus: "28/мес",
    images: "140/мес",
    video: "28/мес",
    threed: "5/мес",
    audio: "20/мес",
    api: "—",
    priority: "—",
    early: "—",
  },
  "max-pro": {
    models: "65+",
    chat: "4 500/мес",
    premium: "336/мес",
    opus: "56/мес",
    images: "280/мес",
    video: "84/мес",
    threed: "30/мес",
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
