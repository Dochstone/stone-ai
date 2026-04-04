"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Leaderboard from "@/components/games/Leaderboard";
import { getAuth } from "@/lib/auth";

const SnakeGame = dynamic(() => import("@/components/games/SnakeGame"), { ssr: false });
const Game2048 = dynamic(() => import("@/components/games/Game2048"), { ssr: false });

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<"none" | "snake" | "2048">("none");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const auth = getAuth();

  return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-extrabold text-text">Stone Arcade</h1>
          <p className="text-sm text-text/40 mt-1">Играйте и соревнуйтесь за призы</p>
        </div>

        {activeGame === "none" ? (
          <>
            {/* Game cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setActiveGame("snake")}
                aria-label="Змейка"
                className="bg-white rounded-2xl border border-text/5 p-6 text-left hover:shadow-md hover:border-accent/20 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  🐍
                </div>
                <h3 className="text-base font-bold text-text mb-1 group-hover:text-accent transition-colors">Змейка</h3>
                <p className="text-xs text-text/40 mb-3">Классическая змейка с ускорением. Собирай еду, не врезайся в стены!</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded font-medium">Аркада</span>
                  <span className="text-[10px] text-text/25">Рекорд: {typeof window !== "undefined" ? localStorage.getItem("snake_best") || "0" : "0"}</span>
                </div>
              </button>

              <button
                onClick={() => setActiveGame("2048")}
                aria-label="2048"
                className="bg-white rounded-2xl border border-text/5 p-6 text-left hover:shadow-md hover:border-accent/20 transition-all group"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                  🧩
                </div>
                <h3 className="text-base font-bold text-text mb-1 group-hover:text-accent transition-colors">2048</h3>
                <p className="text-xs text-text/40 mb-3">Объединяй плитки и набирай очки. Доберись до 2048!</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded font-medium">Головоломка</span>
                  <span className="text-[10px] text-text/25">Рекорд: {typeof window !== "undefined" ? localStorage.getItem("best_2048") || "0" : "0"}</span>
                </div>
              </button>
            </div>

            {/* Prize banner */}
            <div className="bg-gradient-to-r from-accent/10 to-teal/10 border border-accent/15 rounded-2xl p-5 mb-8 text-center">
              <span className="text-2xl block mb-2">🏆</span>
              <h3 className="text-sm font-bold text-text mb-1">Топ-5 каждого месяца получают +100₽ на баланс!</h3>
              <p className="text-xs text-text/40">Соревнуйтесь за место в таблице лидеров</p>
            </div>

            {/* Leaderboard */}
            <div className="bg-white rounded-2xl border border-text/5 p-5">
              <Leaderboard />
            </div>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveGame("none")}
              className="text-sm text-text/40 hover:text-accent mb-4 inline-flex items-center gap-1 transition-colors"
            >
              ← Назад к играм
            </button>

            <div className="flex flex-col items-center">
              {activeGame === "snake" && (
                <SnakeGame
                  token={auth?.token}
                  onClose={() => setActiveGame("none")}
                  onShowLeaderboard={() => setShowLeaderboard(true)}
                />
              )}
              {activeGame === "2048" && (
                <Game2048
                  token={auth?.token}
                  onClose={() => setActiveGame("none")}
                  onShowLeaderboard={() => setShowLeaderboard(true)}
                />
              )}
            </div>

            {/* Inline leaderboard modal */}
            {showLeaderboard && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowLeaderboard(false)}>
                <div className="bg-bg rounded-2xl p-5 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                  <Leaderboard game={activeGame} />
                  <button onClick={() => setShowLeaderboard(false)} className="w-full mt-3 text-xs text-text/30 hover:text-text/50 py-2">
                    Закрыть
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
