"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/Skeleton";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://stone-ai-production.up.railway.app";

interface UserProfile {
  balance_usd: number;
  plan: string;
  usage: { lite_today: number };
  stats: { total_requests: number; total_tokens: number };
  user: { plan: string; balance_usd: number };
}

interface Generation {
  id: string;
  type: string;
  prompt: string;
  result_url: string | null;
  result_text: string | null;
  created_at: string | null;
}

const QUICK_LINKS = [
  {
    href: "/dashboard/templates",
    label: "AI-шаблоны",
    desc: "50+ шаблонов для генерации",
    color: "from-orange-500 to-amber-500",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    href: "/dashboard/projects",
    label: "Мои проекты",
    desc: "Организуйте генерации",
    color: "from-blue-500 to-cyan-500",
    icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  },
  {
    href: "/dashboard/gallery",
    label: "Галерея",
    desc: "Все ваши генерации",
    color: "from-pink-500 to-rose-500",
    icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    href: "/dashboard/seo",
    label: "SEO-модуль",
    desc: "Анализ и генерация контента",
    color: "from-green-500 to-emerald-600",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  {
    href: "/dashboard/achievements",
    label: "Достижения",
    desc: "Ваш прогресс и награды",
    color: "from-yellow-400 to-orange-500",
    icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z",
  },
  {
    href: "/webchat",
    label: "AI-чат",
    desc: "Свободный диалог с ИИ",
    color: "from-purple-500 to-violet-600",
    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
];

function getAuth() {
  try {
    const s = localStorage.getItem("stone_auth");
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} д назад`;
  return new Date(dateStr).toLocaleDateString("ru");
}

export default function DashboardPage() {
  const [auth, setAuth] = useState<{ token: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentGens, setRecentGens] = useState<Generation[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingGens, setLoadingGens] = useState(true);

  useEffect(() => {
    const stored = getAuth();
    setAuth(stored);
    if (!stored?.token) {
      setLoadingProfile(false);
      setLoadingGens(false);
      return;
    }

    const headers = { Authorization: `Bearer ${stored.token}` };

    fetch(`${API_URL}/api/user/me`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("auth");
        return res.json();
      })
      .then((data) => setProfile(data))
      .catch(() => {})
      .finally(() => setLoadingProfile(false));

    fetch(`${API_URL}/api/generations/?limit=4`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error("fetch");
        return res.json();
      })
      .then((data) => {
        const items = data.generations ?? data.items ?? data.results ?? [];
        setRecentGens(Array.isArray(items) ? items.slice(0, 4) : []);
      })
      .catch(() => {})
      .finally(() => setLoadingGens(false));
  }, []);

  const tierLabel = (t: string) =>
    t === "max-pro" ? "Elite" : t === "max" ? "Pro" : t === "mini" ? "Start" : "Free";

  const balanceUsd = profile?.balance_usd ?? profile?.user?.balance_usd ?? 0;
  const balanceRub = Math.round(Number(balanceUsd) * 95);
  const plan = profile?.plan ?? profile?.user?.plan ?? "free";
  const liteToday = profile?.usage?.lite_today ?? 0;
  const totalRequests = profile?.stats?.total_requests ?? 0;

  const stats = [
    {
      label: "Баланс",
      value: profile ? `${balanceRub} ₽` : null,
      color: "text-accent",
    },
    {
      label: "Запросов сегодня",
      value: profile ? String(liteToday) : null,
      color: "text-teal",
    },
    {
      label: "Подписка",
      value: profile ? tierLabel(plan) : null,
      color: "text-text",
    },
    {
      label: "Всего запросов",
      value: profile ? totalRequests.toLocaleString() : null,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="pb-20 animate-fadeIn">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-text mb-1">
            {auth ? `Добро пожаловать, ${auth.email}` : "Добро пожаловать"}
          </h1>
          <p className="text-sm text-text/40">{formatDate(new Date())}</p>
        </div>

        {!auth && (
          <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-text/60">Войдите, чтобы использовать все функции</p>
            <a href="/webchat" className="bg-accent text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors shrink-0">Войти</a>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-text/5 p-5"
            >
              <p className="text-xs text-text/40 mb-1.5">{s.label}</p>
              {loadingProfile || s.value === null ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              )}
            </div>
          ))}
        </div>

        {/* Quick links */}
        <h2 className="text-base font-bold text-text mb-4">Инструменты</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-10">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-2xl border border-text/5 p-5 hover:shadow-md hover:border-accent/20 transition-all group"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${link.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d={link.icon}
                  />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-text mb-0.5 group-hover:text-accent transition-colors">
                {link.label}
              </h3>
              <p className="text-[11px] text-text/40">{link.desc}</p>
            </Link>
          ))}
        </div>

        {/* Recent generations */}
        <h2 className="text-base font-bold text-text mb-4">
          Последние генерации
        </h2>
        {loadingGens ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-text/5 p-4 space-y-2"
              >
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-2.5 w-1/2" />
              </div>
            ))}
          </div>
        ) : recentGens.length === 0 ? (
          <div className="bg-white rounded-2xl border border-text/5 p-8 text-center">
            <p className="text-sm text-text/40">
              Пока нет генераций.{" "}
              <Link
                href="/dashboard/templates"
                className="text-accent hover:underline"
              >
                Начните с шаблонов
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentGens.map((gen) => (
              <Link
                key={gen.id}
                href="/dashboard/gallery"
                className="bg-white rounded-2xl border border-text/5 overflow-hidden hover:shadow-md hover:border-accent/20 transition-all group"
              >
                {gen.result_url ? (
                  <div className="aspect-[4/3] bg-text/[0.03] overflow-hidden">
                    <img
                      src={gen.result_url}
                      alt={gen.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-text/[0.03] flex items-center justify-center p-3">
                    <p className="text-[11px] text-text/30 line-clamp-4 leading-relaxed">
                      {gen.result_text?.slice(0, 120) || gen.prompt?.slice(0, 120)}
                    </p>
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs font-medium text-text truncate">
                    {gen.prompt?.slice(0, 60) || gen.type}
                  </p>
                  <p className="text-[10px] text-text/30 mt-0.5">
                    {timeAgo(gen.created_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
