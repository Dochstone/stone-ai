export type ModelTier = "free" | "pro";
export type ModelCategory = "chat" | "image" | "reason" | "search" | "code";

export interface AIModel {
  id: string;
  name: string;
  company: string;
  tier: ModelTier;
  category: ModelCategory;
  pricePerMillion: number;
  priceUnit?: string;
  context: string;
}

export const TELEGRAM_BOT_URL = "https://t.me/StoneAIBot";

export const MODELS: AIModel[] = [
  // TIER 1: FREE (5 models)
  { id: "gpt-4o-mini", name: "GPT-4o mini", company: "OpenAI", tier: "free", category: "chat", pricePerMillion: 2.5, context: "128K" },
  { id: "claude-haiku-4.5", name: "Claude Haiku 4.5", company: "Anthropic", tier: "free", category: "chat", pricePerMillion: 11.0, context: "200K" },
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", company: "Google", tier: "free", category: "chat", pricePerMillion: 1.4, context: "1M" },
  { id: "llama-4-maverick", name: "Llama 4 Maverick", company: "Meta", tier: "free", category: "chat", pricePerMillion: 1.76, context: "1M" },
  { id: "mistral-large-25", name: "Mistral Large", company: "Mistral", tier: "free", category: "chat", pricePerMillion: 17.6, context: "128K" },

  // TIER 2: MID (15 models)
  { id: "deepseek-r1", name: "DeepSeek R1", company: "DeepSeek", tier: "pro", category: "chat", pricePerMillion: 6.0, context: "164K" },
  { id: "deepseek-v3", name: "DeepSeek V3", company: "DeepSeek", tier: "pro", category: "chat", pricePerMillion: 1.5, context: "128K" },
  { id: "deepseek-v3.2", name: "DeepSeek V3.2", company: "DeepSeek", tier: "pro", category: "chat", pricePerMillion: 1.5, context: "128K" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 mini", company: "OpenAI", tier: "pro", category: "chat", pricePerMillion: 4.5, context: "1M" },
  { id: "gpt-4.1-nano", name: "GPT-4.1 nano", company: "OpenAI", tier: "pro", category: "chat", pricePerMillion: 1.4, context: "1M" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", company: "Google", tier: "pro", category: "chat", pricePerMillion: 1.68, context: "1M" },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", company: "Anthropic", tier: "pro", category: "chat", pricePerMillion: 30.0, context: "200K" },
  { id: "claude-sonnet-4.5", name: "Claude Sonnet 4.5", company: "Anthropic", tier: "pro", category: "chat", pricePerMillion: 30.0, context: "200K" },
  { id: "grok-3-mini", name: "Grok 3 mini", company: "xAI", tier: "pro", category: "chat", pricePerMillion: 1.68, context: "131K" },
  { id: "qwen-3-235b", name: "Qwen 3 235B", company: "Alibaba", tier: "pro", category: "chat", pricePerMillion: 2.0, context: "40K" },
  { id: "qwen-qwq", name: "Qwen QwQ 32B", company: "Alibaba", tier: "pro", category: "chat", pricePerMillion: 2.0, context: "131K" },
  { id: "minimax-m2.5", name: "MiniMax M2.5", company: "MiniMax", tier: "pro", category: "chat", pricePerMillion: 2.34, context: "1M" },
  { id: "glm-5", name: "GLM-5", company: "Zhipu", tier: "pro", category: "chat", pricePerMillion: 4.95, context: "128K" },
  { id: "command-r7", name: "Command R7", company: "Cohere", tier: "pro", category: "chat", pricePerMillion: 0.24, context: "128K" },
  { id: "mistral-small", name: "Mistral Small", company: "Mistral", tier: "pro", category: "chat", pricePerMillion: 1.1, context: "32K" },

  // TIER 3: PREMIUM (15 models)
  { id: "claude-opus-4", name: "Claude Opus 4", company: "Anthropic", tier: "pro", category: "chat", pricePerMillion: 130.0, context: "200K" },
  { id: "claude-opus-4.5", name: "Claude Opus 4.5", company: "Anthropic", tier: "pro", category: "chat", pricePerMillion: 51.0, context: "200K" },
  { id: "gpt-4.1", name: "GPT-4.1", company: "OpenAI", tier: "pro", category: "chat", pricePerMillion: 28.0, context: "1M" },
  { id: "gpt-5.1", name: "GPT-5.1", company: "OpenAI", tier: "pro", category: "chat", pricePerMillion: 26.0, context: "400K" },
  { id: "gpt-5.4", name: "GPT-5.4", company: "OpenAI", tier: "pro", category: "chat", pricePerMillion: 30.0, context: "1M" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", company: "Google", tier: "pro", category: "chat", pricePerMillion: 26.0, context: "1M" },
  { id: "gemini-3-pro", name: "Gemini 3 Pro", company: "Google", tier: "pro", category: "chat", pricePerMillion: 24.0, context: "1M" },
  { id: "grok-3", name: "Grok 3", company: "xAI", tier: "pro", category: "chat", pricePerMillion: 36.0, context: "131K" },
  { id: "perplexity-sonar-pro", name: "Perplexity Pro", company: "Perplexity", tier: "pro", category: "search", pricePerMillion: 26.0, context: "200K" },
  { id: "kimi-k2.5", name: "Kimi K2.5", company: "Moonshot", tier: "pro", category: "chat", pricePerMillion: 3.92, context: "128K" },
  { id: "o4-mini", name: "o4-mini", company: "OpenAI", tier: "pro", category: "reason", pricePerMillion: 12.32, context: "200K" },
  { id: "o3", name: "o3", company: "OpenAI", tier: "pro", category: "reason", pricePerMillion: 19.6, context: "200K" },
  { id: "claude-haiku-4.5-think", name: "Claude Haiku Think", company: "Anthropic", tier: "pro", category: "reason", pricePerMillion: 11.9, context: "200K" },
  { id: "gemini-2.5-flash-think", name: "Gemini Flash Think", company: "Google", tier: "pro", category: "reason", pricePerMillion: 8.64, context: "1M" },
  { id: "devstral", name: "Devstral", company: "Mistral", tier: "pro", category: "code", pricePerMillion: 2.1, context: "128K" },

  // TIER 4: IMAGE (6 models)
  { id: "nano-banana-pro", name: "Nano Banana Pro", company: "Google", tier: "pro", category: "image", pricePerMillion: 32.0, context: "65K" },
  { id: "nano-banana", name: "Nano Banana", company: "Google", tier: "pro", category: "image", pricePerMillion: 1.68, context: "1M" },
  { id: "gpt-5-image", name: "GPT-5 Image", company: "OpenAI", tier: "pro", category: "image", pricePerMillion: 30.0, context: "128K" },
  { id: "gpt-5-image-mini", name: "GPT-5 Image Mini", company: "OpenAI", tier: "pro", category: "image", pricePerMillion: 6.72, context: "128K" },
  { id: "flux-schnell", name: "Flux Schnell", company: "BFL", tier: "pro", category: "image", pricePerMillion: 0.012, priceUnit: "/img", context: "" },
  { id: "stable-diffusion-xl", name: "SDXL", company: "Stability", tier: "pro", category: "image", pricePerMillion: 0.04, priceUnit: "/img", context: "" },

  // TIER 5: FREE on OpenRouter (7 models)
  { id: "gemma-3-27b", name: "Gemma 3 27B", company: "Google", tier: "pro", category: "chat", pricePerMillion: 1.2, context: "96K" },
  { id: "gemma-3n-4b", name: "Gemma 3n 4B", company: "Google", tier: "pro", category: "chat", pricePerMillion: 0.5, context: "32K" },
  { id: "phi-4", name: "Phi-4", company: "Microsoft", tier: "pro", category: "chat", pricePerMillion: 1.2, context: "16K" },
  { id: "llama-3.3-70b", name: "Llama 3.3 70B", company: "Meta", tier: "pro", category: "chat", pricePerMillion: 1.2, context: "128K" },
  { id: "qwen-turbo", name: "Qwen Turbo", company: "Alibaba", tier: "pro", category: "chat", pricePerMillion: 0.65, context: "1M" },
  { id: "nvidia-nemotron", name: "Nemotron 70B", company: "NVIDIA", tier: "pro", category: "chat", pricePerMillion: 1.0, context: "128K" },
  { id: "mythomax-13b", name: "MythoMax 13B", company: "Gryphe", tier: "pro", category: "chat", pricePerMillion: 0.5, context: "4K" },

  // TIER 6: SPECIAL (2 models)
  { id: "perplexity-sonar", name: "Perplexity Sonar", company: "Perplexity", tier: "pro", category: "search", pricePerMillion: 4.0, context: "127K" },
  { id: "perplexity-sonar-deep", name: "Sonar Deep Research", company: "Perplexity", tier: "pro", category: "search", pricePerMillion: 16.8, context: "127K" },
];

export const COMPANIES = Array.from(new Set(MODELS.map((m) => m.company)));
export const CATEGORIES: ModelCategory[] = ["chat", "image", "reason", "search", "code"];
