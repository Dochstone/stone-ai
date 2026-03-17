"use client";

function ChatMockup() {
  return (
    <div
      className="relative mx-auto mt-14 max-w-2xl px-2"
      style={{
        transform: "perspective(1200px) rotateY(-3deg) rotateX(2deg)",
        transformOrigin: "center center",
      }}
    >
      {/* Glow behind */}
      <div className="absolute -inset-4 bg-gradient-to-br from-accent/20 via-teal/10 to-transparent rounded-3xl blur-2xl" />

      {/* Window */}
      <div className="relative bg-[#1C1C1E] rounded-2xl shadow-2xl shadow-black/25 overflow-hidden border border-white/[0.06]">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#2C2C2E] border-b border-white/[0.06]">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <span className="w-3 h-3 rounded-full bg-[#28C840]" />
          </div>
          <span className="text-white/30 text-[11px] font-medium ml-2">Stone AI</span>
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
                  i === 0
                    ? "bg-accent/20 text-accent"
                    : "bg-white/[0.04] text-white/30"
                }`}
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TrustMarquee() {
  const logos = [
    { name: "Яндекс", weight: "700", tracking: "0.01em", size: "text-xl" },
    { name: "Сбер", weight: "800", tracking: "0.02em", size: "text-xl" },
    { name: "Тинькофф", weight: "700", tracking: "-0.01em", size: "text-lg" },
    { name: "VK", weight: "900", tracking: "0.05em", size: "text-xl", upper: true },
    { name: "Ozon", weight: "800", tracking: "0.03em", size: "text-xl" },
    { name: "МТС", weight: "900", tracking: "0.06em", size: "text-lg", upper: true },
    { name: "Wildberries", weight: "600", tracking: "0", size: "text-base", italic: true },
    { name: "Авито", weight: "700", tracking: "0.01em", size: "text-lg" },
    { name: "Ростелеком", weight: "500", tracking: "0.02em", size: "text-base" },
    { name: "HeadHunter", weight: "800", tracking: "-0.01em", size: "text-base" },
    { name: "Мегафон", weight: "600", tracking: "0.01em", size: "text-lg" },
    { name: "Lamoda", weight: "400", tracking: "0.08em", size: "text-base", upper: true },
  ];

  const all = [...logos, ...logos];

  return (
    <div className="mt-20 overflow-hidden">
      <p className="text-center text-[10px] text-text/25 font-semibold uppercase tracking-[0.2em] mb-6">
        Нам доверяют команды из
      </p>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-bg to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-bg to-transparent z-10" />
        <div className="flex animate-marquee items-center">
          {all.map((logo, i) => (
            <span
              key={i}
              className={`shrink-0 mx-7 md:mx-10 whitespace-nowrap text-text/[0.18] select-none ${logo.size} ${logo.italic ? "italic" : ""}`}
              style={{
                fontWeight: logo.weight,
                letterSpacing: logo.tracking,
                textTransform: logo.upper ? "uppercase" : undefined,
              }}
            >
              {logo.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="hero-gradient pt-28 pb-10 md:pt-36 md:pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            Без VPN, без подписок
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
            50 AI-моделей
            <br />
            <span className="bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent">
              прямо в Telegram
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-text/60 max-w-2xl mx-auto leading-relaxed">
            GPT-5, Claude Opus, Gemini Pro, DeepSeek R1 и ещё 46 моделей.
            <br className="hidden sm:block" />
            Платите только за использованные токены.
          </p>

          {/* Inline registration form — Bybit-style */}
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
                className="shrink-0 bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
              >
                Начать бесплатно
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

        {/* Chat mockup */}
        <ChatMockup />

        {/* Stats — large numbers, Bybit-style */}
        <div className="mt-14 flex items-center justify-center gap-8 md:gap-16 text-sm md:text-base text-text/50">
          <div className="text-center">
            <span className="block text-[48px] leading-none font-black text-accent">50+</span>
            <span className="mt-1 block">моделей</span>
          </div>
          <div className="w-px h-16 bg-text/10" />
          <div className="text-center">
            <span className="block text-[48px] leading-none font-black text-teal">4</span>
            <span className="mt-1 block">способа оплаты</span>
          </div>
          <div className="w-px h-16 bg-text/10" />
          <div className="text-center">
            <span className="block text-[48px] leading-none font-black text-accent">$0</span>
            <span className="mt-1 block">для старта</span>
          </div>
        </div>
      </div>

      {/* Trust marquee */}
      <TrustMarquee />
    </section>
  );
}
