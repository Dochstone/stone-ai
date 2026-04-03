"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const GRID = 20;

type Pos = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right";
type State = "ready" | "playing" | "over";
type Particle = { x: number; y: number; vx: number; vy: number; alpha: number; life: number };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

const BASE_SPEED = 150;
const MIN_SPEED = 60;
const SPEED_STEP = 8;

function getSpeed(score: number) {
  return Math.max(MIN_SPEED, BASE_SPEED - Math.floor(score / 5) * SPEED_STEP);
}

interface SnakeGameProps {
  token?: string;
  onClose?: () => void;
  compact?: boolean;
  onShowLeaderboard?: () => void;
}

export default function SnakeGame({ token, onClose, compact, onShowLeaderboard }: SnakeGameProps) {
  const CELL = compact ? 12.5 : 15;
  const SIZE = CELL * GRID;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameState, setGameState] = useState<State>("ready");
  const [newRecord, setNewRecord] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const snakeRef = useRef<Pos[]>([{ x: 10, y: 10 }]);
  const foodRef = useRef<Pos>({ x: 15, y: 10 });
  const dirRef = useRef<Dir>("right");
  const nextDirRef = useRef<Dir>("right");
  const scoreRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isMutedRef = useRef(false);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  useEffect(() => {
    const b = parseInt(localStorage.getItem("snake_best") || "0");
    setBest(b);
  }, []);

  const playSound = useCallback((type: "eat" | "die" | "start") => {
    if (isMutedRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "eat") {
      osc.type = "sine";
      osc.frequency.value = 600;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === "die") {
      osc.type = "sawtooth";
      osc.frequency.value = 200;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = "sine";
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    }
  }, []);

  const spawnParticles = useCallback((pos: Pos) => {
    const particles: Particle[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      particles.push({
        x: pos.x * CELL + CELL / 2,
        y: pos.y * CELL + CELL / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        life: 1,
      });
    }
    particlesRef.current = [...particlesRef.current, ...particles];
  }, [CELL]);

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
    ctx.fillStyle = "#0f0f1a";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, SIZE); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(SIZE, i * CELL); ctx.stroke();
    }

    // Food glow
    const pulse = 0.8 + 0.2 * Math.sin(Date.now() / 200);
    const glowR = CELL * 0.4 * 1.8;
    ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Food
    const fr = CELL * 0.4 * pulse;
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, fr, 0, Math.PI * 2);
    ctx.fill();

    // Snake with gradient
    snake.forEach((s, i) => {
      const r = CELL * 0.45;
      const opacity = 1 - (i / snake.length) * 0.5;
      ctx.fillStyle = i === 0 ? "#16a34a" : `rgba(34, 197, 94, ${opacity})`;
      ctx.beginPath();
      ctx.roundRect(s.x * CELL + (CELL - r * 2) / 2, s.y * CELL + (CELL - r * 2) / 2, r * 2, r * 2, 3);
      ctx.fill();
    });

    // Particles
    particlesRef.current = particlesRef.current.filter(p => p.alpha > 0);
    particlesRef.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.04;
      p.life -= 0.04;
      if (p.alpha > 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [CELL, SIZE]);

  const gameOver = useCallback(() => {
    setGameState("over");
    playSound("die");
    if (intervalRef.current) clearInterval(intervalRef.current);
    const s = scoreRef.current;
    const b = parseInt(localStorage.getItem("snake_best") || "0");
    if (s > b) {
      localStorage.setItem("snake_best", String(s));
      setBest(s);
      setNewRecord(true);
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
  }, [token, playSound]);

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
      spawnParticles(foodRef.current);
      playSound("eat");
      spawnFood();
    } else {
      snake.pop();
    }

    snakeRef.current = snake;
    draw();
  }, [draw, gameOver, spawnFood, spawnParticles, playSound]);

  const startGame = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    snakeRef.current = [{ x: 10, y: 10 }];
    dirRef.current = "right";
    nextDirRef.current = "right";
    scoreRef.current = 0;
    particlesRef.current = [];
    setScore(0);
    setNewRecord(false);
    setGameState("playing");
    spawnFood();
    draw();
    playSound("start");

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, BASE_SPEED);
  }, [tick, draw, spawnFood, playSound]);

  // Speed up as score increases
  useEffect(() => {
    if (gameState !== "playing") return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const speed = getSpeed(scoreRef.current);
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

  const currentSpeed = getSpeed(score);
  const speedLabel = `x${(BASE_SPEED / currentSpeed).toFixed(1)}`;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Header */}
      <div className={`flex items-center justify-between w-full px-1 ${compact ? "max-w-[250px]" : "max-w-[300px]"}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-text">Счёт: {score}</span>
          <button
            onClick={() => setIsMuted(m => !m)}
            className="text-sm text-text/50 hover:text-text/80 transition-colors"
            title={isMuted ? "Включить звук" : "Выключить звук"}
          >
            {isMuted ? "\uD83D\uDD07" : "\uD83D\uDD0A"}
          </button>
        </div>
        <div className="flex items-center gap-3">
          {gameState === "playing" && (
            <span className="text-xs text-emerald-400/70 font-mono">{speedLabel}</span>
          )}
          <span className="text-xs text-text/30">Рекорд: {best}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <canvas ref={canvasRef} width={SIZE} height={SIZE} className="rounded-xl border border-text/10" style={{ touchAction: "none" }} />

        {gameState === "ready" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl">
            <span className="text-2xl mb-2">{"\uD83D\uDC0D"}</span>
            <button onClick={startGame} className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90">
              Играть
            </button>
            <span className="text-[10px] text-white/30 mt-2">WASD / стрелки / свайп</span>
          </div>
        )}

        {gameState === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl">
            <span className="text-lg font-bold text-white mb-2">Game Over!</span>
            <span className="text-4xl font-extrabold text-accent mb-1">{score}</span>
            {newRecord && (
              <span className="text-sm text-amber-400 font-bold mb-3 animate-bounce">
                {"\uD83C\uDF89"} Новый рекорд!
              </span>
            )}
            {!newRecord && <div className="mb-3" />}
            <div className="flex flex-col gap-2">
              <button
                onClick={startGame}
                className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90"
              >
                Играть снова
              </button>
              {onShowLeaderboard && (
                <button
                  onClick={onShowLeaderboard}
                  className="bg-white/10 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors"
                >
                  Лидерборд
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* D-pad for mobile */}
      <div className="sm:hidden select-none mt-2">
        <div className="flex flex-col items-center gap-1.5">
          <button
            onTouchStart={(e) => { e.preventDefault(); if (dirRef.current !== "down") nextDirRef.current = "up"; }}
            className="w-16 h-12 bg-white/[0.08] rounded-xl flex items-center justify-center text-text/50 active:bg-accent/30 active:text-accent transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
          </button>
          <div className="flex gap-1.5">
            <button
              onTouchStart={(e) => { e.preventDefault(); if (dirRef.current !== "right") nextDirRef.current = "left"; }}
              className="w-16 h-12 bg-white/[0.08] rounded-xl flex items-center justify-center text-text/50 active:bg-accent/30 active:text-accent transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); if (dirRef.current !== "up") nextDirRef.current = "down"; }}
              className="w-16 h-12 bg-white/[0.08] rounded-xl flex items-center justify-center text-text/50 active:bg-accent/30 active:text-accent transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); if (dirRef.current !== "left") nextDirRef.current = "right"; }}
              className="w-16 h-12 bg-white/[0.08] rounded-xl flex items-center justify-center text-text/50 active:bg-accent/30 active:text-accent transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-text/[0.06] text-text/40 hover:text-text/60 hover:bg-text/[0.1] transition-colors text-xs font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Закрыть
        </button>
      )}
    </div>
  );
}
