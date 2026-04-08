/**
 * AI model configurations for dashboard tools.
 * Single source of truth — no more duplicate model lists.
 */

export const CHAT_MODELS = [
  { id: "gpt-4o-mini", name: "GPT-4o mini", speed: "Быстрый" },
  { id: "deepseek-v3", name: "DeepSeek V3", speed: "Аналитический" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", speed: "Быстрый" },
  { id: "claude-haiku-4.5", name: "Claude Haiku 4.5", speed: "Умный" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", speed: "Точный · PRO" },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", speed: "Креативный · PRO" },
];

export const IMAGE_MODELS = [
  { id: "nano-banana", name: "Nano Banana (Gemini)" },
  { id: "nano-banana-pro", name: "Nano Banana Pro (рекомендуется)" },
];

export const CATEGORIES = [
  { id: "all", label: "Все", icon: "📋" },
  { id: "marketing", label: "Маркетинг", icon: "📊" },
  { id: "smm", label: "SMM", icon: "📱" },
  { id: "seo", label: "SEO", icon: "🔍" },
  { id: "copywriting", label: "Копирайтинг", icon: "✍️" },
  { id: "code", label: "Код", icon: "💻" },
  { id: "business", label: "Бизнес", icon: "💼" },
];

export const CAT_COLORS: Record<string, string> = {
  marketing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  smm: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  seo: "bg-green-500/10 text-green-500 border-green-500/20",
  copywriting: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  code: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  business: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

/**
 * Fetch with timeout — prevents hanging requests.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 30000
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}
