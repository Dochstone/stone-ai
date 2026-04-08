"use client";

import { useState, useEffect, useCallback } from "react";

interface AchievementEvent {
  title: string;
  icon: string;
  reward_rub: number;
}

let showToastFn: ((a: AchievementEvent) => void) | null = null;

export function triggerAchievementToast(a: AchievementEvent) {
  showToastFn?.(a);
}

export default function AchievementToast() {
  const [queue, setQueue] = useState<AchievementEvent[]>([]);
  const [current, setCurrent] = useState<AchievementEvent | null>(null);
  const [leaving, setLeaving] = useState(false);

  const show = useCallback((a: AchievementEvent) => {
    setQueue(prev => [...prev, a]);
  }, []);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => { setCurrent(null); setLeaving(false); }, 300);
  }, []);

  useEffect(() => { showToastFn = show; return () => { showToastFn = null; }; }, [show]);

  useEffect(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0]);
    setQueue(prev => prev.slice(1));
    setLeaving(false);
    const t = setTimeout(dismiss, 5000);
    return () => clearTimeout(t);
  }, [queue, current, dismiss]);

  if (!current) return null;

  return (
    <a
      href="/dashboard/achievements"
      onClick={dismiss}
      className={`fixed top-4 right-4 z-[100] cursor-pointer no-underline transition-all duration-300 ${leaving ? "translate-x-[120%] opacity-0" : "translate-x-0 opacity-100"}`}
      style={{ animation: leaving ? undefined : "slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <div className="bg-bg border border-accent/20 rounded-2xl shadow-2xl shadow-accent/20 overflow-hidden min-w-[300px] max-w-[360px]">
        {/* Progress bar that drains over 5 seconds */}
        <div className="h-0.5 bg-accent/10">
          <div className="h-full bg-accent" style={{ animation: "drainBar 5s linear forwards" }} />
        </div>
        <div className="p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-teal/10 flex items-center justify-center text-2xl shrink-0 shadow-inner">
            {current.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-accent uppercase tracking-wider">Достижение!</p>
            <p className="text-sm font-bold text-text truncate">{current.title}</p>
            {current.reward_rub > 0 ? (
              <p className="text-[11px] text-teal font-bold">+{current.reward_rub}₽ на баланс</p>
            ) : (
              <p className="text-[11px] text-text/30 font-semibold">Разблокировано!</p>
            )}
          </div>
          {/* Close button */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(); }}
            className="w-6 h-6 rounded-full bg-text/[0.05] hover:bg-text/[0.1] flex items-center justify-center text-text/30 hover:text-text/50 transition-colors shrink-0"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes drainBar {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </a>
  );
}
