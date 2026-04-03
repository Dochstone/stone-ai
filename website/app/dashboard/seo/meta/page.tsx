"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

export default function SEOMetaPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Parse result for preview
  const titleMatch = result.match(/title[:\s]*["""«]?([^"""»\n]{10,60})/i);
  const descMatch = result.match(/description[:\s]*["""«]?([^"""»\n]{30,160})/i);
  const previewTitle = titleMatch?.[1]?.trim() || "";
  const previewDesc = descMatch?.[1]?.trim() || "";

  const getAuth = () => { try { return JSON.parse(localStorage.getItem("stone_auth") || ""); } catch { return null; } };

  const generate = async () => {
    if (!input.trim()) return;
    const auth = getAuth();
    if (!auth?.token) { setError("Войдите для генерации"); return; }

    setLoading(true); setError(""); setResult("");
    const prompt = `Сгенерируй мета-теги для страницы.
Тема/URL страницы: ${input}

Создай:
1. **Title** (до 60 символов, ключевое слово в начале)
2. **Meta Description** (до 160 символов, с призывом к действию)
3. **Keywords** (10 штук через запятую)
4. **Open Graph:**
   - og:title
   - og:description
   - og:type
5. **Twitter Card:**
   - twitter:title
   - twitter:description

Покажи готовый HTML-код мета-тегов для вставки в <head>.
В конце покажи превью как это будет выглядеть в поиске Google (title + URL + description).`;

    try {
      const res = await fetch(`${API_URL}/api/generate/direct`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ prompt, model_id: "gpt-4.1-mini", cost_rub: 2.0 }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail?.message || data.detail || "Ошибка"); }
      else { setResult(data.result); }
    } catch { setError("Ошибка сети"); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 pt-10">
        <a href="/dashboard/seo" className="text-xs text-text/30 hover:text-accent mb-4 inline-block">← SEO-модуль</a>
        <h1 className="text-2xl font-extrabold text-text mb-1">Мета-теги</h1>
        <p className="text-sm text-text/40 mb-6">Title, Description, Keywords, Open Graph — с превью в Google</p>

        <div className="space-y-4 max-w-xl">
          <div>
            <label className="text-xs font-semibold text-text/60 mb-1 block">URL страницы или описание контента</label>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="https://example.com/services или Доставка цветов в Москве"
              className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button onClick={generate} disabled={loading || !input.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold text-white bg-accent hover:bg-accent/90 disabled:opacity-40 shadow-md shadow-accent/20">
            {loading ? "Генерация..." : "Сгенерировать мета-теги · 2₽"}
          </button>
        </div>

        {/* Google preview */}
        {previewTitle && (
          <div className="mt-6 max-w-xl">
            <p className="text-xs text-text/30 font-semibold mb-2">Превью в Google:</p>
            <div className="bg-white dark:bg-[#1C1C1E] border border-text/10 rounded-xl p-4">
              <p className="text-[#1a0dab] dark:text-[#8ab4f8] text-lg font-medium truncate">{previewTitle}</p>
              <p className="text-[#006621] dark:text-[#bdc1c6] text-xs mt-0.5">{input.startsWith("http") ? input : `example.com › ${input.toLowerCase().replace(/\s+/g, "-")}`}</p>
              <p className="text-[#545454] dark:text-[#9aa0a6] text-sm mt-1 line-clamp-2">{previewDesc}</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 bg-text/[0.02] border border-text/5 rounded-2xl p-5">
            <div className="flex justify-end mb-3">
              <button onClick={() => navigator.clipboard.writeText(result)} className="text-xs text-accent font-semibold hover:underline">Копировать</button>
            </div>
            <div className="text-sm text-text/80 whitespace-pre-wrap leading-relaxed">{result}</div>
          </div>
        )}
      </div>
    </div>
  );
}
