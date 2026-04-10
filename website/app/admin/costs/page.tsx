"use client";

import React, { useState, useEffect } from "react";

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

function pct(n: number) {
  return `${n.toFixed(1)}%`;
}

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

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAdmin<CostsOverview>(`/api/admin/costs?period=${period}`),
      fetchAdmin<{ users: UserCost[] }>("/api/admin/costs/users"),
      fetchAdmin<{ models: ModelCost[] }>("/api/admin/costs/models"),
    ]).then(([o, u, m]) => {
      if (o) setOverview(o);
      if (u) setUsers(u.users);
      if (m) setModels(m.models);
      setLoading(false);
    });
  }, [period]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] p-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)] mb-6">Cost Analytics</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[var(--color-surface)] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Cost Analytics</h1>
          <div className="flex items-center gap-3">
            <a href="/admin" className="text-sm text-[var(--color-accent)] hover:underline">&larr; Admin</a>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-text)]/10 text-[var(--color-text)] text-sm"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["overview", "users", "models"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                tab === t
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-surface)] text-[var(--color-text)]/70 hover:bg-[var(--color-surface)]/80"
              }`}
            >
              {t === "overview" ? "P&L" : t === "users" ? "Users" : "Models"}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && overview && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card label="Revenue" value={usd(overview.total_revenue_usd)} color="green" />
              <Card label="Provider Cost" value={usd(overview.total_provider_cost_usd, 4)} color="red" />
              <Card label="Gross Margin" value={usd(overview.gross_margin_usd)} color="blue" />
              <Card label="Margin %" value={pct(overview.margin_percent)} color="purple" />
            </div>

            {/* Breakdown Table */}
            <div className="bg-[var(--color-surface)] rounded-xl p-4">
              <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Breakdown by Category</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[var(--color-text)]/50 border-b border-[var(--color-text)]/10">
                    <th className="text-left py-2">Category</th>
                    <th className="text-right py-2">Requests</th>
                    <th className="text-right py-2">Revenue</th>
                    <th className="text-right py-2">Provider Cost</th>
                    <th className="text-right py-2">Margin</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--color-text)]">
                  <tr className="border-b border-[var(--color-text)]/5">
                    <td className="py-2">Chat</td>
                    <td className="text-right">{overview.breakdown.chat.requests}</td>
                    <td className="text-right text-[var(--color-text)]/50">subscription</td>
                    <td className="text-right text-red-400">{usd(overview.breakdown.chat.provider_cost, 4)}</td>
                    <td className="text-right">-</td>
                  </tr>
                  <tr className="border-b border-[var(--color-text)]/5">
                    <td className="py-2">Video</td>
                    <td className="text-right">{overview.breakdown.video.requests}</td>
                    <td className="text-right text-green-400">{usd(overview.breakdown.video.revenue)}</td>
                    <td className="text-right text-red-400">{usd(overview.breakdown.video.provider_cost, 4)}</td>
                    <td className="text-right">{usd(overview.breakdown.video.revenue - overview.breakdown.video.provider_cost)}</td>
                  </tr>
                  <tr>
                    <td className="py-2">Image</td>
                    <td className="text-right">{overview.breakdown.image.requests}</td>
                    <td className="text-right text-green-400">{usd(overview.breakdown.image.revenue)}</td>
                    <td className="text-right text-red-400">{usd(overview.breakdown.image.provider_cost, 4)}</td>
                    <td className="text-right">{usd(overview.breakdown.image.revenue - overview.breakdown.image.provider_cost)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div className="bg-[var(--color-surface)] rounded-xl p-4 overflow-x-auto">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Per-User Profitability</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--color-text)]/50 border-b border-[var(--color-text)]/10">
                  <th className="text-left py-2">User</th>
                  <th className="text-left py-2">Plan</th>
                  <th className="text-right py-2">Paid</th>
                  <th className="text-right py-2">Cost</th>
                  <th className="text-right py-2">Margin</th>
                  <th className="text-right py-2">Margin %</th>
                  <th className="text-right py-2">Requests</th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-text)]">
                {users.map((u) => (
                  <tr key={u.tg_id} className="border-b border-[var(--color-text)]/5 hover:bg-[var(--color-text)]/5">
                    <td className="py-2">{u.username || u.first_name || u.tg_id}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${u.plan === "free" ? "bg-gray-500/20" : "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="text-right text-green-400">{usd(u.total_paid_usd)}</td>
                    <td className="text-right text-red-400">{usd(u.total_provider_cost_usd, 4)}</td>
                    <td className={`text-right ${u.margin_usd >= 0 ? "text-green-400" : "text-red-400"}`}>{usd(u.margin_usd)}</td>
                    <td className="text-right">{u.total_paid_usd > 0 ? pct(u.margin_percent) : "-"}</td>
                    <td className="text-right">{u.total_requests}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-8 text-[var(--color-text)]/40">No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Models Tab */}
        {tab === "models" && (
          <div className="bg-[var(--color-surface)] rounded-xl p-4 overflow-x-auto">
            <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">Cost by Model</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--color-text)]/50 border-b border-[var(--color-text)]/10">
                  <th className="text-left py-2">Model</th>
                  <th className="text-right py-2">Requests</th>
                  <th className="text-right py-2">Total Cost</th>
                  <th className="text-right py-2">Avg/Request</th>
                  <th className="text-right py-2">Tokens In</th>
                  <th className="text-right py-2">Tokens Out</th>
                </tr>
              </thead>
              <tbody className="text-[var(--color-text)]">
                {models.map((m) => (
                  <tr key={m.model_id} className="border-b border-[var(--color-text)]/5 hover:bg-[var(--color-text)]/5">
                    <td className="py-2 font-mono text-xs">{m.model_id}</td>
                    <td className="text-right">{m.requests.toLocaleString()}</td>
                    <td className="text-right text-red-400">{usd(m.total_provider_cost_usd, 4)}</td>
                    <td className="text-right">{usd(m.avg_cost_per_request, 6)}</td>
                    <td className="text-right text-[var(--color-text)]/50">{(m.total_tokens_in / 1000).toFixed(1)}K</td>
                    <td className="text-right text-[var(--color-text)]/50">{(m.total_tokens_out / 1000).toFixed(1)}K</td>
                  </tr>
                ))}
                {models.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-[var(--color-text)]/40">No data yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    green: "border-green-500/30 bg-green-500/5",
    red: "border-red-500/30 bg-red-500/5",
    blue: "border-blue-500/30 bg-blue-500/5",
    purple: "border-purple-500/30 bg-purple-500/5",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || ""}`}>
      <div className="text-xs text-[var(--color-text)]/50 mb-1">{label}</div>
      <div className="text-xl font-bold text-[var(--color-text)]">{value}</div>
    </div>
  );
}
