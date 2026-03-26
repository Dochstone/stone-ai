"use client";

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

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
  total_tokens_used: number;
  joined_at: string | null;
}

interface Transaction {
  id: number;
  user_id: number;
  amount_usd: number;
  currency: string;
  status: string;
  created_at: string | null;
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-text/5 p-5">
      <div className="text-text/40 text-xs font-medium mb-1">{label}</div>
      <div className="text-2xl font-extrabold">{value}</div>
      {sub && <div className="text-text/30 text-xs mt-1">{sub}</div>}
    </div>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"stats" | "users" | "transactions" | "promos" | "referrals">("stats");

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<{ referrers: any[]; total_referred_users: number }>({ referrers: [], total_referred_users: 0 });
  const [loading, setLoading] = useState(false);

  // Check saved token
  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) {
      setToken(saved);
      setAuthed(true);
    }
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
    if (!authed || !token) return;
    setLoading(true);
    if (tab === "stats") {
      fetchData("stats").then((d) => { if (d) setStats(d); setLoading(false); });
    } else if (tab === "users") {
      fetchData("users?limit=100").then((d) => { if (d) { setUsers(d.users); setUsersTotal(d.total); } setLoading(false); });
    } else if (tab === "promos") {
      fetchData("promos").then((d) => { if (d) setPromos(d.promos); setLoading(false); });
    } else if (tab === "referrals") {
      fetchData("referrals").then((d) => { if (d) setReferrals(d); setLoading(false); });
    } else {
      fetchData("transactions?limit=50").then((d) => { if (d) setTransactions(d.transactions); setLoading(false); });
    }
  }, [authed, token, tab, fetchData]);

  const logout = () => {
    localStorage.removeItem("admin_token");
    setToken("");
    setAuthed(false);
    setStats(null);
    setUsers([]);
    setTransactions([]);
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-extrabold text-center mb-6">Admin Panel</h1>
          <form onSubmit={login} className="bg-white rounded-2xl border border-text/5 p-6 space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Admin email" required
              className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" required
              className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm" />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" className="w-full bg-accent text-white py-3 rounded-xl font-bold text-sm hover:bg-accent/90">
              Войти
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold">Admin Dashboard</h1>
            <p className="text-text/40 text-sm">Stone AI — панель управления</p>
          </div>
          <button onClick={logout} className="text-sm text-text/40 hover:text-red-500 transition-colors">
            Выйти
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-bg rounded-xl p-1 mb-8 max-w-2xl overflow-x-auto">
          {([
            { id: "stats", label: "Статистика" },
            { id: "users", label: "Пользователи" },
            { id: "transactions", label: "Платежи" },
            { id: "promos", label: "Промокоды" },
            { id: "referrals", label: "Рефералы" },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${tab === t.id ? "bg-white text-text shadow-sm" : "text-text/40"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-text/40 text-sm">Загрузка...</p>}

        {/* Stats Tab */}
        {tab === "stats" && stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <StatCard label="Всего пользователей" value={stats.total_users.toLocaleString()} />
              <StatCard label="DAU сегодня" value={stats.dau.toLocaleString()} />
              <StatCard label="Запросов сегодня" value={stats.requests_today.toLocaleString()} />
              <StatCard label="Запросов за месяц" value={stats.requests_month.toLocaleString()} />
              <StatCard label="Выручка сегодня" value={`$${stats.revenue_today_usd}`} />
              <StatCard label="Выручка за месяц" value={`$${stats.revenue_month_usd}`} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Models */}
              <div className="bg-white rounded-2xl border border-text/5 p-6">
                <h3 className="font-bold mb-4">Топ-10 моделей</h3>
                <div className="space-y-2">
                  {stats.top_models.map((m, i) => (
                    <div key={m.model} className="flex items-center justify-between text-sm">
                      <span className="text-text/70">
                        <span className="text-text/30 w-5 inline-block">{i + 1}.</span> {m.model}
                      </span>
                      <span className="font-mono text-text/50">{m.requests.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="bg-white rounded-2xl border border-text/5 p-6">
                <h3 className="font-bold mb-4">Способы оплаты (месяц)</h3>
                <div className="space-y-2">
                  {stats.payment_breakdown.map((p) => (
                    <div key={p.method} className="flex items-center justify-between text-sm">
                      <span className="text-text/70">{p.method || "unknown"}</span>
                      <span className="font-mono text-text/50">{p.count} шт · ${p.total_usd}</span>
                    </div>
                  ))}
                  {stats.payment_breakdown.length === 0 && (
                    <p className="text-text/30 text-sm">Нет транзакций за этот месяц</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div className="bg-white rounded-2xl border border-text/5 overflow-hidden">
            <div className="p-4 border-b border-text/5">
              <span className="font-bold text-sm">Пользователи</span>
              <span className="text-text/40 text-sm ml-2">({usersTotal})</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg text-text/50 text-xs">
                    <th className="text-left py-2.5 px-4">ID</th>
                    <th className="text-left py-2.5 px-4">Имя</th>
                    <th className="text-left py-2.5 px-4">Email</th>
                    <th className="text-center py-2.5 px-4">Подписка</th>
                    <th className="text-right py-2.5 px-4">Баланс</th>
                    <th className="text-right py-2.5 px-4">Запросов</th>
                    <th className="text-left py-2.5 px-4">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-text/5 hover:bg-bg/50">
                      <td className="py-2.5 px-4 font-mono text-text/40">{u.tg_id || u.id}</td>
                      <td className="py-2.5 px-4">{u.first_name || u.username || "—"}</td>
                      <td className="py-2.5 px-4 text-text/50">{u.email || "—"}</td>
                      <td className="py-2.5 px-4 text-center">
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
                            } else {
                              alert("Ошибка смены тарифа");
                            }
                          }}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border-0 cursor-pointer ${
                            u.subscription_tier === "max-pro" ? "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700"
                            : u.subscription_tier === "max" ? "bg-accent/10 text-accent"
                            : u.subscription_tier === "mini" ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <option value="free">Free</option>
                          <option value="mini">Mini</option>
                          <option value="max">Max</option>
                          <option value="max-pro">Max Pro</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono">${u.balance_usd.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-mono">{u.total_requests}</td>
                      <td className="py-2.5 px-4 text-text/40 text-xs">{u.joined_at?.slice(0, 10) || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {tab === "transactions" && (
          <div className="bg-white rounded-2xl border border-text/5 overflow-hidden">
            <div className="p-4 border-b border-text/5">
              <span className="font-bold text-sm">Последние платежи</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-bg text-text/50 text-xs">
                    <th className="text-left py-2.5 px-4">ID</th>
                    <th className="text-left py-2.5 px-4">User</th>
                    <th className="text-right py-2.5 px-4">Сумма</th>
                    <th className="text-left py-2.5 px-4">Метод</th>
                    <th className="text-left py-2.5 px-4">Статус</th>
                    <th className="text-left py-2.5 px-4">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-t border-text/5 hover:bg-bg/50">
                      <td className="py-2.5 px-4 font-mono text-text/40">{t.id}</td>
                      <td className="py-2.5 px-4 font-mono text-text/50">{t.user_id}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold">${t.amount_usd.toFixed(2)}</td>
                      <td className="py-2.5 px-4">
                        <span className="bg-bg px-2 py-0.5 rounded text-xs">{t.currency}</span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`text-xs font-medium ${t.status === "completed" ? "text-teal" : t.status === "pending" ? "text-amber-500" : "text-red-500"}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-text/40 text-xs">{t.created_at?.slice(0, 16).replace("T", " ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Promos Tab */}
        {tab === "promos" && (
          <div className="space-y-4">
            {/* Create promo form */}
            <div className="bg-white rounded-2xl border border-text/5 p-5">
              <h3 className="font-bold text-sm mb-3">Создать промокод</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const fd = new FormData(form);
                const auth = localStorage.getItem("admin_token");
                if (!auth) return;
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
                }
              }} className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input name="code" placeholder="КОД" required className="bg-bg border border-text/10 rounded-lg px-3 py-2 text-xs font-mono uppercase" />
                <select name="type" className="bg-bg border border-text/10 rounded-lg px-3 py-2 text-xs">
                  <option value="days">Бесплатные дни</option>
                  <option value="credits">Кредиты</option>
                </select>
                <select name="tier" className="bg-bg border border-text/10 rounded-lg px-3 py-2 text-xs">
                  <option value="mini">Mini</option>
                  <option value="max">Max</option>
                  <option value="max-pro">Max Pro</option>
                </select>
                <input name="days" type="number" defaultValue={7} placeholder="Дней" className="bg-bg border border-text/10 rounded-lg px-3 py-2 text-xs" />
                <input name="credits" type="number" defaultValue={0} placeholder="Кредитов" className="bg-bg border border-text/10 rounded-lg px-3 py-2 text-xs" />
                <input name="max_uses" type="number" defaultValue={1000} placeholder="Макс. исп." className="bg-bg border border-text/10 rounded-lg px-3 py-2 text-xs" />
                <input name="desc" placeholder="Описание" className="bg-bg border border-text/10 rounded-lg px-3 py-2 text-xs col-span-2 sm:col-span-1" />
                <button type="submit" className="bg-accent text-white rounded-lg px-3 py-2 text-xs font-bold hover:bg-accent/90">
                  Создать
                </button>
              </form>
            </div>

            {/* Promo list */}
            {promos.map((p: any) => (
              <div key={p.code} className="bg-white rounded-2xl border border-text/5 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-lg text-accent">{p.code}</span>
                    <span className="bg-bg px-2 py-0.5 rounded text-xs text-text/50">{p.type}</span>
                    {p.tier !== "—" && <span className="bg-accent/10 text-accent px-2 py-0.5 rounded text-xs font-bold">{p.tier}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-2xl font-extrabold">{p.used}</span>
                      <span className="text-text/30 text-sm">/{p.max_uses}</span>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm(`Удалить промокод ${p.code}?`)) return;
                        const auth = localStorage.getItem("admin_token");
                        if (!auth) return;
                        await fetch(`${API_URL}/api/admin/web/promos/${p.code}`, {
                          method: "DELETE",
                          headers: { Authorization: `Bearer ${auth}` },
                        });
                        fetchData("promos").then((d: any) => { if (d) setPromos(d.promos); });
                      }}
                      className="text-red-400 hover:text-red-600 transition-colors"
                      title="Удалить"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-text/60 text-sm mb-2">{p.desc}</p>
                <div className="flex items-center gap-4 text-xs text-text/40">
                  {p.days > 0 && <span>{p.days} дней бесплатно</span>}
                  {p.credits > 0 && <span>+{p.credits} кредитов</span>}
                  <span>Использовано: {p.used} раз</span>
                </div>
                <div className="mt-3 h-1.5 bg-bg rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min(100, (p.used / p.max_uses) * 100)}%` }} />
                </div>
              </div>
            ))}
            {promos.length === 0 && <p className="text-text/30 text-sm text-center py-8">Нет промокодов</p>}
          </div>
        )}

        {/* Referrals Tab */}
        {tab === "referrals" && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <StatCard label="Всего приглашённых" value={referrals.total_referred_users.toString()} />
              <StatCard label="Рефереров с приглашёнными" value={referrals.referrers.length.toString()} />
            </div>

            <div className="bg-white rounded-2xl border border-text/5 overflow-hidden">
              <div className="p-4 border-b border-text/5">
                <span className="font-bold text-sm">Рефереры</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-bg text-text/50 text-xs">
                      <th className="text-left py-2.5 px-4">Пользователь</th>
                      <th className="text-left py-2.5 px-4">Код</th>
                      <th className="text-right py-2.5 px-4">Приглашённых</th>
                      <th className="text-right py-2.5 px-4">Заработано</th>
                      <th className="text-left py-2.5 px-4">Тариф</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.referrers.map((r: any) => (
                      <tr key={r.id} className="border-t border-text/5 hover:bg-bg/50">
                        <td className="py-2.5 px-4">{r.first_name || r.email || r.username || "—"}</td>
                        <td className="py-2.5 px-4 font-mono text-accent text-xs">{r.referral_code}</td>
                        <td className="py-2.5 px-4 text-right font-bold">{r.referral_count}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-teal">${r.referral_balance}</td>
                        <td className="py-2.5 px-4">
                          <span className="bg-bg px-2 py-0.5 rounded text-xs">{r.subscription_tier}</span>
                        </td>
                      </tr>
                    ))}
                    {referrals.referrers.length === 0 && (
                      <tr><td colSpan={5} className="py-8 text-center text-text/30 text-sm">Нет рефералов</td></tr>
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
