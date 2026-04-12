"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "stone_cookie_consent";  // values: "all" | "essential" | (absent = not decided)
const YM_ID_GLOBAL = "__ymId";

type Consent = "all" | "essential";

function loadYandexMetrika(ymId: number) {
  if (typeof window === "undefined") return;
  if ((window as any).ym && typeof (window as any).ym === "function" && (window as any).__ymLoaded) return;
  (function (m: any, e: Document, t: string, r: string, i: string) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * Number(new Date());
    for (let j = 0; j < e.scripts.length; j++) { if (e.scripts[j].src === r) return; }
    const k = e.createElement(t) as HTMLScriptElement;
    const a = e.getElementsByTagName(t)[0] as HTMLScriptElement;
    k.async = true; k.src = r;
    if (a.parentNode) a.parentNode.insertBefore(k, a);
  })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
  (window as any).ym(ymId, "init", {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
  });
  (window as any).__ymLoaded = true;
}

export default function CookieBanner() {
  const [consent, setConsent] = useState<Consent | null | undefined>(undefined);

  // On mount: read decision and conditionally load YM
  useEffect(() => {
    let saved: Consent | null = null;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "all" || v === "essential") saved = v;
    } catch { /* ignore */ }
    setConsent(saved);

    // If previously accepted "all" — boot YM now
    if (saved === "all") {
      const ymId = (window as any)[YM_ID_GLOBAL];
      if (typeof ymId === "number" && ymId > 0) loadYandexMetrika(ymId);
    }
  }, []);

  const decide = (choice: Consent) => {
    try { localStorage.setItem(STORAGE_KEY, choice); } catch { /* ignore */ }
    setConsent(choice);
    if (choice === "all") {
      const ymId = (window as any)[YM_ID_GLOBAL];
      if (typeof ymId === "number" && ymId > 0) loadYandexMetrika(ymId);
    }
  };

  // Hide while undetermined (SSR/initial) or already decided
  if (consent === undefined || consent !== null) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-[60] animate-fadeIn">
      <div className="bg-bg/95 backdrop-blur-xl border border-text/10 rounded-2xl shadow-2xl shadow-black/10 p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-2xl shrink-0">🍪</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-text mb-1">Используем cookies</h3>
            <p className="text-[12px] text-text/55 leading-relaxed">
              Сайт собирает анонимную статистику через Яндекс.Метрику чтобы становиться удобнее. Технические данные (вход, история чатов) хранятся всегда — без них сайт не работает.
              {" "}
              <a href="/privacy" className="text-accent hover:underline font-semibold">Подробнее</a>
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => decide("all")}
            className="flex-1 px-4 py-2.5 rounded-xl bg-accent text-white text-[13px] font-bold hover:bg-accent/90 active:scale-[0.98] transition-all shadow-sm shadow-accent/20"
          >
            Принять все
          </button>
          <button
            onClick={() => decide("essential")}
            className="flex-1 px-4 py-2.5 rounded-xl bg-text/[0.05] text-text/65 text-[13px] font-semibold hover:bg-text/[0.08] active:scale-[0.98] transition-all"
          >
            Только нужные
          </button>
        </div>
      </div>
    </div>
  );
}
