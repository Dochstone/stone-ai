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

const PROVIDER_ICON: Record<string, string> = {
  novita: "🟢",
  openrouter: "🔵",
  fal: "🟡",
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

export default function ReconciliationPage() {
  const [token, setToken] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const [provider, setProvider] = useState<"novita" | "fal">("novita");
  const [balance, setBalance] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const t = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
    setToken(t);
  }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/reconciliation`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setError("Доступ запрещён. Залогиньтесь как админ через /admin.");
          return;
        }
        setError(`Ошибка ${res.status}`);
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

  useEffect(() => {
    load();
  }, [load]);

  const submitManual = async () => {
    if (!token) return;
    const num = parseFloat(balance.replace(",", "."));
    if (!Number.isFinite(num) || num < 0) {
      setMsg("⚠️ Введите корректный баланс в USD");
      return;
    }
    setSubmitting(true);
    setMsg("");
    try {
      const res = await fetch(`${API_URL}/api/admin/reconciliation/snapshot/manual`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ provider, balance_usd: num, note: note || null }),
      });
      const data = await res.json();
      if (res.ok) {
        const delta = data.delta_pct !== null ? ` · дельта ${fmtPct(data.delta_pct)}` : "";
        setMsg(`✅ Snapshot сохранён${delta}`);
        setBalance("");
        setNote("");
        await load();
      } else {
        setMsg(`❌ ${data.detail || "Ошибка"}`);
      }
    } catch {
      setMsg("❌ Сетевая ошибка");
    } finally {
      setSubmitting(false);
      setTimeout(() => setMsg(""), 6000);
    }
  };

  const submitOpenRouter = async () => {
    if (!token) return;
    setSubmitting(true);
    setMsg("");
    try {
      const res = await fetch(`${API_URL}/api/admin/reconciliation/snapshot/openrouter`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const delta = data.delta_pct !== null ? ` · дельта ${fmtPct(data.delta_pct)}` : "";
        setMsg(`✅ OpenRouter snapshot сохранён${delta}`);
        await load();
      } else {
        setMsg(`❌ ${data.detail || "Ошибка"}`);
      }
    } catch {
      setMsg("❌ Сетевая ошибка");
    } finally {
      setSubmitting(false);
      setTimeout(() => setMsg(""), 6000);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Требуется вход</h1>
          <a href="/admin" className="text-accent hover:underline">Войти как админ</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <a href="/admin" className="text-text/40 text-xs hover:text-text/70">← Админ-панель</a>
            <h1 className="text-2xl font-extrabold mt-1">Сверка трат провайдеров</h1>
            <p className="text-sm text-text/40 mt-1">
              Сравнение реальных списаний со счёта провайдера и нашего внутреннего учёта.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 text-sm">
            {error}
          </div>
        )}
        {msg && (
          <div className="mb-4 p-3 rounded-xl bg-text/[0.04] border border-text/10 text-text/70 text-sm">
            {msg}
          </div>
        )}

        {/* Auto OpenRouter */}
        <div className="bg-surface rounded-2xl border border-text/5 p-5 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span>🔵</span>
                <h2 className="text-base font-bold">OpenRouter — авто-снимок</h2>
              </div>
              <p className="text-xs text-text/40">
                Дёрнет API OpenRouter и зафиксирует текущее использование. Не требует ввода.
              </p>
            </div>
            <button
              onClick={submitOpenRouter}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 disabled:opacity-50"
            >
              {submitting ? "..." : "Сделать snapshot"}
            </button>
          </div>
        </div>

        {/* Manual entry */}
        <div className="bg-surface rounded-2xl border border-text/5 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span>✍️</span>
            <h2 className="text-base font-bold">Ручной snapshot — Novita / fal.ai</h2>
          </div>
          <p className="text-xs text-text/40 mb-4">
            Зайди на dashboard провайдера, скопируй текущий баланс и введи здесь. Система сравнит с нашим расчётом.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-text/40 mb-1">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as "novita" | "fal")}
                className="w-full px-3 py-2 rounded-lg bg-bg border border-text/10 text-sm"
              >
                <option value="novita">🟢 Novita.ai</option>
                <option value="fal">🟡 fal.ai</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-text/40 mb-1">
                Balance USD
              </label>
              <input
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="32.00"
                inputMode="decimal"
                className="w-full px-3 py-2 rounded-lg bg-bg border border-text/10 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide text-text/40 mb-1">
                Заметка (опционально)
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="После теста новой модели"
                className="w-full px-3 py-2 rounded-lg bg-bg border border-text/10 text-sm"
              />
            </div>
          </div>

          <button
            onClick={submitManual}
            disabled={submitting || !balance}
            className="px-4 py-2 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 disabled:opacity-50"
          >
            {submitting ? "..." : "Сохранить snapshot"}
          </button>
        </div>

        {/* History table */}
        <div className="bg-surface rounded-2xl border border-text/5 overflow-hidden">
          <div className="px-5 py-3 border-b border-text/5 flex items-center justify-between">
            <h2 className="text-base font-bold">История сверок</h2>
            <button
              onClick={load}
              disabled={loading}
              className="text-xs text-text/40 hover:text-text/70"
            >
              Обновить
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-text/40 text-sm">Загрузка...</div>
          ) : snapshots.length === 0 ? (
            <div className="p-8 text-center text-text/40 text-sm">
              Пока нет ни одного snapshot. Сделайте первый — он станет baseline.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-text/5 text-[10px] uppercase tracking-wide text-text/40">
                    <th className="px-4 py-2 text-left font-semibold">Дата</th>
                    <th className="px-4 py-2 text-left font-semibold">Provider</th>
                    <th className="px-4 py-2 text-right font-semibold">Баланс</th>
                    <th className="px-4 py-2 text-right font-semibold">Реально</th>
                    <th className="px-4 py-2 text-right font-semibold">У нас в БД</th>
                    <th className="px-4 py-2 text-right font-semibold">Δ</th>
                    <th className="px-4 py-2 text-right font-semibold">Δ %</th>
                    <th className="px-4 py-2 text-left font-semibold">Заметка</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((s) => (
                    <tr key={s.id} className="border-b border-text/[0.04] hover:bg-text/[0.02]">
                      <td className="px-4 py-2 text-text/70">{s.snapshot_date}</td>
                      <td className="px-4 py-2 text-text/70">
                        {PROVIDER_ICON[s.provider] || "•"} {PROVIDER_LABEL[s.provider] || s.provider}
                        {s.source === "auto" && <span className="ml-1 text-[9px] text-text/30">авто</span>}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-text/70">{fmtUsd(s.balance_usd)}</td>
                      <td className="px-4 py-2 text-right font-mono text-text/60">{fmtUsd(s.actual_spend_usd)}</td>
                      <td className="px-4 py-2 text-right font-mono text-text/60">{fmtUsd(s.tracked_spend_usd)}</td>
                      <td className={`px-4 py-2 text-right font-mono ${deltaColor(s.delta_pct)}`}>{fmtUsd(s.delta_usd)}</td>
                      <td className={`px-4 py-2 text-right font-mono font-semibold ${deltaColor(s.delta_pct)}`}>{fmtPct(s.delta_pct)}</td>
                      <td className="px-4 py-2 text-text/40 text-xs truncate max-w-[200px]" title={s.note || ""}>
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
        <div className="mt-6 p-4 rounded-2xl bg-text/[0.02] border border-text/5 text-xs text-text/50">
          <div className="font-semibold mb-1">Как читать дельту:</div>
          <div className="space-y-0.5">
            <div><span className="text-emerald-500 font-semibold">≤ 5%</span> — норма, расхождение в пределах округления</div>
            <div><span className="text-amber-500 font-semibold">5-15%</span> — стоит проверить, может были тесты вне production</div>
            <div><span className="text-rose-500 font-semibold">&gt; 15%</span> — провайдер берёт больше чем мы считаем (ищи баг или скрытую плату)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
