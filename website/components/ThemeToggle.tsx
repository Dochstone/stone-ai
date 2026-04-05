"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle({ compact }: { compact?: boolean } = {}) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved === "dark" || (!saved && prefersDark);
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#1a1a1e" : "#FAF9F5");
  }, []);

  const updateThemeColor = (isDark: boolean) => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#1a1a1e" : "#FAF9F5");
  };

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    updateThemeColor(next);
  };

  // Compact mode — small icon button (for collapsed sidebar)
  if (compact) {
    return (
      <button
        onClick={toggle}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-text/30 hover:text-text/60 hover:bg-text/[0.05] transition-colors"
        title={dark ? "Светлая тема" : "Тёмная тема"}
        aria-label="Toggle theme"
      >
        {dark ? (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        ) : (
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        )}
      </button>
    );
  }

  // Full toggle switch
  return (
    <button
      onClick={toggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0 ${
        dark ? "bg-accent/30" : "bg-text/20 border border-text/10"
      }`}
      title={dark ? "Светлая тема" : "Тёмная тема"}
      aria-label="Toggle theme"
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full shadow-sm flex items-center justify-center transition-all duration-300 ${
          dark ? "left-[22px] bg-accent" : "left-0.5 bg-white border border-text/10"
        }`}
      >
        {dark ? (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        ) : (
          <svg className="w-3 h-3 text-text/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        )}
      </span>
    </button>
  );
}
