"use client";

import React, { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

interface Campaign {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  users: number;
  paid_users: number;
  conversion_pct: number;
  revenue_usd: number;
}

interface Response {
  days: number;
  since: string;
  campaigns: Campaign[];
}

type RangeKey = "7" | "14" | "30" | "90";

const RANGES: { id: RangeKey; label: string }[] = [
  { id: "7", label: "7 дней" },
  { id: "14", label: "14 дней" },
  { id: "30", label: "30 дней" },
  { id: "90", label: "90 дней" },
];

interface Props {
  token: string;
}

export default function UTMTab({ token }: Props) {
  const [days, setDays] = useState<RangeKey>("30");
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/web/utm-stats?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: Response = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [days, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalUsers = data?.campaigns.reduce((sum, c) => sum + c.users, 0) || 0;
  const totalPaid = data?.campaigns.reduce((sum, c) => sum + c.paid_users, 0) || 0;
  const totalRevenue = data?.campaigns.reduce((sum, c) => sum + c.revenue_usd, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold text-text">UTM-кампании</h2>
        <div className="flex gap-2 ml-auto">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => setDays(r.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                days === r.id
                  ? "bg-accent text-white"
                  : "bg-surface-2 text-text/60 hover:text-text"
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-text/60 hover:text-text text-sm font-medium disabled:opacity-50"
          >
            {loading ? "..." : "↻"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
          Ошибка: {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-surface-2 rounded-xl p-4">
              <div className="text-[10px] text-text/30 uppercase tracking-wider font-bold">Юзеры</div>
              <div className="text-2xl font-bold text-text mt-1">{totalUsers}</div>
              <div className="text-xs text-text/50 mt-1">за {data.days} дней</div>
            </div>
            <div className="bg-surface-2 rounded-xl p-4">
              <div className="text-[10px] text-text/30 uppercase tracking-wider font-bold">Платящих</div>
              <div className="text-2xl font-bold text-green-400 mt-1">{totalPaid}</div>
              <div className="text-xs text-text/50 mt-1">
                {totalUsers > 0 ? `${((totalPaid / totalUsers) * 100).toFixed(1)}% конверсия` : "0%"}
              </div>
            </div>
            <div className="bg-surface-2 rounded-xl p-4">
              <div className="text-[10px] text-text/30 uppercase tracking-wider font-bold">Выручка</div>
              <div className="text-2xl font-bold text-accent mt-1">${totalRevenue.toFixed(2)}</div>
              <div className="text-xs text-text/50 mt-1">суммарно</div>
            </div>
          </div>

          <div className="bg-surface-2 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-3 text-text/60 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Источник</th>
                  <th className="text-left px-4 py-3 font-semibold">Медиум</th>
                  <th className="text-left px-4 py-3 font-semibold">Кампания</th>
                  <th className="text-right px-4 py-3 font-semibold">Юзеры</th>
                  <th className="text-right px-4 py-3 font-semibold">Платящих</th>
                  <th className="text-right px-4 py-3 font-semibold">Конв. %</th>
                  <th className="text-right px-4 py-3 font-semibold">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-text/40">
                      Нет UTM-данных за выбранный период
                    </td>
                  </tr>
                ) : (
                  data.campaigns.map((c, i) => (
                    <tr key={i} className="border-t border-surface-3/50 hover:bg-surface-3/30">
                      <td className="px-4 py-3 text-text font-mono text-xs">{c.utm_source || "—"}</td>
                      <td className="px-4 py-3 text-text/70 font-mono text-xs">{c.utm_medium || "—"}</td>
                      <td className="px-4 py-3 text-text/70 font-mono text-xs">{c.utm_campaign || "—"}</td>
                      <td className="px-4 py-3 text-right text-text font-semibold">{c.users}</td>
                      <td className="px-4 py-3 text-right text-green-400 font-semibold">{c.paid_users}</td>
                      <td className="px-4 py-3 text-right text-text/70">{c.conversion_pct}%</td>
                      <td className="px-4 py-3 text-right text-accent font-semibold">${c.revenue_usd.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="text-xs text-text/40">
            Данные с {new Date(data.since).toLocaleDateString("ru-RU")} по сегодня. UTM привязан к юзеру на момент регистрации.
          </div>
        </>
      )}
    </div>
  );
}
