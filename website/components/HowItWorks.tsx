const steps = [
  {
    num: "01",
    title: "Откройте бота",
    desc: "Нажмите кнопку ниже или найдите @StoneAIBot в Telegram. Никакой регистрации.",
  },
  {
    num: "02",
    title: "Выберите модель",
    desc: "50+ моделей: чат, картинки, видео, поиск. От бесплатных GPT-4o mini до мощных GPT-5 и Claude Opus.",
  },
  {
    num: "03",
    title: "Пишите и платите за токены",
    desc: "15 бесплатных запросов в день. Для безлимита пополните баланс — платите только за использованное.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 md:py-28 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Как начать
        </h2>
        <p className="text-text/60 text-center mb-14 max-w-lg mx-auto">
          Три шага — и вы общаетесь с лучшими AI-моделями мира
        </p>

        {/* Desktop: 3 columns */}
        <div className="hidden md:grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step) => (
            <div key={step.num} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-accent/10 text-accent font-extrabold text-lg mb-5">
                {step.num}
              </div>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-text/60 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Mobile: vertical with connector line */}
        <div className="md:hidden relative max-w-sm mx-auto">
          {/* Vertical connector */}
          <div className="absolute left-7 top-14 bottom-14 w-px bg-accent/15" />

          <div className="space-y-8">
            {steps.map((step) => (
              <div key={step.num} className="flex items-start gap-5">
                <div className="relative z-10 shrink-0 w-14 h-14 rounded-2xl bg-accent/10 text-accent font-extrabold text-lg flex items-center justify-center">
                  {step.num}
                </div>
                <div className="pt-2">
                  <h3 className="font-bold text-base mb-1">{step.title}</h3>
                  <p className="text-text/60 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <a
            href="/webchat"
            className="inline-block bg-accent text-white px-8 py-4 min-h-[44px] rounded-xl font-bold hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
          >
            Начать бесплатно
          </a>
        </div>
      </div>
    </section>
  );
}
