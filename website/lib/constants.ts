export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stoneai.ru";

export const DEFAULT_MODEL = "gpt-4o-mini";

// Single source of truth for USD→RUB conversion across the website.
// Keep in sync with backend `USD_TO_RUB` in app/config.py.
export const USD_TO_RUB = 84;

export { PLAN_DISPLAY, UPGRADE_CTA_PRICE } from "./pricing";
