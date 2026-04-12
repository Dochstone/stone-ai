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

export default function AuditLogPage() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<AuditItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<AuditItem | null>(null);
  const [adminId, setAdminId] = useState("");
  const [action, setAction] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
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

  useEffect(() => {
    if (!authed || !token) return;

    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(page * PAGE_SIZE),
    });
    if (adminId.trim()) params.set("admin_id", adminId.trim());
    if (action.trim()) params.set("action", action.trim());
    if (fromDate) params.set("from", toIsoOrEmpty(fromDate));
    if (toDate) params.set("to", toIsoOrEmpty(toDate));

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
          setError("Access denied. Login again via /admin.");
          return null;
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.detail || "Failed to load audit log");
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((err: Error) => {
        setError(err.message || "Failed to load audit log");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [action, adminId, authed, fromDate, page, toDate, token]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (!authed) {
    return (
      <div className="min-h-screen bg-[#0f0f12] text-white flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">Audit Log</h1>
          <p className="text-zinc-400 mb-6">Admin token not found or expired.</p>
          <a href="/admin" className="inline-flex px-4 py-2 rounded-xl bg-[#C4623D] text-white font-semibold hover:opacity-90 transition-opacity">
            Go to Admin Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white">
      <div className="sticky top-0 z-10 bg-[#0f0f12]/95 backdrop-blur-sm border-b border-white/5 px-4 md:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <a href="/admin" className="text-zinc-500 hover:text-white transition text-sm">← Admin</a>
                <span className="text-zinc-700">/</span>
                <span className="text-sm text-zinc-400">Audit Log</span>
              </div>
              <h1 className="text-2xl font-bold">Журнал действий</h1>
            </div>
            <button
              onClick={() => {
                setPage(0);
                setLoading(true);
                setItems([]);
                setTotal(0);
                setSelected(null);
                setError("");
                const currentToken = getAdminToken();
                setToken(currentToken);
                setAuthed(Boolean(currentToken));
              }}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold transition-colors"
            >
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={adminId}
              onChange={(e) => {
                setAdminId(e.target.value);
                setPage(0);
              }}
              placeholder="Admin ID"
              className="px-3 py-2 rounded-xl bg-[#1a1a22] border border-white/10 text-sm focus:outline-none focus:border-[#C4623D]/50"
            />
            <input
              value={action}
              onChange={(e) => {
                setAction(e.target.value);
                setPage(0);
              }}
              placeholder="Action"
              className="px-3 py-2 rounded-xl bg-[#1a1a22] border border-white/10 text-sm focus:outline-none focus:border-[#C4623D]/50"
            />
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2 rounded-xl bg-[#1a1a22] border border-white/10 text-sm focus:outline-none focus:border-[#C4623D]/50"
            />
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2 rounded-xl bg-[#1a1a22] border border-white/10 text-sm focus:outline-none focus:border-[#C4623D]/50"
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

        <div className="overflow-hidden rounded-2xl border border-white/5 bg-[#15151c]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead className="bg-white/[0.03] text-zinc-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Time</th>
                  <th className="px-4 py-3 text-left font-medium">Admin</th>
                  <th className="px-4 py-3 text-left font-medium">Action</th>
                  <th className="px-4 py-3 text-left font-medium">Target</th>
                  <th className="px-4 py-3 text-left font-medium">Result</th>
                  <th className="px-4 py-3 text-left font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">Loading audit log...</td>
                  </tr>
                )}
                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">No records found.</td>
                  </tr>
                )}
                {!loading && items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className="border-t border-white/5 cursor-pointer hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-300">
                      {item.created_at ? new Date(item.created_at).toLocaleString("ru-RU") : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{item.admin_email || "Unknown"}</div>
                      <div className="text-xs text-zinc-500">ID {item.admin_user_id}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#d8a892]">{item.action}</td>
                    <td className="px-4 py-3 text-zinc-300">
                      {[item.target_type, item.target_id].filter(Boolean).join(": ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${
                        item.result === "ok"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : item.result === "denied"
                            ? "bg-amber-500/15 text-amber-300"
                            : "bg-red-500/15 text-red-300"
                      }`}>
                        {item.result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{item.ip_address || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 text-sm text-zinc-400">
          <div>
            Showing {items.length ? page * PAGE_SIZE + 1 : 0}-{page * PAGE_SIZE + items.length} of {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              disabled={page === 0}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            <span>Page {page + 1} / {pages}</span>
            <button
              onClick={() => setPage((prev) => (prev + 1 < pages ? prev + 1 : prev))}
              disabled={page + 1 >= pages}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div
            className="w-full max-w-3xl max-h-[85vh] overflow-auto rounded-2xl border border-white/10 bg-[#121219] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold mb-1">{selected.action}</h2>
                <p className="text-sm text-zinc-400">
                  {selected.created_at ? new Date(selected.created_at).toLocaleString("ru-RU") : "—"}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
              <div className="rounded-xl bg-white/[0.03] p-4">
                <div className="text-zinc-500 mb-1">Admin</div>
                <div>{selected.admin_email || "Unknown"}</div>
                <div className="text-zinc-400 text-xs mt-1">ID {selected.admin_user_id}</div>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-4">
                <div className="text-zinc-500 mb-1">Target</div>
                <div>{[selected.target_type, selected.target_id].filter(Boolean).join(": ") || "—"}</div>
                <div className="text-zinc-400 text-xs mt-1">Result: {selected.result}</div>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-4">
                <div className="text-zinc-500 mb-1">IP</div>
                <div>{selected.ip_address || "—"}</div>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-4">
                <div className="text-zinc-500 mb-1">User Agent</div>
                <div className="break-all">{selected.user_agent || "—"}</div>
              </div>
            </div>

            {selected.error_message && (
              <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {selected.error_message}
              </div>
            )}

            <div>
              <div className="text-sm font-semibold text-zinc-300 mb-2">Payload</div>
              <pre className="rounded-2xl bg-black/30 border border-white/5 p-4 text-xs text-zinc-200 overflow-x-auto whitespace-pre-wrap break-words">
                {JSON.stringify(selected.payload || {}, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
