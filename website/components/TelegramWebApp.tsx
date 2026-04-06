"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/auth";

/**
 * Detects Telegram In-App Browser and handles:
 * 1. Auto-login via Telegram initData (if opened from bot)
 * 2. "Open in browser" banner (if opened from regular TG link)
 */
export default function TelegramWebApp() {
  const [isTgBrowser, setIsTgBrowser] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Detect Telegram In-App Browser
    const ua = navigator.userAgent || "";
    const isTg = ua.includes("Telegram") || ua.includes("TelegramBot") ||
      (typeof window !== "undefined" && (window as any).Telegram?.WebApp);

    if (!isTg) return;
    setIsTgBrowser(true);

    // Check if already logged in
    const existingAuth = localStorage.getItem("stone_auth");
    if (existingAuth) return;

    // Try auto-login via Telegram WebApp initData
    const tgWebApp = (window as any).Telegram?.WebApp;
    if (tgWebApp?.initData) {
      // Have initData — can auto-authenticate
      autoLogin(tgWebApp.initData);
    } else {
      // Telegram browser but no initData (opened from regular link, not bot)
      setShowBanner(true);
    }
  }, []);

  const autoLogin = async (initData: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/telegram-webapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ init_data: initData }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem("stone_auth", JSON.stringify({
            token: data.token,
            email: data.user?.email || "",
            balanceUsd: data.user?.balance_usd || 0,
          }));
          window.location.reload();
        }
      } else {
        // initData invalid or expired — show banner
        setShowBanner(true);
      }
    } catch {
      setShowBanner(true);
    }
  };

  const openInBrowser = () => {
    // Open current page in system browser
    const url = window.location.href;
    // On Android, intent:// opens system browser
    // On iOS, we can only suggest copying the link
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = `intent://${url.replace(/^https?:\/\//, "")}#Intent;scheme=https;end`;
    } else {
      // iOS: copy to clipboard and show message
      navigator.clipboard?.writeText(url);
      alert("Ссылка скопирована. Откройте её в Safari для полного функционала.");
    }
  };

  if (!isTgBrowser || !showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[80] bg-[#2AABEE] text-white px-4 py-3 safe-area-pb">
      <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Откройте в браузере</p>
          <p className="text-[11px] text-white/70">Для авторизации и полного функционала</p>
        </div>
        <button
          onClick={openInBrowser}
          className="shrink-0 bg-white text-[#2AABEE] px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/90 transition-colors"
        >
          Открыть
        </button>
        <button
          onClick={() => setShowBanner(false)}
          className="shrink-0 text-white/50 hover:text-white p-1"
          aria-label="Закрыть"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
