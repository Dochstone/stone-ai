"use client";

import { useState } from "react";
import { getAuth, API_URL } from "@/lib/auth";

export default function ABTestPage() {
  const [topic, setTopic] = useState("");
  const [variants, setVariants] = useState<{ text: string; score: number; feedback: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);

  const generate = async () => {
    const auth = getAuth();
    if (!auth?.token || !topic.trim()) return;
    setLoading(true);
    setVariants([]);
    setWinner(null);

    try {
      // Generate 3 variants
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: "gpt-4o-mini",
          messages: [{ role: "user", content: `Сгенерируй 3 разных варианта текста для: "${topic}".

Каждый вариант должен отличаться стилем, тоном и подходом:
- Вариант A: эмоциональный, продающий
- Вариант B: информативный, экспертный
- Вариант C: короткий, прямолинейный

После каждого варианта дай оценку от 1 до 10 и краткий комментарий.

Формат ответа:
===ВАРИАНТ A===
[текст]
ОЦЕНКА: [число]/10
КОММЕНТАРИЙ: [комментарий]

===ВАРИАНТ B===
[текст]
ОЦЕНКА: [число]/10
КОММЕНТАРИЙ: [комментарий]

===ВАРИАНТ C===
[текст]
ОЦЕНКА: [число]/10
КОММЕНТАРИЙ: [комментарий]` }],
          system_prompt: "Ты эксперт по копирайтингу и маркетингу. Генерируй качественные тексты и объективно оценивай их.",
        }),
      });

      if (res.ok) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let full = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            for (const line of chunk.split("\n")) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                try {
                  const data = JSON.parse(line.slice(6));
                  full += data.choices?.[0]?.delta?.content || "";
                } catch {}
              }
            }
          }
        }

        // Parse variants
        const parts = full.split(/===ВАРИАНТ [ABC]===/i).filter(p => p.trim());
        const parsed = parts.map(part => {
          const scoreMatch = part.match(/ОЦЕНКА:\s*(\d+)/i);
          const commentMatch = part.match(/КОММЕНТАРИЙ:\s*(.+)/i);
          const textPart = part.replace(/ОЦЕНКА:.+/i, "").replace(/КОММЕНТАРИЙ:.+/i, "").trim();
          return {
            text: textPart,
            score: parseInt(scoreMatch?.[1] || "5"),
            feedback: commentMatch?.[1]?.trim() || "",
          };
        });

        setVariants(parsed);
        // Auto-select winner
        if (parsed.length > 0) {
          const bestIdx = parsed.reduce((best, v, i) => v.score > parsed[best].score ? i : best, 0);
          setWinner(bestIdx);
        }
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-text">A/B Тестирование текстов</h1>
          <p className="text-sm text-text/40 mt-1">Сравните 3 варианта текста и выберите лучший</p>
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl border border-text/5 p-5 mb-6">
          <label className="text-[10px] font-bold text-text/30 uppercase tracking-wider">Задача / тема текста</label>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Напиши заголовок для email-рассылки про скидки на AI-сервис&#10;Или: Рекламный текст для фитнес-приложения&#10;Или: Описание товара для маркетплейса"
            rows={3}
            className="w-full mt-2 bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
          <button onClick={generate} disabled={loading || !topic.trim()}
            className="mt-3 bg-accent text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-accent/90 disabled:opacity-40 transition-colors">
            {loading ? "Генерация 3 вариантов..." : "Сгенерировать варианты"}
          </button>
        </div>

        {/* Variants */}
        {variants.length > 0 && (
          <div className="grid gap-4">
            {variants.map((v, i) => (
              <div key={i} className={`bg-white rounded-2xl border-2 p-5 transition-all ${winner === i ? "border-teal shadow-lg shadow-teal/10" : "border-text/5"}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${winner === i ? "bg-teal text-white" : "bg-text/[0.06] text-text/50"}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-xs text-text/40">
                      {i === 0 ? "Эмоциональный" : i === 1 ? "Экспертный" : "Прямолинейный"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 10 }, (_, j) => (
                        <div key={j} className={`w-2 h-2 rounded-full ${j < v.score ? "bg-accent" : "bg-text/10"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-text">{v.score}/10</span>
                    {winner === i && <span className="text-[10px] font-bold bg-teal/10 text-teal px-2 py-0.5 rounded-full">Лучший</span>}
                  </div>
                </div>
                <p className="text-sm text-text/80 leading-relaxed whitespace-pre-wrap mb-3">{v.text}</p>
                {v.feedback && (
                  <p className="text-xs text-text/40 italic border-t border-text/5 pt-2">{v.feedback}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { navigator.clipboard.writeText(v.text); }} className="text-[11px] text-accent font-semibold hover:underline">Копировать</button>
                  <button onClick={() => setWinner(i)} className="text-[11px] text-text/30 font-semibold hover:text-teal">Выбрать лучшим</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
