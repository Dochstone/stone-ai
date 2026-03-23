"use client";

import { useEffect, useState } from "react";
import { TELEGRAM_BOT_URL } from "@/lib/models";
import ThemeToggle from "@/components/ThemeToggle";

function getAvatarColor(email: string): string {
  const colors = ["#C4623D", "#0E9A83", "#4285f4", "#7c3aed", "#ec4899", "#f59e0b", "#06b6d4", "#10a37f"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const tools = [
  { href: "/chat", label: "AI Чат" },
  { href: "/images", label: "Генерация картинок" },
  { href: "/video", label: "AI Видео" },
  { href: "/audio", label: "AI Аудио" },
  { href: "/3d", label: "3D Генерация" },
  { href: "/documents", label: "Анализ документов" },
  { href: "/search", label: "AI Поиск" },
  { href: "/code", label: "Код-ассистент" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("stone_auth");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) setAuthEmail(parsed.email);
      }
    } catch {}
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${
        scrolled ? "bg-bg/90 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 md:h-16">
        <a href="/" className="flex items-center gap-2 shrink-0">
          <div>
            <span className="text-xl font-extrabold text-text block leading-tight">Stone AI</span>
            <span className="hidden md:block text-[9px] text-text/25 tracking-[0.15em] uppercase leading-none">Smart Technology Omniscient Neural Engine</span>
          </div>
          <span className="hidden sm:inline-flex items-center bg-accent/8 text-accent text-[9px] font-bold px-2 py-0.5 rounded-full border border-accent/15">
            65+ моделей
          </span>
        </a>

        {/* Desktop nav — md and up */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          <a href="/" className="text-text/70 hover:text-text font-medium text-sm transition-colors">
            Главная
          </a>
          {/* Tools dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setToolsOpen(true)}
            onMouseLeave={() => setToolsOpen(false)}
          >
            <button className="text-text/70 hover:text-text font-medium text-sm transition-colors flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-accent/30 rounded-lg px-1 -mx-1" aria-haspopup="menu" aria-expanded={toolsOpen}>
              Инструменты
              <svg className={`w-3.5 h-3.5 transition-transform ${toolsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {toolsOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2">
                <div className="bg-white rounded-xl shadow-lg border border-text/5 py-2 min-w-[200px]">
                  {tools.map((t) => (
                    <a
                      key={t.href}
                      href={t.href}
                      className="block px-4 py-2.5 text-sm text-text/70 hover:text-text hover:bg-bg transition-colors"
                    >
                      {t.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <a href="/models" className="text-text/70 hover:text-text font-medium text-sm transition-colors">
            Модели
          </a>
          <a href="/pricing" className="text-text/70 hover:text-text font-medium text-sm transition-colors">
            Цены
          </a>
          <a href="/blog" className="hidden lg:block text-text/70 hover:text-text font-medium text-sm transition-colors">
            Блог
          </a>
          <a href="/#faq" className="hidden lg:block text-text/70 hover:text-text font-medium text-sm transition-colors">
            FAQ
          </a>
          <a href="/docs" className="hidden lg:block text-text/70 hover:text-text font-medium text-sm transition-colors">
            API
          </a>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          {authEmail ? (
            <>
              <a
                href="/webchat"
                className="bg-accent text-white px-4 py-2 min-h-[44px] flex items-center rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors hidden md:inline-flex"
              >
                Открыть чат
              </a>
              <a
                href="/profile"
                className="hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity"
                title="Личный кабинет"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 ring-2 ring-text/[0.06]"
                  style={{ backgroundColor: getAvatarColor(authEmail) }}
                >
                  <span className="text-[12px] font-bold text-white">{authEmail.slice(0, 2).toUpperCase()}</span>
                </div>
              </a>
            </>
          ) : (
            <a
              href="/webchat"
              className="bg-accent text-white px-4 py-2 min-h-[44px] flex items-center rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors hidden md:inline-flex"
            >
              Начать бесплатно
            </a>
          )}

          {/* Burger — visible below md (768px) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col justify-center items-center w-11 h-11 gap-1.5"
            aria-label="Меню" aria-expanded={menuOpen}
          >
            <span className={`block w-5 h-0.5 bg-text transition-all ${menuOpen ? "rotate-45 translate-y-1" : ""}`} />
            <span className={`block w-5 h-0.5 bg-text transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-text transition-all ${menuOpen ? "-rotate-45 -translate-y-1" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu — below md (768px) */}
      {menuOpen && (
        <div className="md:hidden bg-bg/95 backdrop-blur-md border-t border-text/5 px-4 pb-4 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col gap-1 py-3">
            <p className="text-xs text-text/30 font-semibold uppercase tracking-wider px-2 pt-1 pb-2">Инструменты</p>
            {tools.map((t) => (
              <a key={t.href} href={t.href} onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2.5 px-2 min-h-[44px] flex items-center">
                {t.label}
              </a>
            ))}
            <div className="border-t border-text/5 my-2" />
            <a href="/models" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2.5 px-2 min-h-[44px] flex items-center">
              Модели
            </a>
            <a href="/pricing" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2.5 px-2 min-h-[44px] flex items-center">
              Цены
            </a>
            <a href="/blog" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2.5 px-2 min-h-[44px] flex items-center">
              Блог
            </a>
            <a href="/pricing" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2.5 px-2 min-h-[44px] flex items-center">
              Тарифы
            </a>
            <a href="/docs" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2.5 px-2 min-h-[44px] flex items-center">
              API Docs
            </a>
            <div className="border-t border-text/5 my-2" />
            {authEmail ? (
              <>
                <a href="/profile" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-2 min-h-[44px] text-text/70 hover:text-text font-medium">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: getAvatarColor(authEmail) }}>
                    <span className="text-[11px] font-bold text-white">{authEmail.slice(0, 2).toUpperCase()}</span>
                  </div>
                  Личный кабинет
                </a>
                <a href="/webchat" onClick={() => setMenuOpen(false)}
                  className="bg-accent text-white px-5 py-3 min-h-[44px] rounded-xl font-bold text-sm text-center hover:bg-accent/90 transition-colors flex items-center justify-center mt-1">
                  Открыть чат
                </a>
              </>
            ) : (
              <a href="/webchat" onClick={() => setMenuOpen(false)}
                className="bg-accent text-white px-5 py-3 min-h-[44px] rounded-xl font-bold text-sm text-center hover:bg-accent/90 transition-colors flex items-center justify-center">
                Начать бесплатно
              </a>
            )}
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-text/15 text-text px-5 py-3 min-h-[44px] rounded-xl font-bold text-sm text-center hover:border-accent hover:text-accent transition-colors mt-1 flex items-center justify-center"
            >
              Telegram-бот
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
