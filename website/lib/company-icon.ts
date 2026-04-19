/**
 * Maps AI provider company names → PNG brand icon path.
 * Used across chat, model grid, compare page.
 */

export const COMPANY_ICONS: Record<string, string> = {
  OpenAI: "/logos/openai-icon-v4.png",
  Anthropic: "/logos/claude-icon.png",
  Google: "/logos/gemini-new-icon.png",
  xAI: "/logos/grok-icon.png",
  DeepSeek: "/logos/deepseek-icon.png",
  Alibaba: "/logos/qwen-icon.png",
  Perplexity: "/logos/perplexity-icon.png",
  Cohere: "/logos/cohere-icon.png",
  Kuaishou: "/logos/kling-icon.png",
  Midjourney: "/logos/mj-icon.png",
  Meta: "/logos/meta-icon.png",
  Mistral: "/logos/mistral-icon.png",
  MiniMax: "/logos/minimax-icon.png",
  Suno: "/logos/suno-icon.png",
  Stability: "/logos/stability-icon.png",
  Lightricks: "/logos/lightricks-icon.png",
  Pika: "/logos/pika-icon.png",
  PixVerse: "/logos/pixverse-icon.jpg",
  Luma: "/logos/luma-icon.jpg",
  Gryphe: "/logos/mythomax-icon.png",
  NVIDIA: "/logos/nvidia-icon.png",
  Microsoft: "/logos/microsoft-icon.png",
  Moonshot: "/logos/moonshot-icon.jpg",
  Tencent: "/logos/tencent-icon.jpg",
  Tripo3D: "/logos/tripo3d-icon.png",
};

// Per-model overrides — use when the model has its own brand icon
// distinct from its parent company (e.g. Veo, Nano Banana, Gemini Pro).
export const MODEL_ICONS: Record<string, string> = {
  "veo-3": "/logos/veo-icon.png",
  "nano-banana": "/logos/banana-2-icon.png",
  "nano-banana-pro": "/logos/banana-pro-icon.png",
  "gemini-2.0-flash": "/logos/gemini-icon.png",
  "gemini-2.5-flash": "/logos/gemini-new-icon.png",
  "gemini-2.5-flash-think": "/logos/gemini-new-icon.png",
  "gemini-2.5-pro": "/logos/gemini-pro-icon.png",
  "gemini-3-pro": "/logos/gemini-pro-icon.png",
};

export function getCompanyIconSrc(company: string | undefined | null): string | undefined {
  if (!company) return undefined;
  return COMPANY_ICONS[company];
}

export function getModelIconSrc(
  modelId: string | undefined | null,
  company?: string | undefined | null,
): string | undefined {
  if (modelId && MODEL_ICONS[modelId]) return MODEL_ICONS[modelId];
  return getCompanyIconSrc(company);
}
