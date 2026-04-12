"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";
const PAGE_SIZE = 25;

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

interface ActionMeta {
  label: string;
  icon: string;
  group: string;
  tone: "info" | "warn" | "danger" | "success";
}

const ACTION_META: Record<string, ActionMeta> = {
  user_banned: { label: "Блокировка пользователя", icon: "🚫", group: "Пользователи", tone: "danger" },
  user_unbanned: { label: "Разблокировка пользователя", icon: "✅", group: "Пользователи", tone: "success" },
  balance_changed: { label: "Изменение баланса", icon: "💰", group: "Биллинг", tone: "warn" },
  subscription_set: { label: "Изменение тарифа", icon: "⭐", group: "Биллинг", tone: "info" },
  promo_created: { label: "Создан промокод", icon: "🎁", group: "Промокоды", tone: "info" },
  promo_deleted: { label: "Удалён промокод", icon: "🗑", group: "Промокоды", tone: "warn" },
};

function actionMeta(action: string): ActionMeta {
  return ACTION_META[action] || { label: action, icon: "•", group: "Прочее", tone: "info" };
}

function toIsoOrEmpty(value: string) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString();
}

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff} сек. назад`;
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} дн. назад`;
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

function formatAbsolute(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

type QuickRange = "all" | "today" | "7d" | "30d";

function rangeBounds(range: QuickRange): { from: string; to: string } {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: endOfDay.toISOString() };
  }
  if (range === "7d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: endOfDay.toISOString() };
  }
  if (range === "30d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString(), to: endOfDay.toISOString() };
  }
  return { from: "", to: "" };
}

function toneClasses(tone: ActionMeta["tone"]): string {
  switch (tone) {
    case "success": return "bg-emerald-500/15 text-emerald-600 border-emerald-500/20";
    case "warn": return "bg-amber-500/15 text-amber-600 border-amber-500/20";
    case "danger": return "bg-rose-500/15 text-rose-600 border-rose-500/20";
    default: return "bg-sky-500/15 text-sky-600 border-sky-500/20";
  }
}

function resultBadge(result: string): { label: string; cls: string } {
  if (result === "ok") return { label: "Успешно", cls: "bg-emerald-500/15 text-emerald-700" };
  if (result === "denied") return { label: "Отклонено", cls: "bg-amber-500/15 text-amber-700" };
  return { label: "Ошибка", cls: "bg-rose-500/15 text-rose-700" };
}

const FIELD_LABELS: Record<string, string> = {
  old_tier: "Старый тариф", new_tier: "Новый тариф", tier: "Тариф",
  old_balance_usd: "Баланс до ($)", new_balance_usd: "Баланс после ($)",
  amount_usd: "Сумма ($)", reason: "Причина",
  code: "Код", amount: "Сумма", discount_percent: "Скидка (%)", expires_at: "Истекает",
  plan: "План", user_id: "ID пользователя", promo_id: "ID промокода", ban_reason: "Причина блокировки",
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "да" : "нет";
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

// Build a short human-readable summary of a payload, e.g. "$1.50 → $5.00" for balance change
function payloadSummary(action: string, payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  if (action === "balance_changed") {
    const o = payload.old_balance_usd, n = payload.new_balance_usd;
    if (typeof o === "number" && typeof n === "number") {
      const diff = n - o;
      const sign = diff > 0 ? "+" : "";
      return `$${o.toFixed(2)} → $${n.toFixed(2)} (${sign}$${diff.toFixed(2)})`;
    }
  }
  if (action === "subscription_set") {
    const o = payload.old_tier, n = payload.new_tier || payload.tier;
    if (n) return `${o || "—"} → ${n}`;
  }
  if (action === "user_banned" && payload.ban_reason) return String(payload.ban_reason);
  if (action === "promo_created") {
    const c = payload.code, d = payload.discount_percent, a = payload.amount;
    return [c && `код ${c}`, d && `${d}%`, a && `$${a}`].filter(Boolean).join(" · ") || null;
  }
  if (payload.reason) return String(payload.reason);
  // Fallback: show first 2 fields compactly
  const entries = Object.entries(payload).slice(0, 2);
  if (entries.length === 0) return null;
  return entries.map(([k, v]) => `${FIELD_LABELS[k] || k}: ${formatValue(v).slice(0, 30)}`).join(" · ");
}

function PayloadBlock({ payload }: { payload: Record<string, unknown> | null }) {
  if (!payload || Object.keys(payload).length === 0) {
    return <div className="text-sm text-text/40 italic">Без дополнительных данных</div>;
  }
  const entries = Object.entries(payload);
  return (
    <div className="rounded-xl bg-text/[0.02] border border-text/[0.06] divide-y divide-text/5 overflow-hidden">
      {entries.map(([key, value]) => (
        <div key={key} className="flex flex-col sm:flex-row gap-2 px-4 py-2.5 text-sm">
          <div className="sm:w-44 flex-shrink-0 text-text/45 text-xs">{FIELD_LABELS[key] || key}</div>
          <div className="text-text/80 break-words font-mono text-xs">{formatValue(value)}</div>
        </div>
      ))}
    </div>
  );
}

export default function AuditLogTab({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<AuditItem | null>(null);

  const [adminEmail, setAdminEmail] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [resultFilter, setResultFilter] = useState<"all" | "ok" | "denied" | "error">("all");
  const [range, setRange] = useState<QuickRange>("7d");
  const [page, setPage] = useState(0);

  const load = useCallback(async () => {
    if (!token) return;
    const bounds = rangeBounds(range);
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    if (actionFilter) params.set("action", actionFilter);
    if (bounds.from) params.set("from", toIsoOrEmpty(bounds.from));
    if (bounds.to) params.set("to", toIsoOrEmpty(bounds.to));

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/admin/audit-log?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        setError("Доступ запрещён");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Не удалось загрузить журнал");
      }
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [token, range, actionFilter, page]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => items.filter(item => {
    if (resultFilter !== "all" && item.result !== resultFilter) return false;
    if (adminEmail && !(item.admin_email || "").toLowerCase().includes(adminEmail.toLowerCase())) return false;
    return true;
  }), [items, resultFilter, adminEmail]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const showingFrom = items.length ? page * PAGE_SIZE + 1 : 0;
  const showingTo = page * PAGE_SIZE + items.length;

  const groupedActions = useMemo(() => {
    const groups: Record<string, { key: string; label: string; icon: string }[]> = {};
    Object.entries(ACTION_META).forEach(([key, meta]) => {
      if (!groups[meta.group]) groups[meta.group] = [];
      groups[meta.group].push({ key, label: meta.label, icon: meta.icon });
    });
    return groups;
  }, []);

  return (
    <div className="space-y-5">
      {/* Range pills */}
      <div className="flex flex-wrap gap-2">
        {([
          ["today", "Сегодня"], ["7d", "7 дней"], ["30d", "30 дней"], ["all", "Всё время"],
        ] as [QuickRange, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setRange(key); setPage(0); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              range === key ? "bg-accent text-white shadow-sm shadow-accent/20" : "bg-text/[0.04] text-text/55 hover:bg-text/[0.08]"
            }`}
          >
            {label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => { setPage(0); load(); }}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-text/[0.05] hover:bg-text/[0.08] text-xs font-semibold text-text/60 disabled:opacity-50 transition-colors"
        >
          {loading ? "..." : "↻ Обновить"}
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-text/40 mb-1.5">Действие</label>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
            className="w-full px-3 py-2 rounded-xl bg-bg border border-text/10 text-sm focus:outline-none focus:border-accent/50"
          >
            <option value="">Все действия</option>
            {Object.entries(groupedActions).map(([group, actions]) => (
              <optgroup key={group} label={group}>
                {actions.map((a) => <option key={a.key} value={a.key}>{a.icon} {a.label}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-text/40 mb-1.5">Результат</label>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value as "all" | "ok" | "denied" | "error")}
            className="w-full px-3 py-2 rounded-xl bg-bg border border-text/10 text-sm focus:outline-none focus:border-accent/50"
          >
            <option value="all">Любой результат</option>
            <option value="ok">✅ Успешные</option>
            <option value="denied">⚠️ Отклонённые</option>
            <option value="error">❌ Ошибки</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wide text-text/40 mb-1.5">Email админа</label>
          <input
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="admin@example.com"
            className="w-full px-3 py-2 rounded-xl bg-bg border border-text/10 text-sm focus:outline-none focus:border-accent/50"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-700 flex items-start gap-2">
          <span className="shrink-0">❌</span>
          <span>{error}</span>
        </div>
      )}

      {/* Body */}
      {loading && items.length === 0 ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-text/[0.04] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-text/5 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-text/[0.04] flex items-center justify-center text-3xl">📋</div>
          <p className="text-sm font-bold text-text/70 mb-1">Записей не найдено</p>
          <p className="text-xs text-text/40">
            {total === 0 ? "Журнал пуст. Начнёт заполняться при первом действии админа." : "Попробуйте снять фильтры или расширить диапазон дат."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const meta = actionMeta(item.action);
            const result = resultBadge(item.result);
            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="w-full text-left rounded-2xl bg-surface border border-text/5 hover:border-accent/30 transition overflow-hidden"
              >
                <div className="p-3.5 flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${toneClasses(meta.tone)}`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-0.5">
                      <div className="text-sm font-semibold text-text/85 truncate">{meta.label}</div>
                      <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${result.cls}`}>{result.label}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-text/55">
                      <span className="truncate">{item.admin_email || `ID ${item.admin_user_id}`}</span>
                      {item.target_type && item.target_id && (
                        <>
                          <span className="text-text/25">·</span>
                          <span className="truncate">
                            {item.target_type}: <span className="font-mono text-text/70">{item.target_id}</span>
                          </span>
                        </>
                      )}
                      <span className="text-text/25">·</span>
                      <span title={formatAbsolute(item.created_at)}>{formatRelative(item.created_at)}</span>
                    </div>
                    {(() => {
                      const summary = payloadSummary(item.action, item.payload);
                      return summary ? (
                        <div className="mt-1.5 text-[11px] text-text/65 leading-snug line-clamp-1">
                          <span className="text-text/35">→</span> {summary}
                        </div>
                      ) : null;
                    })()}
                    {item.error_message && (
                      <div className="mt-1.5 text-[11px] text-rose-600 line-clamp-1">⚠ {item.error_message}</div>
                    )}
                    {item.ip_address && (
                      <div className="mt-1 text-[10px] text-text/30 font-mono">IP: {item.ip_address}</div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-4 text-xs text-text/50">
          <div>Показано {showingFrom}–{showingTo} из {total.toLocaleString("ru-RU")}</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="px-3 py-1.5 rounded-lg bg-text/[0.04] hover:bg-text/[0.08] font-semibold text-text/65 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Назад
            </button>
            <span className="px-2">Стр. {page + 1} / {pages}</span>
            <button
              onClick={() => setPage((p) => (p + 1 < pages ? p + 1 : p))}
              disabled={page + 1 >= pages || loading}
              className="px-3 py-1.5 rounded-lg bg-text/[0.04] hover:bg-text/[0.08] font-semibold text-text/65 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Вперёд →
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border border-text/10 bg-bg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const meta = actionMeta(selected.action);
              const result = resultBadge(selected.result);
              return (
                <>
                  <div className="sticky top-0 bg-bg border-b border-text/5 px-5 py-4 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl border ${toneClasses(meta.tone)}`}>
                        {meta.icon}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base font-bold truncate">{meta.label}</h2>
                        <div className="text-[11px] text-text/50 mt-0.5 flex items-center flex-wrap gap-x-2">
                          <span className="font-mono">{selected.action}</span>
                          <span className="text-text/30">·</span>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${result.cls}`}>{result.label}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="shrink-0 w-8 h-8 rounded-lg bg-text/[0.05] hover:bg-text/[0.1] text-text/50 flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-text/[0.02] border border-text/[0.06] p-3">
                        <div className="text-[10px] uppercase tracking-wide text-text/40 font-bold mb-1">Администратор</div>
                        <div className="font-semibold text-sm truncate">{selected.admin_email || "Без email"}</div>
                        <div className="text-[10px] text-text/40 mt-0.5">ID {selected.admin_user_id}</div>
                      </div>
                      <div className="rounded-xl bg-text/[0.02] border border-text/[0.06] p-3">
                        <div className="text-[10px] uppercase tracking-wide text-text/40 font-bold mb-1">Когда</div>
                        <div className="text-sm font-semibold">{formatAbsolute(selected.created_at)}</div>
                        <div className="text-[10px] text-text/40 mt-0.5">{formatRelative(selected.created_at)}</div>
                      </div>
                      <div className="rounded-xl bg-text/[0.02] border border-text/[0.06] p-3">
                        <div className="text-[10px] uppercase tracking-wide text-text/40 font-bold mb-1">Цель</div>
                        <div className="text-sm">
                          {selected.target_type && selected.target_id ? `${selected.target_type}: ${selected.target_id}` : "—"}
                        </div>
                      </div>
                      <div className="rounded-xl bg-text/[0.02] border border-text/[0.06] p-3">
                        <div className="text-[10px] uppercase tracking-wide text-text/40 font-bold mb-1">IP</div>
                        <div className="text-sm font-mono">{selected.ip_address || "—"}</div>
                      </div>
                    </div>

                    {selected.error_message && (
                      <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-700">
                        <div className="font-bold mb-0.5">Ошибка</div>
                        <div>{selected.error_message}</div>
                      </div>
                    )}

                    <div>
                      <div className="text-[10px] uppercase tracking-wide text-text/40 font-bold mb-2">Данные</div>
                      <PayloadBlock payload={selected.payload} />
                    </div>

                    {selected.user_agent && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wide text-text/40 font-bold mb-2">User Agent</div>
                        <div className="rounded-xl bg-text/[0.02] border border-text/[0.06] px-3 py-2.5 text-[11px] font-mono text-text/65 break-all">
                          {selected.user_agent}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
