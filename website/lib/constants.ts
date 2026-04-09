export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stoneai.ru";

export const DEFAULT_MODEL = "gpt-4o-mini";

export const PLAN_DISPLAY = {
  mini: { name: "Start", price: "590₽/мес" },
  max: { name: "Pro", price: "1 290₽/мес" },
  "max-pro": { name: "Elite", price: "2 990₽/мес" },
} as const;

export const UPGRADE_CTA_PRICE = "590₽/мес";
