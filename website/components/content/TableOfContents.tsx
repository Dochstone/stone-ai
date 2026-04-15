"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/toc";

// Re-export for compatibility — new imports should use @/lib/toc directly.
export type { TocItem } from "@/lib/toc";
export { toAnchor } from "@/lib/toc";

interface Props {
  items: TocItem[];
  title?: string;
}

export default function TableOfContents({ items, title = "Оглавление" }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const targets = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setActiveId(e.target.id);
            break;
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: [0, 1] },
    );

    for (const t of targets) observer.observe(t);
    return () => observer.disconnect();
  }, [items]);

  if (items.length < 3) return null; // don't show TOC for short articles

  const activeIndex = Math.max(0, items.findIndex((i) => i.id === activeId));
  const progress = items.length > 0 ? ((activeIndex + 1) / items.length) * 100 : 0;

  return (
    <nav
      className="lg:sticky lg:top-24 mb-8 lg:mb-0"
      aria-label="Оглавление статьи"
    >
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        className="lg:hidden w-full flex items-center justify-between bg-text/[0.03] border border-text/5 rounded-xl px-4 py-3 text-sm font-semibold"
        aria-expanded={mobileOpen}
      >
        <span>{title}</span>
        <span className={`transition-transform ${mobileOpen ? "rotate-45" : ""}`}>+</span>
      </button>

      <div
        className={`${
          mobileOpen ? "block" : "hidden"
        } lg:block mt-2 lg:mt-0 bg-surface border border-text/5 rounded-2xl p-4 lg:p-5 shadow-sm`}
      >
        <div className="hidden lg:flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-text/50">
            {title}
          </p>
          <span className="text-[10px] font-bold text-text/35 tabular-nums">
            {activeIndex + 1}/{items.length}
          </span>
        </div>

        {/* Progress bar — visual read-ahead indicator */}
        <div className="hidden lg:block relative h-0.5 bg-text/5 rounded-full mb-4 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-teal rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ol className="space-y-0.5 text-sm relative">
          {/* Rail — a thin vertical line behind the items */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-0 bottom-0 left-[7px] w-px bg-text/5"
          />
          {items.map((it, idx) => {
            const isActive = activeId === it.id;
            const isPast = idx < activeIndex;
            return (
              <li key={it.id} className={it.level === 3 ? "ml-4" : ""}>
                <a
                  href={`#${it.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={`group relative flex items-start gap-3 py-1.5 pl-2 pr-2 rounded-md transition-all duration-200 ${
                    isActive
                      ? "text-accent bg-accent/8 font-semibold"
                      : "text-text/60 hover:text-accent hover:bg-accent/5 hover:translate-x-0.5"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`hidden lg:block shrink-0 mt-1.5 rounded-full transition-all duration-200 ${
                      isActive
                        ? "w-[7px] h-[7px] bg-accent ring-4 ring-accent/15"
                        : isPast
                          ? "w-[5px] h-[5px] bg-accent/40 translate-x-[1px]"
                          : "w-[5px] h-[5px] bg-text/15 translate-x-[1px] group-hover:bg-accent/50 group-hover:scale-110"
                    }`}
                  />
                  <span className="flex-1 leading-tight">{it.text}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

