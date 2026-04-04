"use client";

import { useState, useEffect, useCallback } from "react";
import AuthFormComponent, { type AuthState } from "@/components/AuthForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

interface ReferralStats {
  referral_code: string;
  referral_count: number;
  referral_balance: number;
  referral_percent: number;
  referrals: { name: string; joined: string | null; deposited_usd: number }[];
}

export default function ReferralPage() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [applyCode, setApplyCode] = useState("");
  const [applyMsg, setApplyMsg] = useState("");
  const [applyErr, setApplyErr] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("stone_auth");
      if (saved) setAuth(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  const fetchStats = useCallback(async (token: string) => {
    try {
      // Ensure we have a referral code
      await fetch(`${API_URL}/api/referral/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Then fetch stats
      const res = await fetch(`${API_URL}/api/referral/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setStats(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    if (auth?.token) fetchStats(auth.token);
  }, [auth?.token, fetchStats]);

  const copyLink = () => {
    if (!stats?.referral_code) return;
    const link = `${window.location.origin}/webchat?ref=${stats.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const apply = async () => {
    if (!auth || !applyCode.trim()) return;
    setApplyMsg("");
    setApplyErr("");
    try {
      const res = await fetch(`${API_URL}/api/referral/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ code: applyCode.trim() }),
      });
      const data = await res.json();
      if (res.ok) { setApplyMsg(data.message); setApplyCode(""); }
      else setApplyErr(data.detail || "Ошибка");
    } catch { setApplyErr("Ошибка сети"); }
  };

  if (!loaded) return null;
  if (!auth) return <AuthFormComponent onAuth={setAuth} subtitle="Войдите для реферальной программы" />;

  const refLink = stats?.referral_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/webchat?ref=${stats.referral_code}`
    : "";

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-white border-b border-text/5">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-lg font-extrabold text-text">Stone AI</a>
          <div className="flex items-center gap-4">
            <a href="/dashboard/chat" className="text-xs text-accent font-semibold hover:underline">Чат</a>
            <a href="/pricing" className="text-xs text-text/40 hover:text-text">Пополнить</a>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            Реферальная программа
          </div>
          <h1 className="text-3xl font-extrabold mb-3">
            Приглашай друзей — получай <span className="text-accent">10%</span>
          </h1>
          <p className="text-text/50 max-w-md mx-auto">
            Делитесь ссылкой. Когда друг пополняет баланс, вы получаете 10% на свой счёт.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-text/5 p-5 text-center">
            <p className="text-2xl font-extrabold text-text">{stats?.referral_count ?? 0}</p>
            <p className="text-xs text-text/40 mt-1">Приглашённых</p>
          </div>
          <div className="bg-white rounded-2xl border border-text/5 p-5 text-center">
            <p className="text-2xl font-extrabold text-accent">${(stats?.referral_balance ?? 0).toFixed(2)}</p>
            <p className="text-xs text-text/40 mt-1">Заработано</p>
          </div>
          <div className="bg-white rounded-2xl border border-text/5 p-5 text-center">
            <p className="text-2xl font-extrabold text-teal">10%</p>
            <p className="text-xs text-text/40 mt-1">Комиссия</p>
          </div>
        </div>

        {/* Referral link */}
        <div className="bg-white rounded-2xl border border-text/5 p-6 mb-6">
          <h2 className="font-bold text-sm mb-3">Ваша реферальная ссылка</h2>
          {stats?.referral_code ? (
            <div className="flex gap-2">
              <input
                readOnly
                value={refLink}
                className="flex-1 bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-sm text-text/60 min-w-0"
              />
              <button
                onClick={copyLink}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm shrink-0 transition-colors ${
                  copied ? "bg-teal text-white" : "bg-accent text-white hover:bg-accent/90"
                }`}
              >
                {copied ? "Скопировано!" : "Копировать"}
              </button>
            </div>
          ) : (
            <p className="text-sm text-text/40">Загрузка...</p>
          )}
          <p className="text-xs text-text/30 mt-3">
            Код: <span className="font-mono font-bold text-text/50">{stats?.referral_code || "..."}</span>
          </p>
        </div>

        {/* Apply code */}
        <div className="bg-white rounded-2xl border border-text/5 p-6 mb-6">
          <h2 className="font-bold text-sm mb-3">Ввести реферальный код</h2>
          <div className="flex gap-2">
            <input
              value={applyCode}
              onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
              placeholder="Код друга (8 символов)"
              maxLength={8}
              className="flex-1 bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-sm font-mono uppercase min-w-0"
            />
            <button
              onClick={apply}
              disabled={!applyCode.trim()}
              className="px-5 py-2.5 rounded-xl font-bold text-sm bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-40 shrink-0"
            >
              Применить
            </button>
          </div>
          {applyMsg && <p className="text-xs text-teal mt-2">{applyMsg}</p>}
          {applyErr && <p className="text-xs text-red-500 mt-2">{applyErr}</p>}
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-text/5 p-6 mb-6">
          <h2 className="font-bold text-sm mb-4">Как это работает</h2>
          <div className="space-y-3">
            {[
              { num: "1", text: "Скопируйте реферальную ссылку и отправьте другу" },
              { num: "2", text: "Друг регистрируется по ссылке и пополняет баланс" },
              { num: "3", text: "Вы получаете 10% от каждого его пополнения на свой баланс" },
            ].map((s) => (
              <div key={s.num} className="flex items-start gap-3">
                <div className="w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center text-accent text-xs font-bold shrink-0">
                  {s.num}
                </div>
                <p className="text-sm text-text/60 pt-1">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Referrals list */}
        {stats && stats.referrals.length > 0 && (
          <div className="bg-white rounded-2xl border border-text/5 p-6">
            <h2 className="font-bold text-sm mb-4">Ваши рефералы</h2>
            <div className="space-y-2">
              {stats.referrals.map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-text/[0.03] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center text-accent font-bold text-xs">
                      {r.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.name}</p>
                      {r.joined && (
                        <p className="text-[10px] text-text/30">
                          {new Date(r.joined).toLocaleDateString("ru-RU")}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-text/40">
                    ${r.deposited_usd.toFixed(2)} внесено
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats && stats.referrals.length === 0 && (
          <div className="bg-white rounded-2xl border border-text/5 p-8 text-center">
            <p className="text-text/20 text-3xl mb-2">👥</p>
            <p className="text-sm text-text/30">Пока нет рефералов. Поделитесь ссылкой!</p>
          </div>
        )}
      </div>
    </div>
  );
}
