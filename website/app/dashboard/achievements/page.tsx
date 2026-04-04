"use client";

import { useState, useEffect } from "react";
import { SkeletonAchievements } from "@/components/Skeleton";
import { getAuth, API_URL } from "@/lib/auth";

interface Ach {
  slug: string; title: string; description: string; icon: string;
  category: string; target: number; progress: number;
  is_completed: boolean; completed_at: string | null; reward_rub: number;
  reward_claimed: boolean;
}

const CATS = [
  { id: "all", label: "Все" },
  { id: "generation", label: "Генерация" },
  { id: "streak", label: "Серии" },
  { id: "milestone", label: "Вехи" },
  { id: "social", label: "Социальное" },
];

const CONFETTI = ["#C4623D", "#0E9A83", "#f59e0b", "#7c3aed", "#ec4899", "#06b6d4"];

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Ach[]>([]);
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [cat, setCat] = useState("all");
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ icon: string; title: string; reward: number } | null>(null);

  const [fetching, setFetching] = useState(false);
  const fetchAchs = () => {
    if (fetching) return;
    const auth = getAuth();
    if (!auth?.token) { setLoading(false); return; }
    setFetching(true);
    fetch(`${API_URL}/api/achievements/`, { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(r => r.json())
      .then(data => {
        setAchievements(data.achievements || []);
        setTotal(data.total || 0);
        setCompleted(data.completed || 0);
      })
      .catch((e) => { console.error("Failed to load achievements:", e); })
      .finally(() => { setLoading(false); setFetching(false); });
  };

  useEffect(() => { fetchAchs(); }, []);

  const claimReward = async (slug: string) => {
    const auth = getAuth();
    if (!auth?.token) return;
    setClaiming(slug);
    try {
      const res = await fetch(`${API_URL}/api/achievements/${slug}/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const ach = achievements.find(a => a.slug === slug);
        setPopup({ icon: ach?.icon || "🎉", title: ach?.title || "", reward: data.reward_rub });
        setAchievements(prev => prev.map(a => a.slug === slug ? { ...a, reward_claimed: true } : a));
      }
    } catch {}
    setClaiming(null);
  };

  const filtered = cat === "all" ? achievements : achievements.filter(a => a.category === cat);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const claimable = achievements.filter(a => a.is_completed && !a.reward_claimed && a.reward_rub > 0).length;

  return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text">Достижения</h1>
            <p className="text-sm text-text/40 mt-1">
              {completed} из {total} получено
              {claimable > 0 && (
                <span className="ml-2 text-accent font-bold animate-pulse">{claimable} наград к получению!</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-accent">{pct}%</div>
            <div className="w-24 h-2 bg-text/10 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {!getAuth() && (
          <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-text/60">Войдите, чтобы использовать все функции</p>
            <a href="/dashboard/chat" className="bg-accent text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors shrink-0">Войти</a>
          </div>
        )}

        {/* Category filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          {CATS.map(c => (
            <button key={c.id} onClick={() => setCat(c.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                cat === c.id ? "bg-accent text-white" : "bg-text/[0.04] text-text/50 hover:text-text/70"
              }`}>
              {c.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <SkeletonAchievements count={8} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-fadeIn">
            {filtered.map(a => {
              const canClaim = a.is_completed && !a.reward_claimed && a.reward_rub > 0;
              const claimed = a.is_completed && (a.reward_claimed || a.reward_rub === 0);
              return (
                <div key={a.slug} role="group" aria-label={a.title} tabIndex={0} className={`relative border rounded-2xl p-4 text-center transition-all flex flex-col ${
                  canClaim
                    ? "bg-accent/5 border-accent/30 ring-2 ring-accent/20 ring-offset-1"
                    : a.is_completed
                      ? "bg-accent/5 border-accent/20"
                      : "bg-text/[0.02] border-text/5 opacity-60"
                }`}>
                  <span className={`text-3xl block mb-2 ${a.is_completed ? "" : "grayscale"}`}>{a.icon}</span>
                  <h3 className="text-xs font-bold text-text mb-0.5">{a.title}</h3>
                  <p className="text-[10px] text-text/40 mb-2 line-clamp-2">{a.description}</p>

                  {/* Progress bar */}
                  {!a.is_completed && a.target > 1 && (
                    <div className="w-full h-1.5 bg-text/10 rounded-full mb-1 overflow-hidden">
                      <div className="h-full bg-accent/50 rounded-full transition-all" style={{ width: `${Math.min(100, (a.progress / a.target) * 100)}%` }} />
                    </div>
                  )}

                  {!a.is_completed && a.target > 1 && (
                    <p className="text-[9px] text-text/25 mb-1">{a.progress} / {a.target}</p>
                  )}

                  {/* Spacer to push button to bottom */}
                  <div className="flex-1" />

                  {/* Unified button — always present, different states */}
                  {canClaim ? (
                    <button
                      onClick={() => claimReward(a.slug)}
                      disabled={claiming === a.slug}
                      className="mt-2 w-full py-2 rounded-lg bg-accent text-white text-[11px] font-bold hover:bg-accent/90 transition-all disabled:opacity-50 animate-pulse"
                    >
                      {claiming === a.slug ? "..." : `Забрать +${a.reward_rub}₽`}
                    </button>
                  ) : claimed ? (
                    <div className="mt-2 w-full py-2 rounded-lg bg-accent/10 text-accent text-[11px] font-bold">
                      {a.reward_rub > 0 ? `Получено +${a.reward_rub}₽` : "Выполнено"}
                    </div>
                  ) : (
                    <div className="mt-2 w-full py-2 rounded-lg bg-text/[0.04] text-text/25 text-[11px] font-medium">
                      {a.reward_rub > 0 ? `Награда +${a.reward_rub}₽` : "В процессе"}
                    </div>
                  )}

                  {/* Reward badge */}
                  {a.reward_rub > 0 && (
                    <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      a.reward_claimed ? "bg-accent/10 text-accent" : canClaim ? "bg-accent text-white" : "bg-text/[0.04] text-text/25"
                    }`}>
                      +{a.reward_rub}₽
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══ Claim Popup ═══ */}
      {popup && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPopup(null)}
        >
          <div
            className="relative bg-bg rounded-2xl p-8 text-center max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
            style={{ animation: "popupIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
          >
            {/* Confetti */}
            <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: CONFETTI[i % CONFETTI.length],
                    left: `${10 + Math.random() * 80}%`,
                    top: "-10%",
                    animation: `confettiFall ${1.2 + Math.random() * 0.8}s ease-out ${i * 0.05}s forwards`,
                    opacity: 0.9,
                  }}
                />
              ))}
            </div>

            {/* Icon */}
            <div
              className="text-6xl mb-4"
              style={{ animation: "bounceIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both" }}
            >
              {popup.icon}
            </div>

            {/* Title */}
            <h2
              className="text-xl font-extrabold text-text mb-2"
              style={{ animation: "fadeInUp 0.4s ease both 0.2s" }}
            >
              {popup.title}
            </h2>

            {/* Reward */}
            <div
              className="inline-flex items-center gap-2 bg-accent/10 text-accent px-5 py-2.5 rounded-xl mb-4"
              style={{ animation: "fadeInUp 0.4s ease both 0.3s" }}
            >
              <span className="text-2xl font-black">+{popup.reward}₽</span>
              <span className="text-sm font-medium">на баланс</span>
            </div>

            <p
              className="text-sm text-text/40 mb-6"
              style={{ animation: "fadeInUp 0.4s ease both 0.4s" }}
            >
              Награда зачислена на ваш счёт!
            </p>

            <button
              onClick={() => setPopup(null)}
              className="bg-accent text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors"
              style={{ animation: "fadeInUp 0.4s ease both 0.5s" }}
            >
              Отлично!
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes popupIn {
          from { transform: scale(0.8) translateY(20px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes bounceIn {
          from { transform: scale(0); }
          50% { transform: scale(1.2); }
          to { transform: scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(400px) rotate(720deg) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
