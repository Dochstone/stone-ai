"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Leaderboard from "./games/Leaderboard";

const SnakeGame = dynamic(() => import("./games/SnakeGame"), { ssr: false });
const Game2048 = dynamic(() => import("./games/Game2048"), { ssr: false });

export default function GenerationOverlay({ isVisible, estimatedTime, onMinimize, token, type }: {
  isVisible: boolean;
  estimatedTime?: string;
  onMinimize?: () => void;
  token?: string;
  type?: string;
}) {
  const [view, setView] = useState<"main" | "snake" | "2048" | "leaderboard">("main");

  if (!isVisible) return null;

  const typeLabel = type === "video" ? "видео" : type === "audio" ? "аудио" : type === "3d" ? "3D-модели" : "изображения";

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#12121a] rounded-2xl shadow-2xl border border-white/[0.08] w-full max-w-[420px] overflow-hidden">
        {view === "main" && (
          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
            <h3 className="text-base font-bold text-white mb-1">Генерация {typeLabel}...</h3>
            <p className="text-xs text-gray-400 mb-6">{estimatedTime || "~30 секунд"}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setView("snake")}
                className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <span className="text-2xl">🐍</span>
                <span className="text-xs text-gray-300 font-medium">Змейка</span>
              </button>
              <button
                onClick={() => setView("2048")}
                className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
              >
                <span className="text-2xl">🧩</span>
                <span className="text-xs text-gray-300 font-medium">2048</span>
              </button>
            </div>

            <button
              onClick={() => setView("leaderboard")}
              className="w-full py-2.5 rounded-xl bg-white/5 text-gray-400 font-semibold text-xs hover:bg-white/10 transition-colors mb-2"
            >
              🏆 Таблица лидеров
            </button>

            {onMinimize && (
              <button
                onClick={onMinimize}
                className="w-full py-2.5 text-sm text-gray-500 hover:text-white transition-colors"
              >
                Свернуть в фон — результат появится в галерее
              </button>
            )}
          </div>
        )}

        {view === "snake" && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setView("main")} className="text-gray-400 hover:text-white text-sm transition-colors">
                ← Назад
              </button>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-gray-400">Генерация идёт...</span>
              </div>
            </div>
            <SnakeGame compact token={token} onClose={() => setView("main")} onShowLeaderboard={() => setView("leaderboard")} />
          </div>
        )}

        {view === "2048" && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setView("main")} className="text-gray-400 hover:text-white text-sm transition-colors">
                ← Назад
              </button>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[10px] text-gray-400">Генерация идёт...</span>
              </div>
            </div>
            <Game2048 compact token={token} onClose={() => setView("main")} onShowLeaderboard={() => setView("leaderboard")} />
          </div>
        )}

        {view === "leaderboard" && (
          <div className="p-4">
            <button onClick={() => setView("main")} className="text-gray-400 hover:text-white text-sm mb-3 transition-colors">
              ← Назад
            </button>
            <Leaderboard />
          </div>
        )}
      </div>
    </div>
  );
}
