"use client";

import { useState } from "react";
import { MODELS, type ModelCategory } from "@/lib/models";
import { getModelIconSrc } from "@/lib/company-icon";

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
  Stability: "bg-purple-100 text-purple-700",
  Alibaba: "bg-orange-100 text-orange-700",
  Moonshot: "bg-cyan-100 text-cyan-700",
  MiniMax: "bg-pink-100 text-pink-700",
  Microsoft: "bg-blue-100 text-blue-700",
  NVIDIA: "bg-green-100 text-green-700",
  Cohere: "bg-emerald-100 text-emerald-700",
  Zhipu: "bg-sky-100 text-sky-700",
  Gryphe: "bg-violet-100 text-violet-700",
};

// Badges for popular/new/fast models
const modelBadges: Record<string, { label: string; color: string }[]> = {
  "gpt-5.4": [{ label: "Новинка", color: "bg-blue-500 text-white" }, { label: "Флагман", color: "bg-amber-100 text-amber-700" }],
  "claude-opus-4": [{ label: "Популярная", color: "bg-pink-100 text-pink-700" }, { label: "Для текстов", color: "bg-purple-100 text-purple-700" }],
  "gpt-4o-mini": [{ label: "Бесплатная", color: "bg-teal-light text-teal" }, { label: "Быстрая", color: "bg-sky-100 text-sky-700" }],
  "gemini-2.0-flash": [{ label: "Бесплатная", color: "bg-teal-light text-teal" }, { label: "1M контекст", color: "bg-blue-100 text-blue-700" }],
  "deepseek-r1": [{ label: "Популярная", color: "bg-pink-100 text-pink-700" }, { label: "Reasoning", color: "bg-violet-100 text-violet-700" }],
  "grok-3": [{ label: "Новинка", color: "bg-blue-500 text-white" }, { label: "Без цензуры", color: "bg-slate-100 text-slate-700" }],
  "claude-haiku-4.5": [{ label: "Бесплатная", color: "bg-teal-light text-teal" }, { label: "Быстрая", color: "bg-sky-100 text-sky-700" }],
  "gemini-2.5-pro": [{ label: "Флагман", color: "bg-amber-100 text-amber-700" }, { label: "1M контекст", color: "bg-blue-100 text-blue-700" }],
  "nano-banana-pro": [{ label: "Картинки 4K", color: "bg-pink-100 text-pink-700" }],
  "o3": [{ label: "Reasoning", color: "bg-violet-100 text-violet-700" }, { label: "Для логики", color: "bg-indigo-100 text-indigo-700" }],
  "devstral": [{ label: "Для кода", color: "bg-emerald-100 text-emerald-700" }],
  "perplexity-sonar-pro": [{ label: "Поиск", color: "bg-indigo-100 text-indigo-700" }, { label: "Realtime", color: "bg-emerald-100 text-emerald-700" }],
};

function formatPrice(model: (typeof MODELS)[number]) {
  if (model.tier === "free") return "FREE";
  const s = model.speed || "medium";
  if (s === "instant") return "Мгновенная";
  if (s === "fast") return "Быстрая";
  if (s === "slow") return "Глубокая";
  return "Средняя";
}

const TABS: { id: "all" | ModelCategory; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "chat", label: "Chat" },
  { id: "image", label: "Image" },
  { id: "search", label: "Search" },
  { id: "reason", label: "Глубокий анализ" },
  { id: "code", label: "Code" },
];

export default function ModelGrid() {
  const [tab, setTab] = useState<"all" | ModelCategory>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const filtered = tab === "all" ? MODELS.slice(0, isMobile ? 8 : 16) : MODELS.filter((m) => m.category === tab).slice(0, isMobile ? 6 : 20);

  return (
    <section id="models" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Технологии OpenAI, Anthropic, Google, xAI — под вашим управлением
        </h2>
        <p className="text-text/60 text-center mb-10 max-w-xl mx-auto">
          От бесплатных до самых мощных. Все доступны прямо сейчас.
        </p>

        <div
          className="flex justify-center gap-1.5 mb-10 flex-wrap"
          role="tablist"
          aria-label="Категории моделей"
          onKeyDown={(e) => {
            const idx = TABS.findIndex(t => t.id === tab);
            if (e.key === "ArrowRight") { e.preventDefault(); setTab(TABS[(idx + 1) % TABS.length].id); }
            if (e.key === "ArrowLeft") { e.preventDefault(); setTab(TABS[(idx - 1 + TABS.length) % TABS.length].id); }
          }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              tabIndex={tab === t.id ? 0 : -1}
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30 ${
                tab === t.id
                  ? "bg-accent text-white shadow-sm"
                  : "bg-white text-text/40 hover:text-text/60 border border-text/[0.06]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {(() => {
            const cols = 4;
            const rows: (typeof filtered)[] = [];
            for (let i = 0; i < filtered.length; i += cols) rows.push(filtered.slice(i, i + cols));

            return rows.map((row, ri) => {
              const expandedInRow = row.find(m => m.id === expanded);
              return (
                <div key={ri}>
                  {/* Row of cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {row.map((model) => {
                      const isOpen = expanded === model.id;
                      const badges = modelBadges[model.id] || [];
                      return (
                        <div
                          key={model.id}
                          className={`bg-white rounded-2xl border transition-all cursor-pointer card-hover animate-fadeIn ${
                            isOpen ? "border-accent ring-2 ring-accent/20 shadow-lg" : "border-text/5"
                          }`}
                          onClick={() => setExpanded(isOpen ? null : model.id)}
                        >
                          <div className="p-5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                {(() => { const s = getModelIconSrc(model.id, model.company); return s ? <img src={s} alt={`${model.company} ${model.name}`} width={36} height={36} className="rounded-lg shrink-0 shadow-sm" /> : null; })()}
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${companyColors[model.company] ?? "bg-gray-100 text-gray-700"}`}>{model.company}</span>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${model.tier === "free" ? "bg-teal-light text-teal" : "bg-accent/10 text-accent"}`}>{formatPrice(model)}</span>
                            </div>
                            <h3 className="font-bold text-sm mb-1.5">{model.name}</h3>
                            {model.description && (
                              <p className="text-[12px] text-text/60 mb-2.5 leading-relaxed line-clamp-2">{model.description}</p>
                            )}
                            {badges.length > 0 && (
                              <div className="flex gap-1 flex-wrap mb-2">
                                {badges.map(b => (<span key={b.label} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${b.color}`}>{b.label}</span>))}
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              {model.context && <span className="text-[10px] text-text/40 font-medium">{model.context}</span>}
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

                  {/* Expanded panel BELOW the full row — desktop only */}
                  {expandedInRow && (
                    <div className="mt-3 bg-white border-2 border-accent/20 rounded-2xl p-6 shadow-lg animate-fadeIn hidden sm:block">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Left: info */}
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                          {(() => { const s = getModelIconSrc(expandedInRow.id, expandedInRow.company); return s ? <img src={s} alt={`${expandedInRow.company} ${expandedInRow.name}`} width={44} height={44} className="rounded-lg shrink-0 shadow-sm" /> : null; })()}
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${companyColors[expandedInRow.company] ?? "bg-gray-100 text-gray-700"}`}>{expandedInRow.company}</span>
                        </div>
                            <h3 className="font-extrabold text-lg">{expandedInRow.name}</h3>
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${expandedInRow.tier === "free" ? "bg-teal-light text-teal" : "bg-accent/10 text-accent"}`}>{formatPrice(expandedInRow)}</span>
                          </div>
                          <p className="text-sm text-text leading-relaxed">{expandedInRow.description}</p>
                          {expandedInRow.strengths && (
                            <div className="flex flex-wrap gap-2">
                              {expandedInRow.strengths.map(s => (
                                <span key={s} className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-accent/10 text-accent border border-accent/15">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* Right: stats + CTA */}
                        <div className="w-full md:w-64 shrink-0 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-bg rounded-xl p-3 border border-text/[0.06]">
                              <span className="text-text/40 text-[10px] uppercase font-semibold">Контекст</span>
                              <p className="font-bold text-text mt-0.5 text-sm">{expandedInRow.context || "—"}</p>
                            </div>
                            <div className="bg-bg rounded-xl p-3 border border-text/[0.06]">
                              <span className="text-text/40 text-[10px] uppercase font-semibold">Цена</span>
                              <p className="font-bold text-accent mt-0.5 text-sm">{formatPrice(expandedInRow)}</p>
                            </div>
                          </div>
                          <a
                            href={`/webchat?model=${expandedInRow.id}`}
                            className="block text-center bg-accent text-white px-4 py-3 min-h-[48px] rounded-xl text-sm font-bold hover:bg-accent/90 transition-all focus:outline-none focus:ring-2 focus:ring-accent/30 shadow-md shadow-accent/20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Попробовать {expandedInRow.name}
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

        <div className="text-center mt-10">
          <a href="/models" className="inline-flex items-center gap-2 text-accent font-bold hover:underline text-lg">
            Все 65+ нейросетей <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
