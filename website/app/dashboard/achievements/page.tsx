"use client";

import { useState, useEffect } from "react";
import { SkeletonAchievements } from "@/components/Skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

interface Ach {
  slug: string; title: string; description: string; icon: string;
  category: string; target: number; progress: number;
  is_completed: boolean; completed_at: string | null; reward_rub: number;
}

const CATS = [
  { id: "all", label: "Все" },
  { id: "generation", label: "Генерация" },
  { id: "streak", label: "Серии" },
  { id: "milestone", label: "Вехи" },
  { id: "social", label: "Социальное" },
];

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Ach[]>([]);
  const [total, setTotal] = useState(0);
  const [completed, setCompleted] = useState(0);
  const [cat, setCat] = useState("all");
  const [loading, setLoading] = useState(true);

  const getAuth = () => { try { return JSON.parse(localStorage.getItem("stone_auth") || ""); } catch { return null; } };

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token) { setLoading(false); return; }
    fetch(`${API_URL}/api/achievements/`, { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(r => r.json())
      .then(data => {
        setAchievements(data.achievements || []);
        setTotal(data.total || 0);
        setCompleted(data.completed || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = cat === "all" ? achievements : achievements.filter(a => a.category === cat);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const auth = getAuth();
  if (!auth) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <p className="text-text/50">Войдите для просмотра достижений</p>
      <a href="/webchat" className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm">Войти</a>
    </div>
  );

  return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-text">Достижения</h1>
            <p className="text-sm text-text/40 mt-1">{completed} из {total} получено</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-accent">{pct}%</div>
            <div className="w-24 h-2 bg-text/10 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

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
            {filtered.map(a => (
              <div key={a.slug} className={`relative border rounded-2xl p-4 text-center transition-all ${
                a.is_completed
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
                  <p className="text-[9px] text-text/25">{a.progress} / {a.target}</p>
                )}

                {a.is_completed && (
                  <span className="text-[9px] font-bold text-accent">Получено!</span>
                )}

                {a.reward_rub > 0 && (
                  <span className={`absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    a.is_completed ? "bg-accent/10 text-accent" : "bg-text/[0.04] text-text/25"
                  }`}>
                    +{a.reward_rub}₽
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
