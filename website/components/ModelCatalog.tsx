"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MODELS,
  COMPANIES,
  CATEGORIES,
  type AIModel,
  type ModelCategory,
} from "@/lib/models";
import { planPrice } from "@/lib/pricing";
import ProviderIcon from "@/components/ProviderIcon";

const categoryLabels: Record<ModelCategory, string> = {
  chat: "Чат",
  image: "Изображения",
  reason: "Глубокий анализ",
  search: "Поиск",
  code: "Код",
  video: "Видео",
  "3d": "3D",
};

// Model tier based on pricing (same as WebChat)
const FREE_MODEL_IDS = new Set([
  "gpt-4o-mini", "gemini-2.0-flash", "deepseek-v3",
  "llama-4-maverick", "mistral-small", "qwen-turbo", "nano-banana",
]);
const MINI_MODEL_IDS = new Set([
  "gpt-4o-mini", "gemini-2.0-flash", "deepseek-v3",
  "llama-4-maverick", "mistral-small", "qwen-turbo", "nano-banana",
  "claude-haiku-4.5", "claude-sonnet-4", "gpt-4.1-mini", "gpt-5.1",
  "gemini-2.5-flash", "grok-3-mini", "deepseek-r1", "deepseek-v3.2",
  "nano-banana-pro", "gpt-5-image-mini", "gpt-5-image",
]);

function getTierLabel(id: string): { label: string; style: string } {
  if (FREE_MODEL_IDS.has(id)) return { label: "Free", style: "bg-teal-light text-teal" };
  if (MINI_MODEL_IDS.has(id)) return { label: "Start", style: "bg-cyan-500/10 text-cyan-600" };
  return { label: "Pro", style: "bg-purple-500/10 text-purple-600" };
}

function getSpeed(model: AIModel): string {
  const s = model.speed || "medium";
  if (s === "instant") return "Мгновенная";
  if (s === "fast") return "Быстрая";
  if (s === "slow") return "Мощная";
  return "Средняя";
}

type SortKey = "name" | "tier" | "context";

export default function ModelCatalog() {
  const [company, setCompany] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [tier, setTier] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Accept ?q= from URL so SearchAction in JSON-LD resolves to real results
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, []);

  let filtered = MODELS.filter((m) => {
    if (company !== "all" && m.company !== company) return false;
    if (category !== "all" && m.category !== category) return false;
    if (tier === "free" && !FREE_MODEL_IDS.has(m.id)) return false;
    if (tier === "mini" && !MINI_MODEL_IDS.has(m.id)) return false;
    if (tier === "max" && MINI_MODEL_IDS.has(m.id)) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.company.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sort === "tier") {
      const tierOrder = (id: string) => FREE_MODEL_IDS.has(id) ? 0 : MINI_MODEL_IDS.has(id) ? 1 : 2;
      return tierOrder(a.id) - tierOrder(b.id);
    }
    if (sort === "context") {
      const parseCtx = (c: string) => {
        if (!c) return 0;
        const n = parseFloat(c);
        return c.includes("M") ? n * 1000 : n;
      };
      return parseCtx(b.context) - parseCtx(a.context);
    }
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
          className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        />
        <div className="flex flex-wrap gap-2">
          {[{ id: "all", label: "Все" }, ...CATEGORIES.map(c => ({ id: c, label: categoryLabels[c] }))].map((t) => (
            <button
              key={t.id}
              onClick={() => setCategory(t.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                category === t.id ? "bg-accent text-white" : "bg-bg text-text/40 border border-text/[0.06] hover:text-text/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={company} onChange={(e) => setCompany(e.target.value)}
            className="bg-bg border border-text/10 rounded-lg px-3 py-1.5 text-xs font-medium text-text focus:outline-none focus:border-accent">
            <option value="all">Все провайдеры</option>
            {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={tier} onChange={(e) => setTier(e.target.value)}
            className="bg-bg border border-text/10 rounded-lg px-3 py-1.5 text-xs font-medium text-text focus:outline-none focus:border-accent">
            <option value="all">Все тарифы</option>
            <option value="free">Free (бесплатные)</option>
            <option value="mini">{`Start (от ${planPrice("mini")})`}</option>
            <option value="max">{`Pro (от ${planPrice("max")})`}</option>
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-bg border border-text/10 rounded-lg px-3 py-1.5 text-xs font-medium text-text focus:outline-none focus:border-accent">
            <option value="name">По имени</option>
            <option value="tier">По тарифу</option>
            <option value="context">По контексту ↓</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-text/40 mb-6">
        {filtered.length} {filtered.length === 1 ? "модель" : filtered.length < 5 ? "модели" : "моделей"}
      </p>

      {/* Grid */}
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
                    const tierInfo = getTierLabel(model.id);
                    return (
                      <div
                        key={model.id}
                        className={`bg-bg rounded-2xl border transition-all cursor-pointer card-hover ${
                          isOpen ? "border-accent ring-2 ring-accent/20 shadow-lg" : "border-text/5"
                        }`}
                        onClick={() => setExpanded(isOpen ? null : model.id)}
                      >
                        <div className="p-5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <ProviderIcon company={model.company} size={22} />
                              <span className="text-[10px] font-semibold text-text/50">{model.company}</span>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${tierInfo.style}`}>{tierInfo.label}</span>
                          </div>
                          <h3 className="font-bold text-sm mb-1.5">{model.name}</h3>
                          {model.description && <p className="text-[12px] text-text/60 mb-2.5 leading-relaxed line-clamp-2">{model.description}</p>}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-text/40">{categoryLabels[model.category]}</span>
                            {model.context && <span className="text-[10px] text-text/30">{model.context}</span>}
                            {isOpen ? (
                              <span className="text-[10px] text-accent font-semibold ml-auto">Свернуть</span>
                            ) : (
                              <Link
                                href={`/models/${model.id}`}
                                className="text-[10px] text-accent font-semibold ml-auto hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Открыть {model.name} →
                              </Link>
                            )}
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
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-text/[0.03] rounded-xl p-3">
                                <span className="text-text/40 text-[10px] uppercase font-semibold">Контекст</span>
                                <p className="font-bold text-sm mt-0.5">{model.context || "—"}</p>
                              </div>
                              <div className="bg-text/[0.03] rounded-xl p-3">
                                <span className="text-text/40 text-[10px] uppercase font-semibold">Скорость</span>
                                <p className="font-bold text-sm mt-0.5">{getSpeed(model)}</p>
                              </div>
                              <div className="bg-text/[0.03] rounded-xl p-3">
                                <span className="text-text/40 text-[10px] uppercase font-semibold">Тариф</span>
                                <p className={`font-bold text-sm mt-0.5 ${tierInfo.label === "Free" ? "text-teal" : "text-accent"}`}>{tierInfo.label}</p>
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
                  <div className="mt-3 bg-bg border-2 border-accent/20 rounded-2xl p-6 shadow-lg animate-fadeIn hidden sm:block">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <ProviderIcon company={exp.company} size={28} />
                          <h3 className="font-extrabold text-lg">{exp.name}</h3>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${getTierLabel(exp.id).style}`}>{getTierLabel(exp.id).label}</span>
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
                      <div className="w-full md:w-72 shrink-0 space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-text/[0.03] rounded-xl p-3 border border-text/[0.06]">
                            <span className="text-text/40 text-[10px] uppercase font-semibold">Контекст</span>
                            <p className="font-bold text-text mt-0.5 text-sm">{exp.context || "—"}</p>
                          </div>
                          <div className="bg-text/[0.03] rounded-xl p-3 border border-text/[0.06]">
                            <span className="text-text/40 text-[10px] uppercase font-semibold">Скорость</span>
                            <p className="font-bold text-text mt-0.5 text-sm">{getSpeed(exp)}</p>
                          </div>
                          <div className="bg-text/[0.03] rounded-xl p-3 border border-text/[0.06]">
                            <span className="text-text/40 text-[10px] uppercase font-semibold">Тариф</span>
                            <p className={`font-bold mt-0.5 text-sm ${getTierLabel(exp.id).label === "Free" ? "text-teal" : "text-accent"}`}>
                              {getTierLabel(exp.id).label === "Free" ? "Бесплатно" : getTierLabel(exp.id).label === "Start" ? `от ${planPrice("mini")}` : `от ${planPrice("max")}`}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`/webchat?model=${exp.id}`}
                          className="block text-center bg-accent text-white px-4 py-3 min-h-[48px] rounded-xl text-sm font-bold hover:bg-accent/90 transition-all shadow-md shadow-accent/20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Попробовать {exp.name}
                        </a>
                        <Link
                          href={`/models/${exp.id}`}
                          className="block text-center text-xs text-text/60 hover:text-accent transition-colors py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Подробнее о {exp.name} →
                        </Link>
                        {getTierLabel(exp.id).label !== "Free" && (
                          <a href="/pricing" className="block text-center text-[11px] text-text/40 hover:text-accent transition-colors" onClick={(e) => e.stopPropagation()}>
                            Смотреть тарифы →
                          </a>
                        )}
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
