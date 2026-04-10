"use client";

import React, { useState, useEffect, useMemo } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

interface CostsOverview {
  period: string;
  total_revenue_usd: number;
  total_provider_cost_usd: number;
  gross_margin_usd: number;
  margin_percent: number;
  breakdown: {
    chat: { provider_cost: number; requests: number };
    video: { revenue: number; provider_cost: number; requests: number };
    image: { revenue: number; provider_cost: number; requests: number };
  };
}

interface UserCost {
  tg_id: number;
  username: string;
  first_name: string;
  plan: string;
  total_paid_usd: number;
  total_provider_cost_usd: number;
  total_requests: number;
  margin_usd: number;
  margin_percent: number;
}

interface ModelCost {
  model_id: string;
  requests: number;
  total_provider_cost_usd: number;
  avg_cost_per_request: number;
  total_tokens_in: number;
  total_tokens_out: number;
}

function getAuth() {
  try {
    const raw = localStorage.getItem("stone_auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function fetchAdmin<T>(path: string): Promise<T | null> {
  const auth = getAuth();
  if (!auth?.token) return null;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function usd(n: number, decimals = 2) {
  return `$${n.toFixed(decimals)}`;
}

function rub(n: number) {
  return `${Math.round(n * 95)}₽`;
}

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

function num(n: number) {
  return n.toLocaleString("ru-RU");
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: "Free", color: "bg-zinc-500/20 text-zinc-400" },
  mini: { label: "Start", color: "bg-blue-500/20 text-blue-400" },
  max: { label: "Pro", color: "bg-purple-500/20 text-purple-400" },
  "max-pro": { label: "Elite", color: "bg-amber-500/20 text-amber-400" },
};

type SortKey = "paid" | "cost" | "margin" | "requests";
type SortDir = "asc" | "desc";

export default function CostsPage() {
  const [overview, setOverview] = useState<CostsOverview | null>(null);
  const [users, setUsers] = useState<UserCost[]>([]);
  const [models, setModels] = useState<ModelCost[]>([]);
  const [tab, setTab] = useState<"overview" | "users" | "models">("overview");
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userSort, setUserSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "cost", dir: "desc" });
  const [userFilter, setUserFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      fetchAdmin<CostsOverview>(`/api/admin/costs?period=${period}`),
      fetchAdmin<{ users: UserCost[] }>("/api/admin/costs/users"),
      fetchAdmin<{ models: ModelCost[] }>("/api/admin/costs/models"),
    ]).then(([o, u, m]) => {
      if (!o && !u && !m) setError(true);
      if (o) setOverview(o);
      if (u) setUsers(u.users);
      if (m) setModels(m.models);
      setLoading(false);
    });
  }, [period]);

  const sortedUsers = useMemo(() => {
    let filtered = users;
    if (userFilter) {
      const q = userFilter.toLowerCase();
      filtered = users.filter(
        (u) =>
          (u.username || "").toLowerCase().includes(q) ||
          (u.first_name || "").toLowerCase().includes(q) ||
          String(u.tg_id).includes(q)
      );
    }
    const sorted = [...filtered].sort((a, b) => {
      const map: Record<SortKey, (u: UserCost) => number> = {
        paid: (u) => u.total_paid_usd,
        cost: (u) => u.total_provider_cost_usd,
        margin: (u) => u.margin_usd,
        requests: (u) => u.total_requests,
      };
      const fn = map[userSort.key];
      return userSort.dir === "desc" ? fn(b) - fn(a) : fn(a) - fn(b);
    });
    return sorted;
  }, [users, userSort, userFilter]);

  const totalStats = useMemo(() => {
    const totalPaid = users.reduce((s, u) => s + u.total_paid_usd, 0);
    const totalCost = users.reduce((s, u) => s + u.total_provider_cost_usd, 0);
    const totalReqs = users.reduce((s, u) => s + u.total_requests, 0);
    const paying = users.filter((u) => u.total_paid_usd > 0).length;
    const unprofitable = users.filter((u) => u.margin_usd < 0 && u.total_requests > 10).length;
    return { totalPaid, totalCost, totalReqs, paying, unprofitable, total: users.length };
  }, [users]);

  function toggleUserSort(key: SortKey) {
    setUserSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }
    );
  }

  function sortIcon(key: SortKey) {
    if (userSort.key !== key) return "";
    return userSort.dir === "desc" ? " ↓" : " ↑";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f12] p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Cost Analytics</h1>
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-[#1a1a22] rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-[#1a1a22] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f12] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-zinc-500 mb-4">Login as admin first</p>
          <a href="/admin" className="text-[#C4623D] hover:underline">Go to Admin</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0f0f12]/95 backdrop-blur-sm border-b border-white/5 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-zinc-500 hover:text-white transition text-sm">← Admin</a>
            <h1 className="text-xl font-bold">Cost Analytics</h1>
          </div>
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#1a1a22] border border-white/10 text-white text-sm focus:outline-none focus:border-[#C4623D]/50"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#1a1a22] rounded-xl p-1 w-fit">
          {([
            { id: "overview" as const, label: "P&L Overview" },
            { id: "users" as const, label: `Users (${totalStats.total})` },
            { id: "models" as const, label: `Models (${models.length})` },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-[#C4623D] text-white shadow-lg shadow-[#C4623D]/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ P&L Overview ═══ */}
        {tab === "overview" && overview && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Revenue"
                value={usd(overview.total_revenue_usd)}
                sub={rub(overview.total_revenue_usd)}
                icon="💰"
                trend="green"
              />
              <MetricCard
                label="Provider Cost"
                value={usd(overview.total_provider_cost_usd, 4)}
                sub={rub(overview.total_provider_cost_usd)}
                icon="🔥"
                trend="red"
              />
              <MetricCard
                label="Gross Profit"
                value={usd(overview.gross_margin_usd)}
                sub={rub(overview.gross_margin_usd)}
                icon="📈"
                trend={overview.gross_margin_usd >= 0 ? "green" : "red"}
              />
              <MetricCard
                label="Margin"
                value={pct(overview.margin_percent)}
                sub={overview.margin_percent >= 60 ? "Healthy" : overview.margin_percent >= 30 ? "OK" : "Low!"}
                icon={overview.margin_percent >= 60 ? "✅" : overview.margin_percent >= 30 ? "⚠️" : "🚨"}
                trend={overview.margin_percent >= 50 ? "green" : overview.margin_percent >= 30 ? "yellow" : "red"}
              />
            </div>

            {/* Visual Margin Bar */}
            {overview.total_revenue_usd > 0 && (
              <div className="bg-[#1a1a22] rounded-2xl p-5">
                <div className="flex justify-between text-sm text-zinc-400 mb-3">
                  <span>Revenue vs Cost</span>
                  <span>{pct(overview.margin_percent)} margin</span>
                </div>
                <div className="h-8 rounded-full bg-[#0f0f12] overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-l-full transition-all duration-700 flex items-center justify-center text-xs font-bold"
                    style={{ width: `${Math.max(overview.margin_percent, 5)}%` }}
                  >
                    {overview.margin_percent > 20 && "Profit"}
                  </div>
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-r-full transition-all duration-700 flex items-center justify-center text-xs font-bold"
                    style={{ width: `${Math.max(100 - overview.margin_percent, 5)}%` }}
                  >
                    {100 - overview.margin_percent > 20 && "Cost"}
                  </div>
                </div>
              </div>
            )}

            {/* Breakdown */}
            <div className="bg-[#1a1a22] rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-4">Breakdown by Category</h2>
              <div className="space-y-3">
                <CategoryRow
                  name="Chat"
                  icon="💬"
                  requests={overview.breakdown.chat.requests}
                  revenue={null}
                  cost={overview.breakdown.chat.provider_cost}
                  revenueLabel="subscription"
                />
                <CategoryRow
                  name="Video"
                  icon="🎬"
                  requests={overview.breakdown.video.requests}
                  revenue={overview.breakdown.video.revenue}
                  cost={overview.breakdown.video.provider_cost}
                />
                <CategoryRow
                  name="Image"
                  icon="🖼️"
                  requests={overview.breakdown.image.requests}
                  revenue={overview.breakdown.image.revenue}
                  cost={overview.breakdown.image.provider_cost}
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MiniStat label="Total Requests" value={num(totalStats.totalReqs)} />
              <MiniStat label="Paying Users" value={`${totalStats.paying} / ${totalStats.total}`} />
              <MiniStat label="Avg Cost/User" value={totalStats.total > 0 ? usd(totalStats.totalCost / totalStats.total, 4) : "$0"} />
              <MiniStat label="Unprofitable" value={String(totalStats.unprofitable)} alert={totalStats.unprofitable > 0} />
            </div>
          </div>
        )}

        {/* ═══ Users Tab ═══ */}
        {tab === "users" && (
          <div className="space-y-4">
            {/* Search + Stats */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Search by username, name, or tg_id..."
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#1a1a22] border border-white/10 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-[#C4623D]/50"
              />
              <div className="flex gap-2 text-xs">
                <span className="px-3 py-2.5 rounded-xl bg-green-500/10 text-green-400">
                  Paying: {totalStats.paying}
                </span>
                <span className="px-3 py-2.5 rounded-xl bg-zinc-500/10 text-zinc-400">
                  Free: {totalStats.total - totalStats.paying}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="bg-[#1a1a22] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-500 border-b border-white/5 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3">User</th>
                      <th className="text-left px-3 py-3">Plan</th>
                      <th className="text-right px-3 py-3 cursor-pointer hover:text-white select-none" onClick={() => toggleUserSort("paid")}>
                        Paid{sortIcon("paid")}
                      </th>
                      <th className="text-right px-3 py-3 cursor-pointer hover:text-white select-none" onClick={() => toggleUserSort("cost")}>
                        Cost{sortIcon("cost")}
                      </th>
                      <th className="text-right px-3 py-3 cursor-pointer hover:text-white select-none" onClick={() => toggleUserSort("margin")}>
                        Margin{sortIcon("margin")}
                      </th>
                      <th className="text-right px-3 py-3">%</th>
                      <th className="text-right px-4 py-3 cursor-pointer hover:text-white select-none" onClick={() => toggleUserSort("requests")}>
                        Reqs{sortIcon("requests")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((u) => {
                      const plan = PLAN_LABELS[u.plan] || PLAN_LABELS.free;
                      return (
                        <tr key={u.tg_id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{u.first_name || "—"}</div>
                            <div className="text-xs text-zinc-500">{u.username ? `@${u.username}` : u.tg_id}</div>
                          </td>
                          <td className="px-3 py-3">
                            <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${plan.color}`}>
                              {plan.label}
                            </span>
                          </td>
                          <td className="text-right px-3 py-3 text-green-400 font-mono">{u.total_paid_usd > 0 ? usd(u.total_paid_usd) : "—"}</td>
                          <td className="text-right px-3 py-3 text-red-400 font-mono">{usd(u.total_provider_cost_usd, 4)}</td>
                          <td className={`text-right px-3 py-3 font-mono font-medium ${u.margin_usd >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {u.total_paid_usd > 0 ? usd(u.margin_usd) : "—"}
                          </td>
                          <td className="text-right px-3 py-3 text-zinc-500">
                            {u.total_paid_usd > 0 ? pct(u.margin_percent) : "—"}
                          </td>
                          <td className="text-right px-4 py-3 text-zinc-400">{num(u.total_requests)}</td>
                        </tr>
                      );
                    })}
                    {sortedUsers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-zinc-600">
                          {userFilter ? "No users match your search" : "No data yet"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Models Tab ═══ */}
        {tab === "models" && (
          <div className="space-y-4">
            {/* Top 3 expensive models */}
            {models.length >= 3 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {models.slice(0, 3).map((m, i) => (
                  <div key={m.model_id} className="bg-[#1a1a22] rounded-2xl p-4 border border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-500">#{i + 1} Most Expensive</span>
                      <span className="text-red-400 font-mono font-bold">{usd(m.total_provider_cost_usd, 4)}</span>
                    </div>
                    <div className="font-medium text-white mb-1">{m.model_id}</div>
                    <div className="text-xs text-zinc-500">
                      {num(m.requests)} requests · {usd(m.avg_cost_per_request, 6)}/req
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Full table */}
            <div className="bg-[#1a1a22] rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-zinc-500 border-b border-white/5 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-3">Model</th>
                      <th className="text-right px-3 py-3">Requests</th>
                      <th className="text-right px-3 py-3">Total Cost</th>
                      <th className="text-right px-3 py-3">Avg/Req</th>
                      <th className="text-right px-3 py-3">Tokens In</th>
                      <th className="text-right px-4 py-3">Tokens Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map((m) => {
                      const costLevel =
                        m.avg_cost_per_request > 0.01 ? "text-red-400" :
                        m.avg_cost_per_request > 0.001 ? "text-amber-400" :
                        "text-green-400";
                      return (
                        <tr key={m.model_id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition">
                          <td className="px-4 py-3 font-mono text-xs text-white">{m.model_id}</td>
                          <td className="text-right px-3 py-3 text-zinc-400">{num(m.requests)}</td>
                          <td className="text-right px-3 py-3 text-red-400 font-mono">{usd(m.total_provider_cost_usd, 4)}</td>
                          <td className={`text-right px-3 py-3 font-mono ${costLevel}`}>{usd(m.avg_cost_per_request, 6)}</td>
                          <td className="text-right px-3 py-3 text-zinc-500">{m.total_tokens_in > 0 ? `${(m.total_tokens_in / 1000).toFixed(1)}K` : "—"}</td>
                          <td className="text-right px-4 py-3 text-zinc-500">{m.total_tokens_out > 0 ? `${(m.total_tokens_out / 1000).toFixed(1)}K` : "—"}</td>
                        </tr>
                      );
                    })}
                    {models.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-zinc-600">No data yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function MetricCard({ label, value, sub, icon, trend }: { label: string; value: string; sub: string; icon: string; trend: string }) {
  const borders: Record<string, string> = {
    green: "border-green-500/20",
    red: "border-red-500/20",
    yellow: "border-amber-500/20",
    blue: "border-blue-500/20",
  };
  const bgs: Record<string, string> = {
    green: "bg-green-500/5",
    red: "bg-red-500/5",
    yellow: "bg-amber-500/5",
    blue: "bg-blue-500/5",
  };
  return (
    <div className={`rounded-2xl border p-4 ${borders[trend] || ""} ${bgs[trend] || ""}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-zinc-500">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{sub}</div>
    </div>
  );
}

function CategoryRow({ name, icon, requests, revenue, cost, revenueLabel }: {
  name: string; icon: string; requests: number; revenue: number | null; cost: number; revenueLabel?: string;
}) {
  const margin = revenue !== null ? revenue - cost : null;
  return (
    <div className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/[0.02] transition">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-zinc-500">{num(requests)} requests</div>
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div className="text-right">
          <div className="text-zinc-500 text-xs">Revenue</div>
          <div className={revenue !== null ? "text-green-400 font-mono" : "text-zinc-600 text-xs"}>
            {revenue !== null ? usd(revenue) : revenueLabel || "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-zinc-500 text-xs">Cost</div>
          <div className="text-red-400 font-mono">{usd(cost, 4)}</div>
        </div>
        {margin !== null && (
          <div className="text-right">
            <div className="text-zinc-500 text-xs">Margin</div>
            <div className={`font-mono font-medium ${margin >= 0 ? "text-green-400" : "text-red-400"}`}>{usd(margin)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="bg-[#1a1a22] rounded-xl px-4 py-3">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className={`text-lg font-bold ${alert ? "text-red-400" : "text-white"}`}>{value}</div>
    </div>
  );
}
