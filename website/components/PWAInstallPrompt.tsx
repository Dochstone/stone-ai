"use client";

import { useState, useEffect, useRef } from "react";

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPrompt = useRef<any>(null);

  useEffect(() => {
    // Count visits
    const visits = parseInt(localStorage.getItem("pwa_visits") || "0") + 1;
    localStorage.setItem("pwa_visits", String(visits));

    // Check if already dismissed recently
    const dismissed = localStorage.getItem("pwa_dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 86400000) return;

    // Check if already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Only show after 3rd visit
    if (visits < 3) return;

    // iOS detection
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    if (ios) {
      // iOS doesn't have beforeinstallprompt — show manual instruction
      setShow(true);
      return;
    }

    // Chrome/Edge: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const result = await deferredPrompt.current.userChoice;
      if (result.outcome === "accepted") {
        setShow(false);
      }
      deferredPrompt.current = null;
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa_dismissed", String(Date.now()));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[360px] z-50 bg-bg border border-text/10 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-4">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-text/30 hover:text-text/60 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <span className="text-lg">⚡</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text mb-1">Установите Stone AI</p>
          {isIOS ? (
            <p className="text-xs text-text/50 leading-relaxed">
              Нажмите{" "}
              <span className="inline-flex items-center gap-0.5 font-semibold text-text/70">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Поделиться
              </span>
              {" → "}
              <span className="font-semibold text-text/70">На экран «Домой»</span>
            </p>
          ) : (
            <>
              <p className="text-xs text-text/50 mb-2.5">Быстрый доступ к 65+ нейросетям как в приложении</p>
              <div className="flex gap-2">
                <button
                  onClick={handleInstall}
                  className="px-4 py-1.5 bg-accent text-white rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors"
                >
                  Установить
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-1.5 text-text/40 text-xs font-medium hover:text-text/60 transition-colors"
                >
                  Позже
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
