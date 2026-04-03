"use client";

import { useState, useEffect, useCallback } from "react";
import { SkeletonGrid } from "@/components/Skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

interface Variable { name: string; label: string; placeholder: string }
interface Template {
  id: string; category: string; title: string; description: string;
  content: string; variables: Variable[] | null; usage_count: number;
  default_model: string | null; cost_rub: number | null; icon: string | null;
}

const CATEGORIES = [
  { id: "all", label: "Все", icon: "📋" },
  { id: "marketing", label: "Маркетинг", icon: "📊" },
  { id: "smm", label: "SMM", icon: "📱" },
  { id: "seo", label: "SEO", icon: "🔍" },
  { id: "copywriting", label: "Копирайтинг", icon: "✍️" },
  { id: "code", label: "Код", icon: "💻" },
  { id: "business", label: "Бизнес", icon: "💼" },
];

const MODELS = [
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", speed: "Быстрый" },
  { id: "gpt-4.1", name: "GPT-4.1", speed: "Точный" },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", speed: "Креативный" },
  { id: "deepseek-v3", name: "DeepSeek V3", speed: "Аналитический" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", speed: "Быстрый" },
];

const CAT_COLORS: Record<string, string> = {
  marketing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  smm: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  seo: "bg-green-500/10 text-green-500 border-green-500/20",
  copywriting: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  code: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  business: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Template | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [modelId, setModelId] = useState("gpt-4.1-mini");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ text: string; model: string; cost: number; balance: number } | null>(null);
  const [error, setError] = useState("");

  const getAuth = () => {
    try { const s = localStorage.getItem("stone_auth"); return s ? JSON.parse(s) : null; } catch { return null; }
  };

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`${API_URL}/api/prompts/templates?${params}`);
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch { setTemplates([]); }
    setLoading(false);
  }, [category, search]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);

  const openWizard = (tpl: Template) => {
    setSelected(tpl);
    setFields({});
    setModelId(tpl.default_model || "gpt-4.1-mini");
    setResult(null);
    setError("");
  };

  const generate = async () => {
    if (!selected) return;
    const auth = getAuth();
    if (!auth?.token) { setError("Войдите для генерации"); return; }

    setGenerating(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/templates/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ template_id: selected.id, fields, model_id: modelId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.detail === "string" ? data.detail : data.detail?.message || "Ошибка генерации");
      } else {
        setResult({ text: data.result, model: data.model, cost: data.cost_rub, balance: data.balance_rub });
      }
    } catch { setError("Ошибка сети"); }
    setGenerating(false);
  };

  const copyResult = () => {
    if (result) navigator.clipboard.writeText(result.text);
  };

  return (
    <div className="pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-extrabold text-text">AI-шаблоны</h1>
          <p className="text-sm text-text/40 mt-1">Заполните форму — AI сгенерирует результат. 50+ шаблонов для маркетинга, SMM, SEO и бизнеса.</p>
        </div>

        {/* Search + Categories */}
        <div className="mb-6">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск шаблонов..."
            className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20 mb-3"
          />
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  category === c.id ? "bg-accent text-white" : "bg-text/[0.04] text-text/50 hover:text-text/70"
                }`}>
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <SkeletonGrid cols={3} count={6} />
        ) : templates.length === 0 ? (
          <div className="text-center py-20 text-text/20">Ничего не найдено</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
            {templates.map(tpl => (
              <button
                key={tpl.id}
                onClick={() => openWizard(tpl)}
                className="text-left bg-bg border border-text/5 rounded-2xl p-5 hover:border-accent/20 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold text-text group-hover:text-accent transition-colors">{tpl.title}</h3>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${CAT_COLORS[tpl.category] || "bg-text/5 text-text/40 border-text/10"}`}>
                    {CATEGORIES.find(c => c.id === tpl.category)?.label || tpl.category}
                  </span>
                </div>
                <p className="text-xs text-text/40 line-clamp-2 mb-3">{tpl.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {tpl.variables?.slice(0, 3).map(v => (
                      <span key={v.name} className="text-[9px] bg-text/[0.04] text-text/30 px-1.5 py-0.5 rounded">{v.label}</span>
                    ))}
                    {(tpl.variables?.length || 0) > 3 && <span className="text-[9px] text-text/20">+{(tpl.variables?.length || 0) - 3}</span>}
                  </div>
                  <span className="text-[10px] text-text/25">{tpl.cost_rub || 3}₽</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Wizard modal */}
      {selected && !result && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="bg-bg rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-3 border-b border-text/5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-text">{selected.title}</h2>
                <button onClick={() => setSelected(null)} className="text-text/30 hover:text-text/60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <p className="text-xs text-text/40 mt-1">{selected.description}</p>
            </div>

            <div className="px-6 py-4 space-y-3">
              {selected.variables?.map(v => (
                <div key={v.name}>
                  <label className="text-xs font-semibold text-text/60 mb-1 block">{v.label}</label>
                  {v.placeholder.length > 60 ? (
                    <textarea
                      value={fields[v.name] || ""} onChange={e => setFields(prev => ({ ...prev, [v.name]: e.target.value }))}
                      placeholder={v.placeholder} rows={2}
                      className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20 resize-none"
                    />
                  ) : (
                    <input
                      value={fields[v.name] || ""} onChange={e => setFields(prev => ({ ...prev, [v.name]: e.target.value }))}
                      placeholder={v.placeholder}
                      className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20"
                    />
                  )}
                </div>
              ))}

              {/* Model selector */}
              <div>
                <label className="text-xs font-semibold text-text/60 mb-1 block">Модель AI</label>
                <select value={modelId} onChange={e => setModelId(e.target.value)}
                  className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none">
                  {MODELS.map(m => <option key={m.id} value={m.id}>{m.name} — {m.speed}</option>)}
                </select>
              </div>

              {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
            </div>

            <div className="px-6 pb-5">
              <button
                onClick={generate}
                disabled={generating}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-accent hover:bg-accent/90 disabled:opacity-50 shadow-md shadow-accent/20 transition-all"
              >
                {generating ? "Генерация..." : `Сгенерировать · ${selected.cost_rub || 3}₽`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result modal */}
      {selected && result && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => { setSelected(null); setResult(null); }}>
          <div className="bg-bg rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-3 border-b border-text/5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text">{selected.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-text/[0.04] text-text/40 px-2 py-0.5 rounded">{result.model}</span>
                  <span className="text-[10px] text-text/25">-{result.cost}₽</span>
                  <span className="text-[10px] text-text/25">Баланс: {result.balance}₽</span>
                </div>
              </div>
              <button onClick={() => { setSelected(null); setResult(null); }} className="text-text/30 hover:text-text/60">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="bg-text/[0.02] border border-text/5 rounded-xl p-4 text-sm text-text/80 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto">
                {result.text}
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-2">
              <button onClick={copyResult} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-accent text-white hover:bg-accent/90 shadow-md shadow-accent/20">
                Копировать
              </button>
              <button onClick={() => setResult(null)} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-text/10 text-text/50 hover:text-text/70">
                Ещё раз
              </button>
              <button onClick={() => { setSelected(null); setResult(null); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-text/10 text-text/50 hover:text-text/70">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
