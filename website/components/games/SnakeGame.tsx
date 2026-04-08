"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const GRID = 20;
type Pos = { x: number; y: number };
type Dir = "up" | "down" | "left" | "right";
type State = "ready" | "playing" | "over";
type Particle = { x: number; y: number; vx: number; vy: number; alpha: number; color: string };
type FruitType = "normal" | "gold" | "diamond";
type BonusFruit = { pos: Pos; type: FruitType; expiresAt: number };

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";
const BASE_SPEED = 150, MIN_SPEED = 60, SPEED_STEP = 8;
const getSpeed = (s: number) => Math.max(MIN_SPEED, BASE_SPEED - Math.floor(s / 5) * SPEED_STEP);
const getLevel = (s: number) => s >= 50 ? 4 : s >= 25 ? 3 : s >= 10 ? 2 : 1;
const getWallCount = (s: number) => s >= 50 ? 6 : s >= 25 ? 4 : s >= 10 ? 2 : 0;
const getMascotReaction = (s: number) => s >= 50 ? "Легенда! 🏆" : s >= 30 ? "Отлично! 🔥" : s >= 10 ? "Неплохо!" : "Попробуй ещё!";
const FRUIT: Record<FruitType, { pts: number; color: string; emoji: string; freq: number }> = {
  normal: { pts: 1, color: "#ef4444", emoji: "🍎", freq: 600 },
  gold: { pts: 3, color: "#eab308", emoji: "⭐", freq: 800 },
  diamond: { pts: 5, color: "#06b6d4", emoji: "💎", freq: 1000 },
};
const OPP: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };
const DPAD: { dir: Dir; svg: string; row: "top" | "mid" }[] = [
  { dir: "up", svg: "M5 15l7-7 7 7", row: "top" },
  { dir: "left", svg: "M15 19l-7-7 7-7", row: "mid" },
  { dir: "down", svg: "M19 9l-7 7-7-7", row: "mid" },
  { dir: "right", svg: "M9 5l7 7-7 7", row: "mid" },
];

interface SnakeGameProps { token?: string; onClose?: () => void; compact?: boolean; onShowLeaderboard?: () => void }

export default function SnakeGame({ token, onClose, compact, onShowLeaderboard }: SnakeGameProps) {
  const CELL = compact ? 12.5 : 15, SIZE = CELL * GRID;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameState, setGameState] = useState<State>("ready");
  const [paused, setPaused] = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [level, setLevel] = useState(1);
  const [levelFlash, setLevelFlash] = useState(false);
  const snakeRef = useRef<Pos[]>([{ x: 10, y: 10 }]);
  const foodRef = useRef<Pos>({ x: 15, y: 10 });
  const dirRef = useRef<Dir>("right");
  const nextDirRef = useRef<Dir>("right");
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isMutedRef = useRef(false);
  const bonusRef = useRef<BonusFruit | null>(null);
  const wallsRef = useRef<Pos[]>([]);
  const bonusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { setBest(parseInt(localStorage.getItem("snake_best") || "0")); }, []);

  const occupied = useCallback((p: Pos, snake: Pos[], walls: Pos[], food: Pos, bonus: BonusFruit | null) => {
    return snake.some(s => s.x === p.x && s.y === p.y) || walls.some(w => w.x === p.x && w.y === p.y)
      || (food.x === p.x && food.y === p.y) || !!(bonus && bonus.pos.x === p.x && bonus.pos.y === p.y);
  }, []);

  const playSound = useCallback((type: "eat" | "die" | "start", freq = 600) => {
    if (isMutedRef.current || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current, osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (type === "eat") {
      osc.type = "sine"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
    } else if (type === "die") {
      osc.type = "sawtooth"; osc.frequency.value = 200;
      gain.gain.setValueAtTime(0.15, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
    } else {
      osc.type = "sine"; osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.12, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
    }
  }, []);

  const spawnParticles = useCallback((pos: Pos, color = "#ef4444") => {
    const ps: Particle[] = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2, sp = 1 + Math.random() * 2;
      ps.push({ x: pos.x * CELL + CELL / 2, y: pos.y * CELL + CELL / 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, alpha: 1, color });
    }
    particlesRef.current = [...particlesRef.current, ...ps];
  }, [CELL]);

  const randFree = useCallback((snake: Pos[], walls: Pos[], food: Pos, bonus: BonusFruit | null) => {
    let p: Pos, n = 0;
    do { p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }; n++; }
    while (occupied(p, snake, walls, food, bonus) && n < 200);
    return p;
  }, [occupied]);

  const spawnFood = useCallback(() => {
    foodRef.current = randFree(snakeRef.current, wallsRef.current, { x: -1, y: -1 }, bonusRef.current);
  }, [randFree]);

  const spawnWalls = useCallback((sc: number) => {
    const count = getWallCount(sc), cur = wallsRef.current.length;
    if (count <= cur) return;
    const newW = [...wallsRef.current];
    for (let i = cur; i < count; i++) {
      const p = randFree(snakeRef.current, newW, foodRef.current, bonusRef.current);
      newW.push(p);
    }
    wallsRef.current = newW;
  }, [randFree]);

  const scheduleBonus = useCallback(() => {
    if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
    const isGold = Math.random() > 0.4;
    const delay = isGold ? 15000 + Math.random() * 10000 : 30000 + Math.random() * 20000;
    bonusTimerRef.current = setTimeout(() => {
      const type: FruitType = isGold ? "gold" : "diamond";
      const p = randFree(snakeRef.current, wallsRef.current, foodRef.current, null);
      bonusRef.current = { pos: p, type, expiresAt: Date.now() + (isGold ? 5000 : 3000) };
      scheduleBonus();
    }, delay);
  }, [randFree]);

  const draw = useCallback(() => {
    const c = canvasRef.current?.getContext("2d"); if (!c) return;
    const snake = snakeRef.current, food = foodRef.current, walls = wallsRef.current, now = Date.now();
    if (bonusRef.current && now >= bonusRef.current.expiresAt) bonusRef.current = null;
    c.fillStyle = "#0f0f1a"; c.fillRect(0, 0, SIZE, SIZE);
    c.strokeStyle = "rgba(255,255,255,0.03)"; c.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      c.beginPath(); c.moveTo(i * CELL, 0); c.lineTo(i * CELL, SIZE); c.stroke();
      c.beginPath(); c.moveTo(0, i * CELL); c.lineTo(SIZE, i * CELL); c.stroke();
    }
    // Walls
    walls.forEach(w => {
      c.fillStyle = "#4a4a5a"; c.strokeStyle = "#2a2a3a"; c.lineWidth = 1;
      c.fillRect(w.x * CELL + 1, w.y * CELL + 1, CELL - 2, CELL - 2);
      c.strokeRect(w.x * CELL + 1, w.y * CELL + 1, CELL - 2, CELL - 2);
    });
    // Food
    const pulse = 0.8 + 0.2 * Math.sin(now / 200), fs = CELL * 0.8 * pulse;
    c.font = `${fs}px serif`; c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("🍎", food.x * CELL + CELL / 2, food.y * CELL + CELL / 2 + 1);
    // Bonus
    const bon = bonusRef.current;
    if (bon) {
      const rem = bon.expiresAt - now;
      c.globalAlpha = rem < 1000 ? (Math.sin(now / 80) > 0 ? 1 : 0.3) : 1;
      c.font = `${CELL * 0.9 * pulse}px serif`;
      c.fillText(FRUIT[bon.type].emoji, bon.pos.x * CELL + CELL / 2, bon.pos.y * CELL + CELL / 2 + 1);
      c.globalAlpha = 1;
    }
    // Snake
    snake.forEach((s, i) => {
      const r = CELL * 0.45, op = 1 - (i / snake.length) * 0.5;
      c.fillStyle = i === 0 ? "#16a34a" : `rgba(34, 197, 94, ${op})`;
      c.beginPath(); c.roundRect(s.x * CELL + (CELL - r * 2) / 2, s.y * CELL + (CELL - r * 2) / 2, r * 2, r * 2, 3); c.fill();
      if (i === 0) {
        const cx = s.x * CELL + CELL / 2, cy = s.y * CELL + CELL / 2, o = CELL * 0.15, er = CELL * 0.08;
        const d = dirRef.current;
        const [e1, e2] = d === "right" ? [[cx + o, cy - o], [cx + o, cy + o]]
          : d === "left" ? [[cx - o, cy - o], [cx - o, cy + o]]
          : d === "up" ? [[cx - o, cy - o], [cx + o, cy - o]]
          : [[cx - o, cy + o], [cx + o, cy + o]];
        c.fillStyle = "#fff";
        c.beginPath(); c.arc(e1[0], e1[1], er, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(e2[0], e2[1], er, 0, Math.PI * 2); c.fill();
      }
    });
    // Particles
    particlesRef.current = particlesRef.current.filter(p => p.alpha > 0);
    particlesRef.current.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.alpha -= 0.04;
      if (p.alpha > 0) {
        const hex = Math.round(p.alpha * 255).toString(16).padStart(2, "0");
        c.fillStyle = `${p.color}${hex}`; c.beginPath(); c.arc(p.x, p.y, 2, 0, Math.PI * 2); c.fill();
      }
    });
  }, [CELL, SIZE]);

  const gameOver = useCallback(() => {
    setGameState("over"); playSound("die");
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
    // Keep RAF running briefly for death particles, then stop
    setTimeout(() => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current); }, 500);
    const s = scoreRef.current, b = parseInt(localStorage.getItem("snake_best") || "0");
    if (s > b) {
      localStorage.setItem("snake_best", String(s)); setBest(s); setNewRecord(true);
      if (token) fetch(`${API_URL}/api/games/score`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ game: "snake", score: s }),
      }).catch(() => {});
    } else setNewRecord(false);
  }, [token, playSound]);

  const tick = useCallback(() => {
    dirRef.current = nextDirRef.current;
    const snake = [...snakeRef.current], head = { ...snake[0] };
    if (dirRef.current === "up") head.y--; else if (dirRef.current === "down") head.y++;
    else if (dirRef.current === "left") head.x--; else head.x++;
    if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) { gameOver(); return; }
    if (snake.some(s => s.x === head.x && s.y === head.y)) { gameOver(); return; }
    if (wallsRef.current.some(w => w.x === head.x && w.y === head.y)) { gameOver(); return; }
    snake.unshift(head);
    let ate = false;
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      scoreRef.current += 1; ate = true;
      spawnParticles(foodRef.current, FRUIT.normal.color); playSound("eat", FRUIT.normal.freq); spawnFood();
    }
    const bon = bonusRef.current;
    if (bon && head.x === bon.pos.x && head.y === bon.pos.y) {
      const cfg = FRUIT[bon.type]; scoreRef.current += cfg.pts; ate = true;
      spawnParticles(bon.pos, cfg.color); playSound("eat", cfg.freq); bonusRef.current = null;
    }
    if (ate) {
      const nl = getLevel(scoreRef.current); setScore(scoreRef.current);
      if (nl > levelRef.current) { levelRef.current = nl; setLevel(nl); setLevelFlash(true); setTimeout(() => setLevelFlash(false), 400); }
      spawnWalls(scoreRef.current);
    } else snake.pop();
    snakeRef.current = snake;
  }, [gameOver, spawnFood, spawnParticles, playSound, spawnWalls]);

  // 60 FPS render loop — smooth drawing independent of game tick
  const renderLoop = useCallback(() => {
    draw();
    animFrameRef.current = requestAnimationFrame(renderLoop);
  }, [draw]);

  const startGame = useCallback(() => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    snakeRef.current = [{ x: 10, y: 10 }]; dirRef.current = "right"; nextDirRef.current = "right";
    scoreRef.current = 0; levelRef.current = 1; particlesRef.current = []; wallsRef.current = []; bonusRef.current = null;
    setScore(0); setLevel(1); setNewRecord(false); setGameState("playing");
    spawnFood(); playSound("start"); scheduleBonus();
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, BASE_SPEED);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(renderLoop);
  }, [tick, spawnFood, playSound, scheduleBonus, renderLoop]);

  useEffect(() => {
    if (gameState !== "playing" || paused) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, getSpeed(scoreRef.current));
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [score, gameState, paused, tick]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const d = dirRef.current;
      if ((e.key === "ArrowUp" || e.key === "w") && d !== "down") nextDirRef.current = "up";
      if ((e.key === "ArrowDown" || e.key === "s") && d !== "up") nextDirRef.current = "down";
      if ((e.key === "ArrowLeft" || e.key === "a") && d !== "right") nextDirRef.current = "left";
      if ((e.key === "ArrowRight" || e.key === "d") && d !== "left") nextDirRef.current = "right";
      if (e.key === " " && (gameState === "ready" || gameState === "over")) startGame();
      if ((e.key === "Escape" || e.key === "p") && gameState === "playing") setPaused(p => !p);
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [gameState, startGame]);

  useEffect(() => () => {
    if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x, dy = e.changedTouches[0].clientY - touchStart.current.y, d = dirRef.current;
    if (Math.abs(dx) > Math.abs(dy)) { if (dx > 30 && d !== "left") nextDirRef.current = "right"; if (dx < -30 && d !== "right") nextDirRef.current = "left"; }
    else { if (dy > 30 && d !== "up") nextDirRef.current = "down"; if (dy < -30 && d !== "down") nextDirRef.current = "up"; }
  };

  useEffect(() => { draw(); }, [draw]);
  const speedLabel = `x${(BASE_SPEED / getSpeed(score)).toFixed(1)}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`flex items-center justify-between w-full px-1 ${compact ? "max-w-[250px]" : "max-w-[300px]"}`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-text">Счёт: {score}</span>
          <span className="text-[10px] text-purple-400/80 font-mono">Ур.{level}</span>
          <button onClick={() => setIsMuted(m => !m)} className="text-sm text-text/50 hover:text-text/80 transition-colors" title={isMuted ? "Включить звук" : "Выключить звук"}>
            {isMuted ? "\uD83D\uDD07" : "\uD83D\uDD0A"}
          </button>
          {gameState === "playing" && (
            <button onClick={() => setPaused(p => !p)} className="text-sm text-text/50 hover:text-text/80 transition-colors" title={paused ? "Продолжить (P)" : "Пауза (P)"}>{paused ? "▶️" : "⏸️"}</button>
          )}
          {gameState === "playing" && !paused && <span className="text-[10px] text-emerald-400/70 font-mono">{speedLabel}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text/30">Рекорд: {best}</span>
          {onClose && (
            <button onClick={onClose} className="w-7 h-7 rounded-lg bg-text/[0.08] hover:bg-red-500/20 hover:text-red-400 text-text/30 flex items-center justify-center transition-colors" title="Закрыть">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      <div className="w-full flex justify-center">
      <div className="relative" style={{ maxWidth: SIZE, width: "100%" }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <canvas ref={canvasRef} width={SIZE} height={SIZE} className={`rounded-xl border border-text/10 w-full h-auto transition-all duration-300 ${levelFlash ? "ring-2 ring-purple-400/60" : ""}`} style={{ touchAction: "none" }} />

        {paused && gameState === "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl" onClick={() => setPaused(false)}>
            <span className="text-3xl mb-2">⏸️</span>
            <p className="text-white font-bold text-lg mb-3">ПАУЗА</p>
            <button onClick={() => setPaused(false)} className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90">Продолжить</button>
          </div>
        )}

        {gameState === "ready" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-xl">
            <span className="text-2xl mb-1">{"\uD83D\uDC0D"}</span>
            <span className="text-xs text-white/50 mb-2">Готов?</span>
            <button onClick={startGame} className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90">Играть</button>
            <span className="text-[10px] text-white/30 mt-2">
              <span className="sm:hidden">Свайп или кнопки</span><span className="hidden sm:inline">WASD / стрелки</span>
            </span>
          </div>
        )}

        {gameState === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl">
            <span className="text-lg font-bold text-white mb-1">Game Over!</span>
            <span className="text-4xl font-extrabold text-accent mb-1">{score}</span>
            <span className="text-sm text-white/70 mb-1">{getMascotReaction(score)}</span>
            {newRecord ? <span className="text-sm text-amber-400 font-bold mb-2 animate-bounce">{"\uD83C\uDF89"} Новый рекорд!</span> : <div className="mb-2" />}
            <div className="flex flex-col gap-2">
              <button onClick={startGame} className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90">Играть снова</button>
              {onShowLeaderboard && <button onClick={onShowLeaderboard} className="bg-white/10 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors">Лидерборд</button>}
            </div>
          </div>
        )}
      </div>
      </div>

      <div className="sm:hidden select-none mt-1 w-full flex justify-center">
        <div className="flex flex-col items-center gap-1.5">
          <button onTouchStart={(e) => { e.preventDefault(); if (dirRef.current !== "down") nextDirRef.current = "up"; }}
            className="w-16 h-12 bg-white/[0.08] rounded-xl flex items-center justify-center text-text/50 active:bg-accent/30 active:text-accent transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
          </button>
          <div className="flex gap-1.5">
            {(["left", "down", "right"] as Dir[]).map(d => (
              <button key={d} onTouchStart={(e) => { e.preventDefault(); if (dirRef.current !== OPP[d]) nextDirRef.current = d; }}
                className="w-16 h-12 bg-white/[0.08] rounded-xl flex items-center justify-center text-text/50 active:bg-accent/30 active:text-accent transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={DPAD.find(b => b.dir === d)!.svg} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
