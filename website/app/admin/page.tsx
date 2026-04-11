"use client";

import React, { useState, useEffect, useCallback } from "react";
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
    <div className="bg-surface rounded-2xl border border-text/5 p-5 hover:shadow-md transition-shadow">
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
  { id: "costs" as const, label: "P&L / Costs", icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
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
  const [tab, setTab] = useState<"stats" | "users" | "transactions" | "costs" | "promos" | "referrals" | "analytics">("stats");
  const [costsData, setCostsData] = useState<any>(null);
  const [costsUsers, setCostsUsers] = useState<any[]>([]);
  const [costsModels, setCostsModels] = useState<any[]>([]);
  const [costsSubTab, setCostsSubTab] = useState<"overview" | "users" | "models">("overview");

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [sortCol, setSortCol] = useState<string>("");
  const [sortAsc, setSortAsc] = useState(false);
  const toggleSort = (col: string, getter: (u: UserRow) => number | string) => {
    const asc = sortCol === col ? !sortAsc : false;
    setSortCol(col);
    setSortAsc(asc);
    setUsers(prev => [...prev].sort((a, b) => {
      const va = getter(a), vb = getter(b);
      if (typeof va === "number" && typeof vb === "number") return asc ? va - vb : vb - va;
      return asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    }));
  };
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<{ referrers: any[]; total_referred_users: number }>({ referrers: [], total_referred_users: 0 });
  const [analytics, setAnalytics] = useState<any>(null);
  const [analyticsDays, setAnalyticsDays] = useState(7);
  const [analyticsSortBy, setAnalyticsSortBy] = useState("views");
  const [analyticsSortOrder, setAnalyticsSortOrder] = useState("desc");
  const [txTotal, setTxTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const [txPage, setTxPage] = useState(0);
  const USERS_PER_PAGE = 50;
  const TX_PER_PAGE = 30;
  const [revenueChart, setRevenueChart] = useState<{date: string; revenue_usd: number; transactions: number}[]>([]);
  const [chartDays, setChartDays] = useState(14);
  const [expandedUser, setExpandedUser] = useState<number | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
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
    const t = setTimeout(() => { setDebouncedSearch(userSearch); setUsersPage(0); }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  // Debounce tier/date filters too — prevents flashing
  const [debouncedTier, setDebouncedTier] = useState(userTier);
  const [debouncedDateFrom, setDebouncedDateFrom] = useState(userDateFrom);
  const [debouncedDateTo, setDebouncedDateTo] = useState(userDateTo);
  useEffect(() => { const t = setTimeout(() => { setDebouncedTier(userTier); setUsersPage(0); }, 200); return () => clearTimeout(t); }, [userTier]);
  useEffect(() => { const t = setTimeout(() => { setDebouncedDateFrom(userDateFrom); setUsersPage(0); }, 200); return () => clearTimeout(t); }, [userDateFrom]);
  useEffect(() => { const t = setTimeout(() => { setDebouncedDateTo(userDateTo); setUsersPage(0); }, 200); return () => clearTimeout(t); }, [userDateTo]);

  const loadTab = useCallback(() => {
    if (!authed || !token) return;
    // Only show loading spinner on initial load / tab switch, not on filter changes
    if (tab === "stats") {
      fetchData("stats").then((d) => { if (d) setStats(d); setLoading(false); });
      fetch(`${API_URL}/api/admin/web/revenue-chart?days=${chartDays}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : null).then(d => { if (d) setRevenueChart(d.chart); });
    } else if (tab === "users") {
      const params = new URLSearchParams({ limit: String(USERS_PER_PAGE) });
      params.set("offset", String(usersPage * USERS_PER_PAGE));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (debouncedTier) params.set("tier", debouncedTier);
      if (debouncedDateFrom) params.set("date_from", debouncedDateFrom);
      if (debouncedDateTo) params.set("date_to", debouncedDateTo);
      fetchData(`users?${params}`).then((d) => { if (d) { setUsers(d.users); setUsersTotal(d.total); } setLoading(false); });
    } else if (tab === "promos") {
      fetchData("promos").then((d) => { if (d) setPromos(d.promos); setLoading(false); });
    } else if (tab === "referrals") {
      fetchData("referrals").then((d) => { if (d) setReferrals(d); setLoading(false); });
    } else if (tab === "costs") {
      const period = new Date().toISOString().slice(0, 7);
      const h = { Authorization: `Bearer ${token}` };
      Promise.all([
        fetch(`${API_URL}/api/admin/costs?period=${period}`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/api/admin/costs/users`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(`${API_URL}/api/admin/costs/models`, { headers: h }).then(r => r.ok ? r.json() : null).catch(() => null),
      ]).then(([o, u, m]) => {
        setCostsData(o || { period, total_revenue_usd: 0, total_provider_cost_usd: 0, gross_margin_usd: 0, margin_percent: 0, breakdown: { chat: { provider_cost: 0, requests: 0 }, video: { revenue: 0, provider_cost: 0, requests: 0 }, image: { revenue: 0, provider_cost: 0, requests: 0 } } });
        setCostsUsers(u?.users || []);
        setCostsModels(m?.models || []);
        setLoading(false);
      });
    } else if (tab === "analytics") {
      fetch(`${API_URL}/api/analytics/stats?days=${analyticsDays}&sort_by=${analyticsSortBy}&order=${analyticsSortOrder}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.ok ? r.json() : null).then(d => { if (d) setAnalytics(d); setLoading(false); }).catch(() => setLoading(false));
    } else {
      const txParams = new URLSearchParams({ limit: String(TX_PER_PAGE), offset: String(txPage * TX_PER_PAGE) });
      fetchData(`transactions?${txParams}`).then((d) => { if (d) { setTransactions(d.transactions); setTxTotal(d.total); } setLoading(false); });
    }
  }, [authed, token, tab, fetchData, debouncedSearch, debouncedTier, debouncedDateFrom, debouncedDateTo, usersPage, txPage, chartDays, analyticsDays, analyticsSortBy, analyticsSortOrder]);

  useEffect(() => { loadTab(); }, [loadTab]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken(""); setAuthed(false);
    setStats(null); setUsers([]); setTransactions([]);
  };

  function exportCSV(data: any[], filename: string) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const bom = "\uFEFF";
    const csv = bom + headers.join(";") + "\n" + data.map(row =>
      headers.map(h => {
        const v = row[h];
        return typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : (v ?? "");
      }).join(";")
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

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
          <form onSubmit={login} className="bg-surface rounded-2xl border border-text/5 p-6 space-y-4 shadow-sm">
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
    <div className="pt-24 pb-20 min-h-screen bg-bg">
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
                  ? "bg-surface text-text shadow-sm"
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
              <div className="bg-surface rounded-2xl border border-text/5 p-6">
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
              <div className="bg-surface rounded-2xl border border-text/5 p-6">
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

            {/* Revenue chart */}
            <div className="bg-surface rounded-2xl border border-text/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-text">Доход</h3>
                <select value={chartDays} onChange={e => setChartDays(Number(e.target.value))}
                  className="bg-bg border border-text/10 rounded-lg px-2 py-1 text-xs">
                  <option value={7}>7 дней</option>
                  <option value={14}>14 дней</option>
                  <option value={30}>30 дней</option>
                </select>
              </div>
              <div className="flex items-end gap-1 h-32">
                {revenueChart.map((d, i) => {
                  const max = Math.max(...revenueChart.map(r => r.revenue_usd), 0.01);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: $${d.revenue_usd} (${d.transactions} оплат)`}>
                      <span className="text-[8px] text-text/20">{d.revenue_usd > 0 ? `$${d.revenue_usd.toFixed(0)}` : ""}</span>
                      <div className="w-full bg-teal/10 rounded-t" style={{ height: `${(d.revenue_usd / max) * 100}%`, minHeight: d.revenue_usd > 0 ? 4 : 1 }}>
                        <div className="w-full h-full bg-teal/60 rounded-t" />
                      </div>
                      {revenueChart.length <= 14 && <span className="text-[7px] text-text/15">{d.date.slice(5)}</span>}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-text/30">
                <span>Всего: ${revenueChart.reduce((s, d) => s + d.revenue_usd, 0).toFixed(2)}</span>
                <span>{revenueChart.reduce((s, d) => s + d.transactions, 0)} оплат</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Users Tab ═══ */}
        {tab === "users" && !loading && (
          <div className="space-y-4 animate-fadeIn">
            {/* Filters */}
            <div className="bg-surface rounded-2xl border border-text/5 p-4">
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

            <div className="bg-surface rounded-2xl border border-text/5 overflow-hidden">
              <div className="p-4 border-b border-text/5 flex items-center justify-between">
                <div>
                  <span className="font-bold text-sm">Пользователи</span>
                  <span className="text-text/30 text-xs ml-2 bg-text/[0.04] px-2 py-0.5 rounded-md font-medium">{usersTotal}</span>
                </div>
                <button
                  onClick={() => exportCSV(users, "users.csv")}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-text/[0.04] text-text/50 hover:bg-text/10 transition-colors"
                >
                  Экспорт CSV
                </button>
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
                      <th className="text-right py-3 px-4 font-semibold cursor-pointer hover:text-accent select-none" onClick={() => toggleSort("today", u => u.today_requests || 0)}>Сегодня {sortCol === "today" ? (sortAsc ? "▲" : "▼") : "↕"}</th>
                      <th className="text-right py-3 px-4 font-semibold cursor-pointer hover:text-accent select-none" onClick={() => toggleSort("total", u => u.total_requests)}>Всего {sortCol === "total" ? (sortAsc ? "▲" : "▼") : "↕"}</th>
                      <th className="text-left py-3 px-4 font-semibold cursor-pointer hover:text-accent select-none" onClick={() => toggleSort("joined", u => u.joined_at || "")}>Дата рег. {sortCol === "joined" ? (sortAsc ? "▲" : "▼") : "↕"}</th>
                      <th className="text-left py-3 px-4 font-semibold cursor-pointer hover:text-accent select-none" onClick={() => toggleSort("active", u => u.last_active || "")}>Активность {sortCol === "active" ? (sortAsc ? "▲" : "▼") : "↕"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <React.Fragment key={u.id}>
                      <tr className="border-t border-text/[0.04] hover:bg-text/[0.02] transition-colors cursor-pointer" onClick={() => {
                        if (expandedUser === u.id) {
                          setExpandedUser(null);
                          setUserDetail(null);
                        } else {
                          setExpandedUser(u.id);
                          fetch(`${API_URL}/api/admin/web/user/${u.id}`, {
                            headers: { Authorization: `Bearer ${token}` },
                          }).then(r => r.ok ? r.json() : null).then(d => setUserDetail(d));
                        }
                      }}>
                        <td className="py-3 px-4 font-mono text-text/30 text-xs">{u.tg_id || u.id}</td>
                        <td className="py-3 px-4 font-medium">{u.first_name || u.username || "—"}</td>
                        <td className="py-3 px-4 text-text/50 text-xs">{u.email || "—"}</td>
                        <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
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
                        <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
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
                      {expandedUser === u.id && userDetail && (
                        <tr>
                          <td colSpan={9} className="px-5 py-4 bg-text/[0.02]">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                              <div className="text-xs"><span className="text-text/30">Email:</span> <span className="text-text/70">{userDetail.user.email || "—"}</span></div>
                              <div className="text-xs"><span className="text-text/30">TG:</span> <span className="text-text/70">{userDetail.user.telegram_id || "—"}</span></div>
                              <div className="text-xs"><span className="text-text/30">Подписка до:</span> <span className="text-text/70">{userDetail.user.credits_reset_date?.slice(0,10) || "—"}</span></div>
                              <div className="text-xs"><span className="text-text/30">Auth:</span> <span className="text-text/70">{userDetail.user.auth_provider}</span></div>
                            </div>
                            {userDetail.recent_usage.length > 0 && (
                              <div className="mb-3">
                                <div className="text-[10px] font-semibold text-text/30 uppercase mb-1">Использование (последние дни)</div>
                                <div className="flex gap-1 flex-wrap">
                                  {userDetail.recent_usage.map((u: any) => (
                                    <div key={u.date} className="bg-bg rounded px-2 py-1 text-[10px]">
                                      <span className="text-text/30">{u.date.slice(5)}</span>{" "}
                                      <span className="text-text/60">{u.fast+u.premium+u.opus+u.image+u.video} req</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {userDetail.transactions.length > 0 && (
                              <div>
                                <div className="text-[10px] font-semibold text-text/30 uppercase mb-1">Транзакции</div>
                                <div className="flex gap-1 flex-wrap">
                                  {userDetail.transactions.map((t: any, i: number) => (
                                    <div key={i} className="bg-bg rounded px-2 py-1 text-[10px]">
                                      <span className="text-teal font-bold">${t.amount_usd}</span>{" "}
                                      <span className="text-text/30">{t.currency} {t.created_at?.slice(0,10)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={9} className="py-12 text-center text-text/25 text-sm">Нет пользователей</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {usersTotal > USERS_PER_PAGE && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-text/[0.06]">
                  <span className="text-xs text-text/40">
                    {usersPage * USERS_PER_PAGE + 1}&ndash;{Math.min((usersPage + 1) * USERS_PER_PAGE, usersTotal)} из {usersTotal}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUsersPage(p => Math.max(0, p - 1))}
                      disabled={usersPage === 0}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-text/[0.04] text-text/50 hover:bg-text/10 disabled:opacity-30 transition-colors"
                    >
                      &larr; Назад
                    </button>
                    <button
                      onClick={() => setUsersPage(p => p + 1)}
                      disabled={(usersPage + 1) * USERS_PER_PAGE >= usersTotal}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-text/[0.04] text-text/50 hover:bg-text/10 disabled:opacity-30 transition-colors"
                    >
                      Далее &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ Transactions Tab ═══ */}
        {tab === "transactions" && !loading && (
          <div className="bg-surface rounded-2xl border border-text/5 overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-text/5 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm">Последние платежи</span>
                <span className="text-text/25 text-xs ml-2 bg-text/[0.04] px-2 py-0.5 rounded-md font-medium">{txTotal}</span>
              </div>
              <button
                onClick={() => exportCSV(transactions, "transactions.csv")}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-text/[0.04] text-text/50 hover:bg-text/10 transition-colors"
              >
                Экспорт CSV
              </button>
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
            {txTotal > TX_PER_PAGE && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-text/[0.06]">
                <span className="text-xs text-text/40">
                  {txPage * TX_PER_PAGE + 1}&ndash;{Math.min((txPage + 1) * TX_PER_PAGE, txTotal)} из {txTotal}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTxPage(p => Math.max(0, p - 1))}
                    disabled={txPage === 0}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-text/[0.04] text-text/50 hover:bg-text/10 disabled:opacity-30 transition-colors"
                  >
                    &larr; Назад
                  </button>
                  <button
                    onClick={() => setTxPage(p => p + 1)}
                    disabled={(txPage + 1) * TX_PER_PAGE >= txTotal}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-text/[0.04] text-text/50 hover:bg-text/10 disabled:opacity-30 transition-colors"
                  >
                    Далее &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ Promos Tab ═══ */}
        {tab === "promos" && !loading && (
          <div className="space-y-4 animate-fadeIn">
            {/* Create form */}
            <div className="bg-surface rounded-2xl border border-text/5 p-5">
              <h3 className="font-bold text-sm mb-4">Создать промокод</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);
                const auth = localStorage.getItem("admin_token");
                if (!auth) return;
                try {
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
                  } else {
                    const err = await res.json().catch(() => ({}));
                    alert(`Ошибка: ${err.detail || res.status}`);
                  }
                } catch (err) {
                  alert(`Сетевая ошибка: ${err}`);
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
                  <div key={p.code} className="bg-surface rounded-2xl border border-text/5 p-5 hover:shadow-md transition-shadow">
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
              <div className="text-center py-12 bg-surface rounded-2xl border border-text/5">
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

            <div className="bg-surface rounded-2xl border border-text/5 overflow-hidden">
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
        {tab === "costs" && !loading && costsData && (
          <div className="space-y-6">
            {/* Sub-tabs */}
            <div className="flex gap-1 bg-surface rounded-xl p-1 w-fit border border-text/5">
              {(["overview", "users", "models"] as const).map(st => (
                <button key={st} onClick={() => setCostsSubTab(st)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${costsSubTab === st ? "bg-accent text-white" : "text-text/40 hover:text-text/70"}`}>
                  {st === "overview" ? "P&L" : st === "users" ? "По юзерам" : "По моделям"}
                </button>
              ))}
            </div>

            {/* P&L Overview */}
            {costsSubTab === "overview" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-surface rounded-2xl border border-emerald-500/10 p-5">
                    <div className="text-[10px] text-text/30 uppercase tracking-wider font-bold">Revenue</div>
                    <div className="text-2xl font-extrabold text-emerald-500 mt-1">${costsData.total_revenue_usd.toFixed(2)}</div>
                    <div className="text-[10px] text-text/25 mt-0.5">~{Math.round(costsData.total_revenue_usd * 95)}₽</div>
                  </div>
                  <div className="bg-surface rounded-2xl border border-red-500/10 p-5">
                    <div className="text-[10px] text-text/30 uppercase tracking-wider font-bold">Provider Cost</div>
                    <div className="text-2xl font-extrabold text-red-400 mt-1">${costsData.total_provider_cost_usd.toFixed(4)}</div>
                    <div className="text-[10px] text-text/25 mt-0.5">~{Math.round(costsData.total_provider_cost_usd * 95)}₽</div>
                  </div>
                  <div className="bg-surface rounded-2xl border border-blue-500/10 p-5">
                    <div className="text-[10px] text-text/30 uppercase tracking-wider font-bold">Gross Profit</div>
                    <div className={`text-2xl font-extrabold mt-1 ${costsData.gross_margin_usd >= 0 ? "text-blue-400" : "text-red-400"}`}>${costsData.gross_margin_usd.toFixed(2)}</div>
                    <div className="text-[10px] text-text/25 mt-0.5">~{Math.round(costsData.gross_margin_usd * 95)}₽</div>
                  </div>
                  <div className="bg-surface rounded-2xl border border-purple-500/10 p-5">
                    <div className="text-[10px] text-text/30 uppercase tracking-wider font-bold">Margin</div>
                    <div className={`text-2xl font-extrabold mt-1 ${costsData.margin_percent >= 60 ? "text-emerald-400" : costsData.margin_percent >= 30 ? "text-amber-400" : "text-red-400"}`}>
                      {costsData.margin_percent.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-text/25 mt-0.5">{costsData.margin_percent >= 60 ? "Healthy" : costsData.margin_percent >= 30 ? "OK" : "Low!"}</div>
                  </div>
                </div>

                {/* Margin bar */}
                <div className="bg-surface rounded-2xl border border-text/5 p-5">
                  <div className="flex justify-between text-xs text-text/40 mb-3">
                    <span>Revenue vs Cost</span>
                    <span>{costsData.margin_percent.toFixed(1)}% margin</span>
                  </div>
                  <div className="h-6 rounded-full bg-bg overflow-hidden flex">
                    <div className="h-full bg-emerald-500/80 rounded-l-full transition-all duration-700 flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ width: `${Math.max(costsData.margin_percent, 8)}%` }}>
                      {costsData.margin_percent > 25 && "Profit"}
                    </div>
                    <div className="h-full bg-red-500/60 rounded-r-full transition-all duration-700 flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ width: `${Math.max(100 - costsData.margin_percent, 8)}%` }}>
                      {100 - costsData.margin_percent > 25 && "Cost"}
                    </div>
                  </div>
                </div>

                {/* Category breakdown */}
                <div className="bg-surface rounded-2xl border border-text/5 p-5">
                  <h3 className="text-sm font-bold mb-4">Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Chat", icon: "💬", reqs: costsData.breakdown.chat.requests, rev: null as number | null, cost: costsData.breakdown.chat.provider_cost },
                      { name: "Video", icon: "🎬", reqs: costsData.breakdown.video.requests, rev: costsData.breakdown.video.revenue, cost: costsData.breakdown.video.provider_cost },
                      { name: "Image", icon: "🖼️", reqs: costsData.breakdown.image.requests, rev: costsData.breakdown.image.revenue, cost: costsData.breakdown.image.provider_cost },
                    ].map(c => (
                      <div key={c.name} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-text/[0.02]">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{c.icon}</span>
                          <div>
                            <div className="text-sm font-semibold">{c.name}</div>
                            <div className="text-[10px] text-text/30">{c.reqs.toLocaleString()} requests</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-5 text-xs">
                          <div className="text-right">
                            <div className="text-text/25">Revenue</div>
                            <div className={c.rev !== null ? "text-emerald-400 font-mono" : "text-text/20"}>{c.rev !== null ? `$${c.rev.toFixed(2)}` : "subscription"}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-text/25">Cost</div>
                            <div className="text-red-400 font-mono">${c.cost.toFixed(4)}</div>
                          </div>
                          {c.rev !== null && (
                            <div className="text-right">
                              <div className="text-text/25">Margin</div>
                              <div className={`font-mono font-bold ${c.rev - c.cost >= 0 ? "text-emerald-400" : "text-red-400"}`}>${(c.rev - c.cost).toFixed(2)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Per-user */}
            {costsSubTab === "users" && (
              <div className="bg-surface rounded-2xl border border-text/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-text/30 text-[10px] uppercase tracking-wider border-b border-text/5">
                      <th className="px-4 py-3">User</th>
                      <th className="px-3 py-3">Plan</th>
                      <th className="px-3 py-3 text-right">Paid</th>
                      <th className="px-3 py-3 text-right">Cost</th>
                      <th className="px-3 py-3 text-right">Margin</th>
                      <th className="px-3 py-3 text-right">%</th>
                      <th className="px-4 py-3 text-right">Reqs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costsUsers.map((u: any) => (
                      <tr key={u.tg_id} className="border-b border-text/[0.03] hover:bg-text/[0.02]">
                        <td className="px-4 py-3">
                          <div className="font-semibold">{u.first_name || "—"}</div>
                          <div className="text-[10px] text-text/30">{u.username ? `@${u.username}` : u.tg_id}</div>
                        </td>
                        <td className="px-3 py-3"><TierBadge tier={u.plan} /></td>
                        <td className="px-3 py-3 text-right font-mono text-emerald-400">{u.total_paid_usd > 0 ? `$${u.total_paid_usd.toFixed(2)}` : "—"}</td>
                        <td className="px-3 py-3 text-right font-mono text-red-400">${u.total_provider_cost_usd.toFixed(4)}</td>
                        <td className={`px-3 py-3 text-right font-mono font-bold ${u.margin_usd >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {u.total_paid_usd > 0 ? `$${u.margin_usd.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-3 py-3 text-right text-text/40">{u.total_paid_usd > 0 ? `${u.margin_percent.toFixed(1)}%` : "—"}</td>
                        <td className="px-4 py-3 text-right text-text/50">{u.total_requests.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Per-model */}
            {costsSubTab === "models" && (
              <div className="space-y-4">
                {/* Top expensive */}
                {costsModels.length >= 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {costsModels.slice(0, 3).map((m: any, i: number) => (
                      <div key={m.model_id} className="bg-surface rounded-2xl border border-text/5 p-4">
                        <div className="flex justify-between text-[10px] text-text/30 mb-2">
                          <span>#{i + 1} Most Expensive</span>
                          <span className="text-red-400 font-mono font-bold">${m.total_provider_cost_usd.toFixed(4)}</span>
                        </div>
                        <div className="font-bold text-sm">{m.model_id}</div>
                        <div className="text-[10px] text-text/30 mt-1">{m.requests.toLocaleString()} requests &middot; ${m.avg_cost_per_request.toFixed(6)}/req</div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-surface rounded-2xl border border-text/5 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-text/30 text-[10px] uppercase tracking-wider border-b border-text/5">
                        <th className="px-4 py-3">Model</th>
                        <th className="px-3 py-3 text-right">Requests</th>
                        <th className="px-3 py-3 text-right">Total Cost</th>
                        <th className="px-3 py-3 text-right">Avg/Req</th>
                        <th className="px-3 py-3 text-right">Tokens In</th>
                        <th className="px-4 py-3 text-right">Tokens Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costsModels.map((m: any) => {
                        const lvl = m.avg_cost_per_request > 0.01 ? "text-red-400" : m.avg_cost_per_request > 0.001 ? "text-amber-400" : "text-emerald-400";
                        return (
                          <tr key={m.model_id} className="border-b border-text/[0.03] hover:bg-text/[0.02]">
                            <td className="px-4 py-3 font-mono text-xs">{m.model_id}</td>
                            <td className="px-3 py-3 text-right text-text/50">{m.requests.toLocaleString()}</td>
                            <td className="px-3 py-3 text-right text-red-400 font-mono">${m.total_provider_cost_usd.toFixed(4)}</td>
                            <td className={`px-3 py-3 text-right font-mono ${lvl}`}>${m.avg_cost_per_request.toFixed(6)}</td>
                            <td className="px-3 py-3 text-right text-text/25">{m.total_tokens_in > 0 ? `${(m.total_tokens_in / 1000).toFixed(1)}K` : "—"}</td>
                            <td className="px-4 py-3 text-right text-text/25">{m.total_tokens_out > 0 ? `${(m.total_tokens_out / 1000).toFixed(1)}K` : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

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
                  <div className="bg-surface rounded-xl border border-text/5 p-4">
                    <div className="text-[10px] text-text/30 uppercase font-bold tracking-wider">Просмотры</div>
                    <div className="text-2xl font-extrabold text-text mt-1">{analytics.total_views.toLocaleString()}</div>
                  </div>
                  <div className="bg-surface rounded-xl border border-text/5 p-4">
                    <div className="text-[10px] text-text/30 uppercase font-bold tracking-wider">Уникальные</div>
                    <div className="text-2xl font-extrabold text-accent mt-1">{analytics.unique_visitors.toLocaleString()}</div>
                  </div>
                  <div className="bg-surface rounded-xl border border-text/5 p-4">
                    <div className="text-[10px] text-text/30 uppercase font-bold tracking-wider">Ср. время</div>
                    <div className="text-2xl font-extrabold text-text mt-1">{analytics.avg_duration_sec > 60 ? `${Math.round(analytics.avg_duration_sec / 60)} мин` : `${Math.round(analytics.avg_duration_sec)} сек`}</div>
                  </div>
                  <div className="bg-surface rounded-xl border border-text/5 p-4">
                    <div className="text-[10px] text-text/30 uppercase font-bold tracking-wider">Мобильные</div>
                    <div className="text-2xl font-extrabold text-text mt-1">{analytics.mobile_percent}%</div>
                  </div>
                </div>

                {/* Daily chart */}
                {analytics.daily.length > 0 && (
                  <div className="bg-surface rounded-xl border border-text/5 p-5 mb-6">
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
                <div className="bg-surface rounded-xl border border-text/5 p-5 mb-6">
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
                  <div className="bg-surface rounded-xl border border-text/5 p-5">
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
