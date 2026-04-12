"use client";

import React, { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";
const PAGE_SIZE = 20;

interface AuditItem {
  id: number;
  admin_user_id: number;
  admin_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  payload: Record<string, unknown> | null;
  result: string;
  error_message: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
}

const RANGES = [
  { id: "today", label: "Сегодня", days: 1 },
  { id: "7", label: "7 дней", days: 7 },
  { id: "30", label: "30 дней", days: 30 },
  { id: "all", label: "Всё время", days: 0 },
] as const;

type RangeId = (typeof RANGES)[number]["id"];

function getAdminToken() {
  try { return localStorage.getItem("admin_token") || ""; } catch { return ""; }
}

function rangeBounds(range: RangeId): { from: string; to: string } {
  if (range === "all") return { from: "", to: "" };
  const days = RANGES.find(r => r.id === range)?.days || 1;
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

function fmtTime(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const RESULT_LABELS: Record<string, string> = {
  ok: "Успех",
  denied: "Отказ",
  error: "Ошибка",
  failed: "Сбой",
};

export default function AuditLogPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<AuditItem | null>(null);
  const [range, setRange] = useState<RangeId>("7");
  const [actionFilter, setActionFilter] = useState("all");
  const [resultFilter, setResultFilter] = useState("all");
  const [emailFilter, setEmailFilter] = useState("");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const saved = getAdminToken();
    if (!saved) { setLoading(false); return; }
    setToken(saved);
    setAuthed(true);
  }, []);

  useEffect(() => {
    if (!authed || !token) return;

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    if (actionFilter !== "all") params.set("action", actionFilter);
    if (emailFilter.trim()) params.set("admin_email", emailFilter.trim());
    const { from, to } = rangeBounds(range);
    if (from) params.set("from", from);
    if (to) params.set("to", to);

    setLoading(true);
    setError("");

    fetch(`${API_URL}/api/admin/audit-log?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("admin_token");
          setAuthed(false);
          setToken("");
          setError("Сессия истекла. Войдите заново через /admin.");
          return null;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Не удалось загрузить журнал");
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        let list: AuditItem[] = data.items || [];
        if (resultFilter !== "all") list = list.filter(i => i.result === resultFilter);
        setItems(list);
        setTotal(data.total || 0);
      })
      .catch((err: Error) => setError(err.message || "Не удалось загрузить журнал"))
      .finally(() => setLoading(false));
  }, [authed, token, page, range, actionFilter, resultFilter, emailFilter]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const uniqueActions = Array.from(new Set(items.map(i => i.action))).slice(0, 20);

  if (!authed && !loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-xl font-bold mb-2">Требуется вход</h1>
          <p className="text-text/50 mb-5 text-sm">Журнал действий доступен только администраторам.</p>
          <a href="/admin" className="inline-flex px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors">
            Войти в админ-панель
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <a href="/admin" className="text-text/40 text-xs hover:text-text/70">← Админ-панель</a>
          <div className="flex items-center justify-between gap-4 mt-1">
            <div>
              <h1 className="text-2xl font-extrabold flex items-center gap-2">
                <span className="text-xl">📋</span>
                Журнал действий
              </h1>
              <p className="text-sm text-text/40 mt-0.5">История всех действий администраторов с фильтрами и деталями.</p>
            </div>
            <button
              onClick={() => {
                setPage(0);
                setRange("7");
                setActionFilter("all");
                setResultFilter("all");
                setEmailFilter("");
              }}
              className="px-3 py-2 rounded-xl bg-text/[0.05] hover:bg-text/[0.08] text-text/60 text-xs font-semibold transition-colors"
            >
              ↻ Сбросить
            </button>
          </div>
        </div>

        {/* Range pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => { setRange(r.id); setPage(0); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                range === r.id
                  ? "bg-accent text-white shadow-sm shadow-accent/20"
                  : "bg-text/[0.04] text-text/55 hover:bg-text/[0.08]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-text/40 mb-1.5">Действие</label>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 rounded-xl bg-bg border border-text/10 text-sm focus:outline-none focus:border-accent/50"
            >
              <option value="all">Все действия</option>
              {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-text/40 mb-1.5">Результат</label>
            <select
              value={resultFilter}
              onChange={(e) => { setResultFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 rounded-xl bg-bg border border-text/10 text-sm focus:outline-none focus:border-accent/50"
            >
              <option value="all">Любой результат</option>
              <option value="ok">✅ Успех</option>
              <option value="denied">⚠️ Отказ</option>
              <option value="error">❌ Ошибка</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wide text-text/40 mb-1.5">Email админа</label>
            <input
              value={emailFilter}
              onChange={(e) => { setEmailFilter(e.target.value); setPage(0); }}
              placeholder="admin@example.com"
              className="w-full px-3 py-2 rounded-xl bg-bg border border-text/10 text-sm focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 flex items-start gap-2">
            <span className="shrink-0">❌</span>
            <span>{error}</span>
          </div>
        )}

        {/* Body */}
        {loading ? (
          <div className="bg-surface rounded-2xl border border-text/5 p-8 text-center">
            <div className="w-8 h-8 border-2 border-accent/20 border-t-accent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-text/40">Загружаем записи…</p>
          </div>
        ) : items.length === 0 && !error ? (
          <div className="bg-surface rounded-2xl border border-text/5 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-text/[0.04] flex items-center justify-center text-3xl">📋</div>
            <p className="text-sm font-bold text-text/70 mb-1">Записей не найдено</p>
            <p className="text-xs text-text/40">Попробуйте расширить период или сменить фильтры.</p>
          </div>
        ) : items.length > 0 ? (
          <>
            <div className="bg-surface rounded-2xl border border-text/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-text/[0.03] text-[10px] uppercase tracking-wide text-text/40">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Время</th>
                      <th className="px-4 py-3 text-left font-semibold">Админ</th>
                      <th className="px-4 py-3 text-left font-semibold">Действие</th>
                      <th className="px-4 py-3 text-left font-semibold">Объект</th>
                      <th className="px-4 py-3 text-left font-semibold">Результат</th>
                      <th className="px-4 py-3 text-left font-semibold">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => setSelected(item)}
                        className="border-t border-text/[0.04] cursor-pointer hover:bg-text/[0.02] transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-text/60 text-xs">{fmtTime(item.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-text/85 text-xs truncate max-w-[180px]">{item.admin_email || "Без email"}</div>
                          <div className="text-[10px] text-text/30">ID {item.admin_user_id}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-accent truncate max-w-[180px]">{item.action}</td>
                        <td className="px-4 py-3 text-text/60 text-xs">
                          {[item.target_type, item.target_id].filter(Boolean).join(": ") || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                            item.result === "ok"
                              ? "bg-emerald-500/12 text-emerald-700"
                              : item.result === "denied"
                                ? "bg-amber-500/15 text-amber-700"
                                : "bg-rose-500/15 text-rose-700"
                          }`}>
                            {item.result === "ok" ? "✓" : item.result === "denied" ? "⚠" : "✕"} {RESULT_LABELS[item.result] || item.result}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-text/40 text-[11px] font-mono">{item.ip_address || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="text-xs text-text/40">
                Показано {items.length ? page * PAGE_SIZE + 1 : 0}–{page * PAGE_SIZE + items.length} из {total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg bg-text/[0.04] hover:bg-text/[0.08] text-xs font-semibold text-text/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Назад
                </button>
                <span className="text-xs text-text/40 px-2">Стр. {page + 1} / {pages}</span>
                <button
                  onClick={() => setPage((p) => (p + 1 < pages ? p + 1 : p))}
                  disabled={page + 1 >= pages}
                  className="px-3 py-1.5 rounded-lg bg-text/[0.04] hover:bg-text/[0.08] text-xs font-semibold text-text/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Вперёд →
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-3xl max-h-[85vh] overflow-auto rounded-2xl border border-text/10 bg-bg p-5 sm:p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wide text-text/40 font-bold mb-1">Действие</div>
                <h2 className="text-lg font-bold font-mono text-accent break-all">{selected.action}</h2>
                <p className="text-xs text-text/40 mt-1">
                  {selected.created_at ? new Date(selected.created_at).toLocaleString("ru-RU") : "—"}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-lg bg-text/[0.05] hover:bg-text/[0.1] text-text/50 flex items-center justify-center transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-text/[0.02] border border-text/[0.06] p-3">
                <div className="text-[10px] uppercase tracking-wide text-text/40 font-bold mb-1">Админ</div>
                <div className="text-sm font-semibold truncate">{selected.admin_email || "Без email"}</div>
                <div className="text-[10px] text-text/40 mt-0.5">ID {selected.admin_user_id}</div>
              </div>
              <div className="rounded-xl bg-text/[0.02] border border-text/[0.06] p-3">
                <div className="text-[10px] uppercase tracking-wide text-text/40 font-bold mb-1">Объект</div>
                <div className="text-sm">{[selected.target_type, selected.target_id].filter(Boolean).join(": ") || "—"}</div>
                <div className="text-[10px] text-text/40 mt-0.5">Результат: {RESULT_LABELS[selected.result] || selected.result}</div>
              </div>
              <div className="rounded-xl bg-text/[0.02] border border-text/[0.06] p-3">
                <div className="text-[10px] uppercase tracking-wide text-text/40 font-bold mb-1">IP-адрес</div>
                <div className="text-sm font-mono">{selected.ip_address || "—"}</div>
              </div>
              <div className="rounded-xl bg-text/[0.02] border border-text/[0.06] p-3">
                <div className="text-[10px] uppercase tracking-wide text-text/40 font-bold mb-1">User Agent</div>
                <div className="text-[11px] break-all text-text/65 leading-snug">{selected.user_agent || "—"}</div>
              </div>
            </div>

            {selected.error_message && (
              <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-700">
                <span className="font-bold">Ошибка:</span> {selected.error_message}
              </div>
            )}

            <div>
              <div className="text-[10px] uppercase tracking-wide text-text/40 font-bold mb-2">Payload</div>
              <pre className="rounded-xl bg-text/[0.02] border border-text/[0.06] p-3 text-[11px] text-text/70 overflow-x-auto whitespace-pre-wrap break-words font-mono leading-relaxed">
                {JSON.stringify(selected.payload || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
