"use client";

import { useEffect, useState } from "react";
import { TELEGRAM_BOT_URL } from "@/lib/models";
import ThemeToggle from "@/components/ThemeToggle";
import WelcomeBonusBanner from "@/components/WelcomeBonusBanner";
import dynamic from "next/dynamic";

const TonWalletBadge = dynamic(() => import("./TonWalletBadge"), { ssr: false });

import { getAvatarColor, getSavedAvatar } from "@/lib/avatar";

const tools = [
  { href: "/dashboard/chat", label: "AI Чат" },
  { href: "/dashboard/templates", label: "AI-шаблоны" },
  { href: "/dashboard/presentations", label: "Презентации" },
  { href: "/dashboard/campaigns", label: "Рекламные кампании" },
  { href: "/dashboard/photo-session", label: "Фотосессия товаров" },
  { href: "/dashboard/seo/article", label: "SEO-инструменты" },
  { href: "/dashboard/bots", label: "Конструктор ботов" },
  { href: "/dashboard/agent", label: "AI-Агент" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

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
    setAvatar(getSavedAvatar());
    const handler = () => setAvatar(getSavedAvatar());
    window.addEventListener("avatar-changed", handler);
    return () => window.removeEventListener("avatar-changed", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${
        menuOpen ? "bg-bg shadow-sm" : scrolled ? "bg-bg/90 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      {/* Bonus banner removed from nav — shown in WebChat for guests */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 md:h-16">
        <a href="/" className="flex items-center gap-2 shrink-0 min-w-0">
          <img src="/mascots/stone-mascot-idle.png" alt="" width="28" height="28" className="inline-block" />
          <span className="text-xl font-extrabold text-text">Stone AI</span>
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
                <div className="bg-bg rounded-xl shadow-lg border border-text/5 py-2 min-w-[200px]">
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

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
          {authEmail ? (
            <>
              <a
                href="/dashboard"
                className="text-text/60 hover:text-accent font-semibold text-sm transition-colors hidden md:inline-flex items-center gap-1.5"
                title="Панель управления"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Панель
              </a>
              <a
                href="/dashboard/chat"
                className="bg-accent text-white px-4 py-2 min-h-[44px] flex items-center rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors hidden md:inline-flex"
              >
                Открыть чат
              </a>
              <TonWalletBadge />
              <a
                href="/profile"
                className="hidden md:flex items-center gap-2 hover:opacity-80 transition-opacity"
                title="Личный кабинет"
              >
                {avatar ? (
                  <img src={avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-text/[0.06]" />
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 ring-2 ring-text/[0.06]"
                    style={{ backgroundColor: getAvatarColor(authEmail) }}
                  >
                    <span className="text-[12px] font-bold text-white">{authEmail.slice(0, 2).toUpperCase()}</span>
                  </div>
                )}
              </a>
            </>
          ) : (
            <a
              href="/dashboard/chat"
              className="bg-accent text-white px-4 py-2 min-h-[44px] flex items-center rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors hidden md:inline-flex"
            >
              Начать бесплатно
            </a>
          )}

          {/* Burger — visible below md (768px) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center w-11 h-11 shrink-0"
            aria-label={menuOpen ? "Закрыть меню" : "Открыть меню"} aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg className="w-6 h-6 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu — below md (768px) */}
      {menuOpen && (
        <div className="md:hidden bg-bg border-t border-text/5 px-4 pb-4 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col gap-1 py-3">
            {/* Основные инструменты */}
            <p className="text-xs text-text/30 font-semibold uppercase tracking-wider px-2 pt-1 pb-1">Инструменты</p>
            {tools.slice(0, 3).map((t) => (
              <a key={t.href} href={t.href} onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2.5 px-2 min-h-[44px] flex items-center">
                {t.label}
              </a>
            ))}
            {/* Свёрнутые инструменты */}
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              className="text-text/40 hover:text-text/60 font-medium text-sm py-2 px-2 min-h-[44px] flex items-center gap-1 transition-colors"
            >
              Ещё инструменты
              <svg className={`w-3.5 h-3.5 transition-transform ${toolsOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {toolsOpen && tools.slice(3).map((t) => (
              <a key={t.href} href={t.href} onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2.5 px-2 pl-4 min-h-[44px] flex items-center">
                {t.label}
              </a>
            ))}

            <div className="border-t border-text/5 my-2" />
            <a href="/models" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2.5 px-2 min-h-[44px] flex items-center">
              Модели
            </a>
            <a href="/pricing" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2.5 px-2 min-h-[44px] flex items-center">
              Тарифы
            </a>
            <a href="/blog" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2.5 px-2 min-h-[44px] flex items-center">
              Блог
            </a>
            <a href="/docs" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2.5 px-2 min-h-[44px] flex items-center">
              API Docs
            </a>

            <div className="border-t border-text/5 my-2" />
            {!authEmail && (
              <a href="/pricing" onClick={() => setMenuOpen(false)}
                className="border-2 border-accent text-accent px-5 py-3 min-h-[44px] rounded-xl font-bold text-sm text-center hover:bg-accent hover:text-white transition-colors flex items-center justify-center">
                Тарифы от 390₽
              </a>
            )}
            {authEmail ? (
              <>
                <a href="/dashboard" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-2 min-h-[44px] text-accent hover:text-accent/80 font-semibold">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Панель управления
                </a>
                <a href="/profile" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-2.5 px-2 min-h-[44px] text-text/70 hover:text-text font-medium">
                  {avatar ? (
                    <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: getAvatarColor(authEmail) }}>
                      <span className="text-[11px] font-bold text-white">{authEmail.slice(0, 2).toUpperCase()}</span>
                    </div>
                  )}
                  Личный кабинет
                </a>
                <a href="/dashboard/chat" onClick={() => setMenuOpen(false)}
                  className="bg-accent text-white px-5 py-3 min-h-[44px] rounded-xl font-bold text-sm text-center hover:bg-accent/90 transition-colors flex items-center justify-center mt-1">
                  Открыть чат
                </a>
              </>
            ) : (
              <a href="/dashboard/chat" onClick={() => setMenuOpen(false)}
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
