"use client";

import { useState } from "react";
import SnakeGame from "./games/SnakeGame";
import Leaderboard from "./games/Leaderboard";

export default function GenerationOverlay({ isVisible, estimatedTime, onMinimize, token }: {
  isVisible: boolean;
  estimatedTime?: string;
  onMinimize?: () => void;
  token?: string;
}) {
  const [showGame, setShowGame] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-bg rounded-2xl shadow-2xl border border-text/10 w-full max-w-md overflow-hidden">
        {!showGame && !showLeaderboard && (
          <div className="p-6 text-center">
            {/* Spinner */}
            <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-text/10 border-t-accent animate-spin" />
            <h3 className="text-base font-bold text-text mb-1">Генерация...</h3>
            {estimatedTime && <p className="text-xs text-text/40 mb-5">{estimatedTime}</p>}

            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowGame(true)}
                className="w-full py-3 rounded-xl bg-accent/10 text-accent font-bold text-sm hover:bg-accent/15 transition-colors"
              >
                🎮 Играть пока ждёшь
              </button>
              <button
                onClick={() => setShowLeaderboard(true)}
                className="w-full py-2.5 rounded-xl bg-text/[0.04] text-text/50 font-semibold text-xs hover:bg-text/[0.06] transition-colors"
              >
                🏆 Таблица лидеров
              </button>
              {onMinimize && (
                <button
                  onClick={onMinimize}
                  className="w-full py-2.5 rounded-xl text-text/30 text-xs hover:text-text/50 transition-colors"
                >
                  Свернуть в фон
                </button>
              )}
            </div>
          </div>
        )}

        {showGame && (
          <div className="p-4">
            <SnakeGame token={token} onClose={() => setShowGame(false)} />
          </div>
        )}

        {showLeaderboard && (
          <div className="p-4">
            <Leaderboard />
            <button onClick={() => setShowLeaderboard(false)} className="w-full mt-3 text-xs text-text/30 hover:text-text/50 py-2">
              Назад
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
