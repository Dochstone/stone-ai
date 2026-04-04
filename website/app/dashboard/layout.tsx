"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { OnboardingTour } from "@/components/OnboardingTour";
import ThemeToggle from "@/components/ThemeToggle";
import { getAvatarColor as getAvatarColorFn, getSavedAvatar } from "@/lib/avatar";

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
      { href: "/dashboard/projects", label: "Мои проекты", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
      { href: "/dashboard/gallery", label: "Галерея", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" },
      { href: "/dashboard/photo-session", label: "Фотосессия", icon: "M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" },
      { href: "/dashboard/presentations", label: "Презентации", icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" },
    ],
  },
  {
    group: "SEO-инструменты",
    items: [
      { href: "/dashboard/seo", label: "SEO-модуль", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
      { href: "/dashboard/seo/article", label: "SEO-статьи", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
      { href: "/dashboard/seo/analyze", label: "Анализ текста", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
      { href: "/dashboard/seo/meta", label: "Мета-теги", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" },
    ],
  },
  {
    group: "Прогресс",
    items: [
      { href: "/dashboard/achievements", label: "Достижения", icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" },
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
  // collapsed = desktop only, chat mode, sidebar not hovered and not open on mobile
  const collapsed = isChat && !sidebarHover && !sidebarOpen;

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
        if (parsed.email) {
          setAuthEmail(parsed.email);
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
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label={sidebarOpen ? "Закрыть меню" : "Открыть меню"}
                className="text-text/40 hover:text-text/70 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="text-sm font-bold text-text">AI Чат</span>
              <ThemeToggle />
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
            fixed lg:sticky top-12 lg:top-0 z-40 lg:z-0
            h-[calc(100dvh-48px)] lg:h-[100dvh]
            ${isChat ? (sidebarHover ? "w-64 lg:w-64" : "w-64 lg:w-14") : "w-64"} shrink-0
            bg-bg ${isChat && sidebarHover ? "lg:shadow-xl lg:shadow-black/10" : ""}
            border-r border-text/5
            flex flex-col
            transition-all duration-200 ease-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
          onMouseEnter={() => { if (isChat) setSidebarHover(true); }}
          onMouseLeave={() => { if (isChat) setSidebarHover(false); }}
        >
          <nav className={`flex-1 overflow-y-auto overscroll-contain ${isChat ? (sidebarHover ? "p-3 space-y-4" : "p-3 lg:p-0 lg:pt-2 space-y-4 lg:space-y-0") : "p-3 space-y-4"}`}>

            {/* ═══ Chat mode collapsed: icons with hover labels ═══ */}
            {isChat && !sidebarHover && (
              <div className="hidden lg:flex flex-col items-center gap-0.5 pl-2">
                {/* AI categories */}
                {CHAT_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setChatCategory(c.id)}
                    aria-label={c.label}
                    className={`group relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150 ${
                      chatCategory === c.id
                        ? "bg-accent/10 text-accent"
                        : "text-text/30 hover:text-text/50 hover:bg-text/[0.05]"
                    }`}
                  >
                    <NavIcon d={c.svg} size={20} />
                    <span className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-dark text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                      {c.label}
                    </span>
                  </button>
                ))}

                {/* Divider */}
                <div className="w-6 h-px bg-text/[0.08] my-1" />

                {/* Tools */}
                {NAV_ITEMS.flatMap(g => g.items).filter(i => i.href !== "/dashboard/chat").map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    onClick={() => setSidebarOpen(false)}
                    className={`group relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-150 ${
                      isActive(item.href)
                        ? "text-accent bg-accent/5"
                        : "text-text/30 hover:text-text/50 hover:bg-text/[0.05]"
                    }`}
                  >
                    <NavIcon d={item.icon} size={20} />
                    <span className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-dark text-white text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-lg z-50">
                      {item.label}
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {/* Chat categories — full labels for mobile or hover */}
            {isChat && (sidebarHover || true) && (
              <div className={`${!sidebarHover ? "lg:hidden" : ""} mb-2`}>
                <div className="text-[9px] font-bold text-accent/50 uppercase tracking-[2px] px-3 mb-1.5">Режим AI</div>
                <div className="space-y-px">
                  {CHAT_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setChatCategory(c.id); setSidebarOpen(false); }}
                      aria-label={c.label}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all ${
                        chatCategory === c.id
                          ? "bg-gradient-to-r from-accent/10 to-teal/5 text-accent font-semibold border border-accent/10"
                          : "text-text/40 hover:text-text/70 hover:bg-text/[0.04]"
                      }`}
                    >
                      <NavIcon d={c.svg} />
                      <span>{c.label}</span>
                      {chatCategory === c.id && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 my-2 px-3">
                  <div className="flex-1 h-px bg-text/[0.06]" />
                  <span className="text-[8px] text-text/20 font-bold uppercase tracking-widest">Инструменты</span>
                  <div className="flex-1 h-px bg-text/[0.06]" />
                </div>
              </div>
            )}

            {/* Nav groups */}
            {NAV_ITEMS.map((group) => (
              <div key={group.group}>
                {(!isChat || sidebarHover) && (
                  <div className={`text-[10px] font-bold text-text/30 uppercase tracking-[1.5px] px-3 mb-2 ${isChat && !sidebarHover ? "lg:hidden" : ""}`}>
                    {group.group}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.items.filter(item => !(isChat && item.href === "/dashboard/chat")).map((item) => {
                    const active = isActive(item.href);
                    return isChat ? (
                      sidebarHover ? (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => { setSidebarOpen(false); setSidebarHover(false); }}
                          className={`
                            flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium
                            transition-all duration-150
                            ${active
                              ? "bg-accent/10 text-accent font-semibold"
                              : "text-text/50 hover:text-text/80 hover:bg-text/[0.04]"
                            }
                          `}
                        >
                          <NavIcon d={item.icon} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      ) : (
                        <>
                          {/* Desktop: icon only */}
                          <Link
                            key={item.href + "-lg"}
                            href={item.href}
                            title={item.label}
                            aria-label={item.label}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              hidden lg:flex items-center justify-center p-2 rounded-lg
                              transition-all duration-150
                              ${active
                                ? "bg-accent/10 text-accent"
                                : "text-text/35 hover:text-text/60 hover:bg-text/[0.05]"
                              }
                            `}
                          >
                            <NavIcon d={item.icon} />
                          </Link>
                          {/* Mobile: full with text */}
                          <Link
                            key={item.href + "-sm"}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              flex lg:hidden items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium
                              transition-all duration-150
                              ${active
                                ? "bg-accent/10 text-accent font-semibold"
                                : "text-text/50 hover:text-text/80 hover:bg-text/[0.04]"
                              }
                            `}
                          >
                            <NavIcon d={item.icon} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </>
                      )
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium
                          transition-all duration-150
                          ${active
                            ? "bg-accent/10 text-accent font-semibold"
                            : "text-text/50 hover:text-text/80 hover:bg-text/[0.04]"
                          }
                        `}
                      >
                        <NavIcon d={item.icon} />
                        <span className="truncate">{item.label}</span>
                        {item.badge && (
                          <span className={`ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            active ? "bg-accent/20 text-accent" : "bg-text/[0.06] text-text/30"
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

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
            <div className={`${isChat ? "block lg:h-dvh" : "hidden"}`} style={isChat ? { height: "calc(100dvh - 48px - var(--kb-height, 0px))" } : undefined}>
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
    </div>
  );
}

