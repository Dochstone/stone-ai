"use client";

import { useEffect, useState } from "react";

const PROMO_CODE = "VICTORY10";
const PROMO_DEADLINE = new Date("2026-05-11T23:59:59+03:00").getTime();

function formatRemaining(ms: number): string {
  if (ms <= 0) return "акция завершена";
  const totalSec = Math.floor(ms / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  if (days > 0) return `${days}д ${hours}ч`;
  if (hours > 0) return `${hours}ч ${minutes}м`;
  return `${minutes}м`;
}

export default function PromoBanner() {
  const [remaining, setRemaining] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const tick = () => setRemaining(formatRemaining(PROMO_DEADLINE - Date.now()));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  if (PROMO_DEADLINE - Date.now() <= 0) return null;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <section className="bg-gradient-to-r from-[#c8102e] via-[#a30d24] to-[#7a0a1c] py-3.5">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center sm:text-left">
        <div className="flex items-center gap-2.5">
          <span className="text-lg" aria-hidden>🎖️</span>
          <p className="text-white text-sm sm:text-base font-bold tracking-tight leading-tight">
            9 мая · <span className="text-amber-300">−10% на любой тариф</span>
            <span className="hidden sm:inline text-white/70 font-medium"> · промокод</span>
          </p>
        </div>
        <button
          onClick={handleCopy}
          className={`shrink-0 font-mono font-extrabold text-sm px-4 py-1.5 rounded-lg transition-colors ${
            copied ? "bg-emerald-400 text-zinc-900" : "bg-white text-[#7a0a1c] hover:bg-amber-100"
          }`}
          title="Скопировать промокод"
        >
          {copied ? "Скопировано!" : PROMO_CODE}
        </button>
        <a
          href="/pricing"
          className="shrink-0 bg-white/15 hover:bg-white/25 backdrop-blur text-white px-4 py-1.5 rounded-lg text-sm font-bold transition-colors"
        >
          Применить →
        </a>
        {remaining && (
          <span className="text-white/70 text-xs sm:text-sm font-medium">
            осталось <span className="text-amber-200 font-bold">{remaining}</span>
          </span>
        )}
      </div>
    </section>
  );
}
