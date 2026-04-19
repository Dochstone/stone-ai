"use client";

import { useState, useMemo } from "react";
import ProviderIcon from "@/components/ProviderIcon";

const MODELS_DATA = [
  // Free (Tier 1)
  { name: "GPT-4o mini", company: "OpenAI", category: "chat", tier: "Free", context: "128K" },
  { name: "Gemini 2.0 Flash", company: "Google", category: "chat", tier: "Free", context: "1M" },
  { name: "Claude Haiku 4.5", company: "Anthropic", category: "chat", tier: "Free", context: "200K" },
  { name: "Llama 4 Maverick", company: "Meta", category: "chat", tier: "Free", context: "1M" },
  { name: "Mistral Large", company: "Mistral", category: "chat", tier: "Free", context: "128K" },
  // Start (Tier 2)
  { name: "GPT-4.1 mini", company: "OpenAI", category: "chat", tier: "Start", context: "1M" },
  { name: "GPT-4.1 nano", company: "OpenAI", category: "chat", tier: "Start", context: "1M" },
  { name: "DeepSeek V3", company: "DeepSeek", category: "chat", tier: "Start", context: "128K" },
  { name: "DeepSeek R1", company: "DeepSeek", category: "chat", tier: "Start", context: "164K" },
  { name: "Gemini 2.5 Flash", company: "Google", category: "chat", tier: "Start", context: "1M" },
  { name: "Claude Sonnet 4", company: "Anthropic", category: "chat", tier: "Start", context: "200K" },
  { name: "Claude Sonnet 4.5", company: "Anthropic", category: "chat", tier: "Start", context: "200K" },
  { name: "Grok 3 mini", company: "xAI", category: "chat", tier: "Start", context: "131K" },
  { name: "Qwen 3 235B", company: "Alibaba", category: "chat", tier: "Start", context: "40K" },
  { name: "MiniMax M2.5", company: "MiniMax", category: "chat", tier: "Start", context: "1M" },
  { name: "Command R7", company: "Cohere", category: "chat", tier: "Start", context: "128K" },
  { name: "Mistral Small", company: "Mistral", category: "chat", tier: "Start", context: "32K" },
  // Pro (Tier 3)
  { name: "GPT-5.4", company: "OpenAI", category: "chat", tier: "Pro", context: "1M" },
  { name: "GPT-5.1", company: "OpenAI", category: "chat", tier: "Pro", context: "400K" },
  { name: "GPT-4.1", company: "OpenAI", category: "chat", tier: "Pro", context: "1M" },
  { name: "Gemini 2.5 Pro", company: "Google", category: "chat", tier: "Pro", context: "1M" },
  { name: "Gemini 3 Pro", company: "Google", category: "chat", tier: "Pro", context: "1M" },
  { name: "Claude Opus 4", company: "Anthropic", category: "chat", tier: "Pro", context: "200K" },
  { name: "Claude Opus 4.5", company: "Anthropic", category: "chat", tier: "Pro", context: "200K" },
  { name: "Grok 3", company: "xAI", category: "chat", tier: "Pro", context: "131K" },
  { name: "Kimi K2.5", company: "Moonshot", category: "chat", tier: "Pro", context: "128K" },
  // Reasoning
  { name: "o3", company: "OpenAI", category: "reasoning", tier: "Pro", context: "200K" },
  { name: "o4-mini", company: "OpenAI", category: "reasoning", tier: "Pro", context: "200K" },
  { name: "Claude Haiku Think", company: "Anthropic", category: "reasoning", tier: "Pro", context: "200K" },
  { name: "Gemini Flash Think", company: "Google", category: "reasoning", tier: "Pro", context: "1M" },
  // Image
  { name: "Nano Banana", company: "Google", category: "image", tier: "Pro", context: "1M" },
  { name: "Nano Banana Pro", company: "Google", category: "image", tier: "Pro", context: "65K" },
  { name: "GPT-5 Image", company: "OpenAI", category: "image", tier: "Pro", context: "128K" },
  { name: "GPT-5 Image Mini", company: "OpenAI", category: "image", tier: "Pro", context: "128K" },
  // Code
  { name: "Devstral", company: "Mistral", category: "code", tier: "Pro", context: "128K" },
  // Search
  { name: "Perplexity Pro", company: "Perplexity", category: "search", tier: "Pro", context: "200K" },
  { name: "Perplexity Sonar", company: "Perplexity", category: "search", tier: "Pro", context: "127K" },
  // Lite models
  { name: "Gemma 3n 4B", company: "Google", category: "chat", tier: "Start", context: "32K" },
  { name: "Nemotron 70B", company: "NVIDIA", category: "chat", tier: "Start", context: "128K" },
  { name: "Phi-4", company: "Microsoft", category: "chat", tier: "Start", context: "16K" },
  { name: "Llama 3.3 70B", company: "Meta", category: "chat", tier: "Start", context: "128K" },
];

const TIER_COLORS: Record<string, string> = {
  Free: "bg-teal/10 text-teal",
  Start: "bg-blue-500/10 text-blue-500",
  Pro: "bg-accent/10 text-accent",
};

const CAT_LABELS: Record<string, string> = {
  chat: "Чат",
  image: "Картинки",
  reasoning: "Reasoning",
  code: "Код",
  search: "Поиск",
};

const CAT_COLORS: Record<string, string> = {
  chat: "bg-emerald-500/10 text-emerald-600",
  image: "bg-pink-500/10 text-pink-500",
  reasoning: "bg-amber-500/10 text-amber-600",
  code: "bg-violet-500/10 text-violet-500",
  search: "bg-sky-500/10 text-sky-500",
};

const TIERS = ["Все", "Free", "Start", "Pro"] as const;
const CATEGORIES = [
  { key: "all", label: "Все" },
  { key: "chat", label: "Чат" },
  { key: "image", label: "Картинки" },
  { key: "reasoning", label: "Reasoning" },
  { key: "code", label: "Код" },
  { key: "search", label: "Поиск" },
] as const;

export default function ModelsTable() {
  const [tierFilter, setTierFilter] = useState<string>("Все");
  const [catFilter, setCatFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return MODELS_DATA.filter((m) => {
      if (tierFilter !== "Все" && m.tier !== tierFilter) return false;
      if (catFilter !== "all" && m.category !== catFilter) return false;
      return true;
    });
  }, [tierFilter, catFilter]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-8">
      <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-2">
        Все AI модели
      </h2>
      <p className="text-text/40 text-sm text-center mb-8">
        {MODELS_DATA.length} моделей от 10+ провайдеров
      </p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex flex-wrap gap-1.5">
          {TIERS.map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tierFilter === t
                  ? "bg-accent text-white"
                  : "bg-text/[0.04] text-text/50 hover:bg-text/[0.08]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              onClick={() => setCatFilter(c.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                catFilter === c.key
                  ? "bg-accent text-white"
                  : "bg-text/[0.04] text-text/50 hover:bg-text/[0.08]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <p className="text-xs text-text/30 mb-3">
        Показано {filtered.length} из {MODELS_DATA.length}
      </p>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white rounded-2xl border border-text/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-text/[0.02]">
              <th className="text-left py-3 px-5 text-text/40 text-xs font-semibold uppercase tracking-wider">
                Модель
              </th>
              <th className="text-left py-3 px-4 text-text/40 text-xs font-semibold uppercase tracking-wider">
                Компания
              </th>
              <th className="text-left py-3 px-4 text-text/40 text-xs font-semibold uppercase tracking-wider">
                Категория
              </th>
              <th className="text-left py-3 px-4 text-text/40 text-xs font-semibold uppercase tracking-wider">
                Тариф
              </th>
              <th className="text-right py-3 px-5 text-text/40 text-xs font-semibold uppercase tracking-wider">
                Контекст
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => (
              <tr
                key={`${m.name}-${i}`}
                className="border-t border-text/[0.04] hover:bg-text/[0.02] transition-colors"
              >
                <td className="py-3 px-5 font-medium text-text/80 text-[13px]">
                  {m.name}
                </td>
                <td className="py-3 px-4 text-text/50 text-[13px]">
                  <div className="flex items-center gap-1.5">
                    <ProviderIcon company={m.company} size={20} />
                    {m.company}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      CAT_COLORS[m.category] || "bg-text/5 text-text/50"
                    }`}
                  >
                    {CAT_LABELS[m.category] || m.category}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      TIER_COLORS[m.tier] || "bg-text/5 text-text/50"
                    }`}
                  >
                    {m.tier}
                  </span>
                </td>
                <td className="py-3 px-5 text-right text-text/50 text-[13px] tabular-nums">
                  {m.context}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {filtered.map((m, i) => (
          <div
            key={`${m.name}-${i}`}
            className="bg-white rounded-xl border border-text/5 p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-text/80 text-sm">{m.name}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  TIER_COLORS[m.tier] || "bg-text/5 text-text/50"
                }`}
              >
                {m.tier}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text/40">
              <ProviderIcon company={m.company} size={16} />
              <span>{m.company}</span>
              <span className="text-text/10">|</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  CAT_COLORS[m.category] || "bg-text/5 text-text/50"
                }`}
              >
                {CAT_LABELS[m.category] || m.category}
              </span>
              <span className="ml-auto tabular-nums">{m.context}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
