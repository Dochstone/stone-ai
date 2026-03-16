import { TELEGRAM_BOT_URL } from "@/lib/models";

const companies = [
  "OpenAI", "Anthropic", "Google", "Meta", "Mistral", "DeepSeek", "xAI", "Perplexity",
  "Cohere", "Microsoft", "NVIDIA", "Alibaba", "Stability AI", "Black Forest Labs",
];

export default function Hero() {
  return (
    <section className="hero-gradient pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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

        {/* Stats */}
        <div className="mt-14 flex items-center justify-center gap-8 md:gap-14 text-sm md:text-base text-text/60">
          <div>
            <span className="block text-3xl md:text-4xl font-extrabold text-text">50+</span>
            моделей
          </div>
          <div className="w-px h-12 bg-text/10" />
          <div>
            <span className="block text-3xl md:text-4xl font-extrabold text-teal">5</span>
            бесплатных
          </div>
          <div className="w-px h-12 bg-text/10" />
          <div>
            <span className="block text-3xl md:text-4xl font-extrabold text-accent">$0.24</span>
            от /1M токенов
          </div>
        </div>
      </div>

      {/* Trust marquee */}
      <div className="mt-16 overflow-hidden">
        <p className="text-center text-xs text-text/30 font-medium uppercase tracking-widest mb-5">
          Модели от ведущих компаний
        </p>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-bg to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-bg to-transparent z-10" />
          <div className="flex animate-marquee">
            {[...companies, ...companies].map((name, i) => (
              <span
                key={i}
                className="shrink-0 mx-8 text-text/25 font-bold text-lg md:text-xl whitespace-nowrap"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
