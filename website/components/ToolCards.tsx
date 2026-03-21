"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

// All AI-generated images
const allImages = [
  "/demo/img-cosmos.jpg", "/demo/img-portrait.jpg", "/demo/img-landscape.jpg",
  "/demo/img-fantasy.jpg", "/demo/img-robot.jpg", "/demo/img-food.jpg",
  "/demo/img-abstract.jpg", "/demo/img-architecture.jpg", "/demo/img-product.jpg",
  "/demo/img-samurai.jpg", "/demo/img-underwater.jpg", "/demo/img-owl.jpg",
  "/demo/img-aurora.jpg", "/demo/img-cyberpunk.jpg", "/demo/img-temple.jpg",
  "/demo/img-droplet.jpg", "/demo/img-cabin.jpg", "/demo/img-dragon.jpg",
  "/demo/img-luxury.jpg", "/demo/img-astronaut.jpg", "/demo/img-tokyo.jpg",
  "/demo/img-sculpture.jpg", "/demo/img-tunnel.jpg", "/demo/img-tree.jpg",
];

function ImageCarousel({ images, interval = 3000 }: { images: string[]; interval?: number }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), interval);
    return () => clearInterval(t);
  }, [images.length, interval]);
  return (
    <div className="relative w-full h-full overflow-hidden">
      {images.map((src, i) => (
        <Image key={src} src={src} alt="AI-сгенерированное изображение" fill sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover" style={{ opacity: i === idx ? 1 : 0, transition: "opacity 1s ease-in-out" }} />
      ))}
    </div>
  );
}

// ── Video player — single video, crossfade between sources ──
const videoSources = ["/demo/video-1.mp4", "/demo/video-5.mp4", "/demo/video-2.mp4", "/demo/video-3.mp4", "/demo/video-4.mp4"];

function VideoCarousel() {
  const [active, setActive] = useState(0);
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);
  const idxRef = useRef(0);
  const slotRef = useRef<"a" | "b">("a");

  useEffect(() => {
    const a = refA.current, b = refB.current;
    if (!a || !b) return;

    // Init: slot A plays first video
    a.src = videoSources[0];
    a.load();
    a.play().catch(() => {});

    // Preload slot B with second video
    b.src = videoSources[1];
    b.load();

    const t = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % videoSources.length;
      const nextSlot = slotRef.current === "a" ? "b" : "a";
      const nextEl = nextSlot === "a" ? a : b;
      const oldEl = slotRef.current === "a" ? a : b;

      // Start next (already preloaded)
      nextEl.currentTime = 0;
      nextEl.play().catch(() => {});
      slotRef.current = nextSlot;
      setActive(prev => prev + 1); // trigger re-render

      // After crossfade, pause old and preload next-next
      setTimeout(() => {
        oldEl.pause();
        const preloadIdx = (idxRef.current + 1) % videoSources.length;
        oldEl.src = videoSources[preloadIdx];
        oldEl.load();
      }, 1500);
    }, 5000);

    return () => clearInterval(t);
  }, []);

  const showA = slotRef.current === "a";

  return (
    <div className="absolute inset-0">
      <video ref={refA} muted playsInline preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: showA ? 0.65 : 0, transition: "opacity 1.2s ease-in-out" }} />
      <video ref={refB} muted playsInline preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: showA ? 0 : 0.65, transition: "opacity 1.2s ease-in-out" }} />
    </div>
  );
}

// ── Typing animation hook ──
function useTyping(texts: string[], charDelay = 40, pauseDelay = 2000) {
  const [display, setDisplay] = useState("");
  const [textIdx, setTextIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const text = texts[textIdx];
    if (typing) {
      if (charIdx < text.length) {
        const t = setTimeout(() => { setCharIdx(c => c + 1); setDisplay(text.slice(0, charIdx + 1)); }, charDelay);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), pauseDelay);
        return () => clearTimeout(t);
      }
    } else {
      setTextIdx((textIdx + 1) % texts.length);
      setCharIdx(0);
      setDisplay("");
      setTyping(true);
    }
  }, [charIdx, typing, textIdx, texts, charDelay, pauseDelay]);

  return display;
}

// ── Search Demo — shows real-time multi-source search ──
function SearchDemo() {
  const queries = ["курс биткоина сегодня", "лучшие AI модели 2026", "погода в Москве завтра", "как работает GPT-5"];
  const query = useTyping(queries, 60, 3000);
  const [results, setResults] = useState(0);

  useEffect(() => {
    if (query.length > 5) setResults(Math.min(3, Math.floor((query.length - 5) / 4)));
    else setResults(0);
  }, [query]);

  const resultLines = [
    { source: "Google", title: "Bitcoin price today: $94,230 (+2.3%)", time: "0.3с" },
    { source: "News", title: "BTC обновил максимум на фоне решения ФРС", time: "0.8с" },
    { source: "Scholar", title: "Cryptocurrency Market Analysis Q1 2026", time: "1.2с" },
  ];

  return (
    <div className="bg-white/[0.06] rounded-xl p-3 border border-white/[0.06] space-y-2">
      <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-2.5 py-1.5 border border-white/[0.06]">
        <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
        <span className="text-[11px] text-white/60 flex-1">{query}<span className="animate-pulse">|</span></span>
      </div>
      <div className="flex gap-1">
        {["Google", "Bing", "News", "Scholar"].map((e, i) => (
          <span key={e} className={`text-[8px] px-1.5 py-0.5 rounded transition-colors duration-300 ${results > i ? "bg-emerald-500/20 text-emerald-300" : "bg-white/[0.03] text-white/15"}`}>{e}</span>
        ))}
      </div>
      <div className="space-y-1.5">
        {resultLines.slice(0, results).map((r, i) => (
          <div key={i} className="flex items-start gap-2 animate-fadeIn">
            <span className="text-[7px] bg-emerald-500/15 text-emerald-400 px-1 py-0.5 rounded shrink-0 mt-0.5">{r.source}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-white/60 truncate">{r.title}</div>
              <div className="text-[8px] text-white/20">{r.time}</div>
            </div>
          </div>
        ))}
        {results < 3 && query.length > 3 && (
          <div className="flex gap-1 items-center"><div className="w-2 h-2 rounded-full bg-emerald-400/30 animate-pulse" /><span className="text-[8px] text-white/20">Поиск...</span></div>
        )}
      </div>
    </div>
  );
}

// ── Document Analysis Demo ──
function DocAnalysisDemo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const steps = [0, 1, 2, 3, 4];
    let i = 0;
    const t = setInterval(() => { i = (i + 1) % steps.length; setStep(steps[i]); }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="bg-white/[0.06] rounded-xl p-3 border border-white/[0.06]">
      {/* File upload */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
          <span className="text-[8px] font-bold text-amber-400">PDF</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-white/60">contract_2026.pdf</div>
          <div className="text-[8px] text-white/25">127 стр · 4.2 MB</div>
        </div>
        <span className={`text-[8px] px-1.5 py-0.5 rounded transition-all duration-500 ${step >= 1 ? "bg-emerald-400/15 text-emerald-400" : "bg-white/[0.04] text-white/15"}`}>
          {step >= 1 ? "✓ Готово" : "Загрузка..."}
        </span>
      </div>
      {/* Progress */}
      <div className="h-1 bg-white/[0.04] rounded-full mb-2 overflow-hidden">
        <div className="h-full bg-amber-400/40 rounded-full transition-all duration-1000" style={{ width: `${Math.min(step * 30, 100)}%` }} />
      </div>
      {/* Analysis results appearing one by one */}
      <div className="border-t border-white/[0.04] pt-2 space-y-1">
        <div className="text-[9px] text-white/30 mb-1">AI анализирует документ...</div>
        {step >= 2 && <div className="text-[10px] text-white/60 animate-fadeIn">📌 Срок: 01.01.2027 — 31.12.2029 (§3.1)</div>}
        {step >= 3 && <div className="text-[10px] text-red-400/80 animate-fadeIn">⚠️ Штраф 15% за досрочное расторжение (§12.4)</div>}
        {step >= 4 && <div className="text-[10px] text-amber-400/80 animate-fadeIn">⚠️ Автопролонгация без уведомления (§8.1)</div>}
      </div>
    </div>
  );
}

// ── Reasoning Demo ──
function ReasoningDemo() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % 5), 2500);
    return () => clearInterval(t);
  }, []);

  const steps = [
    { n: "1", label: "Разбор", text: "Определяю переменные: x, y, z ∈ ℝ, x²+y²=1" },
    { n: "2", label: "Подход А", text: "Метод Лагранжа: L = f(x,y) - λ·g(x,y)" },
    { n: "3", label: "Подход Б", text: "Параметризация: x=cos(t), y=sin(t), t∈[0,2π]" },
    { n: "4", label: "Решение", text: "max f = √2 при t = π/4, точка (√2/2, √2/2)" },
  ];

  return (
    <div className="bg-white/[0.06] rounded-xl p-3 border border-white/[0.06] space-y-2">
      {steps.map((s, i) => (
        <div key={i} className={`flex items-start gap-2 transition-opacity duration-500 ${step >= i ? "opacity-100" : "opacity-20"}`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors duration-500 ${
            step > i ? "bg-violet-500/40" : step === i ? "bg-violet-500/20 animate-pulse" : "border border-white/10"
          }`}>
            <span className="text-[8px] text-violet-300 font-bold">{s.n}</span>
          </div>
          <div className="min-w-0">
            <div className="text-[8px] text-violet-400/60">{s.label}</div>
            <div className="text-[10px] text-white/60 font-mono">{step >= i ? s.text : "..."}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Chat Demo — typing conversation ──
function ChatDemo() {
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % 4), 4000);
    return () => clearInterval(t);
  }, []);

  const msgs = [
    { role: "user", text: "Напиши quicksort на Python" },
    { role: "ai", text: "def quicksort(arr):\n  if len(arr) <= 1: return arr\n  pivot = arr[0]\n  return quicksort([x for x in arr..." },
    { role: "user", text: "Теперь на Rust с дженериками" },
    { role: "ai", text: "fn quicksort<T: Ord>(mut arr: Vec<T>)\n  -> Vec<T> {\n  if arr.len() <= 1 { return arr; }\n  let pivot = arr.remove(0)..." },
  ];

  return (
    <div className="bg-white/[0.06] rounded-xl p-3 border border-white/[0.06] space-y-2">
      {msgs.slice(0, msgIdx + 1).map((m, i) => (
        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fadeIn`}>
          <div className={`max-w-[85%] rounded-xl px-2.5 py-1.5 ${m.role === "user" ? "bg-accent/60 text-white" : "bg-white/10 text-white/70"}`}>
            <pre className="text-[9px] whitespace-pre-wrap font-mono leading-relaxed">{m.text}</pre>
          </div>
        </div>
      ))}
      {msgIdx < 3 && (
        <div className="flex gap-1 pl-1">
          <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      )}
    </div>
  );
}

// ── Audio Card with real Web Audio API equalizer ──
const BAR_COUNT = 32;
const DEMO_TEXT = "Привет! Я Stone AI. Пятьдесят нейросетей в одном месте.";

function AudioCard() {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const barsRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Idle breathing animation
  const idleBars = Array.from({ length: BAR_COUNT }, (_, i) => {
    const base = Math.sin(i * 0.4) * 0.3 + 0.5;
    return base;
  });

  const drawBars = (data?: Uint8Array) => {
    const el = barsRef.current;
    if (!el) return;
    const bars = el.children;
    for (let i = 0; i < bars.length; i++) {
      let h: number;
      if (data) {
        const idx = Math.floor((i / BAR_COUNT) * data.length);
        h = data[idx] / 255;
      } else {
        // Idle: gentle sine wave breathing
        const t = Date.now() / 1000;
        h = Math.sin(t * 1.5 + i * 0.3) * 0.25 + 0.35;
      }
      (bars[i] as HTMLElement).style.height = `${Math.max(h * 100, 8)}%`;
    }
  };

  // Idle animation loop
  useEffect(() => {
    if (playing) return;
    let running = true;
    const tick = () => {
      if (!running) return;
      drawBars();
      animRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [playing]);

  const handlePlay = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (playing) {
      // Stop
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }

    setLoading(true);

    try {
      // Use pre-generated demo audio
      const audio = new Audio("/demo/audio-demo.mp3");
      audioRef.current = audio;

      // Set up Web Audio API
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audio.onended = () => {
        setPlaying(false);
        cancelAnimationFrame(animRef.current);
      };

      await audio.play();
      setPlaying(true);
      setLoading(false);

      // Real-time visualization
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const draw = () => {
        if (!audioRef.current || audioRef.current.paused) return;
        analyser.getByteFrequencyData(dataArray);
        drawBars(dataArray);
        animRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch {
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-gradient-to-br from-indigo-600 via-blue-700 to-violet-800 rounded-2xl p-6 group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[220px] cursor-pointer"
      onClick={handlePlay}
    >
      <span className="inline-block bg-white/15 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">10+ голосов</span>
      <h3 className="font-bold text-lg text-white mb-2">ИИ Аудио</h3>
      <p className="text-white/60 text-[13px] mb-3">Нейросеть озвучивает текст 10+ голосами. Голосовой ввод через Whisper</p>

      {/* Play/Stop button */}
      <div className="flex items-center gap-3 mb-4">
        <button className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${playing ? "bg-white/30" : "bg-white/20 hover:bg-white/30"}`}>
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : playing ? (
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
          ) : (
            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
        <span className="text-[11px] text-white/50">
          {loading ? "Загрузка..." : playing ? "Воспроизведение" : "Нажмите Play для демо"}
        </span>
      </div>

      {/* Equalizer bars */}
      <div ref={barsRef} className="flex items-end gap-[2px] h-12">
        {Array.from({ length: BAR_COUNT }, (_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors duration-300 ${playing ? "bg-white/60" : "bg-white/20"}`}
            style={{ height: "30%", transition: "height 60ms linear, background-color 300ms" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ToolCards() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Полный арсенал AI инструментов для любой задачи
        </h2>
        <p className="text-text/60 text-center mb-12 max-w-lg mx-auto">
          Все инструменты AI в одном месте
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-auto">

          {/* ── AI Chat — live typing conversation ── */}
          <a href="/chat" className="sm:col-span-2 bg-[var(--color-card-dark)] rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[260px] sm:min-h-[300px]">
            <div className="relative z-10 mb-4">
              <span className="inline-block bg-accent/20 text-accent text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">50+ нейросетей</span>
              <h3 className="font-bold text-lg sm:text-xl text-white mb-1">ИИ Чат-бот</h3>
              <p className="text-white/50 text-[12px] sm:text-[13px] max-w-[140px] sm:max-w-[200px]">GPT-5, Claude, Gemini и Grok — переключайтесь между нейросетями за секунду</p>
            </div>
            <div className="absolute right-3 sm:right-6 top-4 bottom-4 w-[50%] sm:w-[60%]">
              <ChatDemo />
            </div>
          </a>

          {/* ── Images — full-bleed cycling gallery ── */}
          <a href="/images" className="bg-[var(--color-card-dark)] rounded-2xl block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[300px]">
            <div className="absolute inset-0">
              <ImageCarousel images={allImages} interval={2000} />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card-dark)] via-[var(--color-card-dark)]/20 to-transparent" />
            </div>
            <div className="relative z-10 p-6 flex flex-col justify-end h-full">
              <span className="inline-block bg-pink-500/30 text-pink-300 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3 w-fit">24 стиля</span>
              <h3 className="font-bold text-xl text-white mb-1">Генерация картинок</h3>
              <p className="text-white/80 text-[13px]">Фотореализм, арт, фэнтези — от $0.012 за картинку. 6 нейросетей на выбор</p>
            </div>
          </a>

          {/* ── Search — live multi-source search, FIXED HEIGHT ── */}
          <a href="/search" className="bg-[var(--color-card-dark)] rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative" style={{ height: 320 }}>
            <span className="inline-block bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">Realtime</span>
            <h3 className="font-bold text-lg text-white mb-1">ИИ Поиск</h3>
            <p className="text-white/50 text-[13px] mb-4">Perplexity ищет в Google, Bing, News и даёт ответ со ссылками</p>
            <SearchDemo />
          </a>

          {/* ── Documents — live PDF analysis, FIXED HEIGHT ── */}
          <a href="/documents" className="bg-[var(--color-card-dark)] rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative" style={{ height: 320 }}>
            <span className="inline-block bg-amber-500/20 text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">PDF, фото</span>
            <h3 className="font-bold text-lg text-white mb-1">Анализ документов</h3>
            <p className="text-white/50 text-[13px] mb-4">Загрузите PDF или фото — нейросеть найдёт ключевые пункты и ответит на вопросы</p>
            <DocAnalysisDemo />
          </a>

          {/* ── Video — cycling real videos ── */}
          <a href="/video" className="bg-[var(--color-card-dark)] rounded-2xl block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[220px]">
            <VideoCarousel />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card-dark)] via-[var(--color-card-dark)]/20 to-transparent pointer-events-none" />
            <div className="relative z-10 p-6 flex flex-col justify-end h-full pointer-events-none">
              <span className="inline-block bg-red-500/30 text-red-300 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-2 w-fit">5 моделей</span>
              <h3 className="font-bold text-lg text-white mb-1">ИИ Видео</h3>
              <p className="text-white/70 text-[13px]">Kling, Runway, Pika — нейросеть создаёт видео из текста или фото. От $0.15</p>
            </div>
          </a>

          {/* ── Audio — interactive equalizer ── */}
          <AudioCard />

          {/* ── 3D — real rotating model ── */}
          <a href="/3d" className="bg-[var(--color-card-dark)] rounded-2xl block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative min-h-[220px]">
            <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: `<model-viewer src="/demo/model-demo.glb" auto-rotate camera-controls touch-action="pan-y" interaction-prompt="none" style="width:100%;height:100%;background:#1C1C1E" shadow-intensity="0.5" exposure="1.5"></model-viewer>` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card-dark)] via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 p-6 flex flex-col justify-end h-full pointer-events-none">
              <span className="inline-block bg-cyan-500/30 text-cyan-300 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-2 w-fit">Tripo + TripoSR</span>
              <h3 className="font-bold text-lg text-white mb-1">3D Модели</h3>
              <p className="text-white/50 text-[13px]">Нейросеть создаёт 3D из текста или фото. GLB для игр и печати. Вращайте!</p>
            </div>
          </a>

          {/* ── Deep Analysis — live reasoning chain, FIXED HEIGHT ── */}
          <a href="/chat" className="bg-[var(--color-card-dark)] rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden relative" style={{ height: 320 }}>
            <span className="inline-block bg-violet-500/20 text-violet-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">o3 + DeepSeek R1</span>
            <h3 className="font-bold text-lg text-white mb-1">Глубокий анализ</h3>
            <p className="text-white/50 text-[13px] mb-4">Reasoning-нейросети думают пошагово: математика, логика, сложные задачи</p>
            <ReasoningDemo />
          </a>

          {/* ── API — code snippet ── */}
          <a href="/docs" className="bg-gradient-to-br from-slate-600 via-slate-700 to-zinc-900 rounded-2xl p-6 block group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden min-h-[180px]">
            <span className="inline-block bg-sky-400/20 text-sky-300 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide mb-3">API</span>
            <h3 className="font-bold text-lg text-white mb-1">Простой API</h3>
            <p className="text-white/50 text-[13px] mb-3">REST API для 50+ нейросетей. SSE-стриминг, JWT-авторизация</p>
            <div className="bg-white/[0.04] rounded-xl p-3 overflow-x-auto border border-white/[0.06]">
              <pre className="text-[11px] leading-[1.7] font-mono" dangerouslySetInnerHTML={{ __html: `<span style="color:#34d399">curl</span><span style="color:rgba(255,255,255,0.5)"> -X </span><span style="color:#fcd34d">POST</span><span style="color:rgba(255,255,255,0.5)"> /api/chat \\
  -H </span><span style="color:#7dd3fc">"Bearer $TKN"</span><span style="color:rgba(255,255,255,0.5)"> \\
  -d </span><span style="color:#7dd3fc">'{"model_id"</span><span style="color:rgba(255,255,255,0.5)">:</span><span style="color:#fcd34d">"gpt-4o-mini"</span><span style="color:rgba(255,255,255,0.5)">,
      </span><span style="color:#7dd3fc">"messages"</span><span style="color:rgba(255,255,255,0.5)">:[...]}'</span>` }} />
            </div>
          </a>

        </div>
      </div>
    </section>
  );
}
