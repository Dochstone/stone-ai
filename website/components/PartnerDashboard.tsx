"use client";

import { useState, useEffect, useCallback } from "react";
import AuthFormComponent, { type AuthState } from "@/components/AuthForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";
const SITE = "https://stoneai.ru";

interface Referral {
  name: string;
  joined: string | null;
  deposited_usd: number;
  plan: string;
  requests: number;
}

interface Stats {
  referral_code: string;
  referral_count: number;
  referral_balance: number;
  referral_percent: number;
  is_partner: boolean;
  total_deposits_usd: number;
  paid_count: number;
  conversion_pct: number;
  referrals: Referral[];
}

const PLAN_LABELS: Record<string, { label: string; color: string }> = {
  free: { label: "Free", color: "bg-zinc-500/10 text-zinc-500" },
  mini: { label: "Start", color: "bg-blue-500/10 text-blue-500" },
  max: { label: "Pro", color: "bg-purple-500/10 text-purple-500" },
  "max-pro": { label: "Elite", color: "bg-amber-500/10 text-amber-600" },
};

export default function PartnerDashboard() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  // Link generator
  const [linkSource, setLinkSource] = useState("vk");
  const [linkMedium, setLinkMedium] = useState("cpc");
  const [linkCampaign, setLinkCampaign] = useState("");
  const [linkPage, setLinkPage] = useState("/");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("stone_auth");
      if (saved) setAuth(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  const fetchStats = useCallback(async (token: string) => {
    try {
      await fetch(`${API_URL}/api/referral/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const res = await fetch(`${API_URL}/api/referral/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.is_partner) {
          setError("Эта страница только для партнёров. Обратитесь в поддержку @StoneAIsupport для подключения.");
          return;
        }
        setStats(data);
      } else {
        setError("Не удалось загрузить данные");
      }
    } catch {
      setError("Ошибка сети");
    }
  }, []);

  useEffect(() => {
    if (auth?.token) fetchStats(auth.token);
  }, [auth?.token, fetchStats]);

  const generateLink = () => {
    if (!stats?.referral_code) return "";
    const params = new URLSearchParams();
    params.set("ref", stats.referral_code);
    if (linkSource) params.set("utm_source", linkSource);
    if (linkMedium) params.set("utm_medium", linkMedium);
    if (linkCampaign) params.set("utm_campaign", linkCampaign);
    const page = linkPage.startsWith("/") ? linkPage : `/${linkPage}`;
    return `${SITE}${page}?${params.toString()}`;
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  if (!loaded) return null;
  if (!auth) return <AuthFormComponent onAuth={setAuth} subtitle="Partner Dashboard" />;

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="bg-surface rounded-2xl border border-text/5 p-8 max-w-md text-center">
          <p className="text-2xl mb-3">🔒</p>
          <p className="text-text/60 text-sm">{error}</p>
          <a href="https://t.me/StoneAIsupport" target="_blank" rel="noopener noreferrer"
            className="inline-block mt-4 bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors">
            Написать в поддержку
          </a>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-text/30 text-sm">Загрузка...</p>
      </div>
    );
  }

  const link = generateLink();

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="bg-surface border-b border-text/5">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-lg font-extrabold text-text">Stone AI</a>
            <span className="bg-accent/10 text-accent text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">Partner</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/dashboard/chat" className="text-xs text-text/40 hover:text-text transition-colors">Chat</a>
            <button
              onClick={() => { localStorage.removeItem("stone_auth"); setAuth(null); }}
              className="text-xs text-text/30 hover:text-red-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <KPI label="Your %" value={`${stats.referral_percent}%`} accent />
          <KPI label="Registrations" value={stats.referral_count.toString()} />
          <KPI label="Paid users" value={stats.paid_count.toString()} />
          <KPI label="Conversion" value={`${stats.conversion_pct}%`} />
          <KPI label="Total deposits" value={`$${stats.total_deposits_usd.toFixed(2)}`} />
          <KPI label="Your earnings" value={`$${stats.referral_balance.toFixed(2)}`} accent />
        </div>

        {/* Referral Code */}
        <div className="bg-surface rounded-2xl border border-text/5 p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm">Your referral code</h2>
            <span className="font-mono font-bold text-accent text-lg">{stats.referral_code}</span>
          </div>
          <div className="flex gap-2">
            <input
              readOnly
              value={`${SITE}/?ref=${stats.referral_code}`}
              className="flex-1 bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-sm text-text/60 font-mono min-w-0"
            />
            <button
              onClick={() => copy(`${SITE}/?ref=${stats.referral_code}`, "link")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm shrink-0 transition-colors ${
                copied === "link" ? "bg-emerald-500 text-white" : "bg-accent text-white hover:bg-accent/90"
              }`}
            >
              {copied === "link" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Link Generator */}
        <div className="bg-surface rounded-2xl border border-text/5 p-6 mb-6">
          <h2 className="font-bold text-sm mb-4">UTM Link Generator</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div>
              <label className="text-[10px] font-semibold text-text/30 uppercase tracking-wider mb-1 block">Landing page</label>
              <select value={linkPage} onChange={(e) => setLinkPage(e.target.value)}
                className="w-full bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm">
                <option value="/">Main</option>
                <option value="/pricing">Pricing</option>
                <option value="/models">Models</option>
                <option value="/webchat">Chat</option>
                <option value="/dashboard/chat">Dashboard</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-text/30 uppercase tracking-wider mb-1 block">Source</label>
              <select value={linkSource} onChange={(e) => setLinkSource(e.target.value)}
                className="w-full bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm">
                <option value="vk">VK</option>
                <option value="telegram">Telegram</option>
                <option value="youtube">YouTube</option>
                <option value="instagram">Instagram</option>
                <option value="google">Google</option>
                <option value="yandex">Yandex</option>
                <option value="tiktok">TikTok</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-text/30 uppercase tracking-wider mb-1 block">Medium</label>
              <select value={linkMedium} onChange={(e) => setLinkMedium(e.target.value)}
                className="w-full bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm">
                <option value="cpc">CPC (реклама)</option>
                <option value="cpm">CPM (баннер)</option>
                <option value="social">Social (пост)</option>
                <option value="post">Post (статья)</option>
                <option value="video">Video</option>
                <option value="referral">Referral</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-text/30 uppercase tracking-wider mb-1 block">Campaign</label>
              <input value={linkCampaign} onChange={(e) => setLinkCampaign(e.target.value)}
                placeholder="my_campaign"
                className="w-full bg-bg border border-text/10 rounded-xl px-3 py-2.5 text-sm" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-xs text-text/50 font-mono break-all min-w-0 select-all">
              {link}
            </div>
            <button
              onClick={() => copy(link, "utm")}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm shrink-0 transition-colors ${
                copied === "utm" ? "bg-emerald-500 text-white" : "bg-accent text-white hover:bg-accent/90"
              }`}
            >
              {copied === "utm" ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* Referrals Table */}
        <div className="bg-surface rounded-2xl border border-text/5 overflow-hidden">
          <div className="px-6 py-4 border-b border-text/5 flex items-center justify-between">
            <h2 className="font-bold text-sm">Your referrals ({stats.referral_count})</h2>
            <button onClick={() => fetchStats(auth.token)}
              className="text-xs text-text/30 hover:text-accent transition-colors">
              Refresh
            </button>
          </div>

          {stats.referrals.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-text/30 text-sm">No referrals yet. Share your link!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-text/[0.02] text-text/40 text-[10px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 text-left font-semibold">User</th>
                    <th className="py-2.5 px-4 text-left font-semibold">Registered</th>
                    <th className="py-2.5 px-4 text-center font-semibold">Plan</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Deposited</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Your earn</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Requests</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.referrals.map((r, i) => {
                    const plan = PLAN_LABELS[r.plan] || PLAN_LABELS.free;
                    const earn = r.deposited_usd * stats.referral_percent / 100;
                    return (
                      <tr key={i} className="border-t border-text/[0.04] hover:bg-text/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-accent/10 rounded-full flex items-center justify-center text-accent font-bold text-[10px] shrink-0">
                              {r.name[0]?.toUpperCase()}
                            </div>
                            <span className="text-text/80 font-medium truncate max-w-[120px]">{r.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-text/40 text-xs">
                          {r.joined ? new Date(r.joined).toLocaleDateString("ru-RU") : "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${plan.color}`}>
                            {plan.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {r.deposited_usd > 0 ? (
                            <span className="text-emerald-500">${r.deposited_usd.toFixed(2)}</span>
                          ) : (
                            <span className="text-text/20">$0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {earn > 0 ? (
                            <span className="text-accent">${earn.toFixed(2)}</span>
                          ) : (
                            <span className="text-text/20">$0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right text-text/40">
                          {r.requests > 0 ? r.requests.toLocaleString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="mt-8 bg-surface rounded-2xl border border-text/5 p-6">
          <h2 className="font-bold text-sm mb-4">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { icon: "🔗", title: "Share link", desc: "Copy your UTM link and use in ads or posts" },
              { icon: "👤", title: "User registers", desc: "Referral code is auto-applied on signup" },
              { icon: "💳", title: "User pays", desc: "Any deposit or subscription counts" },
              { icon: "💰", title: `You earn ${stats.referral_percent}%`, desc: "Credited to your balance instantly" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className="font-bold text-sm mb-1">{s.title}</p>
                <p className="text-text/40 text-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="mt-6 text-center">
          <p className="text-text/20 text-xs">
            Questions? <a href="https://t.me/StoneAIsupport" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">@StoneAIsupport</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-surface rounded-2xl border border-text/5 p-4 text-center">
      <p className={`text-xl font-extrabold ${accent ? "text-accent" : "text-text"}`}>{value}</p>
      <p className="text-[10px] text-text/30 mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
}
