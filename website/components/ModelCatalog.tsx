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
  reason: "Глубокий анализ",
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

      {/* Grid — rows of 4 with expand below row */}
      <div className="space-y-4">
        {(() => {
          const cols = 4;
          const rows: typeof filtered[] = [];
          for (let i = 0; i < filtered.length; i += cols) rows.push(filtered.slice(i, i + cols));

          return rows.map((row, ri) => {
            const exp = row.find(m => m.id === expanded);
            return (
              <div key={ri}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {row.map((model) => {
                    const isOpen = expanded === model.id;
                    return (
                      <div
                        key={model.id}
                        className={`bg-white rounded-2xl border transition-all cursor-pointer card-hover ${
                          isOpen ? "border-accent ring-2 ring-accent/20 shadow-lg" : "border-text/5"
                        }`}
                        onClick={() => setExpanded(isOpen ? null : model.id)}
                      >
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${companyColors[model.company] ?? "bg-gray-100 text-gray-700"}`}>{model.company}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${model.tier === "free" ? "bg-teal-light text-teal" : "bg-accent/10 text-accent"}`}>{model.tier === "free" ? "FREE" : formatPrice(model)}</span>
                          </div>
                          <h3 className="font-bold text-sm mb-1.5">{model.name}</h3>
                          {model.description && <p className="text-[12px] text-text/60 mb-2.5 leading-relaxed line-clamp-2">{model.description}</p>}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-text/40">{categoryLabels[model.category]}</span>
                            {model.context && <span className="text-[10px] text-text/30">{model.context}</span>}
                            <span className="text-[10px] text-accent font-semibold ml-auto">{isOpen ? "Свернуть" : "Подробнее →"}</span>
                          </div>
                        </div>
                        {/* Mobile inline expand */}
                        {isOpen && (
                          <div className="sm:hidden border-t border-accent/10 p-5 space-y-3 animate-fadeIn">
                            <p className="text-sm text-text leading-relaxed">{model.description}</p>
                            {model.strengths && (
                              <div className="flex flex-wrap gap-1.5">
                                {model.strengths.map(s => (
                                  <span key={s} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-accent/10 text-accent border border-accent/15">{s}</span>
                                ))}
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-bg rounded-xl p-3">
                                <span className="text-text/40 text-[10px] uppercase font-semibold">Контекст</span>
                                <p className="font-bold text-sm mt-0.5">{model.context || "—"}</p>
                              </div>
                              <div className="bg-bg rounded-xl p-3">
                                <span className="text-text/40 text-[10px] uppercase font-semibold">Цена</span>
                                <p className="font-bold text-accent text-sm mt-0.5">{formatPrice(model)}</p>
                              </div>
                            </div>
                            <a
                              href={`/webchat?model=${model.id}`}
                              className="block text-center bg-accent text-white px-4 py-3 min-h-[44px] rounded-xl text-sm font-bold hover:bg-accent/90 transition-all"
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

                {exp && (
                  <div className="mt-3 bg-white border-2 border-accent/20 rounded-2xl p-6 shadow-lg animate-fadeIn hidden sm:block">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${companyColors[exp.company] ?? "bg-gray-100 text-gray-700"}`}>{exp.company}</span>
                          <h3 className="font-extrabold text-lg">{exp.name}</h3>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${exp.tier === "free" ? "bg-teal-light text-teal" : "bg-accent/10 text-accent"}`}>{formatPrice(exp)}</span>
                        </div>
                        <p className="text-sm text-text leading-relaxed">{exp.description}</p>
                        {exp.strengths && (
                          <div className="flex flex-wrap gap-2">
                            {exp.strengths.map(s => (
                              <span key={s} className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-accent/10 text-accent border border-accent/15">{s}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="w-full md:w-64 shrink-0 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-bg rounded-xl p-3 border border-text/[0.06]">
                            <span className="text-text/40 text-[10px] uppercase font-semibold">Контекст</span>
                            <p className="font-bold text-text mt-0.5 text-sm">{exp.context || "—"}</p>
                          </div>
                          <div className="bg-bg rounded-xl p-3 border border-text/[0.06]">
                            <span className="text-text/40 text-[10px] uppercase font-semibold">Цена</span>
                            <p className="font-bold text-accent mt-0.5 text-sm">{formatPrice(exp)}</p>
                          </div>
                        </div>
                        <a
                          href={`/webchat?model=${exp.id}`}
                          className="block text-center bg-accent text-white px-4 py-3 min-h-[48px] rounded-xl text-sm font-bold hover:bg-accent/90 transition-all shadow-md shadow-accent/20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Попробовать {exp.name}
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          });
        })()}
      </div>
    </>
  );
}
