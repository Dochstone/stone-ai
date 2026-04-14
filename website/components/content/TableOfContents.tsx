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
        } lg:block mt-2 lg:mt-0 bg-text/[0.02] lg:bg-transparent rounded-xl p-4 lg:p-0`}
      >
        <p className="hidden lg:block text-[11px] font-bold uppercase tracking-wider text-text/40 mb-3">
          {title}
        </p>
        <ol className="space-y-1 text-sm">
          {items.map((it) => {
            const isActive = activeId === it.id;
            return (
              <li key={it.id} className={it.level === 3 ? "ml-4" : ""}>
                <a
                  href={`#${it.id}`}
                  onClick={() => setMobileOpen(false)}
                  className={`block py-1.5 px-2 rounded-md transition-colors ${
                    isActive
                      ? "text-accent bg-accent/10 font-semibold"
                      : "text-text/60 hover:text-accent hover:bg-text/[0.03]"
                  }`}
                >
                  {it.text}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

