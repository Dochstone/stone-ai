"use client";

import { useState, useEffect, useCallback } from "react";
import { SkeletonGrid } from "@/components/Skeleton";
import { getAuth, API_URL } from "@/lib/auth";
import { CHAT_MODELS, CATEGORIES, CAT_COLORS } from "@/lib/models-config";

interface Variable { name: string; label: string; placeholder: string }
interface MarketplaceTemplate {
  id: string; category: string; title: string; description: string;
  content: string; variables: Variable[] | null; usage_count: number;
  likes: number; author_name: string | null; author_tg_id: number | null;
  default_model: string | null; cost_rub: number | null; created_at: string | null;
}

type Tab = "popular" | "newest" | "my";

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([]);
  const [myTemplates, setMyTemplates] = useState<MarketplaceTemplate[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>("popular");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 12;

  // Use template modal
  const [selected, setSelected] = useState<MarketplaceTemplate | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [modelId, setModelId] = useState("gpt-4.1-mini");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ text: string; model: string; cost: number; balance: number } | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Publish modal
  const [showPublish, setShowPublish] = useState(false);
  const [pubTitle, setPubTitle] = useState("");
  const [pubDesc, setPubDesc] = useState("");
  const [pubCategory, setPubCategory] = useState("marketing");
  const [pubContent, setPubContent] = useState("");
  const [pubVars, setPubVars] = useState<Variable[]>([]);
  const [pubError, setPubError] = useState("");
  const [publishing, setPublishing] = useState(false);

  const fetchMarketplace = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (search) params.set("search", search);
    params.set("sort", tab === "newest" ? "newest" : "popular");
    params.set("limit", String(PER_PAGE));
    params.set("offset", String((page - 1) * PER_PAGE));
    try {
      const res = await fetch(`${API_URL}/api/prompts/marketplace?${params}`);
      const data = await res.json();
      setTemplates(data.templates || []);
      setTotal(data.total || 0);
    } catch { setTemplates([]); }
    setLoading(false);
  }, [category, search, tab, page]);

  const fetchMyTemplates = useCallback(async () => {
    const auth = getAuth();
    if (!auth?.token) { setMyTemplates([]); return; }
    try {
      const res = await fetch(`${API_URL}/api/prompts/marketplace/my`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = await res.json();
      setMyTemplates(data.templates || []);
    } catch { setMyTemplates([]); }
  }, []);

  const fetchLiked = useCallback(async () => {
    const auth = getAuth();
    if (!auth?.token) return;
    try {
      const res = await fetch(`${API_URL}/api/prompts/marketplace/liked`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = await res.json();
      setLikedIds(new Set(data.liked_ids || []));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (tab === "my") {
      fetchMyTemplates();
    } else {
      fetchMarketplace();
    }
  }, [tab, fetchMarketplace, fetchMyTemplates]);

  useEffect(() => { fetchLiked(); }, [fetchLiked]);

  const toggleLike = async (templateId: string) => {
    const auth = getAuth();
    if (!auth?.token) { setError("Войдите для оценки шаблонов"); return; }
    try {
      const res = await fetch(`${API_URL}/api/prompts/templates/${templateId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setLikedIds(prev => {
          const next = new Set(prev);
          if (data.liked) next.add(templateId); else next.delete(templateId);
          return next;
        });
        setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, likes: data.likes } : t));
        setMyTemplates(prev => prev.map(t => t.id === templateId ? { ...t, likes: data.likes } : t));
      }
    } catch { /* ignore */ }
  };

  const openUseModal = (tpl: MarketplaceTemplate) => {
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
    if (result) {
      navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePublish = async () => {
    const auth = getAuth();
    if (!auth?.token) { setPubError("Войдите для публикации"); return; }
    if (pubTitle.trim().length < 3) { setPubError("Название минимум 3 символа"); return; }
    if (pubContent.trim().length < 10) { setPubError("Шаблон минимум 10 символов"); return; }

    setPublishing(true);
    setPubError("");
    try {
      const res = await fetch(`${API_URL}/api/prompts/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({
          title: pubTitle.trim(),
          description: pubDesc.trim(),
          content: pubContent.trim(),
          variables: pubVars.length > 0 ? pubVars : null,
          category: pubCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPubError(typeof data.detail === "string" ? data.detail : "Ошибка публикации");
      } else {
        setShowPublish(false);
        setPubTitle(""); setPubDesc(""); setPubContent(""); setPubVars([]);
        setTab("my");
        fetchMyTemplates();
      }
    } catch { setPubError("Ошибка сети"); }
    setPublishing(false);
  };

  const deleteTemplate = async (id: string) => {
    const auth = getAuth();
    if (!auth?.token) return;
    if (!confirm("Удалить шаблон из маркетплейса?")) return;
    try {
      await fetch(`${API_URL}/api/prompts/marketplace/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setMyTemplates(prev => prev.filter(t => t.id !== id));
    } catch { /* ignore */ }
  };

  const addVariable = () => {
    setPubVars(prev => [...prev, { name: `var${prev.length + 1}`, label: "", placeholder: "" }]);
  };

  const updateVariable = (index: number, field: keyof Variable, value: string) => {
    setPubVars(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const removeVariable = (index: number) => {
    setPubVars(prev => prev.filter((_, i) => i !== index));
  };

  const autoExtractVars = (content: string) => {
    const matches = content.match(/\{(\w+)\}/g);
    if (!matches) return;
    const names = Array.from(new Set(matches.map(m => m.slice(1, -1))));
    const existingNames = pubVars.map(v => v.name);
    const newVars = names.filter(n => !existingNames.includes(n)).map(n => ({
      name: n,
      label: n.charAt(0).toUpperCase() + n.slice(1).replace(/_/g, " "),
      placeholder: "",
    }));
    if (newVars.length > 0) setPubVars(prev => [...prev, ...newVars]);
  };

  const displayTemplates = tab === "my" ? myTemplates : templates;

  return (
    <div className="pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text">Маркетплейс шаблонов</h1>
            <p className="text-sm text-text/40 mt-1">{total > 0 ? `${total} шаблонов от сообщества` : "Используйте шаблоны сообщества или опубликуйте свои"}</p>
          </div>
          <button
            onClick={() => setShowPublish(true)}
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-accent hover:bg-accent/90 shadow-md shadow-accent/20 transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Опубликовать свой
          </button>
        </div>

        {!getAuth() && (
          <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-text/60">Войдите, чтобы публиковать и оценивать шаблоны</p>
            <a href="/dashboard/chat" className="bg-accent text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors shrink-0">Войти</a>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-text/[0.04] rounded-xl p-1 w-fit">
          {([
            { id: "popular" as Tab, label: "Популярные" },
            { id: "newest" as Tab, label: "Новые" },
            { id: "my" as Tab, label: "Мои" },
          ]).map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id ? "bg-bg text-text shadow-sm" : "text-text/40 hover:text-text/60"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + Categories */}
        {tab !== "my" && (
          <div className="mb-6">
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Поиск шаблонов..."
              className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20 mb-3"
            />
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => { setCategory(c.id); setPage(1); }}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    category === c.id ? "bg-accent text-white" : "bg-text/[0.04] text-text/50 hover:text-text/70"
                  }`}>
                  <span>{c.icon}</span> {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid */}
        {loading && tab !== "my" ? (
          <SkeletonGrid cols={3} count={6} />
        ) : displayTemplates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-text/5">
            <span className="text-4xl block mb-3">🏪</span>
            <h3 className="text-base font-bold text-text mb-1">
              {tab === "my" ? "Вы ещё не опубликовали шаблоны" : "Шаблоны не найдены"}
            </h3>
            <p className="text-xs text-text/40 mb-4">
              {tab === "my" ? "Создайте первый шаблон и поделитесь с сообществом" : "Попробуйте изменить фильтры или поиск"}
            </p>
            {tab === "my" && (
              <button onClick={() => setShowPublish(true)} className="bg-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors">
                Опубликовать шаблон
              </button>
            )}
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
            {displayTemplates.map(tpl => (
              <div
                key={tpl.id}
                className="bg-bg border border-text/5 rounded-2xl p-5 hover:border-accent/20 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-bold text-text group-hover:text-accent transition-colors line-clamp-1">{tpl.title}</h3>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ml-2 ${CAT_COLORS[tpl.category] || "bg-text/5 text-text/40 border-text/10"}`}>
                    {CATEGORIES.find(c => c.id === tpl.category)?.label || tpl.category}
                  </span>
                </div>
                <p className="text-xs text-text/40 line-clamp-2 mb-3">{tpl.description}</p>

                {tpl.variables && tpl.variables.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {tpl.variables.slice(0, 3).map(v => (
                      <span key={v.name} className="text-[9px] bg-text/[0.04] text-text/30 px-1.5 py-0.5 rounded">{v.label || v.name}</span>
                    ))}
                    {tpl.variables.length > 3 && <span className="text-[9px] text-text/20">+{tpl.variables.length - 3}</span>}
                  </div>
                )}

                {/* Author + stats */}
                <div className="flex items-center gap-3 mb-3 text-[10px] text-text/30">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                    </svg>
                    {tpl.author_name || "Аноним"}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                    {tpl.usage_count}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openUseModal(tpl)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-accent hover:bg-accent/90 shadow-sm shadow-accent/20 transition-all"
                  >
                    Использовать
                  </button>
                  <button
                    onClick={() => toggleLike(tpl.id)}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      likedIds.has(tpl.id)
                        ? "border-red-300 bg-red-50 text-red-500"
                        : "border-text/10 text-text/30 hover:text-red-400 hover:border-red-200"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill={likedIds.has(tpl.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                    </svg>
                    {tpl.likes}
                  </button>
                  {tab === "my" && (
                    <button
                      onClick={() => deleteTemplate(tpl.id)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold border border-text/10 text-text/30 hover:text-red-500 hover:border-red-200 transition-all"
                      title="Удалить"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {total > PER_PAGE && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg border border-text/10 text-sm text-text/50 hover:bg-text/[0.04] disabled:opacity-30 transition-colors"
              >
                &larr; Назад
              </button>
              <span className="text-sm text-text/40 px-3">
                {page} из {Math.ceil(total / PER_PAGE)}
              </span>
              <button
                onClick={() => setPage(p => Math.min(Math.ceil(total / PER_PAGE), p + 1))}
                disabled={page >= Math.ceil(total / PER_PAGE)}
                className="px-3 py-2 rounded-lg border border-text/10 text-sm text-text/50 hover:bg-text/[0.04] disabled:opacity-30 transition-colors"
              >
                Далее &rarr;
              </button>
            </div>
          )}
          </>
        )}
      </div>

      {/* Use template modal */}
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
              {selected.author_name && (
                <p className="text-[10px] text-text/25 mt-1">Автор: {selected.author_name}</p>
              )}
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

              <div>
                <label className="text-xs font-semibold text-text/60 mb-1 block">Модель AI</label>
                <select value={modelId} onChange={e => setModelId(e.target.value)}
                  className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none">
                  {CHAT_MODELS.map(m => <option key={m.id} value={m.id}>{m.name} — {m.speed}</option>)}
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
                {copied ? "Скопировано!" : "Копировать"}
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

      {/* Publish modal */}
      {showPublish && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4" onClick={() => setShowPublish(false)}>
          <div className="bg-bg rounded-2xl w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-5 pb-3 border-b border-text/5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-text">Опубликовать шаблон</h2>
                <button onClick={() => setShowPublish(false)} className="text-text/30 hover:text-text/60">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <p className="text-xs text-text/40 mt-1">Ваш шаблон станет доступен всем пользователям</p>
            </div>

            <div className="px-6 py-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-text/60 mb-1 block">Название</label>
                <input
                  value={pubTitle} onChange={e => setPubTitle(e.target.value)}
                  placeholder="Генератор идей для стартапа"
                  className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text/60 mb-1 block">Описание</label>
                <input
                  value={pubDesc} onChange={e => setPubDesc(e.target.value)}
                  placeholder="Краткое описание что делает шаблон"
                  className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text/60 mb-1 block">Категория</label>
                <select value={pubCategory} onChange={e => setPubCategory(e.target.value)}
                  className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none">
                  {CATEGORIES.filter(c => c.id !== "all").map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text/60 mb-1 block">
                  Шаблон промта
                  <span className="font-normal text-text/30 ml-1">используйте {"{переменная}"} для подстановки</span>
                </label>
                <textarea
                  value={pubContent} onChange={e => { setPubContent(e.target.value); autoExtractVars(e.target.value); }}
                  placeholder={"Напиши 5 идей для стартапа в нише {niche}.\nЦА: {audience}.\nБюджет: {budget}."}
                  rows={5}
                  className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20 resize-none font-mono"
                />
              </div>

              {/* Variables builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-text/60">Переменные</label>
                  <button onClick={addVariable} className="text-[10px] font-bold text-accent hover:text-accent/80 transition-colors">
                    + Добавить
                  </button>
                </div>
                {pubVars.length === 0 && (
                  <p className="text-[10px] text-text/25">Добавьте переменные, которые используются в шаблоне</p>
                )}
                <div className="space-y-2">
                  {pubVars.map((v, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <input
                          value={v.name} onChange={e => updateVariable(i, "name", e.target.value)}
                          placeholder="name"
                          className="bg-text/[0.04] border border-text/[0.08] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20 font-mono"
                        />
                        <input
                          value={v.label} onChange={e => updateVariable(i, "label", e.target.value)}
                          placeholder="Название поля"
                          className="bg-text/[0.04] border border-text/[0.08] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20"
                        />
                        <input
                          value={v.placeholder} onChange={e => updateVariable(i, "placeholder", e.target.value)}
                          placeholder="Подсказка"
                          className="bg-text/[0.04] border border-text/[0.08] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20"
                        />
                      </div>
                      <button onClick={() => removeVariable(i)} className="text-text/20 hover:text-red-500 mt-1 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {pubTitle && pubContent && (
                <div>
                  <label className="text-xs font-semibold text-text/60 mb-2 block">Предпросмотр</label>
                  <div className="bg-text/[0.02] border border-text/5 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-sm font-bold text-text">{pubTitle}</h4>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ml-2 ${CAT_COLORS[pubCategory] || "bg-text/5 text-text/40 border-text/10"}`}>
                        {CATEGORIES.find(c => c.id === pubCategory)?.label || pubCategory}
                      </span>
                    </div>
                    {pubDesc && <p className="text-xs text-text/40 mb-2">{pubDesc}</p>}
                    <div className="flex gap-1 flex-wrap">
                      {pubVars.map(v => (
                        <span key={v.name} className="text-[9px] bg-text/[0.04] text-text/30 px-1.5 py-0.5 rounded">{v.label || v.name}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {pubError && <p className="text-xs text-red-500 font-medium">{pubError}</p>}
            </div>

            <div className="px-6 pb-5">
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="w-full py-3 rounded-xl text-sm font-bold text-white bg-accent hover:bg-accent/90 disabled:opacity-50 shadow-md shadow-accent/20 transition-all"
              >
                {publishing ? "Публикация..." : "Опубликовать"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
