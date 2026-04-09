"use client";

import { useState, useEffect, useCallback } from "react";
import { SkeletonStats, SkeletonTable } from "@/components/Skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

interface Stats {
  total_users: number;
  dau: number;
  requests_today: number;
  requests_month: number;
  revenue_today_usd: number;
  revenue_month_usd: number;
  top_models: { model: string; requests: number }[];
  payment_breakdown: { method: string; count: number; total_usd: number }[];
}

interface UserRow {
  id: number;
  tg_id: number | null;
  email: string | null;
  username: string | null;
  first_name: string | null;
  balance_usd: number;
  subscription_tier: string;
  total_deposited_usd: number;
  total_requests: number;
  today_requests: number;
  total_tokens_used: number;
  joined_at: string | null;
  last_active: string | null;
}

interface Transaction {
  id: number;
  user_id: number;
  amount_usd: number;
  currency: string;
  status: string;
  created_at: string | null;
}

/* ── Icons (inline SVG paths) ── */
const ICONS = {
  users: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  dau: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  requests: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
  revenue: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  logout: "M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9",
  refresh: "M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182",
};

function Icon({ d, className = "w-5 h-5" }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

/* ── Stat Card ── */
const STAT_CONFIGS: Record<string, { icon: string; color: string; bgColor: string }> = {
  users: { icon: ICONS.users, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  dau: { icon: ICONS.dau, color: "text-teal", bgColor: "bg-teal/10" },
  requests_today: { icon: ICONS.requests, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  requests_month: { icon: ICONS.requests, color: "text-orange-500", bgColor: "bg-orange-500/10" },
  revenue_today: { icon: ICONS.revenue, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
  revenue_month: { icon: ICONS.revenue, color: "text-green-500", bgColor: "bg-green-500/10" },
};

function StatCard({ id, label, value, sub }: { id: string; label: string; value: string; sub?: string }) {
  const cfg = STAT_CONFIGS[id] || STAT_CONFIGS.users;
  return (
    <div className="bg-white rounded-2xl border border-text/5 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${cfg.bgColor} flex items-center justify-center ${cfg.color}`}>
          <Icon d={cfg.icon} />
        </div>
      </div>
      <div className="text-2xl font-extrabold tracking-tight">{value}</div>
      <div className="text-text/40 text-xs font-medium mt-1">{label}</div>
      {sub && <div className="text-text/25 text-[10px] mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Horizontal bar chart ── */
function BarChart({ items, color = "accent" }: { items: { label: string; value: number; sub?: string }[]; color?: string }) {
  const max = Math.max(...items.map(i => i.value), 1);
  return (
    <div className="space-y-2.5">
      {items.map((item, i) => (
        <div key={item.label} className="group">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-text/70 truncate flex items-center gap-2">
              <span className="text-text/25 text-xs w-5 text-right shrink-0">{i + 1}</span>
              <span className="truncate">{item.label}</span>
            </span>
            <span className="font-mono text-text/50 text-xs shrink-0 ml-2">
              {item.value.toLocaleString()}
              {item.sub && <span className="text-text/25 ml-1">{item.sub}</span>}
            </span>
          </div>
          <div className="h-2 bg-text/[0.04] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                color === "accent" ? "bg-accent/70" : color === "teal" ? "bg-teal/70" : "bg-blue-500/70"
              }`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Tier badge ── */
function TierBadge({ tier }: { tier: string }) {
  const styles: Record<string, string> = {
    "max-pro": "bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-600 border-amber-500/20",
    max: "bg-accent/10 text-accent border-accent/20",
    mini: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    free: "bg-text/[0.04] text-text/40 border-text/[0.06]",
  };
  const labels: Record<string, string> = { "max-pro": "Elite", max: "Pro", mini: "Start", free: "Free" };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${styles[tier] || styles.free}`}>
      {labels[tier] || tier}
    </span>
  );
}

/* ── Status badge ── */
function StatusBadge({ status }: { status: string }) {
  const s = status === "completed" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    : status === "pending" ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
    : "bg-red-500/10 text-red-500 border-red-500/20";
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${s}`}>{status}</span>;
}

/* ── Tab config ── */
const TABS = [
  { id: "stats" as const, label: "Статистика", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
  { id: "users" as const, label: "Пользователи", icon: ICONS.users },
  { id: "transactions" as const, label: "Платежи", icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" },
  { id: "promos" as const, label: "Промокоды", icon: "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z" },
  { id: "referrals" as const, label: "Рефералы", icon: "M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" },
  { id: "analytics" as const, label: "Аналитика", icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
];

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"stats" | "users" | "transactions" | "promos" | "referrals" | "analytics">("stats");

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<{ referrers: any[]; total_referred_users: number }>({ referrers: [], total_referred_users: 0 });
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsDays, setAnalyticsDays] = useState(7);
  const [analyticsSortBy, setAnalyticsSortBy] = useState("views");
  const [analyticsSortOrder, setAnalyticsSortOrder] = useState("desc");
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [userTier, setUserTier] = useState("");
  const [userDateFrom, setUserDateFrom] = useState("");
  const [userDateTo, setUserDateTo] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) { setToken(saved); setAuthed(true); }
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Login failed"); return; }
      setToken(data.token);
      localStorage.setItem("admin_token", data.token);
      setAuthed(true);
    } catch { setError("Network error"); }
  };

  const fetchData = useCallback(async (endpoint: string) => {
    const res = await fetch(`${API_URL}/api/admin/web/${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401 || res.status === 403) {
      setAuthed(false);
      localStorage.removeItem("admin_token");
      setError("Доступ запрещён. Проверьте ADMIN_EMAILS на сервере.");
      return null;
    }
    return res.json();
  }, [token]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(userSearch), 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  // Debounce tier/date filters too — prevents flashing
  const [debouncedTier, setDebouncedTier] = useState(userTier);
  const [debouncedDateFrom, setDebouncedDateFrom] = useState(userDateFrom);
  const [debouncedDateTo, setDebouncedDateTo] = useState(userDateTo);
  useEffect(() => { const t = setTimeout(() => setDebouncedTier(userTier), 200); return () => clearTimeout(t); }, [userTier]);
  useEffect(() => { const t = setTimeout(() => setDebouncedDateFrom(userDateFrom), 200); return () => clearTimeout(t); }, [userDateFrom]);
  useEffect(() => { const t = setTimeout(() => setDebouncedDateTo(userDateTo), 200); return () => clearTimeout(t); }, [userDateTo]);

  const loadTab = useCallback(() => {
    if (!authed || !token) return;
    // Only show loading spinner on initial load / tab switch, not on filter changes
    if (tab === "stats") {
      fetchData("stats").then((d) => { if (d) setStats(d); setLoading(false); });
    } else if (tab === "users") {
      const params = new URLSearchParams({ limit: "200" });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (debouncedTier) params.set("tier", debouncedTier);
      if (debouncedDateFrom) params.set("date_from", debouncedDateFrom);
      if (debouncedDateTo) params.set("date_to", debouncedDateTo);
      fetchData(`users?${params}`).then((d) => { if (d) { setUsers(d.users); setUsersTotal(d.total); } setLoading(false); });
    } else if (tab === "promos") {
      fetchData("promos").then((d) => { if (d) setPromos(d.promos); setLoading(false); });
    } else if (tab === "referrals") {
      fetchData("referrals").then((d) => { if (d) setReferrals(d); setLoading(false); });
    } else if (tab === "analytics") {
      fetch(`${API_URL}/api/analytics/stats?days=${analyticsDays}&sort_by=${analyticsSortBy}&order=${analyticsSortOrder}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : null).then(d => { if (d) setAnalytics(d); setLoading(false); }).catch(() => setLoading(false));
    } else {
      fetchData("transactions?limit=50").then((d) => { if (d) setTransactions(d.transactions); setLoading(false); });
    }
  }, [authed, token, tab, fetchData, debouncedSearch, debouncedTier, debouncedDateFrom, debouncedDateTo, analyticsDays, analyticsSortBy, analyticsSortOrder]);

  useEffect(() => { loadTab(); }, [loadTab]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken(""); setAuthed(false);
    setStats(null); setUsers([]); setTransactions([]);
  };

  /* ── Login screen ── */
  if (!authed) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold">Stone AI Admin</h1>
            <p className="text-text/40 text-sm mt-1">Панель управления</p>
          </div>
          <form onSubmit={login} className="bg-white rounded-2xl border border-text/5 p-6 space-y-4 shadow-sm">
            <div>
              <label className="text-xs font-semibold text-text/50 mb-1.5 block">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@stoneai.ru" required
                className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-text/50 mb-1.5 block">Пароль</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="********" required
                className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30" />
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                <p className="text-red-500 text-xs font-medium">{error}</p>
              </div>
            )}
            <button type="submit" className="w-full bg-accent text-white py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors shadow-md shadow-accent/20">
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* ── Dashboard ── */
  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
            <p className="text-text/40 text-sm mt-0.5">Stone AI — панель управления</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadTab} className="p-2.5 rounded-xl text-text/30 hover:text-text/60 hover:bg-text/[0.04] transition-colors" title="Обновить">
              <Icon d={ICONS.refresh} />
            </button>
            <button onClick={logout} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-text/40 hover:text-red-500 hover:bg-red-500/5 transition-colors">
              <Icon d={ICONS.logout} className="w-4 h-4" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-text/[0.03] rounded-xl p-1 mb-8 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                tab === t.id
                  ? "bg-white text-text shadow-sm"
                  : "text-text/40 hover:text-text/60"
              }`}>
              <Icon d={t.icon} className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Skeleton loading */}
        {loading && tab === "stats" && (
          <div className="space-y-6">
            <SkeletonStats count={6} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SkeletonTable rows={10} cols={2} />
              <SkeletonTable rows={5} cols={3} />
            </div>
          </div>
        )}
        {loading && (tab === "users" || tab === "transactions" || tab === "referrals") && (
          <SkeletonTable rows={8} cols={tab === "users" ? 8 : 6} />
        )}
        {loading && tab === "promos" && <SkeletonTable rows={2} cols={4} />}

        {/* ═══ Stats Tab ═══ */}
        {tab === "stats" && stats && !loading && (
          <div className="space-y-6 animate-fadeIn">
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatCard id="users" label="Всего пользователей" value={stats.total_users.toLocaleString()} />
              <StatCard id="dau" label="DAU сегодня" value={stats.dau.toLocaleString()} />
              <StatCard id="requests_today" label="Запросов сегодня" value={stats.requests_today.toLocaleString()} />
              <StatCard id="requests_month" label="Запросов за месяц" value={stats.requests_month.toLocaleString()} />
              <StatCard id="revenue_today" label="Выручка сегодня" value={`$${stats.revenue_today_usd}`} />
              <StatCard id="revenue_month" label="Выручка за месяц" value={`$${stats.revenue_month_usd}`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Models */}
              <div className="bg-white rounded-2xl border border-text/5 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-sm">Топ-10 моделей</h3>
                  <span className="text-[10px] text-text/25 font-medium">запросов</span>
                </div>
                <BarChart
                  items={stats.top_models.map(m => ({ label: m.model, value: m.requests }))}
                  color="accent"
                />
              </div>

              {/* Payment Breakdown */}
              <div className="bg-white rounded-2xl border border-text/5 p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-sm">Способы оплаты</h3>
                  <span className="text-[10px] text-text/25 font-medium">за месяц</span>
                </div>
                {stats.payment_breakdown.length > 0 ? (
                  <BarChart
                    items={stats.payment_breakdown.map(p => ({
                      label: p.method || "unknown",
                      value: p.count,
                      sub: `$${p.total_usd}`,
                    }))}
                    color="teal"
                  />
                ) : (
                  <p className="text-text/25 text-sm py-8 text-center">Нет транзакций за этот месяц</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══ Users Tab ═══ */}
        {tab === "users" && !loading && (
          <div className="space-y-4 animate-fadeIn">
            {/* Filters */}
            <div className="bg-white rounded-2xl border border-text/5 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="relative col-span-2 sm:col-span-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Поиск: email, имя..."
                    className="w-full bg-bg border border-text/10 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <select value={userTier} onChange={(e) => setUserTier(e.target.value)}
                  className="bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm">
                  <option value="">Все тарифы</option>
                  <option value="free">Free</option>
                  <option value="mini">Start</option>
                  <option value="max">Pro</option>
                  <option value="max-pro">Elite</option>
                </select>
                <input type="date" value={userDateFrom} onChange={(e) => setUserDateFrom(e.target.value)}
                  className="bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm" title="Дата от" />
                <input type="date" value={userDateTo} onChange={(e) => setUserDateTo(e.target.value)}
                  className="bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm" title="Дата до" />
              </div>
              {(userSearch || userTier || userDateFrom || userDateTo) && (
                <button onClick={() => { setUserSearch(""); setUserTier(""); setUserDateFrom(""); setUserDateTo(""); }}
                  className="mt-2 text-xs text-accent hover:underline font-medium">
                  Сбросить фильтры
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-text/5 overflow-hidden">
              <div className="p-4 border-b border-text/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm">Пользователи</span>
                  <span className="text-text/30 text-xs ml-2 bg-text/[0.04] px-2 py-0.5 rounded-md font-medium">{usersTotal}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-text/[0.02] text-text/40 text-xs uppercase tracking-wider">
                      <th className="text-left py-3 px-4 font-semibold">ID</th>
                      <th className="text-left py-3 px-4 font-semibold">Имя</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-center py-3 px-4 font-semibold">Тариф</th>
                      <th className="text-right py-3 px-4 font-semibold">Баланс</th>
                      <th className="text-right py-3 px-4 font-semibold cursor-pointer hover:text-accent" onClick={() => { setUsers(prev => [...prev].sort((a, b) => (b.today_requests || 0) - (a.today_requests || 0))); }}>Сегодня ▼</th>
                      <th className="text-right py-3 px-4 font-semibold cursor-pointer hover:text-accent" onClick={() => { setUsers(prev => [...prev].sort((a, b) => b.total_requests - a.total_requests)); }}>Всего ▼</th>
                      <th className="text-left py-3 px-4 font-semibold">Дата рег.</th>
                      <th className="text-left py-3 px-4 font-semibold cursor-pointer hover:text-accent" onClick={() => { setUsers(prev => [...prev].sort((a, b) => (b.last_active || "").localeCompare(a.last_active || ""))); }}>Активность ▼</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t border-text/[0.04] hover:bg-text/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono text-text/30 text-xs">{u.tg_id || u.id}</td>
                        <td className="py-3 px-4 font-medium">{u.first_name || u.username || "—"}</td>
                        <td className="py-3 px-4 text-text/50 text-xs">{u.email || "—"}</td>
                        <td className="py-3 px-4 text-center">
                          <select
                            value={u.subscription_tier}
                            onChange={async (e) => {
                              const newTier = e.target.value;
                              const res = await fetch(`${API_URL}/api/admin/web/users/${u.id}/subscription`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ tier: newTier }),
                              });
                              if (res.ok) {
                                setUsers(prev => prev.map(x => x.id === u.id ? { ...x, subscription_tier: newTier } : x));
                              }
                            }}
                            className={`text-[10px] font-bold px-2 py-1 rounded-md border cursor-pointer ${
                              u.subscription_tier === "max-pro" ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-500/20"
                              : u.subscription_tier === "max" ? "bg-accent/10 text-accent border-accent/20"
                              : u.subscription_tier === "mini" ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                              : "bg-text/[0.04] text-text/40 border-text/[0.06]"
                            }`}
                          >
                            <option value="free">Free</option>
                            <option value="mini">Start</option>
                            <option value="max">Pro</option>
                            <option value="max-pro">Elite</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <input
                              type="number"
                              defaultValue={Math.round(u.balance_usd * 95)}
                              onBlur={async (e) => {
                                const rub = Number(e.target.value);
                                if (isNaN(rub) || rub === Math.round(u.balance_usd * 95)) return;
                                const usd = rub / 95;
                                const res = await fetch(`${API_URL}/api/admin/web/users/${u.id}/balance`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                  body: JSON.stringify({ balance_usd: usd, reason: "admin manual" }),
                                });
                                if (res.ok) {
                                  setUsers(prev => prev.map(x => x.id === u.id ? { ...x, balance_usd: usd } : x));
                                }
                              }}
                              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                              className="w-16 text-right font-mono text-xs bg-transparent border-b border-dashed border-text/10 focus:border-accent outline-none py-0.5 px-1"
                            />
                            <span className="text-[10px] text-text/25">₽</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs">{(u.today_requests || 0) > 0 ? <span className="text-accent font-bold">{u.today_requests}</span> : <span className="text-text/20">0</span>}</td>
                        <td className="py-3 px-4 text-right font-mono text-xs">{u.total_requests > 0 ? u.total_requests.toLocaleString() : <span className="text-text/20">0</span>}</td>
                        <td className="py-3 px-4 text-text/30 text-xs">{u.joined_at ? `${u.joined_at.slice(8,10)}.${u.joined_at.slice(5,7)}` : "—"}</td>
                        <td className="py-3 px-4 text-text/30 text-xs">{u.last_active ? `${u.last_active.slice(8,10)}.${u.last_active.slice(5,7)}` : "—"}</td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={8} className="py-12 text-center text-text/25 text-sm">Нет пользователей</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Transactions Tab ═══ */}
        {tab === "transactions" && !loading && (
          <div className="bg-white rounded-2xl border border-text/5 overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-text/5 flex items-center justify-between">
              <span className="font-bold text-sm">Последние платежи</span>
              <span className="text-text/25 text-xs bg-text/[0.04] px-2 py-0.5 rounded-md font-medium">{transactions.length}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-text/[0.02] text-text/40 text-xs uppercase tracking-wider">
                    <th className="text-left py-3 px-4 font-semibold">ID</th>
                    <th className="text-left py-3 px-4 font-semibold">User</th>
                    <th className="text-right py-3 px-4 font-semibold">Сумма</th>
                    <th className="text-left py-3 px-4 font-semibold">Метод</th>
                    <th className="text-left py-3 px-4 font-semibold">Статус</th>
                    <th className="text-left py-3 px-4 font-semibold">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-t border-text/[0.04] hover:bg-text/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-text/30 text-xs">{t.id}</td>
                      <td className="py-3 px-4 font-mono text-text/50 text-xs">{t.user_id}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold">${t.amount_usd.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold bg-text/[0.04] text-text/50 px-2 py-0.5 rounded-md border border-text/[0.06]">{t.currency}</span>
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={t.status} /></td>
                      <td className="py-3 px-4 text-text/30 text-xs">{t.created_at?.slice(0, 16).replace("T", " ") || "—"}</td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-text/25 text-sm">Нет транзакций</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ═══ Promos Tab ═══ */}
        {tab === "promos" && !loading && (
          <div className="space-y-4 animate-fadeIn">
            {/* Create form */}
            <div className="bg-white rounded-2xl border border-text/5 p-5">
              <h3 className="font-bold text-sm mb-4">Создать промокод</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);
                const auth = localStorage.getItem("admin_token");
                if (!auth) return;
                const res = await fetch(`${API_URL}/api/admin/web/promos`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth}` },
                  body: JSON.stringify({
                    code: fd.get("code"), type: fd.get("type"), tier: fd.get("tier"),
                    days: fd.get("days"), credits: fd.get("credits"),
                    max_uses: fd.get("max_uses"), desc: fd.get("desc"),
                  }),
                });
                if (res.ok) {
                  form.reset();
                  fetchData("promos").then((d: any) => { if (d) setPromos(d.promos); });
                }
              }} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input name="code" placeholder="КОД" required className="bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-accent/30" />
                <select name="type" className="bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-xs">
                  <option value="days">Бесплатные дни</option>
                  <option value="credits">Кредиты</option>
                </select>
                <select name="tier" className="bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-xs">
                  <option value="mini">Start</option>
                  <option value="max">Pro</option>
                  <option value="max-pro">Elite</option>
                </select>
                <input name="days" type="number" defaultValue={7} placeholder="Дней" className="bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30" />
                <input name="credits" type="number" defaultValue={0} placeholder="Кредитов" className="bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30" />
                <input name="max_uses" type="number" defaultValue={1000} placeholder="Макс. исп." className="bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30" />
                <input name="desc" placeholder="Описание" className="bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-xs col-span-2 sm:col-span-1 focus:outline-none focus:ring-2 focus:ring-accent/30" />
                <button type="submit" className="bg-accent text-white rounded-xl px-3 py-2.5 text-xs font-bold hover:bg-accent/90 transition-colors shadow-sm shadow-accent/15">
                  Создать
                </button>
              </form>
            </div>

            {/* Promo list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {promos.map((p: any) => {
                const pct = Math.min(100, (p.used / p.max_uses) * 100);
                return (
                  <div key={p.code} className="bg-white rounded-2xl border border-text/5 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-lg text-accent">{p.code}</span>
                          {p.tier !== "—" && <TierBadge tier={p.tier} />}
                        </div>
                        <p className="text-text/50 text-xs">{p.desc}</p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!confirm(`Удалить промокод ${p.code}?`)) return;
                          const auth = localStorage.getItem("admin_token");
                          if (!auth) return;
                          await fetch(`${API_URL}/api/admin/web/promos/${p.code}`, {
                            method: "DELETE", headers: { Authorization: `Bearer ${auth}` },
                          });
                          fetchData("promos").then((d: any) => { if (d) setPromos(d.promos); });
                        }}
                        className="p-2 rounded-lg text-text/20 hover:text-red-500 hover:bg-red-500/5 transition-colors"
                        title="Удалить"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-text/35 mb-3">
                      <span className="bg-text/[0.04] px-2 py-0.5 rounded">{p.type === "days" ? "дни" : "кредиты"}</span>
                      {p.days > 0 && <span>{p.days} дн.</span>}
                      {p.credits > 0 && <span>+{p.credits} кр.</span>}
                    </div>

                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-text/40 font-medium">Использовано</span>
                      <span className="font-mono font-bold">{p.used}<span className="text-text/25 font-normal">/{p.max_uses}</span></span>
                    </div>
                    <div className="h-2 bg-text/[0.04] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${pct > 80 ? "bg-red-400" : pct > 50 ? "bg-amber-400" : "bg-accent/70"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {promos.length === 0 && (
              <div className="text-center py-12 bg-white rounded-2xl border border-text/5">
                <span className="text-3xl block mb-2">🏷️</span>
                <p className="text-text/25 text-sm">Нет промокодов</p>
              </div>
            )}
          </div>
        )}

        {/* ═══ Referrals Tab ═══ */}
        {tab === "referrals" && !loading && (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <StatCard id="users" label="Всего приглашённых" value={referrals.total_referred_users.toString()} />
              <StatCard id="dau" label="Рефереров с приглашёнными" value={referrals.referrers.length.toString()} />
            </div>

            <div className="bg-white rounded-2xl border border-text/5 overflow-hidden">
              <div className="p-4 border-b border-text/5">
                <span className="font-bold text-sm">Рефереры</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-text/[0.02] text-text/40 text-xs uppercase tracking-wider">
                      <th className="text-left py-3 px-4 font-semibold">Пользователь</th>
                      <th className="text-left py-3 px-4 font-semibold">Код</th>
                      <th className="text-right py-3 px-4 font-semibold">Приглашённых</th>
                      <th className="text-right py-3 px-4 font-semibold">Заработано</th>
                      <th className="text-left py-3 px-4 font-semibold">Тариф</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.referrers.map((r: any) => (
                      <tr key={r.id} className="border-t border-text/[0.04] hover:bg-text/[0.02] transition-colors">
                        <td className="py-3 px-4 font-medium">{r.first_name || r.email || r.username || "—"}</td>
                        <td className="py-3 px-4 font-mono text-accent text-xs">{r.referral_code}</td>
                        <td className="py-3 px-4 text-right font-bold">{r.referral_count}</td>
                        <td className="py-3 px-4 text-right font-mono text-teal font-semibold">${r.referral_balance}</td>
                        <td className="py-3 px-4"><TierBadge tier={r.subscription_tier} /></td>
                      </tr>
                    ))}
                    {referrals.referrers.length === 0 && (
                      <tr><td colSpan={5} className="py-12 text-center text-text/25 text-sm">Нет рефералов</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* Analytics tab */}
        {tab === "analytics" && (
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <select value={analyticsDays} onChange={e => setAnalyticsDays(Number(e.target.value))} className="bg-bg border border-text/10 rounded-lg px-3 py-2 text-sm">
                <option value={1}>Сегодня</option>
                <option value={7}>7 дней</option>
                <option value={30}>30 дней</option>
                <option value={90}>90 дней</option>
              </select>
              <select value={analyticsSortBy} onChange={e => setAnalyticsSortBy(e.target.value)} className="bg-bg border border-text/10 rounded-lg px-3 py-2 text-sm">
                <option value="views">По просмотрам</option>
                <option value="unique">По уникальным</option>
                <option value="avg_duration">По времени</option>
                <option value="path">По пути</option>
              </select>
              <select value={analyticsSortOrder} onChange={e => setAnalyticsSortOrder(e.target.value)} className="bg-bg border border-text/10 rounded-lg px-3 py-2 text-sm">
                <option value="desc">Убывание</option>
                <option value="asc">Возрастание</option>
              </select>
              <button onClick={loadTab} className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-accent/90">Обновить</button>
            </div>

            {analytics && (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl border border-text/5 p-4">
                    <div className="text-[10px] text-text/30 uppercase font-bold tracking-wider">Просмотры</div>
                    <div className="text-2xl font-extrabold text-text mt-1">{analytics.total_views.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-text/5 p-4">
                    <div className="text-[10px] text-text/30 uppercase font-bold tracking-wider">Уникальные</div>
                    <div className="text-2xl font-extrabold text-accent mt-1">{analytics.unique_visitors.toLocaleString()}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-text/5 p-4">
                    <div className="text-[10px] text-text/30 uppercase font-bold tracking-wider">Ср. время</div>
                    <div className="text-2xl font-extrabold text-text mt-1">{analytics.avg_duration_sec > 60 ? `${Math.round(analytics.avg_duration_sec / 60)} мин` : `${Math.round(analytics.avg_duration_sec)} сек`}</div>
                  </div>
                  <div className="bg-white rounded-xl border border-text/5 p-4">
                    <div className="text-[10px] text-text/30 uppercase font-bold tracking-wider">Мобильные</div>
                    <div className="text-2xl font-extrabold text-text mt-1">{analytics.mobile_percent}%</div>
                  </div>
                </div>

                {/* Daily chart */}
                {analytics.daily.length > 0 && (
                  <div className="bg-white rounded-xl border border-text/5 p-5 mb-6">
                    <h3 className="text-sm font-bold text-text mb-4">Просмотры по дням</h3>
                    <div className="flex items-end gap-1 h-32">
                      {analytics.daily.map((d: { date: string; views: number; unique: number }, i: number) => {
                        const max = Math.max(...analytics.daily.map((x: { views: number }) => x.views), 1);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-[8px] text-text/25">{d.views}</span>
                            <div className="w-full bg-accent/10 rounded-t-sm relative" style={{ height: `${(d.views / max) * 100}%`, minHeight: d.views > 0 ? 4 : 0 }}>
                              <div className="absolute inset-0 bg-accent rounded-t-sm" style={{ height: `${(d.unique / Math.max(d.views, 1)) * 100}%` }} />
                            </div>
                            <span className="text-[8px] text-text/20">{d.date.slice(5)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-[10px] text-text/30">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-accent rounded-sm" /> Уникальные</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 bg-accent/20 rounded-sm" /> Просмотры</span>
                    </div>
                  </div>
                )}

                {/* Top pages table */}
                <div className="bg-white rounded-xl border border-text/5 p-5 mb-6">
                  <h3 className="text-sm font-bold text-text mb-4">Страницы</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-text/30 text-[10px] uppercase tracking-wider border-b border-text/5">
                        <th className="pb-2">Путь</th>
                        <th className="pb-2 text-right">Просмотры</th>
                        <th className="pb-2 text-right">Уникальные</th>
                        <th className="pb-2 text-right">Ср. время</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.pages.map((p: { path: string; views: number; unique: number; avg_duration: number }, i: number) => (
                        <tr key={i} className="border-b border-text/[0.03] hover:bg-text/[0.02]">
                          <td className="py-2 text-text/70 truncate max-w-[200px]">{p.path}</td>
                          <td className="py-2 text-right font-semibold">{p.views}</td>
                          <td className="py-2 text-right text-text/50">{p.unique}</td>
                          <td className="py-2 text-right text-text/40">{p.avg_duration > 60 ? `${Math.round(p.avg_duration / 60)}м` : `${Math.round(p.avg_duration)}с`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Top referrers */}
                {analytics.referrers.length > 0 && (
                  <div className="bg-white rounded-xl border border-text/5 p-5">
                    <h3 className="text-sm font-bold text-text mb-4">Источники трафика</h3>
                    <div className="space-y-2">
                      {analytics.referrers.map((r: { referrer: string; views: number }, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-text/60 truncate max-w-[300px]">{r.referrer}</span>
                          <span className="font-semibold text-text/80">{r.views}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {loading && <div className="text-center py-10 text-text/30">Загрузка...</div>}
          </div>
        )}
      </div>
    </div>
  );
}
