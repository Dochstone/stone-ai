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
};

type SortKey = "name" | "price-asc" | "price-desc";

function formatPrice(model: AIModel) {
  if (model.priceUnit) return `$${model.pricePerMillion}${model.priceUnit}`;
  return `$${model.pricePerMillion}/1M`;
}

export default function ModelCatalog() {
  const [company, setCompany] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [tier, setTier] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [expanded, setExpanded] = useState<string | null>(null);

  let filtered = MODELS.filter((m) => {
    if (company !== "all" && m.company !== company) return false;
    if (category !== "all" && m.category !== category) return false;
    if (tier !== "all" && m.tier !== tier) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sort === "price-asc") return a.pricePerMillion - b.pricePerMillion;
    if (sort === "price-desc") return b.pricePerMillion - a.pricePerMillion;
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        <select
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="bg-white border border-text/10 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="all">Все провайдеры</option>
          {COMPANIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-white border border-text/10 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="all">Все категории</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{categoryLabels[c]}</option>
          ))}
        </select>

        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="bg-white border border-text/10 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="all">Все тарифы</option>
          <option value="free">Бесплатные</option>
          <option value="pro">Pro</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="bg-white border border-text/10 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="name">По имени</option>
          <option value="price-asc">Цена ↑</option>
          <option value="price-desc">Цена ↓</option>
        </select>
      </div>

      {/* Count */}
      <p className="text-sm text-text/40 mb-6">
        {filtered.length}{" "}
        {filtered.length === 1 ? "модель" : filtered.length < 5 ? "модели" : "моделей"}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((model) => {
          const isExpanded = expanded === model.id;
          return (
            <div
              key={model.id}
              className={`bg-white rounded-2xl border transition-all cursor-pointer card-hover ${
                isExpanded ? "border-accent/30 shadow-md" : "border-text/5"
              }`}
              onClick={() => setExpanded(isExpanded ? null : model.id)}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${companyColors[model.company] ?? "bg-gray-100 text-gray-700"}`}>
                    {model.company}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      model.tier === "free"
                        ? "bg-teal-light text-teal"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {model.tier === "free" ? "FREE" : "PRO"}
                  </span>
                </div>

                <h3 className="font-bold mb-2">{model.name}</h3>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-accent">
                    {formatPrice(model)}
                  </span>
                  <span className="text-xs text-text/35">
                    {categoryLabels[model.category]}
                  </span>
                  {model.context && (
                    <span className="text-xs text-text/25">
                      {model.context}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-text/5 px-5 py-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-text/35 text-xs">Категория</span>
                      <p className="font-medium">
                        {categoryLabels[model.category]}
                      </p>
                    </div>
                    <div>
                      <span className="text-text/35 text-xs">Контекст</span>
                      <p className="font-medium">{model.context || "---"}</p>
                    </div>
                    <div>
                      <span className="text-text/35 text-xs">Цена за 1M</span>
                      <p className="font-medium text-accent">
                        {formatPrice(model)}
                      </p>
                    </div>
                    <div>
                      <span className="text-text/35 text-xs">Тариф</span>
                      <p className="font-medium">
                        {model.tier === "free"
                          ? "Бесплатный (10+5/день)"
                          : "Per-token"}
                      </p>
                    </div>
                  </div>
                  <a
                    href="/webchat"
                    className="block text-center bg-accent text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-accent/90 transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Попробовать
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
