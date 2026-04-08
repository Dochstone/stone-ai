"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

interface Entry { rank: number; name: string; score: number }

const MEDALS = ["🥇", "🥈", "🥉"];

const GAMES = [
  { id: "snake", label: "Змейка", icon: "🐍" },
  { id: "2048", label: "2048", icon: "🧩" },
];

export default function Leaderboard({ game: initialGame = "snake" }: { game?: string }) {
  const [game, setGame] = useState(initialGame);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/api/games/leaderboard?game=${game}&month=${month}`)
      .then(r => r.json())
      .then(data => setEntries(data.leaderboard || []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [game, month]);

  return (
    <div className="w-full max-w-md">
      {/* Game tabs */}
      <div className="flex gap-1 bg-text/[0.03] rounded-lg p-1 mb-3">
        {GAMES.map(g => (
          <button
            key={g.id}
            onClick={() => setGame(g.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-colors ${
              game === g.id ? "bg-white text-text shadow-sm" : "text-text/40"
            }`}
          >
            <span>{g.icon}</span> {g.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-text">Таблица лидеров</h3>
        <select value={month} onChange={e => setMonth(e.target.value)}
          className="bg-text/[0.04] border border-text/[0.08] rounded-lg px-2 py-1 text-[10px] text-text/50 focus:outline-none">
          <option value={new Date().toISOString().slice(0, 7)}>Этот месяц</option>
          <option value={new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 7)}>Прошлый месяц</option>
        </select>
      </div>

      {loading ? (
        <p className="text-xs text-text/20 text-center py-4">Загрузка...</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-text/20 text-center py-4">Пока пусто. Будь первым!</p>
      ) : (
        <div className="space-y-1">
          {entries.map(e => (
            <div key={e.rank} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${e.rank <= 5 ? "bg-accent/5" : ""}`}>
              <span className="w-6 text-center text-xs font-bold shrink-0">
                {e.rank <= 3 ? MEDALS[e.rank - 1] : <span className="text-text/25">{e.rank}</span>}
              </span>
              <span className="flex-1 text-xs font-medium text-text/70 truncate">{e.name}</span>
              <span className="text-xs font-bold text-text/50">{e.score}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-accent/60 text-center mt-3 font-semibold">
        🏆 Топ-5 игроков месяца получают +100₽ на баланс!
      </p>
    </div>
  );
}
