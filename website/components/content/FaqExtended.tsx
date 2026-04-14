"use client";

import { useMemo, useState } from "react";

export interface FaqEntry {
  q: string;
  a: string; // may contain simple inline HTML
  category?: string; // optional grouping
}

interface Props {
  items: FaqEntry[];
  title?: string;
  searchable?: boolean; // show search input (recommended for >= 10 items)
  categoriesTitle?: string; // label for "Все" tab
  defaultOpen?: boolean; // open first item by default
}

export default function FaqExtended({
  items,
  title = "Частые вопросы",
  searchable,
  categoriesTitle = "Все",
  defaultOpen = false,
}: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(defaultOpen ? 0 : null);
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>(categoriesTitle);

  const categories = useMemo(() => {
    const all = new Set<string>();
    for (const it of items) if (it.category) all.add(it.category);
    return [categoriesTitle, ...Array.from(all)];
  }, [items, categoriesTitle]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .map((it, originalIndex) => ({ ...it, originalIndex }))
      .filter((it) => {
        if (activeCat !== categoriesTitle && it.category !== activeCat) return false;
        if (!q) return true;
        return (
          it.q.toLowerCase().includes(q) ||
          it.a.toLowerCase().includes(q)
        );
      });
  }, [items, query, activeCat, categoriesTitle]);

  const showSearch = searchable ?? items.length >= 10;
  const showCategories = categories.length > 1;

  return (
    <section className="my-12">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-center mb-8">{title}</h2>

      {(showSearch || showCategories) && (
        <div className="max-w-3xl mx-auto mb-6 space-y-3">
          {showSearch && (
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Найти в FAQ…"
              className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          )}
          {showCategories && (
            <div className="flex gap-2 flex-wrap">
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveCat(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeCat === c
                      ? "bg-accent text-white"
                      : "bg-text/[0.04] text-text/60 hover:text-text"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-3">
        {filtered.map((faq) => {
          const idx = faq.originalIndex;
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="bg-bg border border-text/5 rounded-2xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-text/[0.02] transition-colors"
              >
                <span className="font-semibold text-sm pr-4">{faq.q}</span>
                <span
                  className={`text-text/30 text-xl shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-45" : ""
                  }`}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? "max-h-[600px] pb-5" : "max-h-0"
                }`}
              >
                <div
                  className="px-5 text-sm text-text/70 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: faq.a }}
                />
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-text/40 py-8">По запросу ничего не найдено.</p>
        )}
      </div>
    </section>
  );
}
