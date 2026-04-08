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

  const show = useCallback((a: AchievementEvent) => {
    setQueue(prev => [...prev, a]);
  }, []);

  useEffect(() => { showToastFn = show; return () => { showToastFn = null; }; }, [show]);

  useEffect(() => {
    if (current || queue.length === 0) return;
    setCurrent(queue[0]);
    setQueue(prev => prev.slice(1));
    const t = setTimeout(() => setCurrent(null), 4000);
    return () => clearTimeout(t);
  }, [queue, current]);

  if (!current) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] animate-fadeIn">
      <div className="bg-bg border border-accent/20 rounded-2xl shadow-2xl shadow-accent/10 p-4 flex items-center gap-3 min-w-[280px]">
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl shrink-0">
          {current.icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-accent uppercase tracking-wider">Достижение!</p>
          <p className="text-sm font-bold text-text truncate">{current.title}</p>
          {current.reward_rub > 0 ? (
            <p className="text-[11px] text-teal font-semibold">+{current.reward_rub}₽ на баланс</p>
          ) : (
            <p className="text-[11px] text-text/30 font-semibold">Разблокировано!</p>
          )}
        </div>
      </div>
    </div>
  );
}
