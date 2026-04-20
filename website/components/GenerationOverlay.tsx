"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Leaderboard from "./games/Leaderboard";

const SnakeGame = dynamic(() => import("./games/SnakeGame"), { ssr: false });
const Game2048 = dynamic(() => import("./games/Game2048"), { ssr: false });

export default function GenerationOverlay({ isVisible, estimatedTime, onMinimize, onClose, token, type }: {
  isVisible: boolean;
  estimatedTime?: string;
  onMinimize?: () => void;
  onClose?: () => void;
  token?: string;
  type?: string;
}) {
  const [view, setView] = useState<"main" | "snake" | "2048" | "leaderboard">("main");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isVisible) { setElapsed(0); return; }
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [isVisible]);

  if (!isVisible) return null;

  const typeLabel = type === "video" ? "видео" : type === "audio" ? "аудио" : type === "3d" ? "3D-модели" : "изображения";

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-bg rounded-2xl shadow-2xl border border-text/10 w-full max-w-[420px] overflow-hidden relative">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-text/[0.06] hover:bg-text/10 text-text/50 hover:text-text transition-colors"
            aria-label="Закрыть"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        {view === "main" && (
          <div className="p-6 text-center">
            <img src="/mascots/stone-mascot-loading.webp?v=2" alt="" width="72" height="72" className="mx-auto mb-4 animate-bounce" style={{ animationDuration: "2s" }} />
            <h3 className="text-base font-bold text-text mb-1">Генерация {typeLabel}...</h3>
            <p className="text-xs text-text/50 mb-1">{estimatedTime || "~30 секунд"}</p>
            <p className="text-text/30 text-xs mb-6">{elapsed}с прошло</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setView("snake")}
                className="flex flex-col items-center gap-2 p-4 bg-text/[0.06] hover:bg-text/10 rounded-xl transition-colors"
              >
                <span className="text-2xl">🐍</span>
                <span className="text-xs text-text/60 font-medium">Змейка</span>
              </button>
              <button
                onClick={() => setView("2048")}
                className="flex flex-col items-center gap-2 p-4 bg-text/[0.06] hover:bg-text/10 rounded-xl transition-colors"
              >
                <span className="text-2xl">🧩</span>
                <span className="text-xs text-text/60 font-medium">2048</span>
              </button>
            </div>

            <button
              onClick={() => setView("leaderboard")}
              className="w-full py-2.5 rounded-xl bg-text/[0.06] text-text/50 font-semibold text-xs hover:bg-text/10 transition-colors mb-2"
            >
              🏆 Таблица лидеров
            </button>

            {onMinimize && (
              <button
                onClick={onMinimize}
                className="w-full py-2.5 text-sm text-text/40 hover:text-text transition-colors"
              >
                Свернуть в фон — результат появится в галерее
              </button>
            )}
          </div>
        )}

        {view === "snake" && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setView("main")} className="text-text/50 hover:text-text text-sm transition-colors">
                ← Назад
              </button>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-text/50">Генерация идёт...</span>
              </div>
            </div>
            <SnakeGame compact token={token} onClose={() => setView("main")} onShowLeaderboard={() => setView("leaderboard")} />
          </div>
        )}

        {view === "2048" && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setView("main")} className="text-text/50 hover:text-text text-sm transition-colors">
                ← Назад
              </button>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-text/50">Генерация идёт...</span>
              </div>
            </div>
            <Game2048 compact token={token} onClose={() => setView("main")} onShowLeaderboard={() => setView("leaderboard")} />
          </div>
        )}

        {view === "leaderboard" && (
          <div className="p-4">
            <button onClick={() => setView("main")} className="text-text/50 hover:text-text text-sm mb-3 transition-colors">
              ← Назад
            </button>
            <Leaderboard />
          </div>
        )}
      </div>
    </div>
  );
}
