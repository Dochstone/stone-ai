"use client";

import { useState } from "react";
import { MODELS, type ModelCategory } from "@/lib/models";

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

function formatPrice(model: (typeof MODELS)[number]) {
  if (model.tier === "free") return "FREE";
  if (model.priceUnit) return `$${model.pricePerMillion}${model.priceUnit}`;
  return `$${model.pricePerMillion}/1M`;
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

  const filtered = tab === "all" ? MODELS.slice(0, 16) : MODELS.filter((m) => m.category === tab);

  return (
    <section id="models" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Технологии OpenAI, Anthropic, Google, xAI — под вашим управлением
        </h2>
        <p className="text-text/60 text-center mb-10 max-w-xl mx-auto">
          От бесплатных до самых мощных. Все доступны прямо сейчас.
        </p>

        {/* Tabs */}
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

        {/* Grid with fade */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 transition-opacity duration-300">
          {filtered.map((model) => (
            <div
              key={model.id}
              className="bg-white rounded-2xl p-5 card-hover border border-text/5 animate-fadeIn"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${companyColors[model.company] ?? "bg-gray-100 text-gray-700"}`}>
                  {model.company}
                </span>
              </div>
              <h3 className="font-bold text-sm mb-3 leading-snug">{model.name}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    model.tier === "free"
                      ? "bg-teal-light text-teal"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {formatPrice(model)}
                </span>
                {model.context && (
                  <span className="text-[10px] text-text/35 font-medium">{model.context}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="/models"
            className="inline-flex items-center gap-2 text-accent font-bold hover:underline text-lg"
          >
            Все 50 моделей
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
