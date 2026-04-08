"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

interface Variable {
  name: string;
  label: string;
  placeholder: string;
}

interface Template {
  id: string;
  category: string;
  title: string;
  description: string;
  content: string;
  variables: Variable[] | null;
  usage_count: number;
}

const CATEGORIES = [
  { id: "all", label: "Все" },
  { id: "marketing", label: "Маркетинг" },
  { id: "smm", label: "SMM" },
  { id: "seo", label: "SEO" },
  { id: "copywriting", label: "Копирайтинг" },
  { id: "code", label: "Код" },
  { id: "business", label: "Бизнес" },
];

const CATEGORY_COLORS: Record<string, string> = {
  marketing: "bg-blue-500/10 text-blue-500",
  smm: "bg-pink-500/10 text-pink-500",
  seo: "bg-green-500/10 text-green-500",
  copywriting: "bg-purple-500/10 text-purple-500",
  code: "bg-cyan-500/10 text-cyan-500",
  business: "bg-amber-500/10 text-amber-500",
};

export default function PromptLibrary({ open, onClose, onInsert }: {
  open: boolean;
  onClose: () => void;
  onInsert: (text: string) => void;
}) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Template | null>(null);
  const [varValues, setVarValues] = useState<Record<string, string>>({});

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== "all") params.set("category", category);
      if (search) params.set("search", search);
      const res = await fetch(`${API_URL}/api/prompts/templates?${params}`);
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {
      setTemplates([]);
    }
    setLoading(false);
  }, [category, search]);

  useEffect(() => {
    if (open) fetchTemplates();
  }, [open, fetchTemplates]);

  // Debounce search
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(fetchTemplates, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleUse = (tpl: Template) => {
    if (tpl.variables && tpl.variables.length > 0) {
      setSelected(tpl);
      setVarValues({});
    } else {
      insertAndClose(tpl.content);
    }
  };

  const insertAndClose = (text: string) => {
    onInsert(text);
    setSelected(null);
    onClose();
    // Track usage
    if (selected) {
      fetch(`${API_URL}/api/prompts/templates/${selected.id}/use`, { method: "POST" }).catch(() => {});
    }
  };

  const handleInsertWithVars = () => {
    if (!selected) return;
    let text = selected.content;
    for (const [key, val] of Object.entries(varValues)) {
      text = text.replace(new RegExp(`\\{${key}\\}`, "g"), val || `{${key}}`);
    }
    insertAndClose(text);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-bg border-l border-text/10 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-text/5">
          <h2 className="text-base font-bold text-text">Библиотека промптов</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-text/30 hover:text-text/60 transition-colors rounded-lg hover:bg-text/5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск промптов..."
            className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/25 transition-all"
          />
        </div>

        {/* Category tabs */}
        <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                category === c.id
                  ? "bg-accent text-white"
                  : "bg-text/[0.04] text-text/50 hover:text-text/70 hover:bg-text/[0.06]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Templates list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-text/30 text-sm">Загрузка...</div>
          ) : templates.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-text/30 text-sm">Ничего не найдено</div>
          ) : (
            <div className="space-y-2 pt-1">
              {templates.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => handleUse(tpl)}
                  className="w-full text-left p-3.5 rounded-xl border border-text/[0.06] hover:border-accent/20 hover:bg-accent/[0.02] transition-all group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text group-hover:text-accent transition-colors truncate">{tpl.title}</p>
                      <p className="text-xs text-text/40 mt-0.5 line-clamp-2">{tpl.description}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md ${CATEGORY_COLORS[tpl.category] || "bg-text/5 text-text/40"}`}>
                      {CATEGORIES.find(c => c.id === tpl.category)?.label || tpl.category}
                    </span>
                  </div>
                  {tpl.variables && tpl.variables.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {tpl.variables.map(v => (
                        <span key={v.name} className="text-[10px] bg-text/[0.04] text-text/30 px-1.5 py-0.5 rounded">{`{${v.name}}`}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Variable fill modal */}
      {selected && selected.variables && selected.variables.length > 0 && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-bg rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-base font-bold text-text mb-0.5">{selected.title}</h3>
              <p className="text-xs text-text/40">{selected.description}</p>
            </div>
            <div className="px-5 pb-2 space-y-3">
              {selected.variables.map(v => (
                <div key={v.name}>
                  <label className="text-xs font-semibold text-text/60 mb-1 block">{v.label}</label>
                  {v.placeholder.length > 60 ? (
                    <textarea
                      value={varValues[v.name] || ""}
                      onChange={e => setVarValues(prev => ({ ...prev, [v.name]: e.target.value }))}
                      placeholder={v.placeholder}
                      rows={3}
                      className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20 resize-none"
                    />
                  ) : (
                    <input
                      type="text"
                      value={varValues[v.name] || ""}
                      onChange={e => setVarValues(prev => ({ ...prev, [v.name]: e.target.value }))}
                      placeholder={v.placeholder}
                      className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="px-5 pb-5 pt-2 flex gap-2">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-text/40 hover:text-text/60 border border-text/[0.08] transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleInsertWithVars}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-accent hover:bg-accent/90 transition-colors shadow-md shadow-accent/20"
              >
                Вставить в чат
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
