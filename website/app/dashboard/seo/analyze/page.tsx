"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

export default function SEOAnalyzePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getAuth = () => { try { return JSON.parse(localStorage.getItem("stone_auth") || ""); } catch { return null; } };

  const analyze = async () => {
    if (!text.trim() || text.length < 100) { setError("Минимум 100 символов"); return; }
    const auth = getAuth();
    if (!auth?.token) { setError("Войдите для анализа"); return; }

    setLoading(true); setError(""); setResult("");
    const prompt = `Проведи SEO-анализ следующего текста. Оцени по шкале 1-10 каждый параметр и дай конкретные рекомендации.

Параметры оценки:
1. Релевантность основной теме
2. Читабельность (длина предложений, сложность)
3. Структура (заголовки H2/H3, списки, абзацы)
4. Ключевые слова (плотность, распределение, LSI)
5. Длина текста (достаточность для ранжирования)
6. Уникальность формулировок

Формат ответа:
- Таблица оценок (параметр | оценка | комментарий)
- Общий SEO-балл (среднее)
- 5 конкретных рекомендаций по улучшению
- Предложенные мета-теги (title, description)

Текст для анализа:
"""
${text}
"""`;

    try {
      const res = await fetch(`${API_URL}/api/generate/direct`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ prompt, model_id: "gpt-4.1-mini", cost_rub: 8.0 }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail?.message || data.detail || "Ошибка"); }
      else { setResult(data.result); }
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
          <span className="text-text/50">Анализ</span>
        </nav>
        <h1 className="text-xl sm:text-2xl font-extrabold text-text mb-1">Анализатор текста</h1>
        <p className="text-sm text-text/40 mb-6">Вставьте текст — AI оценит SEO-параметры и даст рекомендации</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Вставьте текст для SEO-анализа (минимум 100 символов)..."
              rows={15}
              className="w-full bg-text/[0.04] border border-text/[0.08] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20 resize-none" />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-text/20">{text.length} символов</span>
              {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
            <button onClick={analyze} disabled={loading || text.length < 100}
              className="w-full mt-3 py-3 rounded-xl text-sm font-bold text-white bg-accent hover:bg-accent/90 disabled:opacity-40 shadow-md shadow-accent/20">
              {loading ? "Анализ..." : "Анализировать · 8₽"}
            </button>
          </div>

          <div className="bg-text/[0.02] border border-text/5 rounded-2xl p-5 min-h-[300px]">
            {result ? (
              <>
                <div className="flex justify-end mb-3">
                  <button onClick={() => navigator.clipboard.writeText(result)} className="text-xs text-accent font-semibold hover:underline">Копировать</button>
                </div>
                <div className="text-sm text-text/80 whitespace-pre-wrap leading-relaxed">{result}</div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-text/15 text-sm">
                {loading ? "Анализ текста..." : "Результат анализа появится здесь"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
