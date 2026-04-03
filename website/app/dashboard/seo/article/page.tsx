"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

const MODELS = [
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini — быстрый" },
  { id: "gpt-4.1", name: "GPT-4.1 — точный" },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4 — креативный" },
  { id: "deepseek-v3", name: "DeepSeek V3 — аналитический" },
];

export default function SEOArticlePage() {
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [length, setLength] = useState("5000");
  const [model, setModel] = useState("gpt-4.1-mini");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cost, setCost] = useState<{ cost: number; balance: number } | null>(null);

  const getAuth = () => { try { return JSON.parse(localStorage.getItem("stone_auth") || ""); } catch { return null; } };

  const generate = async () => {
    if (!topic.trim()) return;
    const auth = getAuth();
    if (!auth?.token) { setError("Войдите для генерации"); return; }

    setLoading(true); setError(""); setResult("");
    const prompt = `Напиши SEO-статью на тему: ${topic}.
Основные ключевые слова: ${keywords || "определи сам по теме"}.
Длина: ${length} символов.

Требования:
- Title (до 60 символов) и meta description (до 160 символов) в начале
- H2 и H3 подзаголовки с ключевыми словами
- Ключевое слово в первом абзаце
- Плотность ключевых слов: 1-2%
- Списки и таблицы где уместно
- FAQ-блок (5 вопросов) в конце
- Естественный читабельный стиль
- Формат: Markdown`;

    try {
      const res = await fetch(`${API_URL}/api/generate/direct`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ prompt, model_id: model, cost_rub: 5.0 }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail?.message || data.detail || "Ошибка"); }
      else { setResult(data.result); setCost({ cost: data.cost_rub, balance: data.balance_rub }); }
    } catch { setError("Ошибка сети"); }
    setLoading(false);
  };

  return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <nav className="flex items-center gap-1.5 text-xs text-text/30 mb-4">
          <a href="/dashboard" className="hover:text-accent transition-colors">Панель</a>
          <span>/</span>
          <a href="/dashboard/seo" className="hover:text-accent transition-colors">SEO</a>
          <span>/</span>
          <span className="text-text/50">Статьи</span>
        </nav>
        <h1 className="text-xl sm:text-2xl font-extrabold text-text mb-1">Генератор SEO-статей</h1>
        <p className="text-sm text-text/40 mb-6">Оптимизированная статья с заголовками, ключами и FAQ</p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text/60 mb-1 block">Тема статьи *</label>
              <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="Как выбрать CRM для малого бизнеса"
                className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text/60 mb-1 block">Ключевые слова</label>
              <textarea value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="CRM для бизнеса, лучшие CRM, выбрать CRM" rows={2}
                className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20 resize-none" />
              <p className="text-[10px] text-text/20 mt-1">По одному на строку или через запятую</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-text/60 mb-1 block">Длина (символов)</label>
              <select value={length} onChange={e => setLength(e.target.value)}
                className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none">
                <option value="3000">3 000 — короткая</option>
                <option value="5000">5 000 — средняя</option>
                <option value="8000">8 000 — длинная</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-text/60 mb-1 block">Модель AI</label>
              <select value={model} onChange={e => setModel(e.target.value)}
                className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none">
                {MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button onClick={generate} disabled={loading || !topic.trim()}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-accent hover:bg-accent/90 disabled:opacity-40 shadow-md shadow-accent/20">
              {loading ? "Генерация..." : "Сгенерировать · 5₽"}
            </button>
            {cost && <p className="text-[10px] text-text/25 text-center">Списано {cost.cost}₽ · Баланс: {cost.balance}₽</p>}
          </div>

          {/* Result */}
          <div className="bg-text/[0.02] border border-text/5 rounded-2xl p-5 min-h-[300px]">
            {result ? (
              <>
                <div className="flex justify-end mb-3 gap-2">
                  <button onClick={() => navigator.clipboard.writeText(result)} className="text-xs text-accent font-semibold hover:underline">Копировать текст</button>
                  <button onClick={() => {
                    const blob = new Blob([result], { type: "text/markdown" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = "article.md"; a.click();
                  }} className="text-xs text-text/40 font-semibold hover:text-text/60">Скачать .md</button>
                </div>
                <div className="text-sm text-text/80 whitespace-pre-wrap leading-relaxed">{result}</div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-text/15 text-sm">
                {loading ? "Генерация статьи..." : "Результат появится здесь"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
