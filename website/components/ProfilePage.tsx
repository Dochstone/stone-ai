"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MODELS } from "@/lib/models";
import { SITE_URL } from "@/lib/constants";
import dynamic from "next/dynamic";

const TonWalletProfile = dynamic(() => import("./TonWalletProfile"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

// ─── Types ───

interface AuthState {
  token: string;
  email: string;
  balanceUsd: number;
}

interface UserProfile {
  id: number;
  email: string;
  username: string | null;
  first_name: string | null;
  telegram_id: number | null;
  balance_usd: number;
  plan: string;
  auth_provider: string;
  total_deposited_usd: number;
  created_at: string;
  stats: { total_requests: number; total_tokens: number };
}

interface UsageItem {
  model_id: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  created_at: string;
}

interface Transaction {
  amount_usd: number;
  amount: number;
  currency: string;
  status: string;
  product_type: string;
  created_at: string;
}

interface ReferralStats {
  referral_code: string;
  referral_count: number;
  referral_balance: number;
  referral_percent: number;
  referrals: { name: string; joined: string; deposited_usd: number }[];
}

interface ByokStatus {
  enabled: boolean;
  key_masked: string;
}

type Tab = "overview" | "balance" | "history" | "settings" | "referrals" | "api";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Обзор", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { id: "balance", label: "Подписка", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "history", label: "История", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "settings", label: "Настройки", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { id: "referrals", label: "Рефералы", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
  { id: "api", label: "API", icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" },
];

// ─── Helpers ───

function getInitials(email: string, name?: string | null): string {
  if (name) return name.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function getAvatarColor(email: string): string {
  const colors = ["#C4623D", "#0E9A83", "#4285f4", "#7c3aed", "#ec4899", "#f59e0b", "#06b6d4", "#10a37f"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function authProviderLabel(p: string): string {
  if (p === "google") return "Google";
  if (p === "yandex") return "Яндекс";
  if (p === "telegram") return "Telegram";
  if (p === "both") return "Email + Telegram";
  return "Email";
}

// ─── StatCard ───

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-text/[0.06] p-5">
      <div className="text-[11px] font-semibold text-text/35 uppercase tracking-wider mb-2">{label}</div>
      <div className={`text-2xl font-extrabold ${accent ? "text-accent" : "text-text"}`}>{value}</div>
      {sub && <div className="text-[11px] text-text/30 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Bar Chart (CSS) ───

function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 0.01);
  return (
    <div className="bg-white rounded-2xl border border-text/[0.06] p-5">
      <div className="text-[11px] font-semibold text-text/35 uppercase tracking-wider mb-4">Расходы за 7 дней</div>
      <div className="flex items-end gap-2 h-32">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-text/30 font-medium">${d.value.toFixed(2)}</span>
            <div className="w-full relative rounded-t-lg overflow-hidden bg-accent/10" style={{ height: "100%" }}>
              <div
                className="absolute bottom-0 left-0 right-0 bg-accent rounded-t-lg transition-all duration-500"
                style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 4 : 0 }}
              />
            </div>
            <span className="text-[9px] text-text/25">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Overview ───

function OverviewTab({ profile, usage }: { profile: UserProfile; usage: UsageItem[] }) {
  // Favorite model
  const modelCounts: Record<string, number> = {};
  usage.forEach((u) => { modelCounts[u.model_id] = (modelCounts[u.model_id] || 0) + 1; });
  const favModelId = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const favModel = MODELS.find((m) => m.id === favModelId);

  // Monthly spend
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthSpend = usage
    .filter((u) => new Date(u.created_at) >= monthStart)
    .reduce((s, u) => s + u.cost_usd, 0);

  // Last 7 days chart
  const days: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString("ru-RU", { weekday: "short" });
    const daySpend = usage
      .filter((u) => u.created_at.slice(0, 10) === key)
      .reduce((s, u) => s + u.cost_usd, 0);
    days.push({ label: dayLabel, value: daySpend });
  }

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-text/[0.06] p-6 flex items-center gap-5">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: getAvatarColor(profile.email) }}
        >
          <span className="text-xl font-bold text-white">{getInitials(profile.email, profile.first_name)}</span>
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold text-text truncate">
            {profile.first_name || profile.username || profile.email.split("@")[0]}
          </h2>
          <p className="text-sm text-text/40">{profile.email}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
              {authProviderLabel(profile.auth_provider)}
            </span>
            <span className="text-[10px] text-text/25">
              С {formatDate(profile.created_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Тариф" value={profile.plan === "max-pro" ? "Max Pro" : profile.plan === "max" ? "Max" : profile.plan === "mini" ? "Mini" : "Free"} accent />
        <StatCard label="Запросов" value={profile.stats.total_requests.toLocaleString()} />
        <StatCard label="Всего запросов" value={profile.stats.total_requests.toLocaleString()} />
        <StatCard label="Любимая модель" value={favModel?.name || "—"} sub={favModel?.company} />
      </div>

      {/* Chart */}
      <BarChart data={days} />
    </div>
  );
}

// ─── Tab: Balance ───

function BalanceTab({ profile, transactions }: { profile: UserProfile; transactions: Transaction[] }) {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = transactions.filter((t) => {
    if (dateFrom && t.created_at < dateFrom) return false;
    if (dateTo && t.created_at.slice(0, 10) > dateTo) return false;
    return true;
  });

  const methodLabel = (t: Transaction): string => {
    const c = t.currency?.toLowerCase() || "";
    if (c === "stars" || t.product_type === "stars") return "Stars";
    if (c === "ton") return "TON";
    if (c === "rub") return "Рубли";
    if (["usdt", "btc", "eth"].includes(c)) return "Heleket";
    return t.product_type || "—";
  };

  const statusColor = (s: string) => {
    if (s === "completed" || s === "success") return "text-teal bg-teal-light";
    if (s === "pending") return "text-yellow-600 bg-yellow-50";
    return "text-red-500 bg-red-50";
  };

  return (
    <div className="space-y-6">
      {/* Subscription hero */}
      <div className="bg-white rounded-2xl border border-text/[0.06] p-8 text-center">
        <div className="text-[11px] font-semibold text-text/35 uppercase tracking-wider mb-2">Текущий тариф</div>
        <div className="text-4xl font-extrabold text-accent mb-4">
          {profile.plan === "max-pro" ? "Max Pro" : profile.plan === "max" ? "Max" : profile.plan === "mini" ? "Mini" : "Free"}
        </div>
        <a
          href="/pricing"
          className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors"
        >
          {profile.plan === "free" ? "Выбрать тариф" : profile.plan === "mini" ? "Улучшить тариф" : "Сменить тариф"}
        </a>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11px] font-semibold text-text/30 uppercase">Фильтр</span>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="bg-white border border-text/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent" />
        <span className="text-text/20">—</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="bg-white border border-text/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent" />
      </div>

      {/* Transaction table */}
      <div className="bg-white rounded-2xl border border-text/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-text/[0.06] text-left">
                <th className="px-5 py-3 text-[10px] font-semibold text-text/30 uppercase">Дата</th>
                <th className="px-5 py-3 text-[10px] font-semibold text-text/30 uppercase">Сумма</th>
                <th className="px-5 py-3 text-[10px] font-semibold text-text/30 uppercase">Метод</th>
                <th className="px-5 py-3 text-[10px] font-semibold text-text/30 uppercase">Статус</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-text/20 text-xs">Нет транзакций</td></tr>
              )}
              {filtered.map((t, i) => (
                <tr key={i} className="border-b border-text/[0.03] hover:bg-bg/50 transition-colors">
                  <td className="px-5 py-3 text-text/60 text-xs">{formatDateTime(t.created_at)}</td>
                  <td className="px-5 py-3 font-bold text-teal">${t.amount_usd.toFixed(2)}</td>
                  <td className="px-5 py-3 text-xs text-text/60">{methodLabel(t)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: History ───

function HistoryTab({ usage }: { usage: UsageItem[] }) {
  const [modelFilter, setModelFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = usage.filter((u) => {
    if (modelFilter && u.model_id !== modelFilter) return false;
    if (dateFrom && u.created_at < dateFrom) return false;
    if (dateTo && u.created_at.slice(0, 10) > dateTo) return false;
    return true;
  });

  const totalCost = filtered.reduce((s, u) => s + u.cost_usd, 0);
  const totalTokens = filtered.reduce((s, u) => s + u.tokens_in + u.tokens_out, 0);
  const usedModelIds = Array.from(new Set(usage.map((u) => u.model_id)));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <select value={modelFilter} onChange={(e) => setModelFilter(e.target.value)}
          className="bg-white border border-text/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent">
          <option value="">Все модели</option>
          {usedModelIds.map((id) => (
            <option key={id} value={id}>{MODELS.find((m) => m.id === id)?.name || id}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
          className="bg-white border border-text/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent" />
        <span className="text-text/20">—</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="bg-white border border-text/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent" />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Запросов" value={filtered.length.toLocaleString()} />
        <StatCard label="Токенов" value={totalTokens.toLocaleString()} />
        <StatCard label="Потрачено" value={`$${totalCost.toFixed(2)}`} accent />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-text/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-text/[0.06] text-left">
                <th className="px-3 sm:px-5 py-3 text-[10px] font-semibold text-text/30 uppercase">Дата</th>
                <th className="px-3 sm:px-5 py-3 text-[10px] font-semibold text-text/30 uppercase">Модель</th>
                <th className="px-3 sm:px-5 py-3 text-[10px] font-semibold text-text/30 uppercase text-right hidden sm:table-cell">Input</th>
                <th className="px-3 sm:px-5 py-3 text-[10px] font-semibold text-text/30 uppercase text-right hidden sm:table-cell">Output</th>
                <th className="px-3 sm:px-5 py-3 text-[10px] font-semibold text-text/30 uppercase text-right">Стоимость</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-text/20 text-xs">Нет запросов</td></tr>
              )}
              {filtered.map((u, i) => {
                const model = MODELS.find((m) => m.id === u.model_id);
                return (
                  <tr key={i} className="border-b border-text/[0.03] hover:bg-bg/50 transition-colors">
                    <td className="px-3 sm:px-5 py-3 text-text/60 text-xs">{formatDateTime(u.created_at)}</td>
                    <td className="px-3 sm:px-5 py-3 text-xs font-medium text-text truncate max-w-[120px] sm:max-w-none">{model?.name || u.model_id}</td>
                    <td className="px-3 sm:px-5 py-3 text-xs text-text/40 text-right hidden sm:table-cell">{u.tokens_in.toLocaleString()}</td>
                    <td className="px-3 sm:px-5 py-3 text-xs text-text/40 text-right hidden sm:table-cell">{u.tokens_out.toLocaleString()}</td>
                    <td className="px-3 sm:px-5 py-3 text-xs font-bold text-accent text-right">${u.cost_usd.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Settings ───

function SettingsTab({ profile, auth }: { profile: UserProfile; auth: AuthState }) {
  const [displayName, setDisplayName] = useState(profile.first_name || "");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [language, setLanguage] = useState("ru");
  const [theme, setTheme] = useState("light");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [maxTokens, setMaxTokens] = useState(4096);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Load settings from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem("stone_settings");
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.theme) setTheme(parsed.theme);
        if (parsed.systemPrompt) setSystemPrompt(parsed.systemPrompt);
        if (parsed.maxTokens) setMaxTokens(parsed.maxTokens);
      }
    } catch {}
  }, []);

  const saveSettings = () => {
    localStorage.setItem("stone_settings", JSON.stringify({ language, theme, systemPrompt, maxTokens }));
    setMsg("Настройки сохранены");
    setTimeout(() => setMsg(""), 2000);
  };

  const changePassword = async () => {
    if (!newPass || newPass.length < 8) { setMsg("Пароль минимум 8 символов"); return; }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ old_password: oldPass, new_password: newPass }),
      });
      if (res.ok) {
        setMsg("Пароль изменён");
        setOldPass("");
        setNewPass("");
      } else {
        const err = await res.json().catch(() => ({ detail: "Ошибка" }));
        setMsg(err.detail || "Ошибка");
      }
    } catch {
      setMsg("Ошибка соединения");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const linkTelegram = () => {
    window.open("https://t.me/drifttt55bot?start=link_" + profile.id, "_blank");
  };

  const linkGoogle = () => {
    window.location.href = `/auth/google/callback?link=true`;
  };

  const linkYandex = () => {
    window.location.href = `/auth/yandex/callback?link=true`;
  };

  return (
    <div className="space-y-6">
      {msg && (
        <div className="bg-teal-light text-teal px-4 py-2.5 rounded-xl text-sm font-medium">{msg}</div>
      )}

      {/* Display name */}
      <div className="bg-white rounded-2xl border border-text/[0.06] p-6">
        <h3 className="text-sm font-bold text-text mb-4">Профиль</h3>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-text/35 uppercase block mb-1">Отображаемое имя</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-text/35 uppercase block mb-1">Email</label>
            <input value={profile.email} disabled
              className="w-full bg-bg/50 border border-text/5 rounded-xl px-4 py-2.5 text-sm text-text/40" />
          </div>
        </div>
      </div>

      {/* Password (only for email auth) */}
      {(profile.auth_provider === "email" || profile.auth_provider === "both") && (
        <div className="bg-white rounded-2xl border border-text/[0.06] p-6">
          <h3 className="text-sm font-bold text-text mb-4">Смена пароля</h3>
          <div className="space-y-3 max-w-sm">
            <input type="password" placeholder="Текущий пароль" value={oldPass} onChange={(e) => setOldPass(e.target.value)}
              className="w-full bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" />
            <input type="password" placeholder="Новый пароль (мин. 8 символов)" value={newPass} onChange={(e) => setNewPass(e.target.value)}
              className="w-full bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" />
            <button onClick={changePassword} disabled={saving}
              className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors disabled:opacity-50">
              Сменить пароль
            </button>
          </div>
        </div>
      )}

      {/* Link accounts */}
      <div className="bg-white rounded-2xl border border-text/[0.06] p-6">
        <h3 className="text-sm font-bold text-text mb-4">Привязка аккаунтов</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">T</span>
              </div>
              <div>
                <div className="text-sm font-medium text-text">Telegram</div>
                <div className="text-[11px] text-text/30">{profile.telegram_id ? `ID: ${profile.telegram_id}` : "Не привязан"}</div>
              </div>
            </div>
            {!profile.telegram_id && (
              <button onClick={linkTelegram}
                className="text-xs font-semibold text-accent hover:underline">Привязать</button>
            )}
          </div>
          <div className="flex items-center justify-between py-2 border-t border-text/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-red-500">G</span>
              </div>
              <div>
                <div className="text-sm font-medium text-text">Google</div>
                <div className="text-[11px] text-text/30">{profile.auth_provider === "google" ? "Привязан" : "Не привязан"}</div>
              </div>
            </div>
            {profile.auth_provider !== "google" && (
              <button onClick={linkGoogle}
                className="text-xs font-semibold text-accent hover:underline">Привязать</button>
            )}
          </div>
          <div className="flex items-center justify-between py-2 border-t border-text/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-yellow-600">Я</span>
              </div>
              <div>
                <div className="text-sm font-medium text-text">Яндекс</div>
                <div className="text-[11px] text-text/30">{profile.auth_provider === "yandex" ? "Привязан" : "Не привязан"}</div>
              </div>
            </div>
            {profile.auth_provider !== "yandex" && (
              <button onClick={linkYandex}
                className="text-xs font-semibold text-accent hover:underline">Привязать</button>
            )}
          </div>
          {/* TON Wallet */}
          <TonWalletProfile />
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white rounded-2xl border border-text/[0.06] p-6">
        <h3 className="text-sm font-bold text-text mb-4">Настройки чата</h3>
        <div className="space-y-4">
          {/* Language */}
          <div>
            <label className="text-[11px] font-semibold text-text/35 uppercase block mb-1">Язык</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}
              className="bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent">
              <option value="ru">Русский</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
            </select>
          </div>

          {/* Theme */}
          <div>
            <label className="text-[11px] font-semibold text-text/35 uppercase block mb-1">Тема</label>
            <div className="flex gap-2">
              <button onClick={() => setTheme("light")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${theme === "light" ? "bg-accent text-white" : "bg-bg text-text/40 hover:text-text/60"}`}>
                Светлая
              </button>
              <button onClick={() => setTheme("dark")}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${theme === "dark" ? "bg-text text-white" : "bg-bg text-text/40 hover:text-text/60"}`}>
                Тёмная
              </button>
            </div>
            {theme === "dark" && <p className="text-[10px] text-text/25 mt-1">Тёмная тема скоро будет доступна</p>}
          </div>

          {/* System prompt */}
          <div>
            <label className="text-[11px] font-semibold text-text/35 uppercase block mb-1">Системный промт</label>
            <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Инструкции для AI, отправляемые с каждым запросом..."
              rows={3}
              className="w-full bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-accent" />
          </div>

          {/* Max tokens slider */}
          <div>
            <label className="text-[11px] font-semibold text-text/35 uppercase block mb-1">
              Max tokens: <span className="text-accent">{maxTokens}</span>
            </label>
            <input type="range" min={512} max={8192} step={256} value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              className="w-full max-w-sm accent-accent" />
            <div className="flex justify-between text-[9px] text-text/20 max-w-sm">
              <span>512</span><span>4096</span><span>8192</span>
            </div>
          </div>

          <button onClick={saveSettings}
            className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors">
            Сохранить настройки
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Referrals ───

function ReferralsTab({ stats, loading }: { stats: ReferralStats | null; loading: boolean }) {
  const [copied, setCopied] = useState(false);

  if (loading || !stats) {
    return <div className="text-center py-12 text-text/25 text-sm">Загрузка...</div>;
  }

  const refLink = `${SITE_URL}/webchat?ref=${stats.referral_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(refLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(refLink)}&bgcolor=FAF9F5&color=1A1916`;

  return (
    <div className="space-y-6">
      {/* Ref link + QR */}
      <div className="bg-white rounded-2xl border border-text/[0.06] p-6">
        <h3 className="text-sm font-bold text-text mb-4">Ваша реферальная ссылка</h3>
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 mb-3">
              <input value={refLink} readOnly
                className="flex-1 bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-xs text-text/60 focus:outline-none min-w-0" />
              <button onClick={copyLink}
                className="shrink-0 bg-accent text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-accent/90 transition-colors">
                {copied ? "Скопировано!" : "Копировать"}
              </button>
            </div>
            <div className="space-y-1.5">
              <p className="text-[11px] text-teal font-semibold">
                Вы и ваш друг получаете +5 запросов при регистрации по ссылке
              </p>
              <p className="text-[11px] text-text/30">
                + {stats.referral_percent}% от каждого пополнения приглашённого пользователя
              </p>
            </div>
          </div>
          <img src={qrUrl} alt="QR" width={120} height={120} className="rounded-xl border border-text/[0.06] shrink-0" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Приглашено" value={stats.referral_count.toString()} />
        <StatCard label="Заработано" value={`$${stats.referral_balance.toFixed(2)}`} accent />
        <StatCard label="Процент" value={`${stats.referral_percent}%`} />
      </div>

      {/* Referrals table */}
      <div className="bg-white rounded-2xl border border-text/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-text/[0.06] text-left">
                <th className="px-5 py-3 text-[10px] font-semibold text-text/30 uppercase">Пользователь</th>
                <th className="px-5 py-3 text-[10px] font-semibold text-text/30 uppercase">Дата</th>
                <th className="px-5 py-3 text-[10px] font-semibold text-text/30 uppercase text-right">Принёс $</th>
              </tr>
            </thead>
            <tbody>
              {stats.referrals.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-text/20 text-xs">Пока никого не пригласили</td></tr>
              )}
              {stats.referrals.map((r, i) => (
                <tr key={i} className="border-b border-text/[0.03] hover:bg-bg/50 transition-colors">
                  <td className="px-5 py-3 text-xs font-medium text-text">{r.name || "—"}</td>
                  <td className="px-5 py-3 text-xs text-text/40">{formatDate(r.joined)}</td>
                  <td className="px-5 py-3 text-xs font-bold text-accent text-right">${r.deposited_usd.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: API ───

function ApiTab({ byok, auth, onRefreshByok }: { byok: ByokStatus | null; auth: AuthState; onRefreshByok: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [keyCopied, setKeyCopied] = useState(false);
  const [curlCopied, setCurlCopied] = useState(false);

  const setKey = async () => {
    if (!apiKey.startsWith("sk-or-")) { setMsg("Ключ должен начинаться с sk-or-"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/byok/key`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ key: apiKey }),
      });
      if (res.ok) {
        setMsg("Ключ установлен");
        setApiKey("");
        onRefreshByok();
      } else {
        const err = await res.json().catch(() => ({ detail: "Ошибка" }));
        setMsg(err.detail || "Ошибка");
      }
    } catch {
      setMsg("Ошибка соединения");
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const revokeKey = async () => {
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/byok/key`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setMsg("Ключ удалён");
      onRefreshByok();
    } catch {
      setMsg("Ошибка");
    } finally {
      setLoading(false);
      setTimeout(() => setMsg(""), 3000);
    }
  };

  const curlExample = `curl -X POST ${API_URL}/api/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "model_id": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`;

  const copyToken = () => {
    navigator.clipboard.writeText(auth.token);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(curlExample);
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {msg && (
        <div className="bg-teal-light text-teal px-4 py-2.5 rounded-xl text-sm font-medium">{msg}</div>
      )}

      {/* API Token */}
      <div className="bg-white rounded-2xl border border-text/[0.06] p-6">
        <h3 className="text-sm font-bold text-text mb-1">API Token</h3>
        <p className="text-[11px] text-text/30 mb-4">Используйте этот токен для доступа к API Stone AI.</p>
        <div className="flex gap-2">
          <input value={auth.token.slice(0, 20) + "..."} readOnly
            className="flex-1 bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-xs text-text/40 font-mono focus:outline-none min-w-0" />
          <button onClick={copyToken}
            className="shrink-0 bg-accent text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-accent/90 transition-colors">
            {keyCopied ? "Скопировано!" : "Копировать"}
          </button>
        </div>
      </div>

      {/* BYOK */}
      <div className="bg-white rounded-2xl border border-text/[0.06] p-6">
        <h3 className="text-sm font-bold text-text mb-1">BYOK — Свой ключ OpenRouter</h3>
        <p className="text-[11px] text-text/30 mb-4">Используйте свой ключ OpenRouter для снижения стоимости.</p>

        {byok?.enabled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-teal-light/50 rounded-xl px-4 py-3">
              <svg className="w-5 h-5 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <div className="text-sm font-medium text-teal">Ключ активен</div>
                <div className="text-[11px] text-text/40 font-mono">{byok.key_masked}</div>
              </div>
            </div>
            <button onClick={revokeKey} disabled={loading}
              className="text-xs text-red-500 font-semibold hover:underline disabled:opacity-50">
              Удалить ключ
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input value={apiKey} onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-or-..."
              className="flex-1 bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:border-accent min-w-0" />
            <button onClick={setKey} disabled={loading || !apiKey}
              className="shrink-0 bg-accent text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-accent/90 transition-colors disabled:opacity-50">
              Установить
            </button>
          </div>
        )}
      </div>

      {/* curl example */}
      <div className="bg-white rounded-2xl border border-text/[0.06] p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-text">Пример запроса</h3>
          <button onClick={copyCurl}
            className="text-[10px] text-accent font-semibold hover:underline">
            {curlCopied ? "Скопировано!" : "Копировать"}
          </button>
        </div>
        <pre className="bg-[#1C1C1E] rounded-xl p-4 overflow-x-auto">
          <code className="text-[12px] text-white/80 font-mono whitespace-pre">{curlExample}</code>
        </pre>
        <div className="mt-3">
          <a href="/docs" className="text-xs font-semibold text-accent hover:underline">
            Полная документация API →
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main ProfilePage ───

export default function ProfilePage() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usage, setUsage] = useState<UsageItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [byok, setByok] = useState<ByokStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Load auth
  useEffect(() => {
    try {
      const saved = localStorage.getItem("stone_auth");
      if (saved) setAuth(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!auth) return;
    setLoading(true);
    const headers = { Authorization: `Bearer ${auth.token}` };

    try {
      const [profileRes, usageRes, txRes, refRes, byokRes] = await Promise.allSettled([
        fetch(`${API_URL}/api/user/me`, { headers }),
        fetch(`${API_URL}/api/user/usage-history?limit=100`, { headers }),
        fetch(`${API_URL}/api/user/transactions?limit=100`, { headers }),
        fetch(`${API_URL}/api/referral/stats`, { headers }),
        fetch(`${API_URL}/api/byok/status`, { headers }),
      ]);

      if (profileRes.status === "fulfilled" && profileRes.value.ok) {
        const data = await profileRes.value.json();
        const u = data.user || data;
        setProfile({
          id: u.id || 0,
          email: u.email || auth.email,
          username: u.username || null,
          first_name: u.first_name || null,
          telegram_id: u.telegram_id || null,
          balance_usd: u.balance_usd || 0,
          plan: u.plan || "free",
          auth_provider: u.auth_provider || "email",
          total_deposited_usd: data.total_deposited_usd || u.total_deposited_usd || 0,
          created_at: u.created_at || new Date().toISOString(),
          stats: data.stats || u.stats || { total_requests: 0, total_tokens: 0 },
        });
      }

      if (usageRes.status === "fulfilled" && usageRes.value.ok) {
        const data = await usageRes.value.json();
        setUsage(Array.isArray(data) ? data : data.usage || data.items || []);
      }

      if (txRes.status === "fulfilled" && txRes.value.ok) {
        const data = await txRes.value.json();
        setTransactions(Array.isArray(data) ? data : data.transactions || data.items || []);
      }

      if (refRes.status === "fulfilled" && refRes.value.ok) {
        setReferralStats(await refRes.value.json());
      }

      if (byokRes.status === "fulfilled" && byokRes.value.ok) {
        setByok(await byokRes.value.json());
      }
    } catch {}
    setLoading(false);
  }, [auth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const refreshByok = useCallback(async () => {
    if (!auth) return;
    try {
      const res = await fetch(`${API_URL}/api/byok/status`, { headers: { Authorization: `Bearer ${auth.token}` } });
      if (res.ok) setByok(await res.json());
    } catch {}
  }, [auth]);

  const logout = () => {
    localStorage.removeItem("stone_auth");
    window.location.href = "/";
  };

  if (!loaded) return null;

  if (!auth) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-text mb-3">Личный кабинет</h1>
          <p className="text-sm text-text/40 mb-6">Войдите, чтобы управлять профилем</p>
          <a href="/webchat" className="bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors">
            Войти
          </a>
        </div>
      </div>
    );
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-text/30">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pt-20 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-text">Личный кабинет</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto mb-8 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
                tab === t.id
                  ? "bg-accent text-white shadow-sm"
                  : "text-text/40 hover:text-text/60 hover:bg-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
              </svg>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold whitespace-nowrap transition-colors shrink-0 text-text/30 hover:bg-red-50 hover:text-red-500"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>

        {/* Tab content */}
        {tab === "overview" && <OverviewTab profile={profile} usage={usage} />}
        {tab === "balance" && <BalanceTab profile={profile} transactions={transactions} />}
        {tab === "history" && <HistoryTab usage={usage} />}
        {tab === "settings" && <SettingsTab profile={profile} auth={auth} />}
        {tab === "referrals" && <ReferralsTab stats={referralStats} loading={loading} />}
        {tab === "api" && <ApiTab byok={byok} auth={auth} onRefreshByok={refreshByok} />}

      </div>
    </div>
  );
}
