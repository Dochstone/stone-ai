"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://stoneai.ru";

type Board = number[][];
type GameState = "playing" | "won" | "over";

interface Props {
  token?: string;
  compact?: boolean;
  onClose?: () => void;
  onShowLeaderboard?: () => void;
}

const TILE_STYLES: Record<number, string> = {
  0: "bg-white/5",
  2: "bg-[#eee4da] text-[#776e65]",
  4: "bg-[#ede0c8] text-[#776e65]",
  8: "bg-[#f2b179] text-white",
  16: "bg-[#f59563] text-white",
  32: "bg-[#f67c5f] text-white",
  64: "bg-[#f65e3b] text-white",
  128: "bg-[#edcf72] text-white text-xs",
  256: "bg-[#edcc61] text-white text-xs",
  512: "bg-[#edc850] text-white text-xs",
  1024: "bg-[#edc53f] text-white text-[10px]",
  2048: "bg-[#edc22e] text-white text-[10px] animate-pulse",
};

function emptyBoard(): Board {
  return Array.from({ length: 4 }, () => Array(4).fill(0));
}

function cloneBoard(b: Board): Board {
  return b.map((row) => [...row]);
}

function getEmptyCells(b: Board): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (b[r][c] === 0) cells.push([r, c]);
    }
  }
  return cells;
}

function addRandomTile(b: Board): { board: Board; idx: number } {
  const empty = getEmptyCells(b);
  if (empty.length === 0) return { board: b, idx: -1 };
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const next = cloneBoard(b);
  next[r][c] = Math.random() < 0.9 ? 2 : 4;
  return { board: next, idx: r * 4 + c };
}

function slideRow(row: number[]): { result: number[]; score: number; moved: boolean; merged: boolean } {
  const filtered = row.filter((v) => v !== 0);
  let score = 0;
  let merged = false;
  const result: number[] = [];

  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const val = filtered[i] * 2;
      result.push(val);
      score += val;
      merged = true;
      i++;
    } else {
      result.push(filtered[i]);
    }
  }

  while (result.length < 4) result.push(0);
  const moved = row.some((v, i) => v !== result[i]);
  return { result, score, moved, merged };
}

function transpose(b: Board): Board {
  return b[0].map((_, c) => b.map((row) => row[c]));
}

function reverseRows(b: Board): Board {
  return b.map((row) => [...row].reverse());
}

function moveLeft(b: Board): { board: Board; score: number; moved: boolean; merged: boolean } {
  let totalScore = 0;
  let anyMoved = false;
  let anyMerged = false;
  const next = b.map((row) => {
    const { result, score, moved, merged } = slideRow(row);
    totalScore += score;
    if (moved) anyMoved = true;
    if (merged) anyMerged = true;
    return result;
  });
  return { board: next, score: totalScore, moved: anyMoved, merged: anyMerged };
}

function moveRight(b: Board): { board: Board; score: number; moved: boolean; merged: boolean } {
  const reversed = reverseRows(b);
  const { board, score, moved, merged } = moveLeft(reversed);
  return { board: reverseRows(board), score, moved, merged };
}

function moveUp(b: Board): { board: Board; score: number; moved: boolean; merged: boolean } {
  const transposed = transpose(b);
  const { board, score, moved, merged } = moveLeft(transposed);
  return { board: transpose(board), score, moved, merged };
}

function moveDown(b: Board): { board: Board; score: number; moved: boolean; merged: boolean } {
  const transposed = transpose(b);
  const { board, score, moved, merged } = moveRight(transposed);
  return { board: transpose(board), score, moved, merged };
}

function hasWon(b: Board): boolean {
  return b.some((row) => row.some((v) => v >= 2048));
}

function canMove(b: Board): boolean {
  if (getEmptyCells(b).length > 0) return true;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const v = b[r][c];
      if (c + 1 < 4 && b[r][c + 1] === v) return true;
      if (r + 1 < 4 && b[r + 1][c] === v) return true;
    }
  }
  return false;
}

function tileStyle(v: number): string {
  return TILE_STYLES[v] ?? "bg-[#3c3a32] text-white text-[10px]";
}

export default function Game2048({ token, compact, onClose, onShowLeaderboard }: Props) {
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameState, setGameState] = useState<GameState>("playing");
  const [newTileIdx, setNewTileIdx] = useState(-1);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);

  const boardRef = useRef(board);
  const scoreRef = useRef(score);
  const gameStateRef = useRef(gameState);
  const mutedRef = useRef(muted);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const popTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  boardRef.current = board;
  scoreRef.current = score;
  gameStateRef.current = gameState;
  mutedRef.current = muted;

  const getAudioCtx = useCallback((): AudioContext | null => {
    if (mutedRef.current) return null;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playSound = useCallback(
    (type: "move" | "merge" | "win" | "die") => {
      const ctx = getAudioCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.value = 0.15;

      switch (type) {
        case "move":
          osc.type = "sine";
          osc.frequency.value = 300;
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.05);
          break;
        case "merge":
          osc.type = "sine";
          osc.frequency.value = 500;
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.1);
          break;
        case "win":
          osc.type = "sine";
          osc.frequency.setValueAtTime(400, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);
          gain.gain.setValueAtTime(0.15, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
          break;
        case "die":
          osc.type = "sawtooth";
          osc.frequency.value = 150;
          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.3);
          break;
      }
    },
    [getAudioCtx]
  );

  const initBoard = useCallback(() => {
    let b = emptyBoard();
    const first = addRandomTile(b);
    b = first.board;
    const second = addRandomTile(b);
    b = second.board;
    return { board: b, idx: second.idx };
  }, []);

  const saveScore = useCallback(
    (s: number) => {
      const b = parseInt(localStorage.getItem("best_2048") || "0");
      if (s > b) {
        localStorage.setItem("best_2048", String(s));
        setBest(s);
        setIsNewRecord(true);
        if (token) {
          fetch(`${API_URL}/api/games/score`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ game: "2048", score: s }),
          }).catch(() => {});
        }
      } else {
        setIsNewRecord(false);
      }
    },
    [token]
  );

  const restart = useCallback(() => {
    const { board: b, idx } = initBoard();
    setBoard(b);
    setScore(0);
    setGameState("playing");
    setIsNewRecord(false);
    setNewTileIdx(idx);
    if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current);
    popTimeoutRef.current = setTimeout(() => setNewTileIdx(-1), 200);
  }, [initBoard]);

  const handleMove = useCallback(
    (dir: "left" | "right" | "up" | "down") => {
      if (gameStateRef.current !== "playing" || paused) return;

      const current = boardRef.current;
      const moveFn = { left: moveLeft, right: moveRight, up: moveUp, down: moveDown }[dir];
      const { board: moved, score: gained, moved: didMove, merged } = moveFn(current);

      if (!didMove) return;

      if (merged) {
        playSound("merge");
      } else {
        playSound("move");
      }

      const newScore = scoreRef.current + gained;
      const { board: withTile, idx } = addRandomTile(moved);

      setBoard(withTile);
      setScore(newScore);
      setNewTileIdx(idx);
      if (popTimeoutRef.current) clearTimeout(popTimeoutRef.current);
      popTimeoutRef.current = setTimeout(() => setNewTileIdx(-1), 200);

      if (hasWon(withTile)) {
        setGameState("won");
        playSound("win");
        saveScore(newScore);
      } else if (!canMove(withTile)) {
        setGameState("over");
        playSound("die");
        saveScore(newScore);
      }
    },
    [playSound, saveScore]
  );

  // Init
  useEffect(() => {
    const b = parseInt(localStorage.getItem("best_2048") || "0");
    setBest(b);
    const { board: initial, idx } = initBoard();
    setBoard(initial);
    setNewTileIdx(idx);
    const t = setTimeout(() => setNewTileIdx(-1), 200);
    return () => clearTimeout(t);
  }, [initBoard]);

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, "left" | "right" | "up" | "down"> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
        w: "up",
        W: "up",
        s: "down",
        S: "down",
        a: "left",
        A: "left",
        d: "right",
        D: "right",
      };
      if (e.key === "Escape" || e.key === "p") { setPaused(p => !p); return; }
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleMove]);

  // Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      handleMove(dx > 0 ? "right" : "left");
    } else {
      handleMove(dy > 0 ? "down" : "up");
    }
  };

  const gridSize = compact ? 250 : 320;
  const tileSize = compact ? "h-[54px]" : "h-[68px]";
  const fontSize = compact ? "text-lg" : "text-xl";

  return (
    <div className="flex flex-col items-center gap-3">
      <style>{`
        @keyframes pop {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        .animate-pop {
          animation: pop 200ms ease-out;
        }
      `}</style>

      {/* Header */}
      <div
        className="flex items-center justify-between w-full px-1"
        style={{ maxWidth: gridSize }}
      >
        <span className="text-xl font-extrabold text-text">2048</span>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-text">
              Счёт: {score}
            </span>
            <span className="text-[10px] text-text/30">
              Рекорд: {best}
            </span>
          </div>
          <button
            onClick={() => setMuted((m) => !m)}
            className="text-lg opacity-50 hover:opacity-80 transition-opacity"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? "\uD83D\uDD07" : "\uD83D\uDD0A"}
          </button>
          {gameState === "playing" && (
            <button onClick={() => setPaused(p => !p)} className="text-lg opacity-50 hover:opacity-80 transition-opacity" title={paused ? "Продолжить (P)" : "Пауза (P)"}>
              {paused ? "▶️" : "⏸️"}
            </button>
          )}
        </div>
      </div>

      {/* Pause overlay */}
      {paused && gameState === "playing" && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 rounded-2xl" onClick={() => setPaused(false)}>
          <span className="text-3xl mb-2">⏸️</span>
          <p className="text-white font-bold text-lg mb-3">ПАУЗА</p>
          <button onClick={() => setPaused(false)} className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm">Продолжить</button>
        </div>
      )}

      {/* Grid */}
      <div
        className="relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "none" }}
      >
        <div
          className="grid grid-cols-4 gap-2 p-3 bg-[#1a1a2e] rounded-xl"
          style={{ width: gridSize }}
        >
          {board.flat().map((val, i) => (
            <div
              key={i}
              className={`${tileSize} rounded-lg flex items-center justify-center font-bold ${fontSize} select-none transition-colors duration-100 ${tileStyle(val)} ${i === newTileIdx ? "animate-pop" : ""}`}
            >
              {val > 0 ? val : ""}
            </div>
          ))}
        </div>

        {/* Win overlay */}
        {gameState === "won" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
            <p className="text-4xl font-bold mb-2">{score}</p>
            <p className="text-sm text-gray-400 mb-1">очков</p>
            {isNewRecord && (
              <p className="text-yellow-400 text-sm font-medium mb-4 animate-bounce">
                &#x2B50; Новый рекорд!
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={restart}
                className="bg-accent text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-accent/90"
              >
                Играть снова
              </button>
              {onShowLeaderboard && (
                <button
                  onClick={onShowLeaderboard}
                  className="bg-white/10 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-white/20"
                >
                  Лидерборд
                </button>
              )}
            </div>
          </div>
        )}

        {/* Game over overlay */}
        {gameState === "over" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-xl backdrop-blur-sm">
            <p className="text-4xl font-bold mb-2">{score}</p>
            <p className="text-sm text-gray-400 mb-1">очков</p>
            {isNewRecord && (
              <p className="text-yellow-400 text-sm font-medium mb-4 animate-bounce">
                &#x2B50; Новый рекорд!
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={restart}
                className="bg-accent text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-accent/90"
              >
                Играть снова
              </button>
              {onShowLeaderboard && (
                <button
                  onClick={onShowLeaderboard}
                  className="bg-white/10 text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-white/20"
                >
                  Лидерборд
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controls below grid */}
      <div className="flex items-center gap-3">
        <button
          onClick={restart}
          className="bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors"
        >
          Новая игра
        </button>
      </div>

      {/* D-pad for mobile */}
      <div className="grid grid-cols-3 gap-1 w-[120px] sm:hidden">
        <div />
        <button
          onTouchStart={() => handleMove("up")}
          className="w-10 h-10 bg-text/10 rounded-lg flex items-center justify-center text-text/40 active:bg-text/20"
        >
          &#x2191;
        </button>
        <div />
        <button
          onTouchStart={() => handleMove("left")}
          className="w-10 h-10 bg-text/10 rounded-lg flex items-center justify-center text-text/40 active:bg-text/20"
        >
          &#x2190;
        </button>
        <button
          onTouchStart={() => handleMove("down")}
          className="w-10 h-10 bg-text/10 rounded-lg flex items-center justify-center text-text/40 active:bg-text/20"
        >
          &#x2193;
        </button>
        <button
          onTouchStart={() => handleMove("right")}
          className="w-10 h-10 bg-text/10 rounded-lg flex items-center justify-center text-text/40 active:bg-text/20"
        >
          &#x2192;
        </button>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="text-xs text-text/30 hover:text-text/50 transition-colors"
        >
          Закрыть
        </button>
      )}
    </div>
  );
}
