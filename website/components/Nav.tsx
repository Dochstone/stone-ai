"use client";

import { useEffect, useState } from "react";
import { TELEGRAM_BOT_URL } from "@/lib/models";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <a href="/" className="text-xl font-extrabold text-text">
          Stone AI
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="/models" className="text-text/70 hover:text-text font-medium transition-colors">
            Модели
          </a>
          <a href="/pricing" className="text-text/70 hover:text-text font-medium transition-colors">
            Цены
          </a>
          <a href="/#faq" className="text-text/70 hover:text-text font-medium transition-colors">
            FAQ
          </a>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={TELEGRAM_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors hidden sm:inline-block"
          >
            Открыть в Telegram
          </a>

          {/* Mobile burger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-text transition-all ${menuOpen ? "rotate-45 translate-y-1" : ""}`} />
            <span className={`block w-5 h-0.5 bg-text transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-text transition-all ${menuOpen ? "-rotate-45 -translate-y-1" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-bg/95 backdrop-blur-md border-t border-text/5 px-4 pb-4">
          <div className="flex flex-col gap-3 py-3">
            <a href="/models" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2">
              Модели
            </a>
            <a href="/pricing" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2">
              Цены
            </a>
            <a href="/#faq" onClick={() => setMenuOpen(false)} className="text-text/70 hover:text-text font-medium py-2">
              FAQ
            </a>
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent text-white px-5 py-3 rounded-xl font-bold text-sm text-center hover:bg-accent/90 transition-colors sm:hidden"
            >
              Открыть в Telegram
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
