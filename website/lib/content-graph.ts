import { MODELS, type AIModel, type ModelCategory } from "./models";
import { POSTS, type BlogPost } from "./blog";
import { USE_CASES, type UseCase } from "./use-cases";
import { ALTERNATIVES, type Alternative, PROFESSIONS, type Profession } from "./seo-data";

/**
 * Content graph — dynamic internal linking based on shared categories,
 * tags, company, and tier. Replaces the hardcoded HUBS list with
 * context-aware suggestions ("from this model → related models",
 * "from this article → related articles", etc.).
 *
 * All functions are pure and deterministic, safe to call during SSR
 * prerender. No side effects, no network.
 */

// ── Related Models ─────────────────────────────────────────────────
export function relatedModels(modelId: string, limit = 4): AIModel[] {
  const current = MODELS.find((m) => m.id === modelId);
  if (!current) return [];

  const scored = MODELS
    .filter((m) => m.id !== modelId)
    .map((m) => {
      let score = 0;
      // Same category = strongest signal
      if (m.category === current.category) score += 10;
      // Same company = moderate signal (users comparing siblings)
      if (m.company === current.company) score += 3;
      // Same tier (free/pro) = 2
      if (m.tier === current.tier) score += 2;
      // Overlap in strengths
      if (current.strengths && m.strengths) {
        const overlap = current.strengths.filter((s) => m.strengths!.includes(s)).length;
        score += overlap * 2;
      }
      return { m, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((x) => x.m);
}

// ── Related Articles (blog) ────────────────────────────────────────
/**
 * Тэги в существующем blog.ts не формализованы. Используем эвристику:
 * общие слова в title + упоминание модели в content → близость.
 * curated post.related[] принимается первым — оверрайды явные.
 */
export function relatedArticles(slug: string, limit = 3): BlogPost[] {
  const current = POSTS.find((p) => p.slug === slug);
  if (!current) return [];

  // 1. curated overrides
  if (current.related && current.related.length) {
    const curated = current.related
      .map((s) => POSTS.find((p) => p.slug === s))
      .filter((p): p is BlogPost => !!p);
    if (curated.length >= limit) return curated.slice(0, limit);
  }

  // 2. similarity score
  const currentTokens = tokenize(`${current.title} ${current.description}`);
  const scored = POSTS
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const tokens = tokenize(`${p.title} ${p.description}`);
      const overlap = tokens.filter((t) => currentTokens.includes(t)).length;
      return { p, score: overlap };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  // Merge with curated, dedupe
  const merged = [
    ...(current.related ?? []).map((s) => POSTS.find((p) => p.slug === s)!).filter(Boolean),
    ...scored.map((x) => x.p),
  ];
  const unique = Array.from(new Map(merged.map((p) => [p.slug, p])).values());
  return unique.slice(0, limit);
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-zа-я0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
  "stone", "нейросеть", "нейросети", "нейросетей", "нейросетями",
  "лучший", "лучшая", "лучшие", "онлайн",
  "этот", "этой", "этим", "который",
  "какие", "какую", "какой",
  "how", "what", "which", "the", "and", "for", "with",
  "2026", "2025",
]);

// ── Related Use-cases ──────────────────────────────────────────────
export function relatedUseCases(slug: string, limit = 4): UseCase[] {
  const current = USE_CASES.find((u) => u.slug === slug);
  if (!current) return [];

  return USE_CASES
    .filter((u) => u.slug !== slug)
    .map((u) => {
      let score = 0;
      if (u.category === current.category) score += 10;
      // Overlap in model recommendations
      const overlap = u.models.filter((m) => current.models.includes(m)).length;
      score += overlap * 2;
      return { u, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.u);
}

/** Models recommended for a given use-case (uses the curated `models` field). */
export function modelsForUseCase(slug: string, limit = 4): AIModel[] {
  const uc = USE_CASES.find((u) => u.slug === slug);
  if (!uc) return [];
  return uc.models
    .map((id) => MODELS.find((m) => m.id === id))
    .filter((m): m is AIModel => !!m)
    .slice(0, limit);
}

// ── Related Alternatives ───────────────────────────────────────────
export function relatedAlternatives(slug: string, limit = 4): Alternative[] {
  const current = ALTERNATIVES.find((a) => a.slug === slug);
  if (!current) return [];

  return ALTERNATIVES
    .filter((a) => a.slug !== slug)
    .map((a) => {
      const overlap = a.models.filter((m) => current.models.includes(m)).length;
      return { a, score: overlap };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.a);
}

/** Models recommended by an alternative (from its `.models` field). */
export function modelsForAlternative(slug: string, limit = 6): AIModel[] {
  const alt = ALTERNATIVES.find((a) => a.slug === slug);
  if (!alt) return [];
  return alt.models
    .map((id) => MODELS.find((m) => m.id === id))
    .filter((m): m is AIModel => !!m)
    .slice(0, limit);
}

// ── Related Professions (for /for/[role]) ──────────────────────────
export function relatedProfessions(role: string, limit = 4): Profession[] {
  return PROFESSIONS
    .filter((p) => p.role !== role)
    .slice(0, limit);
}

// ── Contextual CrossLinks (for footer-of-page "useful sections") ───
/**
 * Smart CrossLinks replacement: given the current page's categories
 * and excluded URLs, return up to N contextually-relevant links.
 *
 * Used by <CrossLinks> component when no explicit hubs are passed.
 */
export interface CrossLink {
  href: string;
  label: string;
  icon: string;
  category: "chat" | "image" | "video" | "compare" | "professions" | "pricing" | "blog" | "tools" | "models";
}

const ALL_HUBS: CrossLink[] = [
  { href: "/models", label: "Все 65+ моделей", icon: "🤖", category: "models" },
  { href: "/alternatives/chatgpt", label: "Аналоги ChatGPT", icon: "🔄", category: "chat" },
  { href: "/alternatives/claude", label: "Аналоги Claude", icon: "🧠", category: "chat" },
  { href: "/alternatives/midjourney", label: "Аналоги Midjourney", icon: "🎨", category: "image" },
  { href: "/alternatives/sora", label: "Аналоги Sora", icon: "🎬", category: "video" },
  { href: "/alternatives/perplexity", label: "Аналоги Perplexity", icon: "🔍", category: "chat" },
  { href: "/compare", label: "Сравнение моделей", icon: "⚖️", category: "compare" },
  { href: "/tools/image-generation", label: "Генерация картинок", icon: "🖼️", category: "image" },
  { href: "/tools/video-generation", label: "Генерация видео", icon: "📹", category: "video" },
  { href: "/tools/text-generation", label: "Генерация текстов", icon: "✍️", category: "tools" },
  { href: "/tools/code-generation", label: "Генерация кода", icon: "💻", category: "tools" },
  { href: "/for/marketer", label: "AI для маркетолога", icon: "📢", category: "professions" },
  { href: "/for/developer", label: "AI для программиста", icon: "👨‍💻", category: "professions" },
  { href: "/for/copywriter", label: "AI для копирайтера", icon: "✍️", category: "professions" },
  { href: "/for/business", label: "AI для бизнеса", icon: "💼", category: "professions" },
  { href: "/for/smm", label: "AI для SMM", icon: "📱", category: "professions" },
  { href: "/pricing", label: "Тарифы", icon: "💎", category: "pricing" },
  { href: "/blog", label: "Блог", icon: "📝", category: "blog" },
];

export interface CrossLinksQuery {
  /** Priority categories — hubs matching these appear first. */
  prefer?: CrossLink["category"][];
  /** Category IDs or href substrings to exclude. */
  exclude?: string[];
  /** How many to return (default 6). */
  limit?: number;
}

export function crossLinksFor(query: CrossLinksQuery = {}): CrossLink[] {
  const { prefer = [], exclude = [], limit = 6 } = query;
  const filtered = ALL_HUBS.filter(
    (h) => !exclude.some((e) => h.href.includes(e) || h.category === e),
  );
  if (prefer.length === 0) return filtered.slice(0, limit);

  const preferred = filtered.filter((h) => prefer.includes(h.category));
  const rest = filtered.filter((h) => !prefer.includes(h.category));
  return [...preferred, ...rest].slice(0, limit);
}

// ── Broad pillar → cluster mapping (for hub pages) ─────────────────
export const PILLARS = {
  "image-ai": {
    title: "Нейросети для генерации картинок",
    modelCategories: ["image"] as ModelCategory[],
    alternatives: ["midjourney"],
    useCases: ["generate-images", "product-photo", "social-media-visuals"],
    relatedBlogs: ["nejroset-dlya-generacii-kartinok", "midjourney-analogi-besplatno-rossiya"],
  },
  "video-ai": {
    title: "Нейросети для генерации видео",
    modelCategories: ["video"] as ModelCategory[],
    alternatives: ["sora", "runway"],
    useCases: ["generate-video", "reels-content"],
    relatedBlogs: ["nejroseti-dlya-generacii-video-2026", "ai-video-generation-2026"],
  },
  "chat-models": {
    title: "Чат-модели: GPT, Claude, Gemini",
    modelCategories: ["chat", "reason"] as ModelCategory[],
    alternatives: ["chatgpt", "claude", "gemini", "deepseek", "grok"],
    useCases: ["napisat-statyu", "perevod-teksta"],
    relatedBlogs: ["gpt5-vs-claude-sonnet-vs-gemini", "claude-opus-vs-gpt-5", "guide-50-ai-models"],
  },
  "coding-ai": {
    title: "AI для программирования",
    modelCategories: ["code"] as ModelCategory[],
    alternatives: [],
    useCases: [],
    relatedBlogs: [],
  },
  "business-ai": {
    title: "AI для бизнеса и автоматизации",
    modelCategories: ["chat"] as ModelCategory[],
    alternatives: [],
    useCases: [],
    relatedBlogs: ["ii-dlya-biznesa-v-rossii"],
  },
} as const;

export type PillarTopic = keyof typeof PILLARS;

export function getPillarModels(topic: PillarTopic): AIModel[] {
  const pillar = PILLARS[topic];
  return MODELS.filter((m) => pillar.modelCategories.includes(m.category));
}
