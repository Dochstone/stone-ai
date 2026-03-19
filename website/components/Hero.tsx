"use client";

/* ── Floating model cards around the mockup ── */
const floatingModels = [
  { name: "GPT-5.1", color: "#10a37f", x: "-12%", y: "10%", delay: "0s" },
  { name: "Claude Opus", color: "#D97757", x: "85%", y: "5%", delay: "1.2s" },
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
            <div className="flex justify-end">
              <div className="bg-accent rounded-2xl rounded-br-md px-4 py-2.5 max-w-[75%]">
                <p className="text-white text-[13px] leading-relaxed">Сравни React и Vue для стартапа из 3 человек</p>
              </div>
            </div>

            {/* AI response */}
            <div className="flex justify-start">
              <div className="bg-[#2C2C2E] rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
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

function ProviderLogo({ children, color, className = "" }: { children: React.ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={`shrink-0 mx-6 md:mx-9 inline-flex items-center gap-1.5 opacity-[0.4] hover:opacity-[0.7] transition-opacity duration-300 select-none cursor-default ${className}`}
      style={{ width: 120, height: 40, color }}
    >
      {children}
    </span>
  );
}

function TrustMarquee() {
  const logos = (
    <>
      {/* OpenAI — black bold + circle dot */}
      <ProviderLogo color="#1A1916">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fillOpacity="0.15"/><circle cx="12" cy="12" r="4"/></svg>
        <span className="text-lg font-extrabold tracking-tight">OpenAI</span>
      </ProviderLogo>
      {/* Anthropic — orange + starburst */}
      <ProviderLogo color="#d97706">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.09 6.26L20.18 8l-4.91 3.82L17.36 18 12 14.27 6.64 18l2.09-6.18L3.82 8l6.09.26z"/></svg>
        <span className="text-lg font-medium">Anthropic</span>
      </ProviderLogo>
      {/* Google — 4-color letters */}
      <ProviderLogo>
        <span className="text-lg font-medium tracking-tight">
          <span style={{color:"#4285f4"}}>G</span><span style={{color:"#ea4335"}}>o</span><span style={{color:"#fbbc05"}}>o</span><span style={{color:"#4285f4"}}>g</span><span style={{color:"#34a853"}}>l</span><span style={{color:"#ea4335"}}>e</span>
        </span>
      </ProviderLogo>
      {/* xAI — bold italic on dark badge */}
      <ProviderLogo>
        <span className="bg-[#1A1916] text-white text-sm font-extrabold italic px-3 py-1 rounded-lg">xAI</span>
      </ProviderLogo>
      {/* DeepSeek — cyan + whale */}
      <ProviderLogo color="#06b6d4">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><ellipse cx="12" cy="13" rx="9" ry="7" fillOpacity="0.2"/><path d="M5 12c0-4 3.5-7 7-7s7 3 7 7c0 3-2 5.5-4 6.5C13.5 19.5 12 20 12 20s-1.5-.5-3-1.5C7 17.5 5 15 5 12z" fillOpacity="0.6"/><circle cx="9" cy="11" r="1"/></svg>
        <span className="text-lg font-normal">DeepSeek</span>
      </ProviderLogo>
      {/* Meta — blue + infinity */}
      <ProviderLogo color="#0668E1">
        <svg className="w-5 h-4 shrink-0" viewBox="0 0 24 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 8c0-3 2-5 4-5s4 3 4 5-2 5-4 5-4-3-4-5zM12 8c0-3 2-5 4-5s4 3 4 5-2 5-4 5-4-3-4-5z"/></svg>
        <span className="text-lg font-bold">Meta</span>
      </ProviderLogo>
      {/* Mistral — orange + wind */}
      <ProviderLogo color="#f97316">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9.59 4.59A2 2 0 1113 8H3m14.59-1.41A2 2 0 1121 12H3m-1 5a2 2 0 114-1H3"/></svg>
        <span className="text-lg font-normal">Mistral</span>
      </ProviderLogo>
      {/* Stability AI — purple + diamond */}
      <ProviderLogo color="#a855f7">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8 10-8 10-8-10z" fillOpacity="0.5"/></svg>
        <span className="text-base font-light">Stability AI</span>
      </ProviderLogo>
      {/* ElevenLabs — green + sound wave */}
      <ProviderLogo color="#10a37f">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 12h2m2-4h2v8H8m4-10h2v12h-2m4-8h2v4h-2"/></svg>
        <span className="text-base font-medium">ElevenLabs</span>
      </ProviderLogo>
      {/* Runway — black bold */}
      <ProviderLogo color="#1A1916">
        <span className="text-lg font-extrabold tracking-tight">Runway</span>
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
        <div className="flex animate-marquee items-center">
          {logos}{logos}
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative pt-28 pb-10 md:pt-36 md:pb-16 overflow-hidden">
      <GradientMeshBg />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            Без VPN, без подписок
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
            Единая платформа для 50 нейросетей.
            <br />
            <span className="bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent">
              Подключись к AI будущего
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-text/60 max-w-2xl mx-auto leading-relaxed">
            Переключайтесь между GPT-5, Claude, Gemini и Grok за одно нажатие.
            <br className="hidden sm:block" />
            Генерируйте картинки и видео, анализируйте документы, ищите в интернете. Начните бесплатно.
          </p>

          {/* Inline registration form */}
          <div className="mt-10 max-w-md mx-auto">
            <form
              onSubmit={(e) => { e.preventDefault(); window.location.href = '/webchat'; }}
              className="flex items-center gap-2 bg-white rounded-2xl p-2 shadow-lg shadow-black/[0.06] border border-text/[0.06]"
            >
              <input
                type="text"
                placeholder="Email или Telegram"
                aria-label="Email или Telegram"
                className="flex-1 min-w-0 bg-transparent px-4 py-3 text-sm text-text placeholder:text-text/35 outline-none"
              />
              <button
                type="submit"
                className="shrink-0 bg-accent text-white px-5 sm:px-6 py-3 min-h-[44px] rounded-xl font-bold text-sm hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
              >
                Начать использовать AI
              </button>
            </form>
            <p className="text-[11px] text-text/35 mt-3 text-center">
              Без привязки карты · 10 запросов/день бесплатно
            </p>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <a
              href="https://t.me/StoneAIBot"
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
            <span className="block text-[32px] sm:text-[40px] md:text-[48px] leading-none font-black text-accent">50+</span>
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
