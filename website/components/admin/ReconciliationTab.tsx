"use client";

import React, { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

interface Snapshot {
  id: number;
  provider: string;
  snapshot_date: string;
  balance_usd: number;
  actual_spend_usd: number | null;
  tracked_spend_usd: number | null;
  delta_usd: number | null;
  delta_pct: number | null;
  source: string;
  note: string | null;
  created_at: string | null;
}

const PROVIDER_LABEL: Record<string, string> = {
  novita: "Novita.ai",
  openrouter: "OpenRouter",
  fal: "fal.ai",
};

const PROVIDER_DOT: Record<string, string> = {
  novita: "bg-emerald-500",
  openrouter: "bg-blue-500",
  fal: "bg-amber-500",
};

function fmtUsd(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const sign = v < 0 ? "-" : "";
  return `${sign}$${Math.abs(v).toFixed(2)}`;
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(1)}%`;
}

function deltaColor(pct: number | null | undefined): string {
  if (pct === null || pct === undefined) return "text-text/40";
  const abs = Math.abs(pct);
  if (abs <= 5) return "text-emerald-500";
  if (abs <= 15) return "text-amber-500";
  return "text-rose-500";
}

export default function ReconciliationTab({ token }: { token: string }) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState<{ kind: "ok" | "err" | "warn"; text: string } | null>(null);

  const [provider, setProvider] = useState<"novita" | "fal">("novita");
  const [balance, setBalance] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/reconciliation`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError(res.status === 401 || res.status === 403 ? "Доступ запрещён" : `Ошибка ${res.status}`);
        return;
      }
      const data = await res.json();
      setSnapshots(data.snapshots || []);
    } catch {
      setError("Сетевая ошибка");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const showMsg = (kind: "ok" | "err" | "warn", text: string) => {
    setMsg({ kind, text });
    setTimeout(() => setMsg(null), 8000);
  };

  const submitManual = async () => {
    if (!token) return showMsg("warn", "Нет токена");
    if (!balance.trim()) return showMsg("warn", "Введите баланс в USD");
    const num = parseFloat(balance.replace(",", "."));
    if (!Number.isFinite(num) || num < 0) return showMsg("warn", `"${balance}" — не похоже на число`);

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/reconciliation/snapshot/manual`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ provider, balance_usd: num, note: note || null }),
      });
      const data = await res.json();
      if (res.ok) {
        const delta = data.delta_pct !== null && data.delta_pct !== undefined
          ? `дельта ${fmtPct(data.delta_pct)}`
          : "первый baseline";
        showMsg("ok", `Snapshot ${PROVIDER_LABEL[provider]} сохранён · ${delta}`);
        setBalance("");
        setNote("");
        await load();
      } else {
        showMsg("err", `${res.status}: ${data.detail || "Ошибка"}`);
      }
    } catch (e) {
      showMsg("err", `Сетевая ошибка: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const submitOpenRouter = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/reconciliation/snapshot/openrouter`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const delta = data.delta_pct !== null && data.delta_pct !== undefined
          ? `дельта ${fmtPct(data.delta_pct)}`
          : "первый baseline";
        showMsg("ok", `OpenRouter snapshot сохранён · ${delta}`);
        await load();
      } else {
        showMsg("err", `${res.status}: ${data.detail || "Ошибка"}`);
      }
    } catch (e) {
      showMsg("err", `Сетевая ошибка: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Group snapshots by provider for the cards on top
  const lastByProvider: Record<string, Snapshot> = {};
  for (const s of snapshots) {
    if (!lastByProvider[s.provider]) lastByProvider[s.provider] = s;
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 text-sm">{error}</div>
      )}
      {msg && (
        <div className={`p-3 rounded-xl text-sm border ${
          msg.kind === "ok" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
          : msg.kind === "err" ? "bg-rose-500/10 border-rose-500/20 text-rose-700"
          : "bg-amber-500/10 border-amber-500/20 text-amber-700"
        }`}>
          {msg.text}
        </div>
      )}

      {/* Provider summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(["novita", "openrouter", "fal"] as const).map((p) => {
          const s = lastByProvider[p];
          return (
            <div key={p} className="bg-surface rounded-2xl border border-text/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${PROVIDER_DOT[p]}`}></span>
                <span className="text-sm font-bold">{PROVIDER_LABEL[p]}</span>
              </div>
              {s ? (
                <>
                  <div className="text-2xl font-extrabold tracking-tight">{fmtUsd(s.balance_usd)}</div>
                  <div className="text-[10px] text-text/40 mt-0.5">
                    {p === "openrouter" ? "потрачено всего" : "баланс на счёте"} · {s.snapshot_date}
                  </div>
                  {s.delta_pct !== null && (
                    <div className={`text-xs mt-2 font-semibold ${deltaColor(s.delta_pct)}`}>
                      Δ {fmtPct(s.delta_pct)} ({fmtUsd(s.delta_usd)})
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-text/30">Нет snapshot</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action panel */}
      <div className="bg-surface rounded-2xl border border-text/5 p-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          {/* OpenRouter auto */}
          <div className="sm:w-[200px]">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-text/40 mb-1.5">OpenRouter</div>
            <button
              onClick={submitOpenRouter}
              disabled={submitting}
              className="w-full px-3 py-2 rounded-lg bg-blue-500 text-white text-xs font-semibold hover:bg-blue-600 disabled:opacity-50"
            >
              🔵 Авто-снимок
            </button>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px bg-text/10 h-12 self-center"></div>

          {/* Manual */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-text/40 mb-1.5">Provider</div>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as "novita" | "fal")}
                className="w-full px-3 py-2 rounded-lg bg-bg border border-text/10 text-xs"
              >
                <option value="novita">🟢 Novita</option>
                <option value="fal">🟡 fal.ai</option>
              </select>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-text/40 mb-1.5">Balance $</div>
              <input
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="32.00"
                inputMode="decimal"
                className="w-full px-3 py-2 rounded-lg bg-bg border border-text/10 text-xs"
              />
            </div>
            <div className="col-span-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-text/40 mb-1.5">Заметка</div>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="—"
                className="w-full px-3 py-2 rounded-lg bg-bg border border-text/10 text-xs"
              />
            </div>
            <div className="col-span-2 sm:col-span-4">
              <button
                onClick={submitManual}
                disabled={submitting}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 disabled:opacity-50"
              >
                {submitting ? "Сохраняем..." : "Сохранить snapshot"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-surface rounded-2xl border border-text/5 overflow-hidden">
        <div className="px-5 py-3 border-b border-text/5 flex items-center justify-between">
          <h3 className="text-sm font-bold">История</h3>
          <button onClick={load} disabled={loading} className="text-[11px] text-text/40 hover:text-text/70">
            ↻ Обновить
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text/40 text-sm">Загрузка…</div>
        ) : snapshots.length === 0 ? (
          <div className="p-8 text-center text-text/40 text-sm">
            Пока пусто. Сделайте первый snapshot — он станет baseline.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-text/5 text-[10px] uppercase tracking-wide text-text/40">
                  <th className="px-4 py-2 text-left font-semibold">Дата</th>
                  <th className="px-4 py-2 text-left font-semibold">Provider</th>
                  <th className="px-4 py-2 text-right font-semibold">Баланс</th>
                  <th className="px-4 py-2 text-right font-semibold">Реально</th>
                  <th className="px-4 py-2 text-right font-semibold">У нас</th>
                  <th className="px-4 py-2 text-right font-semibold">Δ $</th>
                  <th className="px-4 py-2 text-right font-semibold">Δ %</th>
                  <th className="px-4 py-2 text-left font-semibold">Заметка</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map((s) => (
                  <tr key={s.id} className="border-b border-text/[0.04] hover:bg-text/[0.02]">
                    <td className="px-4 py-2 text-text/70 whitespace-nowrap">{s.snapshot_date}</td>
                    <td className="px-4 py-2 text-text/70 whitespace-nowrap">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${PROVIDER_DOT[s.provider] || "bg-text/30"}`}></span>
                      {PROVIDER_LABEL[s.provider] || s.provider}
                      {s.source === "auto" && <span className="ml-1 text-[9px] text-text/30">авто</span>}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-text/70">{fmtUsd(s.balance_usd)}</td>
                    <td className="px-4 py-2 text-right font-mono text-text/60">{fmtUsd(s.actual_spend_usd)}</td>
                    <td className="px-4 py-2 text-right font-mono text-text/60">{fmtUsd(s.tracked_spend_usd)}</td>
                    <td className={`px-4 py-2 text-right font-mono ${deltaColor(s.delta_pct)}`}>{fmtUsd(s.delta_usd)}</td>
                    <td className={`px-4 py-2 text-right font-mono font-semibold ${deltaColor(s.delta_pct)}`}>{fmtPct(s.delta_pct)}</td>
                    <td className="px-4 py-2 text-text/40 truncate max-w-[180px]" title={s.note || ""}>
                      {s.note || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help */}
      <div className="text-[11px] text-text/40 px-1">
        <span className="text-emerald-500 font-semibold">≤5%</span> норма ·{" "}
        <span className="text-amber-500 font-semibold">5–15%</span> проверь ·{" "}
        <span className="text-rose-500 font-semibold">&gt;15%</span> провайдер берёт больше — баг или скрытая плата
      </div>
    </div>
  );
}
