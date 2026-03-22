const providers = [
  {
    name: "OpenAI",
    desc: "Создатели GPT-5 и DALL-E. Самые популярные AI-модели в мире.",
    color: "text-green-400",
    border: "border-green-500/20 hover:border-green-500/40",
    glow: "group-hover:bg-green-500/5",
    models: 7,
  },
  {
    name: "Anthropic",
    desc: "Claude Opus — лучшая модель для кода, анализа и длинных документов.",
    color: "text-orange-400",
    border: "border-orange-500/20 hover:border-orange-500/40",
    glow: "group-hover:bg-orange-500/5",
    models: 7,
  },
  {
    name: "Google",
    desc: "Gemini Pro с контекстом 1M токенов. Flash — самая быстрая в мире.",
    color: "text-blue-400",
    border: "border-blue-500/20 hover:border-blue-500/40",
    glow: "group-hover:bg-blue-500/5",
    models: 8,
  },
  {
    name: "xAI",
    desc: "Grok 3 от Илона Маска. Прямой стиль, сильная логика.",
    color: "text-slate-300",
    border: "border-slate-500/20 hover:border-slate-400/40",
    glow: "group-hover:bg-slate-500/5",
    models: 2,
  },
  {
    name: "DeepSeek",
    desc: "R1 — reasoning-модель с пошаговым рассуждением. V3 — быстрый чат.",
    color: "text-cyan-400",
    border: "border-cyan-500/20 hover:border-cyan-500/40",
    glow: "group-hover:bg-cyan-500/5",
    models: 3,
  },
  {
    name: "Meta",
    desc: "Llama 4 Maverick — open-source флагман на 400B параметров.",
    color: "text-sky-400",
    border: "border-sky-500/20 hover:border-sky-500/40",
    glow: "group-hover:bg-sky-500/5",
    models: 2,
  },
];

export default function Providers() {
  return (
    <section className="bg-dark text-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.2em] mb-4">
            AI Technology
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Модели от лидеров индустрии
          </h2>
          <p className="text-white/40 max-w-lg mx-auto">
            65+ моделей от 15 компаний. Лучшие AI-провайдеры мира — в одном месте.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {providers.map((p) => (
            <div
              key={p.name}
              className={`group relative rounded-2xl border ${p.border} bg-white/[0.02] p-6 transition-all duration-300`}
            >
              <div className={`absolute inset-0 rounded-2xl ${p.glow} transition-colors duration-300`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-xl font-extrabold ${p.color}`}>{p.name}</h3>
                  <span className="text-[11px] text-white/20 font-medium">
                    {p.models} {p.models < 5 ? "модели" : "моделей"}
                  </span>
                </div>
                <p className="text-white/45 text-sm leading-relaxed mb-5">
                  {p.desc}
                </p>
                <a
                  href={`/models?company=${p.name}`}
                  className={`text-sm font-semibold ${p.color} opacity-70 group-hover:opacity-100 transition-opacity`}
                >
                  Модели &rarr;
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
