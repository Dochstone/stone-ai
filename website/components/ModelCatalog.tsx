"use client";

import { useState } from "react";
import {
  MODELS,
  COMPANIES,
  CATEGORIES,
  type AIModel,
  type ModelCategory,
} from "@/lib/models";

const categoryLabels: Record<ModelCategory, string> = {
  chat: "Чат",
  image: "Изображения",
  reason: "Reasoning",
  search: "Поиск",
  code: "Код",
  video: "Видео",
  "3d": "3D",
};

const companyColors: Record<string, string> = {
  OpenAI: "bg-green-100 text-green-700",
  Anthropic: "bg-orange-100 text-orange-700",
  Google: "bg-blue-100 text-blue-700",
  Meta: "bg-sky-100 text-sky-700",
  Mistral: "bg-purple-100 text-purple-700",
  DeepSeek: "bg-cyan-100 text-cyan-700",
  xAI: "bg-slate-100 text-slate-700",
  Perplexity: "bg-indigo-100 text-indigo-700",
  BFL: "bg-amber-100 text-amber-700",
  Stability: "bg-pink-100 text-pink-700",
  Alibaba: "bg-orange-50 text-orange-600",
  MiniMax: "bg-rose-100 text-rose-700",
  Zhipu: "bg-violet-100 text-violet-700",
  Moonshot: "bg-blue-50 text-blue-600",
  Cohere: "bg-yellow-100 text-yellow-700",
  Microsoft: "bg-blue-100 text-blue-700",
  NVIDIA: "bg-lime-100 text-lime-700",
  Gryphe: "bg-red-100 text-red-700",
  Kuaishou: "bg-red-100 text-red-700",
  Runway: "bg-slate-100 text-slate-700",
  Pika: "bg-pink-100 text-pink-700",
  Luma: "bg-indigo-100 text-indigo-700",
  Tripo3D: "bg-cyan-100 text-cyan-700",
};

type SortKey = "name" | "price-asc" | "price-desc";

function formatPrice(model: AIModel) {
  if (model.tier === "free") return "FREE";
  if (model.priceUnit) return `$${model.pricePerMillion}${model.priceUnit}`;
  return `$${model.pricePerMillion}/1M`;
}

export default function ModelCatalog() {
  const [company, setCompany] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [tier, setTier] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  let filtered = MODELS.filter((m) => {
    if (company !== "all" && m.company !== company) return false;
    if (category !== "all" && m.category !== category) return false;
    if (tier !== "all" && m.tier !== tier) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.company.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sort === "price-asc") return a.pricePerMillion - b.pricePerMillion;
    if (sort === "price-desc") return b.pricePerMillion - a.pricePerMillion;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      {/* Search + Filters */}
      <div className="space-y-3 mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск модели..."
          className="w-full bg-white border border-text/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        />
        <div className="flex flex-wrap gap-2">
          {[{ id: "all", label: "Все" }, ...CATEGORIES.map(c => ({ id: c, label: categoryLabels[c] }))].map((t) => (
            <button
              key={t.id}
              onClick={() => setCategory(t.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                category === t.id ? "bg-accent text-white" : "bg-white text-text/40 border border-text/[0.06] hover:text-text/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={company} onChange={(e) => setCompany(e.target.value)}
            className="bg-white border border-text/10 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-accent">
            <option value="all">Все провайдеры</option>
            {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={tier} onChange={(e) => setTier(e.target.value)}
            className="bg-white border border-text/10 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-accent">
            <option value="all">Все тарифы</option>
            <option value="free">Бесплатные</option>
            <option value="pro">Pro</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-white border border-text/10 rounded-lg px-3 py-1.5 text-xs font-medium focus:outline-none focus:border-accent">
            <option value="name">По имени</option>
            <option value="price-asc">Цена ↑</option>
            <option value="price-desc">Цена ↓</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-text/40 mb-6">
        {filtered.length} {filtered.length === 1 ? "модель" : filtered.length < 5 ? "модели" : "моделей"}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((model) => {
          const isExpanded = expanded === model.id;
          return (
            <div
              key={model.id}
              className={`bg-white rounded-2xl border transition-all cursor-pointer card-hover ${
                isExpanded ? "border-accent/30 shadow-lg" : "border-text/5"
              }`}
              onClick={() => setExpanded(isExpanded ? null : model.id)}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${companyColors[model.company] ?? "bg-gray-100 text-gray-700"}`}>
                    {model.company}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    model.tier === "free" ? "bg-teal-light text-teal" : "bg-accent/10 text-accent"
                  }`}>
                    {model.tier === "free" ? "FREE" : formatPrice(model)}
                  </span>
                </div>

                <h3 className="font-bold mb-1.5">{model.name}</h3>

                {model.description && (
                  <p className="text-xs text-text/50 mb-3 line-clamp-2">{model.description}</p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-text/30 font-medium">{categoryLabels[model.category]}</span>
                  {model.context && <span className="text-[10px] text-text/20">{model.context}</span>}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-text/5 px-5 py-4 space-y-4">
                  {model.description && (
                    <p className="text-sm text-text/70 leading-relaxed">{model.description}</p>
                  )}

                  {/* Strengths */}
                  {model.strengths && model.strengths.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {model.strengths.map((s) => (
                        <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-bg text-text/50 border border-text/[0.06]">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-text/30 text-[10px] uppercase">Категория</span>
                      <p className="font-medium text-xs">{categoryLabels[model.category]}</p>
                    </div>
                    <div>
                      <span className="text-text/30 text-[10px] uppercase">Контекст</span>
                      <p className="font-medium text-xs">{model.context || "—"}</p>
                    </div>
                    <div>
                      <span className="text-text/30 text-[10px] uppercase">Цена</span>
                      <p className="font-medium text-xs text-accent">{formatPrice(model)}</p>
                    </div>
                    <div>
                      <span className="text-text/30 text-[10px] uppercase">Тариф</span>
                      <p className="font-medium text-xs">{model.tier === "free" ? "Бесплатный (15/день)" : "Per-token"}</p>
                    </div>
                  </div>

                  <a
                    href={`/webchat?model=${model.id}`}
                    className="block text-center bg-accent text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-accent/90 transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Попробовать {model.name}
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
