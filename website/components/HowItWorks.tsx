const steps = [
  {
    num: "01",
    title: "Зарегистрируйтесь",
    desc: "Google, Яндекс, email или Telegram — вход за 5 секунд. Никаких анкет.",
  },
  {
    num: "02",
    title: "Попробуйте бесплатно",
    desc: "15 запросов в день к 7 моделям — GPT-4o mini, Gemini Flash, Claude Haiku и другие. Без оплаты.",
  },
  {
    num: "03",
    title: "Выберите подписку",
    desc: "От 590₽/мес — 65+ нейросетей, картинки, видео, 3D. Карта РФ, СБП, криптовалюта.",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-20 md:py-28 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <img src="/mascots/stone-mascot-success.webp" alt="" width="64" height="64" className="mx-auto mb-4" />
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Как начать
        </h2>
        <p className="text-text/60 text-center mb-14 max-w-lg mx-auto">
          Три шага — и все нейросети мира у вас в браузере
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

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-12">
          <a
            href="/dashboard/chat"
            className="inline-flex items-center justify-center bg-accent text-white px-8 py-4 min-h-[48px] rounded-xl font-bold text-sm hover:bg-accent/90 transition-all shadow-md shadow-accent/20"
          >
            Попробовать бесплатно
          </a>
          <a
            href="/pricing"
            className="inline-flex items-center justify-center border-2 border-accent text-accent px-8 py-4 min-h-[48px] rounded-xl font-bold text-sm hover:bg-accent hover:text-white transition-all"
          >
            Выбрать подписку
          </a>
        </div>
      </div>
    </section>
  );
}
