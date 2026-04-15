"use client";

import { useEffect, useMemo, useState } from "react";

interface Item {
  q: string;
  a: string;
  slug: string;
  category: string;
}

export default function FaqSearch({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (q.length < 2) return [];
    return items
      .filter((it) => it.q.toLowerCase().includes(q) || it.a.toLowerCase().includes(q))
      .slice(0, 8);
  }, [items, q]);

  // Hide every FAQ <details> that doesn't match — pure DOM manipulation so the
  // server-rendered content keeps its SEO value.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const all = document.querySelectorAll<HTMLDetailsElement>("details[id]");
    if (q.length < 2) {
      all.forEach((d) => { d.style.display = ""; });
      return;
    }
    const keep = new Set(results.map((r) => r.slug));
    all.forEach((d) => {
      d.style.display = keep.has(d.id) ? "" : "none";
      if (keep.has(d.id)) d.open = true;
    });
  }, [q, results]);

  return (
    <div className="mb-8">
      <label className="relative block">
        <span className="sr-only">Поиск по FAQ</span>
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text/35 pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1010.5 18a7.5 7.5 0 006.15-6.15z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти ответ — например, «оплата» или «Opus»"
          className="w-full bg-surface border border-text/10 rounded-xl pl-11 pr-11 py-3 text-sm placeholder:text-text/35 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Очистить"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-text/5 hover:bg-text/10 text-text/50 text-sm flex items-center justify-center transition-colors"
          >
            ×
          </button>
        )}
      </label>
      {q.length >= 2 && (
        <p className="mt-2 text-xs text-text/50">
          {results.length === 0
            ? `Ничего не найдено по запросу «${query}». Напишите в поддержку.`
            : `Найдено: ${results.length}${results.length === 8 ? "+" : ""} вопрос(ов).`}
        </p>
      )}
    </div>
  );
}
