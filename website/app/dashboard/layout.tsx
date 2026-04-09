"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { OnboardingTour } from "@/components/OnboardingTour";
import ThemeToggle from "@/components/ThemeToggle";
import { getAvatarColor as getAvatarColorFn, getSavedAvatar } from "@/lib/avatar";
import AchievementToast from "@/components/AchievementToast";

const WebChat = dynamic(() => import("@/components/WebChat"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

const NAV_ITEMS = [
  {
    group: "Рабочее пространство",
    items: [
      { href: "/dashboard/chat", label: "AI Чат", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
      { href: "/dashboard/templates", label: "AI-шаблоны", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", badge: "50+" },
      { href: "/dashboard/marketplace", label: "Маркетплейс", icon: "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z", badge: "NEW" },
      { href: "/dashboard/agent", label: "AI-Агент", icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M5 14.5l2.47 2.47a3.18 3.18 0 004.56 0L14.5 14.5m4.5 0l-2.47 2.47a3.18 3.18 0 01-4.56 0", badge: "NEW" },
      { href: "/dashboard/bots", label: "Мои боты", icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-1.756-1.089a1.477 1.477 0 00-.82-.243H7.576a1.477 1.477 0 00-.82.243L5 14.5m14 0v4.25A2.25 2.25 0 0116.75 21h-9.5A2.25 2.25 0 015 18.75V14.5", badge: "NEW" },
      { href: "/dashboard/projects", label: "Мои проекты", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
      { href: "/dashboard/gallery", label: "Галерея", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
      { href: "/dashboard/photo-session", label: "Фотосессия", icon: "M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" },
      { href: "/dashboard/presentations", label: "Презентации", icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" },
    ],
  },
  {
    group: "SEO-инструменты",
    items: [
      { href: "/dashboard/campaigns", label: "Рекламные кампании", icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6", badge: "NEW" },
      { href: "/dashboard/seo", label: "SEO-модуль", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
      { href: "/dashboard/seo/article", label: "SEO-статьи", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
      { href: "/dashboard/seo/analyze", label: "Анализ текста", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
      { href: "/dashboard/seo/ab-test", label: "A/B тест", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
      { href: "/dashboard/seo/meta", label: "Мета-теги", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" },
    ],
  },
  {
    group: "Прогресс",
    items: [
      { href: "/dashboard/achievements", label: "Достижения", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
      { href: "/dashboard/faq", label: "FAQ", icon: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" },
      { href: "/dashboard/games", label: "Игры", icon: "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", badge: "NEW" },
    ],
  },
];

function NavIcon({ d, size }: { d: string; size?: number }) {
  const s = size || 18;
  return (
    <svg className="shrink-0" style={{ width: s, height: s }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpenRaw] = useState(false);
  const setSidebarOpen = (open: boolean) => {
    setSidebarOpenRaw(open);
    if (open) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
  };
  const [sidebarHover, setSidebarHover] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [chatLoaded, setChatLoaded] = useState(false);
  const [chatCategory, setChatCategory] = useState("all");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const isChat = pathname === "/dashboard/chat";

  // Dispatch model selection event when ?model= is in URL
  useEffect(() => {
    if (!isChat) return;
    try {
      const modelParam = new URLSearchParams(window.location.search).get("model");
      if (modelParam) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("select-model", { detail: modelParam }));
          // Clean URL
          window.history.replaceState({}, "", "/dashboard/chat");
        }, 300);
      }
    } catch {}
  }, [isChat, pathname]);

  const [sidebarPinned, setSidebarPinned] = useState(false);
  const collapsed = isChat && !sidebarHover && !sidebarPinned && !sidebarOpen;
  const expanded = !collapsed;

  const CHAT_CATEGORIES = [
    { id: "all", label: "Все чаты", svg: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
    { id: "free", label: "Бесплатные", svg: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
    { id: "image", label: "Картинки", svg: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" },
    { id: "video", label: "Видео", svg: "M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" },
  ];

  useEffect(() => {
    try {
      const saved = localStorage.getItem("stone_auth");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.token) {
          setAuthEmail(parsed.email || "Telegram");
          if (!localStorage.getItem("stone_onboarded_dashboard")) {
            setShowTour(true);
          }
        }
      }
    } catch {}
    setUserAvatar(getSavedAvatar());
    const onAvatarChange = () => setUserAvatar(getSavedAvatar());
    window.addEventListener("avatar-changed", onAvatarChange);
    return () => window.removeEventListener("avatar-changed", onAvatarChange);
  }, []);

  useEffect(() => {
    if (isChat && !chatLoaded) setChatLoaded(true);
  }, [isChat, chatLoaded]);

  // Check for new achievements
  useEffect(() => {
    if (!authEmail) return;
    const checkAchievements = async () => {
      try {
        const auth = JSON.parse(localStorage.getItem("stone_auth") || "{}");
        if (!auth.token) return;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru"}/api/achievements`, {
          headers: { Authorization: `Bearer ${auth.token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        const completed = (data.achievements || []).filter((a: { is_completed: boolean }) => a.is_completed).map((a: { slug: string }) => a.slug);
        const prev = JSON.parse(localStorage.getItem("stone_achievements_seen") || "[]");
        const newOnes = completed.filter((s: string) => !prev.includes(s));
        if (newOnes.length > 0) {
          localStorage.setItem("stone_achievements_seen", JSON.stringify(completed));
          const { triggerAchievementToast } = await import("@/components/AchievementToast");
          for (const slug of newOnes) {
            const ach = (data.achievements || []).find((a: { slug: string }) => a.slug === slug);
            if (ach) triggerAchievementToast({ title: ach.title, icon: ach.icon, reward_rub: ach.reward_rub });
          }
        } else if (prev.length === 0 && completed.length > 0) {
          localStorage.setItem("stone_achievements_seen", JSON.stringify(completed));
        }
      } catch {}
    };
    const t = setTimeout(checkAchievements, 3000);
    return () => clearTimeout(t);
  }, [authEmail]);

  // Lock body scroll on mobile when in chat
  useEffect(() => {
    if (isChat) {
      document.body.classList.add("chat-active");
    } else {
      document.body.classList.remove("chat-active");
    }
    return () => document.body.classList.remove("chat-active");
  }, [isChat]);

  const isActive = (href: string) => {
    if (href === "/dashboard/seo") return pathname === "/dashboard/seo";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="min-h-screen">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 bg-bg/95 backdrop-blur-md border-b border-text/5">
        <div className="flex items-center justify-between px-4 h-12">
          {isChat ? (
            <>
              <button
                onClick={() => window.dispatchEvent(new Event("toggle-chat-history"))}
                aria-label="История чатов"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-text/40 hover:text-text/70 hover:bg-text/[0.05] transition-colors"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                </svg>
              </button>
              <span className="text-sm font-bold text-text">AI Чат</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label="Меню"
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-text/40 hover:text-text/70 hover:bg-text/[0.05] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <ThemeToggle />
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? "Закрыть меню" : "Открыть меню"}
                className="flex items-center gap-2 text-sm font-semibold text-text/70"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Навигация
              </button>
              <div className="flex items-center gap-1">
                <ThemeToggle />
                <Link href="/dashboard/chat" className="text-xs font-bold text-accent">
                  Чат
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-[34] bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 lg:top-0 z-40 lg:z-0
            h-dvh lg:h-[100dvh]
            ${isChat && !expanded ? "w-64 lg:w-14" : "w-64"} shrink-0
            bg-bg ${isChat && sidebarHover && !sidebarPinned ? "lg:shadow-xl lg:shadow-black/10" : ""}
            border-r border-text/5
            flex flex-col
            transition-all duration-200 ease-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
          onMouseEnter={() => { if (isChat && !sidebarPinned) setSidebarHover(true); }}
          onMouseLeave={() => { if (isChat && !sidebarPinned) setSidebarHover(false); }}
        >
          <nav className={`flex-1 overflow-y-auto overscroll-contain ${expanded ? "p-2 space-y-1" : "p-0 lg:pt-2"}`}>

            {/* ═══ Collapsed: icon-only (desktop chat, not expanded) ═══ */}
            {isChat && !expanded && (
              <div className="hidden lg:flex flex-col items-center gap-0.5 pl-2">
                {CHAT_CATEGORIES.map((c) => (
                  <button key={c.id} onClick={() => setChatCategory(c.id)} aria-label={c.label}
                    className={`group relative w-9 h-9 flex items-center justify-center rounded-lg transition-all ${chatCategory === c.id ? "bg-accent/10 text-accent" : "text-text/30 hover:text-text/50 hover:bg-text/[0.05]"}`}>
                    <NavIcon d={c.svg} size={20} />
                    <span className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-dark text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">{c.label}</span>
                  </button>
                ))}
                <div className="w-6 h-px bg-text/[0.08] my-1" />
                {NAV_ITEMS.flatMap(g => g.items).filter(i => i.href !== "/dashboard/chat").map((item) => (
                  <Link key={item.href} href={item.href} aria-label={item.label} onClick={() => setSidebarOpen(false)}
                    className={`group relative w-9 h-9 flex items-center justify-center rounded-lg transition-all ${isActive(item.href) ? "text-accent bg-accent/5" : "text-text/30 hover:text-text/50 hover:bg-text/[0.05]"}`}>
                    <NavIcon d={item.icon} size={20} />
                    <span className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-dark text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">{item.label}</span>
                  </Link>
                ))}
              </div>
            )}

            {/* ═══ Expanded: full sidebar (always same render) ═══ */}
            {expanded && (
              <>
                {/* Header */}
                {isChat && (
                  <div className="px-3 pb-2 mb-1 border-b border-text/[0.06] flex items-center" style={{ paddingTop: "max(8px, env(safe-area-inset-top))" }}>
                    <a href="/" className="flex items-center gap-1.5">
                      <img src="/mascots/stone-mascot-idle.webp" alt="" width="24" height="24" />
                      <span className="text-sm font-extrabold text-text">Stone AI</span>
                    </a>
                    <span className="text-[9px] text-accent font-bold ml-1.5">65+</span>
                    {isChat && (
                      <button onClick={() => setSidebarPinned(p => !p)} title={sidebarPinned ? "Открепить" : "Закрепить"}
                        className={`ml-auto hidden lg:flex w-6 h-6 items-center justify-center rounded-md transition-colors ${sidebarPinned ? "text-accent bg-accent/10" : "text-text/20 hover:text-text/40"}`}>
                        <svg className="w-3.5 h-3.5" fill={sidebarPinned ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 4.5l-4 4L7 7 4 10l5.5 5.5L7 18h3l2.5-2.5L18 21l3-3-1.5-4 4-4-6.5-5.5z" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {/* Chat categories */}
                {isChat && (
                  <>
                    <div className="text-[9px] font-bold text-accent/50 uppercase tracking-[2px] px-3 pt-1 mb-1">Режим AI</div>
                    <div className="space-y-px mb-1">
                      {CHAT_CATEGORIES.map((c) => (
                        <button key={c.id} onClick={() => { setChatCategory(c.id); setSidebarOpen(false); }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${chatCategory === c.id ? "bg-gradient-to-r from-accent/10 to-teal/5 text-accent font-semibold border border-accent/10" : "text-text/40 hover:text-text/70 hover:bg-text/[0.04]"}`}>
                          <NavIcon d={c.svg} />
                          <span>{c.label}</span>
                          {chatCategory === c.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 my-1 px-3">
                      <div className="flex-1 h-px bg-text/[0.06]" />
                      <span className="text-[8px] text-text/15 font-bold uppercase tracking-widest">Инструменты</span>
                      <div className="flex-1 h-px bg-text/[0.06]" />
                    </div>
                  </>
                )}

                {/* Nav groups — ONE render path for all states */}
                {NAV_ITEMS.map((group) => (
                  <div key={group.group}>
                    <div className="text-[9px] font-bold text-text/20 uppercase tracking-[1.5px] px-3 pt-2 mb-0.5">{group.group}</div>
                    <div className="space-y-0.5">
                      {group.items.filter(item => !(isChat && item.href === "/dashboard/chat")).map((item) => {
                        const active = isActive(item.href);
                        return (
                          <Link key={item.href} href={item.href}
                            onClick={() => { setSidebarOpen(false); setSidebarHover(false); }}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${active ? "bg-accent/10 text-accent font-semibold" : "text-text/50 hover:text-text/80 hover:bg-text/[0.04]"}`}>
                            <NavIcon d={item.icon} />
                            <span className="truncate">{item.label}</span>
                            {item.badge && <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md ${active ? "bg-accent/20 text-accent" : "bg-text/[0.06] text-text/30"}`}>{item.badge}</span>}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}


          </nav>

          {/* Sticky bottom — Theme (desktop only) + Profile */}
          <div className={`shrink-0 border-t border-text/5 ${collapsed ? "hidden lg:flex py-1.5 flex-col items-center gap-0.5" : "p-3"}`}>
            {/* Theme toggle — desktop only (mobile has it in top bar) */}
            <div className={`${collapsed ? "" : "hidden lg:flex items-center justify-between mb-2"}`}>
              {!collapsed && <span className="text-[9px] text-text/20 font-medium">Тема</span>}
              <ThemeToggle compact={collapsed} />
            </div>
            {/* Profile — always visible */}
            {authEmail ? (
              <Link
                href="/profile"
                onClick={() => setSidebarOpen(false)}
                aria-label="Профиль"
                className={`flex items-center ${collapsed ? "justify-center p-2 rounded-lg" : "gap-3 px-3 py-2 rounded-xl"} text-text/50 hover:text-text/80 hover:bg-text/[0.04] transition-colors`}
              >
                {userAvatar ? (
                  <img src={userAvatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: getAvatarColorFn(authEmail) }}
                  >
                    <span className="text-[9px] font-bold text-white">{authEmail.slice(0, 2).toUpperCase()}</span>
                  </div>
                )}
                {!collapsed && (
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-text/60 truncate">{authEmail}</div>
                  </div>
                )}
              </Link>
            ) : (
              <Link
                href="/profile"
                onClick={() => setSidebarOpen(false)}
                aria-label="Профиль"
                className={`flex items-center ${collapsed ? "justify-center p-2 rounded-lg" : "gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold"} text-accent hover:bg-accent/5 transition-colors`}
              >
                <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {!collapsed && <span>Войти</span>}
              </Link>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {chatLoaded && (
            <div className={`${isChat ? "fixed inset-x-0 top-12 bottom-0 lg:relative lg:inset-auto lg:top-auto lg:bottom-auto lg:h-dvh" : "hidden"}`}>
              <WebChat embedded initialCategory={chatCategory} />
            </div>
          )}
          {!isChat && children}
        </main>
      </div>

      {showTour && !isChat && (
        <OnboardingTour
          onComplete={() => {
            setShowTour(false);
            localStorage.setItem("stone_onboarded_dashboard", "1");
          }}
        />
      )}
      <AchievementToast />
    </div>
  );
}

