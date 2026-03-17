"use client";

import { useEffect, useState } from "react";
import { TELEGRAM_BOT_URL } from "@/lib/models";

const tools = [
  { href: "/chat", label: "AI Чат" },
  { href: "/images", label: "Генерация картинок" },
  { href: "/documents", label: "Анализ документов" },
  { href: "/search", label: "AI Поиск" },
  { href: "/code", label: "Код-ассистент" },
  { href: "/translate", label: "Переводчик" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${
        scrolled ? "bg-bg/90 backdrop-blur-md shadow-sm" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14 lg:h-16">
        <a href="/" className="text-xl font-extrabold text-text shrink-0">
          Stone AI
        </a>

        {/* Desktop nav — lg and up */}
        <div className="hidden lg:flex items-center gap-6">
          {/* Tools dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setToolsOpen(true)}
            onMouseLeave={() => setToolsOpen(false)}
          >
            <button className="text-text/70 hover:text-text font-medium text-sm transition-colors flex items-center gap-1">
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
          <a href="/blog" className="text-text/70 hover:text-text font-medium text-sm transition-colors">
            Блог
          </a>
          <a href="/#faq" className="text-text/70 hover:text-text font-medium text-sm transition-colors">
            FAQ
          </a>
          <a href="/docs" className="text-text/70 hover:text-text font-medium text-sm transition-colors">
            API
          </a>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/webchat"
            className="bg-accent text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors hidden lg:inline-block"
          >
            Начать бесплатно
          </a>

          {/* Burger — visible below lg */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-text transition-all ${menuOpen ? "rotate-45 translate-y-1" : ""}`} />
            <span className={`block w-5 h-0.5 bg-text transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-text transition-all ${menuOpen ? "-rotate-45 -translate-y-1" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile/Tablet menu — below lg */}
      {menuOpen && (
        <div className="lg:hidden bg-bg/95 backdrop-blur-md border-t border-text/5 px-4 pb-4 max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col gap-1 py-3">
            <p className="text-xs text-text/30 font-semibold uppercase tracking-wider px-2 pt-1 pb-2">Инструменты</p>
            {tools.map((t) => (
              <a key={t.href} href={t.href} onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2 px-2">
                {t.label}
              </a>
            ))}
            <div className="border-t border-text/5 my-2" />
            <a href="/models" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2 px-2">
              Модели
            </a>
            <a href="/pricing" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2 px-2">
              Цены
            </a>
            <a href="/blog" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2 px-2">
              Блог
            </a>
            <a href="/topup" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2 px-2">
              Пополнить
            </a>
            <a href="/docs" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2 px-2">
              API Docs
            </a>
            <div className="border-t border-text/5 my-2" />
            <a
              href="/webchat"
              onClick={() => setMenuOpen(false)}
              className="bg-accent text-white px-5 py-3 rounded-xl font-bold text-sm text-center hover:bg-accent/90 transition-colors"
            >
              Начать бесплатно
            </a>
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-text/15 text-text px-5 py-3 rounded-xl font-bold text-sm text-center hover:border-accent hover:text-accent transition-colors mt-1"
            >
              Telegram-бот
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
