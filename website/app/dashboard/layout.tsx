"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  {
    group: "Рабочее пространство",
    items: [
      { href: "/dashboard/templates", label: "AI-шаблоны", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", badge: "50+" },
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

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("stone_auth");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) setAuthEmail(parsed.email);
      }
    } catch {}
  }, []);

  const isActive = (href: string) => {
    if (href === "/dashboard/seo") return pathname === "/dashboard/seo";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="min-h-screen pt-14 md:pt-16">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-14 md:top-16 z-30 bg-bg/95 backdrop-blur-md border-b border-text/5">
        <div className="flex items-center justify-between px-4 h-12">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 text-sm font-semibold text-text/70"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Навигация
          </button>
          <Link href="/webchat" className="text-xs font-bold text-accent">
            Открыть чат
          </Link>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar overlay (mobile) */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-14 md:top-16 z-40 lg:z-0
            h-[calc(100vh-56px)] md:h-[calc(100vh-64px)]
            w-64 shrink-0
            bg-bg lg:bg-transparent
            border-r border-text/5
            overflow-y-auto overscroll-contain
            transition-transform duration-200 ease-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <nav className="p-4 space-y-6">
            {/* User card */}
            {authEmail && (
              <Link
                href="/profile"
                className="flex items-center gap-3 p-3 rounded-xl bg-text/[0.03] hover:bg-text/[0.06] border border-text/5 transition-colors"
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: getAvatarColor(authEmail) }}
                >
                  <span className="text-[11px] font-bold text-white">
                    {authEmail.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-text truncate">{authEmail}</div>
                  <div className="text-[10px] text-text/40">Личный кабинет</div>
                </div>
              </Link>
            )}

            {/* Nav groups */}
            {NAV_ITEMS.map((group) => (
              <div key={group.group}>
                <div className="text-[10px] font-bold text-text/30 uppercase tracking-[1.5px] px-3 mb-2">
                  {group.group}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
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

            {/* Quick actions */}
            <div className="border-t border-text/5 pt-4">
              <Link
                href="/webchat"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-accent hover:bg-accent/5 transition-colors"
              >
                <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Открыть AI-чат
              </Link>
              <Link
                href="/pricing"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text/40 hover:text-text/60 hover:bg-text/[0.04] transition-colors"
              >
                <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Тарифы
              </Link>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}

function getAvatarColor(email: string): string {
  const colors = ["#C4623D", "#0E9A83", "#4285f4", "#7c3aed", "#ec4899", "#f59e0b", "#06b6d4", "#10a37f"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
