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

function ProviderLogo({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="shrink-0 mx-5 md:mx-8 inline-flex items-center gap-2 opacity-100 hover:opacity-100 transition-opacity duration-300 select-none cursor-default"
      style={{ height: 40, color }}
    >
      {children}
    </span>
  );
}

function TrustMarquee() {
  const logos = (
    <>
      {/* OpenAI — black circle with white center */}
      <ProviderLogo color="#1A1916">
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="currentColor"/><circle cx="14" cy="14" r="6" fill="#FAF9F5"/></svg>
        <span style={{ fontSize: 20, fontWeight: 700 }}>OpenAI</span>
      </ProviderLogo>
      {/* Anthropic — orange starburst pinwheel */}
      <ProviderLogo color="#d97706">
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 28 28" fill="currentColor"><path d="M14 2l1.8 5.4L21.2 6l-3.8 4.2 5.6 1-5 2.8 3.4 4.6L16 16.8 14 22l-2-5.2-5.4 1.8 3.4-4.6-5-2.8 5.6-1L6.8 6l5.4 1.4z"/></svg>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Anthropic</span>
      </ProviderLogo>
      {/* Google — 4-color G icon + text */}
      <ProviderLogo>
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 28 28"><path d="M25.2 14.3c0-.8-.1-1.6-.2-2.3H14v4.5h6.3a5.4 5.4 0 01-2.3 3.5v2.9h3.8c2.2-2 3.4-5 3.4-8.6z" fill="#4285f4"/><path d="M14 26c3.1 0 5.8-1 7.7-2.8l-3.8-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.6-2-6.5-4.8H3.6v3C5.5 23.3 9.4 26 14 26z" fill="#34a853"/><path d="M7.5 16.6c-.5-1.4-.5-2.8 0-4.2V9.4H3.6A12 12 0 002 14c0 1.9.5 3.8 1.6 5.4l3.9-2.8z" fill="#fbbc05"/><path d="M14 7.4c1.7 0 3.2.6 4.4 1.7l3.3-3.3C19.8 4 17.1 2.8 14 2.8 9.4 2.8 5.5 5.5 3.6 9.4l3.9 2.8c.9-2.7 3.5-4.8 6.5-4.8z" fill="#ea4335"/></svg>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Google</span>
      </ProviderLogo>
      {/* xAI — stylized X */}
      <ProviderLogo color="#1A1916">
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 28 28" fill="currentColor"><path d="M5 5l8 9L5 23h2.5l6.5-7.2L20.5 23H24l-8-9L24 5h-2.5L15 12.2 8.5 5H5z" fillOpacity="0.8"/></svg>
        <span style={{ fontSize: 20, fontWeight: 700, fontStyle: "italic" }}>xAI</span>
      </ProviderLogo>
      {/* DeepSeek — blue whale */}
      <ProviderLogo color="#06b6d4">
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 28 28" fill="currentColor"><path d="M6 14c0-5 3.6-8 8-8s8 3 8 8c0 4-2.5 6.5-4.5 7.5-1 .5-2 1-3.5 1s-2.5-.5-3.5-1C8.5 20.5 6 18 6 14z" fillOpacity="0.35"/><path d="M8 13c0-3.5 2.7-6 6-6s6 2.5 6 6c0 3-2 5-3.5 5.8-.8.4-1.5.7-2.5.7s-1.7-.3-2.5-.7C9.8 18 8 16 8 13z" fillOpacity="0.5"/><circle cx="11" cy="12" r="1.2"/><path d="M17 15c-1 .8-2 1-3 1s-2-.2-3-1" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        <span style={{ fontSize: 20, fontWeight: 700 }}>DeepSeek</span>
      </ProviderLogo>
      {/* Meta — blue infinity */}
      <ProviderLogo color="#0668E1">
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 28 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 10c0-3.5 2-5.5 4.5-5.5S14 7.5 14 10s-2 5.5-4.5 5.5S5 13.5 5 10zM14 10c0-3.5 2-5.5 4.5-5.5S23 7.5 23 10s-2 5.5-4.5 5.5S14 13.5 14 10z"/></svg>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Meta</span>
      </ProviderLogo>
      {/* Mistral — orange wind stripes */}
      <ProviderLogo color="#f97316">
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 28 28" fill="currentColor"><rect x="4" y="6" width="18" height="3" rx="1.5"/><rect x="4" y="12.5" width="22" height="3" rx="1.5"/><rect x="4" y="19" width="14" height="3" rx="1.5"/></svg>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Mistral</span>
      </ProviderLogo>
      {/* Stability AI — purple diamond */}
      <ProviderLogo color="#a855f7">
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 28 28" fill="currentColor"><path d="M14 3l10 11-10 11L4 14z" fillOpacity="0.4"/><path d="M14 7l6 7-6 7-6-7z"/></svg>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Stability AI</span>
      </ProviderLogo>
      {/* ElevenLabs — green sound waves ||| */}
      <ProviderLogo color="#10a37f">
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 28 28" fill="currentColor"><rect x="6" y="10" width="3" height="8" rx="1.5"/><rect x="12.5" y="6" width="3" height="16" rx="1.5"/><rect x="19" y="8" width="3" height="12" rx="1.5"/></svg>
        <span style={{ fontSize: 20, fontWeight: 700 }}>ElevenLabs</span>
      </ProviderLogo>
      {/* Runway — black rect with R */}
      <ProviderLogo color="#1A1916">
        <svg className="w-7 h-7 shrink-0" viewBox="0 0 28 28"><rect x="2" y="5" width="24" height="18" rx="4" fill="currentColor"/><text x="14" y="18" textAnchor="middle" fill="#FAF9F5" fontSize="13" fontWeight="800" fontFamily="sans-serif">R</text></svg>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Runway</span>
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
          <p className="text-[11px] text-text/35 mt-4 text-center">
            Бесплатно · Без карты · 15 запросов в день
          </p>

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
