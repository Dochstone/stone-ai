import { TELEGRAM_BOT_URL } from "@/lib/models";

function ChatMockup() {
  return (
    <div
      className="relative mx-auto mt-14 max-w-2xl"
      style={{
        transform: "perspective(1200px) rotateY(-3deg) rotateX(2deg)",
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
    { name: "OpenAI", weight: "800", tracking: "-0.02em", size: "text-lg" },
    { name: "Anthropic", weight: "600", tracking: "0.02em", size: "text-base", italic: true },
    { name: "Google", weight: "400", tracking: "0", size: "text-lg", colors: true },
    { name: "Meta", weight: "700", tracking: "0.01em", size: "text-lg" },
    { name: "Mistral", weight: "800", tracking: "0.05em", size: "text-sm", upper: true },
    { name: "DeepSeek", weight: "600", tracking: "-0.01em", size: "text-base" },
    { name: "xAI", weight: "800", tracking: "0.03em", size: "text-lg" },
    { name: "Perplexity", weight: "500", tracking: "0", size: "text-base" },
    { name: "NVIDIA", weight: "700", tracking: "0.08em", size: "text-sm", upper: true },
    { name: "Microsoft", weight: "400", tracking: "0", size: "text-base" },
    { name: "Stability", weight: "600", tracking: "0.02em", size: "text-base", italic: true },
    { name: "Cohere", weight: "700", tracking: "0", size: "text-base" },
  ];

  const all = [...logos, ...logos];

  return (
    <div className="mt-20 overflow-hidden">
      <p className="text-center text-[10px] text-text/25 font-semibold uppercase tracking-[0.2em] mb-6">
        Модели от ведущих компаний
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

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={TELEGRAM_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-accent text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
            >
              Открыть в Telegram
            </a>
            <a
              href="#models"
              className="border-2 border-text/15 text-text px-8 py-4 rounded-xl font-bold hover:border-accent hover:text-accent transition-colors"
            >
              Посмотреть модели
            </a>
          </div>
        </div>

        {/* Chat mockup */}
        <ChatMockup />

        {/* Stats */}
        <div className="mt-14 flex items-center justify-center gap-8 md:gap-14 text-sm md:text-base text-text/60">
          <div className="text-center">
            <span className="block text-3xl md:text-4xl font-extrabold text-text">50+</span>
            моделей
          </div>
          <div className="w-px h-12 bg-text/10" />
          <div className="text-center">
            <span className="block text-3xl md:text-4xl font-extrabold text-teal">5</span>
            бесплатных
          </div>
          <div className="w-px h-12 bg-text/10" />
          <div className="text-center">
            <span className="block text-3xl md:text-4xl font-extrabold text-accent">$0.24</span>
            от /1M токенов
          </div>
        </div>
      </div>

      {/* Trust marquee */}
      <TrustMarquee />
    </section>
  );
}
