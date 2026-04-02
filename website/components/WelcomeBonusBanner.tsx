"use client";

import { useState, useEffect } from "react";

export default function WelcomeBonusBanner() {
  const [show, setShow] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if dismissed
    const dismissed = localStorage.getItem("bonus_banner_closed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 86400000) return;

    // Check auth
    try {
      const auth = localStorage.getItem("stone_auth");
      if (auth) {
        setIsLoggedIn(true);
        // Don't show banner for logged-in users (they already got the bonus)
        return;
      }
    } catch {}

    setShow(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("bonus_banner_closed", String(Date.now()));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="relative bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#a855f7] text-white">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3 text-center">
        <span className="text-base shrink-0">🎁</span>
        <p className="text-sm font-semibold">
          Зарегистрируйтесь — <span className="underline decoration-white/40">+100₽ на баланс</span> для генераций
        </p>
        <a
          href="/webchat"
          className="shrink-0 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xs font-bold px-3.5 py-1.5 rounded-full transition-colors"
        >
          Начать бесплатно
        </a>
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
