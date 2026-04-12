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

function getAdminToken() {
  try {
    return localStorage.getItem("admin_token") || "";
  } catch {
    return "";
  }
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
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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
    case "success":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
    case "warn":
      return "bg-amber-500/15 text-amber-300 border-amber-500/20";
    case "danger":
      return "bg-red-500/15 text-red-300 border-red-500/20";
    default:
      return "bg-sky-500/15 text-sky-300 border-sky-500/20";
  }
}

function resultBadge(result: string): { label: string; cls: string } {
  if (result === "ok") return { label: "Успешно", cls: "bg-emerald-500/15 text-emerald-300" };
  if (result === "denied") return { label: "Отклонено", cls: "bg-amber-500/15 text-amber-300" };
  return { label: "Ошибка", cls: "bg-red-500/15 text-red-300" };
}

function PayloadBlock({ payload }: { payload: Record<string, unknown> | null }) {
  if (!payload || Object.keys(payload).length === 0) {
    return <div className="text-sm text-zinc-500 italic">Без дополнительных данных</div>;
  }
  const entries = Object.entries(payload);
  return (
    <div className="rounded-2xl bg-black/30 border border-white/5 divide-y divide-white/5 overflow-hidden">
      {entries.map(([key, value]) => {
        const label = FIELD_LABELS[key] || key;
        const display = formatValue(value);
        return (
          <div key={key} className="flex flex-col sm:flex-row gap-2 px-4 py-3 text-sm">
            <div className="sm:w-48 flex-shrink-0 text-zinc-500">{label}</div>
            <div className="text-zinc-200 break-words font-mono text-xs">{display}</div>
          </div>
        );
      })}
    </div>
  );
}

const FIELD_LABELS: Record<string, string> = {
  old_tier: "Старый тариф",
  new_tier: "Новый тариф",
  tier: "Тариф",
  old_balance_usd: "Баланс до ($)",
  new_balance_usd: "Баланс после ($)",
  amount_usd: "Сумма ($)",
  reason: "Причина",
  code: "Код",
  amount: "Сумма",
  discount_percent: "Скидка (%)",
  expires_at: "Истекает",
  plan: "План",
  user_id: "ID пользователя",
  promo_id: "ID промокода",
  ban_reason: "Причина блокировки",
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "да" : "нет";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function AuditLogPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
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

  useEffect(() => {
    const saved = getAdminToken();
    if (!saved) {
      setLoading(false);
      return;
    }
    setToken(saved);
    setAuthed(true);
  }, []);

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
        localStorage.removeItem("admin_token");
        setAuthed(false);
        setToken("");
        setError("Сессия истекла. Войди снова через /admin.");
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
      const message = err instanceof Error ? err.message : "Ошибка загрузки";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, range, actionFilter, page]);

  useEffect(() => {
    if (authed && token) load();
  }, [authed, token, load]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (resultFilter !== "all" && item.result !== resultFilter) return false;
      if (adminEmail && !(item.admin_email || "").toLowerCase().includes(adminEmail.toLowerCase())) return false;
      return true;
    });
  }, [items, resultFilter, adminEmail]);

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

  if (!authed) {
    return (
      <div className="min-h-screen bg-bg text-text flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">Журнал действий</h1>
          <p className="text-text/60 mb-6">Сессия администратора истекла или отсутствует.</p>
          <a
            href="/admin"
            className="inline-flex px-4 py-2 rounded-xl bg-accent text-white font-semibold hover:opacity-90 transition"
          >
            Войти в админку
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Header (non-sticky to avoid overlap with admin nav) */}
      <div className="border-b border-text/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-text/50 mb-0.5">
                <a href="/admin" className="hover:text-text transition">← Админка</a>
              </div>
              <h1 className="text-xl md:text-2xl font-bold truncate">
                Журнал действий
                {total > 0 && (
                  <span className="ml-2 text-sm font-normal text-text/50">
                    · {total.toLocaleString("ru-RU")}
                  </span>
                )}
              </h1>
            </div>
            <button
              onClick={() => {
                setPage(0);
                load();
              }}
              className="flex-shrink-0 px-3 py-2 rounded-xl bg-surface border border-text/10 hover:border-text/20 text-sm font-semibold transition"
              disabled={loading}
            >
              {loading ? "…" : "Обновить"}
            </button>
          </div>

          {/* Quick date ranges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {([
              ["today", "Сегодня"],
              ["7d", "7 дней"],
              ["30d", "30 дней"],
              ["all", "Всё время"],
            ] as [QuickRange, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => {
                  setRange(key);
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  range === key
                    ? "bg-accent text-white"
                    : "bg-surface border border-text/10 text-text/70 hover:text-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2 rounded-xl bg-surface border border-text/10 text-sm focus:outline-none focus:border-accent/50"
            >
              <option value="">Все действия</option>
              {Object.entries(groupedActions).map(([group, actions]) => (
                <optgroup key={group} label={group}>
                  {actions.map((a) => (
                    <option key={a.key} value={a.key}>
                      {a.icon} {a.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value as "all" | "ok" | "denied" | "error")}
              className="px-3 py-2 rounded-xl bg-surface border border-text/10 text-sm focus:outline-none focus:border-accent/50"
            >
              <option value="all">Любой результат</option>
              <option value="ok">Только успешные</option>
              <option value="denied">Только отклонённые</option>
              <option value="error">Только ошибки</option>
            </select>

            <input
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="Email администратора"
              className="px-3 py-2 rounded-xl bg-surface border border-text/10 text-sm focus:outline-none focus:border-accent/50"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {loading && items.length === 0 ? (
          <div className="space-y-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-text/50">
            <div className="text-4xl mb-3">📋</div>
            <div className="font-semibold text-text/70 mb-1">Записей не найдено</div>
            <div className="text-sm">
              {total === 0
                ? "Журнал пуст. Начнёт заполняться при первом действии администратора."
                : "Попробуй снять фильтры или расширить диапазон дат."}
            </div>
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
                  className="w-full text-left rounded-2xl bg-surface border border-text/5 hover:border-accent/30 transition overflow-hidden group"
                >
                  <div className="p-4 flex items-start gap-4">
                    <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl border ${toneClasses(meta.tone)}`}>
                      {meta.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-1">
                        <div className="font-semibold">{meta.label}</div>
                        <div className={`flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-semibold ${result.cls}`}>
                          {result.label}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text/60">
                        <span>{item.admin_email || `ID ${item.admin_user_id}`}</span>
                        {item.target_type && item.target_id && (
                          <>
                            <span>•</span>
                            <span>
                              {item.target_type}: <span className="font-mono text-text/80">{item.target_id}</span>
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span title={formatAbsolute(item.created_at)}>{formatRelative(item.created_at)}</span>
                      </div>
                      {item.error_message && (
                        <div className="mt-2 text-xs text-red-300/80 line-clamp-1">⚠ {item.error_message}</div>
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
          <div className="mt-6 flex items-center justify-between gap-4 text-sm text-text/60">
            <div>
              Показано {showingFrom}–{showingTo} из {total.toLocaleString("ru-RU")}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="px-3 py-2 rounded-xl bg-surface border border-text/10 hover:border-text/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Предыдущая
              </button>
              <span className="px-2">
                {page + 1} / {pages}
              </span>
              <button
                onClick={() => setPage((p) => (p + 1 < pages ? p + 1 : p))}
                disabled={page + 1 >= pages || loading}
                className="px-3 py-2 rounded-xl bg-surface border border-text/10 hover:border-text/20 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Следующая →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl border border-text/10 bg-surface"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const meta = actionMeta(selected.action);
              const result = resultBadge(selected.result);
              return (
                <>
                  <div className="sticky top-0 bg-surface border-b border-text/5 px-6 py-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-xl border ${toneClasses(meta.tone)}`}>
                        {meta.icon}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold truncate">{meta.label}</h2>
                        <div className="text-xs text-text/60 mt-0.5">
                          <span className="font-mono">{selected.action}</span>
                          <span className="mx-2">•</span>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${result.cls}`}>
                            {result.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelected(null)}
                      className="flex-shrink-0 w-9 h-9 rounded-lg bg-bg/50 hover:bg-bg text-text/60 hover:text-text transition"
                      aria-label="Закрыть"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-text/50 mb-1">Администратор</div>
                        <div className="font-semibold">{selected.admin_email || "Без email"}</div>
                        <div className="text-xs text-text/50 mt-0.5">ID {selected.admin_user_id}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text/50 mb-1">Когда</div>
                        <div className="font-semibold">{formatAbsolute(selected.created_at)}</div>
                        <div className="text-xs text-text/50 mt-0.5">{formatRelative(selected.created_at)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text/50 mb-1">Цель</div>
                        <div className="font-semibold">
                          {selected.target_type && selected.target_id
                            ? `${selected.target_type}: ${selected.target_id}`
                            : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-text/50 mb-1">IP</div>
                        <div className="font-mono text-sm">{selected.ip_address || "—"}</div>
                      </div>
                    </div>

                    {selected.error_message && (
                      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        <div className="font-semibold mb-1">Ошибка</div>
                        <div>{selected.error_message}</div>
                      </div>
                    )}

                    <div>
                      <div className="text-xs text-text/50 mb-2 uppercase tracking-wider">Данные</div>
                      <PayloadBlock payload={selected.payload} />
                    </div>

                    {selected.user_agent && (
                      <div>
                        <div className="text-xs text-text/50 mb-2 uppercase tracking-wider">User Agent</div>
                        <div className="rounded-xl bg-bg/50 border border-text/5 px-4 py-3 text-xs font-mono text-text/70 break-all">
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
