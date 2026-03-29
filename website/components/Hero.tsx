"use client";

import { useState, useEffect, useRef } from "react";

/* ── Video Cycler — smooth crossfade between multiple videos ── */
function VideoCycler({ sources, poster }: { sources: string[]; poster?: string }) {
  const [activeSlot, setActiveSlot] = useState<"a" | "b">("a");
  const [srcA, setSrcA] = useState(sources[0]);
  const [srcB, setSrcB] = useState(sources[1] || sources[0]);
  const idxRef = useRef(0);
  const refA = useRef<HTMLVideoElement>(null);
  const refB = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Preload first video immediately
    if (refA.current) {
      refA.current.load();
      refA.current.play().catch(() => {});
    }
    if (refB.current) {
      refB.current.load();
    }

    const interval = setInterval(() => {
      idxRef.current = (idxRef.current + 1) % sources.length;
      const nextSrc = sources[idxRef.current];
      const preloadIdx = (idxRef.current + 1) % sources.length;

      if (activeSlot === "a") {
        // B becomes active, preload next into A
        setSrcB(nextSrc);
        setTimeout(() => {
          refB.current?.play().catch(() => {});
          setActiveSlot("b");
          // Preload next into A
          setTimeout(() => setSrcA(sources[preloadIdx]), 1500);
        }, 100);
      } else {
        setSrcA(nextSrc);
        setTimeout(() => {
          refA.current?.play().catch(() => {});
          setActiveSlot("a");
          setTimeout(() => setSrcB(sources[preloadIdx]), 1500);
        }, 100);
      }
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <video
        ref={refA}
        src={srcA}
        poster={poster}
        autoPlay muted loop playsInline preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out"
        style={{ opacity: activeSlot === "a" ? 1 : 0 }}
      />
      <video
        ref={refB}
        src={srcB}
        poster={poster}
        muted loop playsInline preload="auto"
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1500ms] ease-in-out"
        style={{ opacity: activeSlot === "b" ? 1 : 0 }}
      />
    </>
  );
}

/* ── Floating model cards around the mockup ── */
const floatingModels = [
  { name: "GPT-5.1", color: "#10a37f", x: "-12%", y: "10%", delay: "0s" },
  { name: "Claude Opus", color: "#C4623D", x: "85%", y: "5%", delay: "1.2s" },
  { name: "Gemini Pro", color: "#4285f4", x: "90%", y: "55%", delay: "0.6s" },
  { name: "Grok 3", color: "#1d9bf0", x: "-8%", y: "60%", delay: "1.8s" },
  { name: "DeepSeek R1", color: "#6366f1", x: "40%", y: "-8%", delay: "2.4s" },
];

function GradientMeshBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Large accent blob */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full animate-pulse-slow"
        style={{
          background: "radial-gradient(circle, rgba(217,119,87,0.18) 0%, transparent 70%)",
          top: "-10%", left: "50%", transform: "translateX(-50%)",
        }}
      />
      {/* Teal blob */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full animate-pulse-slow-alt"
        style={{
          background: "radial-gradient(circle, rgba(14,154,131,0.14) 0%, transparent 70%)",
          top: "20%", right: "-5%",
        }}
      />
      {/* Small accent dot */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full animate-pulse-slow"
        style={{
          background: "radial-gradient(circle, rgba(217,119,87,0.10) 0%, transparent 70%)",
          bottom: "5%", left: "10%",
        }}
      />
      {/* SVG mesh lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" aria-hidden="true">
        <defs>
          <pattern id="mesh" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="0.8" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mesh)" />
      </svg>
    </div>
  );
}

function ChatMockup() {
  return (
    <div className="relative mx-auto mt-16 max-w-2xl px-2">
      {/* Floating model cards */}
      {floatingModels.map((m) => (
        <div
          key={m.name}
          className="absolute hidden lg:flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-text/[0.06] animate-float z-10"
          style={{
            left: m.x, top: m.y,
            animationDelay: m.delay,
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.color }} />
          <span className="text-[11px] font-bold text-text/80 whitespace-nowrap">{m.name}</span>
        </div>
      ))}

      {/* 3D isometric wrapper */}
      <div
        style={{
          transform: "perspective(1200px) rotateY(-4deg) rotateX(3deg)",
          transformOrigin: "center center",
        }}
      >
        {/* Glow behind */}
        <div className="absolute -inset-6 bg-gradient-to-br from-accent/25 via-teal/15 to-transparent rounded-3xl blur-3xl animate-glow" />

        {/* Window */}
        <div className="relative bg-[#1C1C1E] rounded-2xl shadow-2xl shadow-black/30 overflow-hidden border border-white/[0.08]">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#2C2C2E] border-b border-white/[0.06]">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
              <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
              <span className="w-3 h-3 rounded-full bg-[#28C840]" />
            </div>
            <span className="text-white/30 text-[11px] font-medium ml-2">Stone AI</span>
            <div className="ml-auto flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
              <span className="text-[9px] text-teal/60">online</span>
            </div>
          </div>

          {/* Chat area */}
          <div className="p-5 space-y-4 min-h-[220px]">
            {/* User message */}
            <div className="flex justify-end gap-2">
              <div className="bg-accent rounded-2xl rounded-br-md px-4 py-2.5 max-w-[75%]">
                <p className="text-white text-[13px] leading-relaxed">Сравни React и Vue для стартапа из 3 человек</p>
              </div>
              <div className="w-7 h-7 rounded-full bg-accent/60 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-white">U</span>
              </div>
            </div>

            {/* AI response */}
            <div className="flex justify-start gap-2">
              <div className="w-7 h-7 rounded-full bg-teal flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[9px] font-bold text-white">AI</span>
              </div>
              <div className="bg-[#2C2C2E] rounded-2xl rounded-bl-md px-4 py-3 max-w-[80%]">
                <p className="text-white/80 text-[13px] leading-relaxed">
                  Для команды из 3 человек рекомендую <span className="text-teal font-semibold">React</span> — больше разработчиков на рынке, богатая экосистема.
                  <span className="text-white/40"> Vue проще в освоении, но при масштабировании React выигрывает за счёт TypeScript-интеграции и Next.js...</span>
                </p>
                <div className="flex items-center gap-3 mt-2.5 pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] text-white/25">GPT-5.1 · 847 tok · $0.02</span>
                </div>
              </div>
            </div>
          </div>

          {/* Model selector bar */}
          <div className="px-4 py-3 bg-[#2C2C2E] border-t border-white/[0.06] flex items-center gap-2">
            <div className="flex gap-1.5 overflow-hidden">
              {["GPT-5.1", "Claude Opus", "Gemini Pro", "DeepSeek R1", "Grok 3"].map((name, i) => (
                <span
                  key={name}
                  className={`shrink-0 px-3 py-1 rounded-lg text-[11px] font-medium ${
                    i === 0 ? "bg-accent/20 text-accent" : "bg-white/[0.04] text-white/30"
                  }`}
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderLogo({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="shrink-0 mx-5 md:mx-8 inline-flex items-center gap-2 opacity-70 hover:opacity-100 transition-opacity duration-300 select-none cursor-default"
      style={{ height: 40, color }}
    >
      {children}
    </span>
  );
}

function TrustMarquee() {
  const logos = (
    <>
      {/* OpenAI */}
      <ProviderLogo>
        <svg className="h-7 shrink-0 text-text/70" viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>
        <span className="text-lg font-bold text-text/70">OpenAI</span>
      </ProviderLogo>
      {/* Anthropic */}
      <ProviderLogo>
        <svg className="h-6 shrink-0" viewBox="0 0 24 24" fill="#D97706"><path d="M17.304 3.541h-3.483l6.196 16.918h3.483L17.304 3.541zm-10.608 0L.5 20.459h3.544l1.26-3.474h6.39l1.258 3.474h3.544L10.301 3.541H6.696zm-.437 10.71L8.5 8.168l2.24 6.083H6.259z"/></svg>
        <span style={{ fontSize: 18, fontWeight: 600, color: "#D97706" }}>Anthropic</span>
      </ProviderLogo>
      {/* Google */}
      <ProviderLogo>
        <svg className="h-6 shrink-0" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        <span style={{ fontSize: 18, fontWeight: 600, color: "#4285F4" }}>Google</span>
      </ProviderLogo>
      {/* xAI */}
      <ProviderLogo>
        <svg className="h-5 shrink-0 text-text/70" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3l7.5 9L3 21h2.5l6-7.2L17.5 21H21l-7.5-9L21 3h-2.5l-6 7.2L6.5 3H3z"/></svg>
        <span className="text-lg font-extrabold italic text-text/70">xAI</span>
      </ProviderLogo>
      {/* DeepSeek */}
      <ProviderLogo>
        <span style={{ fontSize: 20, fontWeight: 700, color: "#0891B2" }}>DeepSeek</span>
      </ProviderLogo>
      {/* Mistral */}
      <ProviderLogo>
        <svg className="h-6 shrink-0" viewBox="0 0 24 24" fill="#F97316"><rect x="0" y="0" width="5" height="5"/><rect x="19" y="0" width="5" height="5"/><rect x="0" y="6.3" width="5" height="5"/><rect x="6.3" y="6.3" width="5" height="5"/><rect x="19" y="6.3" width="5" height="5"/><rect x="0" y="12.6" width="5" height="5"/><rect x="6.3" y="12.6" width="5" height="5"/><rect x="12.6" y="12.6" width="5" height="5"/><rect x="19" y="12.6" width="5" height="5"/><rect x="0" y="19" width="5" height="5"/><rect x="19" y="19" width="5" height="5"/></svg>
        <span style={{ fontSize: 18, fontWeight: 600, color: "#F97316" }}>Mistral</span>
      </ProviderLogo>
      {/* Stability AI */}
      <ProviderLogo>
        <svg className="h-6 shrink-0" viewBox="0 0 24 24" fill="#7C3AED"><path d="M12 2L2 12l10 10 10-10L12 2zm0 3.5L18.5 12 12 18.5 5.5 12 12 5.5z"/></svg>
        <span style={{ fontSize: 18, fontWeight: 600, color: "#7C3AED" }}>Stability</span>
      </ProviderLogo>
      {/* NVIDIA */}
      <ProviderLogo>
        <span style={{ fontSize: 20, fontWeight: 800, color: "#76B900", letterSpacing: "0.05em" }}>NVIDIA</span>
      </ProviderLogo>
      {/* Perplexity */}
      <ProviderLogo>
        <span style={{ fontSize: 18, fontWeight: 600, color: "#6366F1" }}>Perplexity</span>
      </ProviderLogo>
      {/* Runway */}
      <ProviderLogo>
        <span className="text-xl font-extrabold text-text/70" style={{ letterSpacing: "-0.02em" }}>Runway</span>
      </ProviderLogo>
      {/* ElevenLabs */}
      <ProviderLogo>
        <span className="text-lg font-semibold text-text/70">ElevenLabs</span>
      </ProviderLogo>
    </>
  );

  return (
    <div className="mt-20 overflow-hidden">
      <p className="text-center text-[10px] text-text/25 font-semibold uppercase tracking-[0.2em] mb-6">
        Работаем с лучшими AI-провайдерами
      </p>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-bg to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg to-transparent z-10" />
        <div className="flex items-center w-max animate-marquee">
          <div className="flex items-center shrink-0">{logos}</div>
          <div className="flex items-center shrink-0">{logos}</div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("stone_onboarded")) {
      const timer = setTimeout(() => setShowOnboarding(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("stone_onboarded", "1");
  };

  return (
    <section className="relative pt-28 pb-10 md:pt-36 md:pb-16 overflow-hidden">
      <GradientMeshBg />

      {/* Onboarding popup */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[60] bg-[#0a0a0f]">
          <button onClick={closeOnboarding}
            className="absolute top-4 right-4 z-20 text-white/30 text-xs hover:text-white/60 px-3 py-2">
            Пропустить
          </button>
          <div className="absolute top-4 right-16 z-20 text-white/20 text-[10px]">{onboardingStep + 1} / 3</div>

          {onboardingStep === 0 && (
            <div className="h-full flex flex-col md:flex-row">
              {/* Video — half screen */}
              <div className="relative flex-1 md:w-1/2">
                <VideoCycler sources={["/demo/veo-02.mp4", "/demo/veo-06.mp4", "/demo/onboard-5.mp4"]} poster="/demo/veo-02-poster.webp" />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0a0a0f] via-transparent to-transparent" />
              </div>
              {/* Text — half screen */}
              <div className="relative md:w-1/2 flex flex-col justify-center p-6 md:p-12 pb-8">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-3 py-1 rounded-full mb-4 w-fit">
                  <span>✨</span> БЕСПЛАТНЫЕ ГЕНЕРАЦИИ
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight">
                  ГЕНЕРИРУЙ<br />С НЕЙРОСЕТЬЮ
                </h1>
                <p className="text-white/50 text-sm md:text-base mb-6 max-w-md">
                  Картинки, видео и текст от 65+ нейросетей. GPT-5.4, Claude Opus, Sora 2, DALL-E — всё в одном месте.
                </p>
                <button onClick={() => setOnboardingStep(1)}
                  className="w-full max-w-sm bg-accent text-white py-4 rounded-xl font-bold text-sm hover:bg-accent/90 transition-all shadow-lg shadow-accent/30 mb-2">
                  Начать бесплатно ✦
                </button>
              </div>
            </div>
          )}

          {onboardingStep === 1 && (
            <div className="h-full flex flex-col md:flex-row">
              <div className="relative flex-1 md:w-1/2">
                <VideoCycler sources={["/demo/veo-03.mp4", "/demo/veo-05.mp4", "/demo/onboard-2.mp4"]} poster="/demo/veo-03-poster.webp" />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0a0a0f] via-transparent to-transparent" />
              </div>
              <div className="relative md:w-1/2 flex flex-col justify-center p-6 md:p-12 pb-8">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3">
                  15 ЗАПРОСОВ<br />КАЖДЫЙ ДЕНЬ
                </h1>
                <p className="text-white/50 text-sm md:text-base mb-5">Бесплатно. Без карты. Навсегда.</p>
                <div className="grid grid-cols-4 gap-2 mb-6 max-w-sm">
                  {[
                    { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>, color: "from-accent to-orange-500", label: "Чат", sub: "7 моделей" },
                    { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>, color: "from-pink-500 to-purple-500", label: "Фото", sub: "2/день" },
                    { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0118 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-3.75 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m1.5-3.75C5.496 8.25 6 7.746 6 7.125v-1.5M4.875 8.25C5.496 8.25 6 8.754 6 9.375v1.5m0-5.25v5.25m0-5.25C6 5.004 6.504 4.5 7.125 4.5h9.75c.621 0 1.125.504 1.125 1.125m1.125 2.625h1.5m-1.5 0A1.125 1.125 0 0118 7.125v-1.5m1.125 2.625c-.621 0-1.125.504-1.125 1.125v1.5m2.625-2.625c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125M18 5.625v5.25M7.125 12h9.75m-9.75 0A1.125 1.125 0 016 10.875M7.125 12C6.504 12 6 12.504 6 13.125m0-2.25C6 11.496 5.496 12 4.875 12M18 10.875c0 .621-.504 1.125-1.125 1.125M18 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m-12 5.25v-5.25m0 5.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125m-12 0v-1.5c0-.621-.504-1.125-1.125-1.125M18 18.375v-5.25m0 5.25v-1.5c0-.621.504-1.125 1.125-1.125M18 13.125v1.5c0 .621.504 1.125 1.125 1.125M18 13.125c0-.621.504-1.125 1.125-1.125M6 13.125v1.5c0 .621-.504 1.125-1.125 1.125M6 13.125C6 12.504 5.496 12 4.875 12m-1.5 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M19.125 12h1.5m0 0c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h1.5m14.25 0h1.5" /></svg>, color: "from-blue-500 to-cyan-400", label: "Видео", sub: "подписка" },
                    { icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>, color: "from-teal to-emerald-400", label: "AI", sub: "65+ моделей" },
                  ].map(f => (
                    <div key={f.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                      <div className={`w-10 h-10 mx-auto rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-1.5`}>
                        {f.icon}
                      </div>
                      <p className="text-[10px] font-bold text-white/80">{f.label}</p>
                      <p className="text-[8px] text-white/30">{f.sub}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => setOnboardingStep(2)}
                  className="w-full max-w-sm bg-accent text-white py-4 rounded-xl font-bold text-sm hover:bg-accent/90 transition-all shadow-lg shadow-accent/30 mb-2">
                  Далее
                </button>
              </div>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="h-full flex flex-col md:flex-row">
              <div className="relative flex-1 md:w-1/2">
                <VideoCycler sources={["/demo/onboard-3.mp4", "/demo/veo-07.mp4", "/demo/veo-08.mp4"]} poster="/demo/onboard-3-poster.webp" />
                <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#0a0a0f] via-transparent to-transparent" />
              </div>
              <div className="relative md:w-1/2 flex flex-col justify-center p-6 md:p-12 pb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-2">
                  В 4.5 РАЗА ДЕШЕВЛЕ<br />CHATGPT PLUS
                </h1>
                <p className="text-white/40 text-sm mb-5">
                  ChatGPT Plus = <span className="line-through text-white/25">$20/мес (~1900₽)</span>. Stone AI Max = <span className="text-accent font-bold">890₽/мес</span>
                </p>
                <div className="flex gap-2 mb-5 max-w-sm">
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-[9px] text-white/30 font-semibold">MINI</p>
                    <p className="text-xl font-extrabold text-white">390<span className="text-sm text-white/40">₽</span></p>
                    <p className="text-[8px] text-white/25">20+ моделей</p>
                  </div>
                  <div className="flex-1 bg-accent/15 border-2 border-accent/50 rounded-xl p-3 text-center relative">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent text-white text-[7px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap">BEST VALUE</div>
                    <p className="text-[9px] text-accent/70 font-semibold">MAX</p>
                    <p className="text-xl font-extrabold text-white">890<span className="text-sm text-white/40">₽</span></p>
                    <p className="text-[8px] text-accent/60">65+ моделей</p>
                  </div>
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-[9px] text-white/30 font-semibold">MAX PRO</p>
                    <p className="text-xl font-extrabold text-white">1990<span className="text-sm text-white/40">₽</span></p>
                    <p className="text-[8px] text-white/25">безлимит + API</p>
                  </div>
                </div>
                <button onClick={closeOnboarding}
                  className="w-full max-w-sm bg-accent text-white py-4 rounded-xl font-bold text-sm hover:bg-accent/90 transition-all shadow-lg shadow-accent/30">
                  Начать бесплатно ✦
                </button>
                <a href="/pricing" onClick={closeOnboarding}
                  className="block text-center max-w-sm text-white/30 text-xs font-medium hover:text-accent transition-colors mt-3">
                  Все тарифы и способы оплаты →
                </a>
              </div>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-2 py-3 z-10">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1 rounded-full transition-all ${onboardingStep === i ? "bg-accent w-6" : "bg-white/15 w-2"}`} />
            ))}
          </div>
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            Попробуйте бесплатно
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
            Одна подписка вместо десяти
            <br />
            <span className="bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent">
              Все нейросети уже здесь
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-text/60 max-w-2xl mx-auto leading-relaxed">
            GPT-5, Claude, Gemini, Midjourney, Sora и ещё 60 нейросетей.
            <br className="hidden sm:block" />
            Пишите тексты, генерируйте картинки и видео, анализируйте документы — в одном окне.
          </p>

          {/* CTA buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="/webchat"
              className="bg-accent text-white px-8 py-4 min-h-[44px] rounded-xl font-bold text-sm hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2"
            >
              Открыть чат
            </a>
            <a
              href="/models"
              className="border-2 border-text/15 text-text px-8 py-4 min-h-[44px] rounded-xl font-bold text-sm hover:border-accent hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2"
            >
              Посмотреть модели
            </a>
          </div>
          <p className="mt-3 text-xs text-text/30">Бесплатно 15 запросов/день · Подписка от 390₽/мес</p>
          <p className="text-[11px] text-text/35 mt-4 text-center">
            Бесплатно · Без карты · 15 запросов в день
          </p>

          <div className="mt-4 flex items-center justify-center">
            <a
              href="https://t.me/drifttt55bot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-text/50 hover:text-accent transition-colors"
            >
              или откройте в Telegram →
            </a>
          </div>
        </div>

        {/* Chat mockup with floating cards */}
        <ChatMockup />

        {/* Stats */}
        <div className="mt-14 flex items-center justify-center gap-6 sm:gap-8 md:gap-16 text-xs sm:text-sm md:text-base text-text/50">
          <div className="text-center">
            <span className="block text-[32px] sm:text-[40px] md:text-[48px] leading-none font-black text-accent">65+</span>
            <span className="mt-1 block">моделей</span>
          </div>
          <div className="w-px h-12 sm:h-16 bg-text/10" />
          <div className="text-center">
            <span className="block text-[32px] sm:text-[40px] md:text-[48px] leading-none font-black text-teal">4</span>
            <span className="mt-1 block">способа оплаты</span>
          </div>
          <div className="w-px h-12 sm:h-16 bg-text/10" />
          <div className="text-center">
            <span className="block text-[32px] sm:text-[40px] md:text-[48px] leading-none font-black text-accent">$0</span>
            <span className="mt-1 block">для старта</span>
          </div>
        </div>
      </div>

      <TrustMarquee />
    </section>
  );
}
