"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const CELL = 15;
const GRID = 20;
const SIZE = CELL * GRID;

type Pos = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right";
type State = "ready" | "playing" | "over";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

export default function SnakeGame({ token, onClose }: { token?: string; onClose?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameState, setGameState] = useState<State>("ready");
  const [newRecord, setNewRecord] = useState(false);

  const snakeRef = useRef<Pos[]>([{ x: 10, y: 10 }]);
  const foodRef = useRef<Pos>({ x: 15, y: 10 });
  const dirRef = useRef<Dir>("right");
  const nextDirRef = useRef<Dir>("right");
  const scoreRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const b = parseInt(localStorage.getItem("snake_best") || "0");
    setBest(b);
  }, []);

  const spawnFood = useCallback(() => {
    const snake = snakeRef.current;
    let pos: Pos;
    do {
      pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    foodRef.current = pos;
  }, []);

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const snake = snakeRef.current;
    const food = foodRef.current;

    // Background
    ctx.fillStyle = "#0f1117";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(SIZE, i * CELL); ctx.stroke();
    }

    // Food
    const pulse = 0.8 + 0.2 * Math.sin(Date.now() / 200);
    const fr = CELL * 0.4 * pulse;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, fr, 0, Math.PI * 2);
    ctx.fill();

    // Snake
    snake.forEach((s, i) => {
      const r = CELL * 0.45;
      ctx.fillStyle = i === 0 ? "#16a34a" : "#22c55e";
      ctx.beginPath();
      ctx.roundRect(s.x * CELL + (CELL - r * 2) / 2, s.y * CELL + (CELL - r * 2) / 2, r * 2, r * 2, 3);
      ctx.fill();
    });
  }, []);

  const gameOver = useCallback(() => {
    setGameState("over");
    if (intervalRef.current) clearInterval(intervalRef.current);
    const s = scoreRef.current;
    const b = parseInt(localStorage.getItem("snake_best") || "0");
    if (s > b) {
      localStorage.setItem("snake_best", String(s));
      setBest(s);
      setNewRecord(true);
      // Save to server
      if (token) {
        fetch(`${API_URL}/api/games/score`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ game: "snake", score: s }),
        }).catch(() => {});
      }
    } else {
      setNewRecord(false);
    }
  }, [token]);

  const tick = useCallback(() => {
    dirRef.current = nextDirRef.current;
    const snake = [...snakeRef.current];
    const head = { ...snake[0] };

    if (dirRef.current === "up") head.y--;
    if (dirRef.current === "down") head.y++;
    if (dirRef.current === "left") head.x--;
    if (dirRef.current === "right") head.x++;

    // Wall collision
    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) { gameOver(); return; }
    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) { gameOver(); return; }

    snake.unshift(head);

    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      scoreRef.current++;
      setScore(scoreRef.current);
      spawnFood();
    } else {
      snake.pop();
    }

    snakeRef.current = snake;
    draw();
  }, [draw, gameOver, spawnFood]);

  const startGame = useCallback(() => {
    snakeRef.current = [{ x: 10, y: 10 }];
    dirRef.current = "right";
    nextDirRef.current = "right";
    scoreRef.current = 0;
    setScore(0);
    setNewRecord(false);
    setGameState("playing");
    spawnFood();
    draw();

    const speed = 150;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, speed);
  }, [tick, draw, spawnFood]);

  // Speed up as score increases
  useEffect(() => {
    if (gameState !== "playing") return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const speed = Math.max(70, 150 - Math.floor(scoreRef.current / 5) * 5);
    intervalRef.current = setInterval(tick, speed);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [score, gameState, tick]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const d = dirRef.current;
      if ((e.key === "ArrowUp" || e.key === "w") && d !== "down") nextDirRef.current = "up";
      if ((e.key === "ArrowDown" || e.key === "s") && d !== "up") nextDirRef.current = "down";
      if ((e.key === "ArrowLeft" || e.key === "a") && d !== "right") nextDirRef.current = "left";
      if ((e.key === "ArrowRight" || e.key === "d") && d !== "left") nextDirRef.current = "right";
      if (e.key === " " && gameState === "ready") startGame();
      if (e.key === " " && gameState === "over") startGame();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameState, startGame]);

  // Touch controls
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    const d = dirRef.current;
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 30 && d !== "left") nextDirRef.current = "right";
      if (dx < -30 && d !== "right") nextDirRef.current = "left";
    } else {
      if (dy > 30 && d !== "up") nextDirRef.current = "down";
      if (dy < -30 && d !== "down") nextDirRef.current = "up";
    }
  };

  // Initial draw
  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Score */}
      <div className="flex items-center justify-between w-full max-w-[300px] px-1">
        <span className="text-sm font-bold text-text">Счёт: {score}</span>
        <span className="text-xs text-text/30">Рекорд: {best}</span>
      </div>

      {/* Canvas */}
      <div className="relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <canvas ref={canvasRef} width={SIZE} height={SIZE} className="rounded-xl border border-text/10" style={{ touchAction: "none" }} />

        {gameState === "ready" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl">
            <span className="text-2xl mb-2">🐍</span>
            <button onClick={startGame} className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90">
              Играть
            </button>
            <span className="text-[10px] text-white/30 mt-2">WASD / стрелки / свайп</span>
          </div>
        )}

        {gameState === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl">
            <span className="text-lg font-bold text-white mb-1">Game Over!</span>
            <span className="text-2xl font-extrabold text-accent mb-1">{score}</span>
            {newRecord && <span className="text-xs text-amber-400 font-bold mb-2">🎉 Новый рекорд!</span>}
            <button onClick={startGame} className="bg-accent text-white px-5 py-2 rounded-xl font-bold text-sm hover:bg-accent/90 mb-2">
              Ещё раз
            </button>
          </div>
        )}
      </div>

      {/* D-pad for mobile */}
      <div className="grid grid-cols-3 gap-1 w-[120px] sm:hidden">
        <div />
        <button onTouchStart={() => { if (dirRef.current !== "down") nextDirRef.current = "up"; }} className="w-10 h-10 bg-text/10 rounded-lg flex items-center justify-center text-text/40 active:bg-text/20">↑</button>
        <div />
        <button onTouchStart={() => { if (dirRef.current !== "right") nextDirRef.current = "left"; }} className="w-10 h-10 bg-text/10 rounded-lg flex items-center justify-center text-text/40 active:bg-text/20">←</button>
        <button onTouchStart={() => { if (dirRef.current !== "up") nextDirRef.current = "down"; }} className="w-10 h-10 bg-text/10 rounded-lg flex items-center justify-center text-text/40 active:bg-text/20">↓</button>
        <button onTouchStart={() => { if (dirRef.current !== "left") nextDirRef.current = "right"; }} className="w-10 h-10 bg-text/10 rounded-lg flex items-center justify-center text-text/40 active:bg-text/20">→</button>
      </div>

      {onClose && (
        <button onClick={onClose} className="text-xs text-text/30 hover:text-text/50 transition-colors">Закрыть</button>
      )}
    </div>
  );
}
