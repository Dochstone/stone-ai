const plans = [
  {
    id: "free",
    name: "Free",
    price: "0₽",
    period: "",
    desc: "Для знакомства",
    badge: null,
    accent: false,
    features: [
      "7 моделей (GPT-4o mini, Gemini Flash, DeepSeek V3...)",
      "15 запросов в день",
      "2 картинки в день",
      "Регистрация за 10 секунд",
    ],
    locked: ["Премиум модели", "Видео, аудио, 3D", "История чатов"],
    cta: "Начать бесплатно",
    href: "/webchat",
  },
  {
    id: "mini",
    name: "Мини",
    price: "390₽",
    period: "/мес",
    desc: "20+ моделей",
    badge: null,
    accent: false,
    features: [
      "20+ моделей (+ GPT-5.1, Claude Sonnet, DeepSeek R1)",
      "500 запросов/мес к быстрым моделям",
      "20 запросов/мес к премиум",
      "15 картинок/мес (все модели)",
      "История чатов",
    ],
    locked: ["Видео, аудио, 3D"],
    cta: "Выбрать Мини",
    href: "/topup",
  },
  {
    id: "opti",
    name: "Опти",
    price: "890₽",
    period: "/мес",
    desc: "Все 65+ моделей",
    badge: "Популярный",
    accent: true,
    features: [
      "Все 65+ моделей",
      "2 000 запросов/мес к быстрым",
      "100 запросов/мес к премиум (Claude Opus, Grok 3)",
      "50 картинок/мес",
      "10 видео/мес",
      "5 3D-моделей, 20 озвучек",
      "Голосовой ассистент",
      "История чатов",
    ],
    locked: [],
    cta: "Выбрать Опти",
    href: "/topup",
  },
  {
    id: "plus",
    name: "Плюс",
    price: "1 990₽",
    period: "/мес",
    desc: "Для профессионалов",
    badge: null,
    accent: false,
    features: [
      "Все 65+ моделей + API доступ",
      "10 000 запросов/мес к быстрым",
      "500 запросов/мес к премиум",
      "300 картинок, 50 видео/мес",
      "30 3D-моделей, 100 озвучек",
      "Приоритетная скорость",
      "Ранний доступ к новым моделям",
    ],
    locked: [],
    cta: "Выбрать Плюс",
    href: "/topup",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Выберите тариф под свои задачи
        </h2>
        <p className="text-text/60 text-center mb-12 max-w-xl mx-auto">
          Бесплатный старт. Апгрейд когда нужно больше.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 relative flex flex-col ${
                plan.accent
                  ? "bg-bg border-2 border-accent shadow-lg shadow-accent/5"
                  : "bg-bg border border-text/5"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                  {plan.badge}
                </span>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-extrabold">{plan.name}</h3>
                <div className="mt-1">
                  <span className="text-2xl font-extrabold">{plan.price}</span>
                  {plan.period && <span className="text-text/40 text-sm">{plan.period}</span>}
                </div>
                <p className="text-text/50 text-xs mt-1">{plan.desc}</p>
              </div>

              <ul className="space-y-2 text-sm mb-4 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className={`mt-0.5 shrink-0 text-xs ${plan.accent ? "text-accent" : "text-teal"}`}>&#10003;</span>
                    <span className="text-text/70 text-xs">{f}</span>
                  </li>
                ))}
                {plan.locked.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-xs text-text/20">&#128274;</span>
                    <span className="text-text/30 text-xs line-through">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.href}
                className={`block text-center px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-sm transition-all ${
                  plan.accent
                    ? "bg-accent text-white hover:bg-accent/90 shadow-md shadow-accent/20"
                    : "border-2 border-text/15 text-text hover:border-accent hover:text-accent"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div className="mt-12 text-center">
          <p className="text-xs text-text/40 font-medium uppercase tracking-wide mb-3">
            Способы оплаты
          </p>
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-xs sm:text-sm text-text/50">
            <span>Telegram Stars</span>
            <span className="w-1 h-1 bg-text/20 rounded-full hidden sm:block" />
            <span>Криптовалюта (USDT, BTC, ETH)</span>
            <span className="w-1 h-1 bg-text/20 rounded-full hidden sm:block" />
            <span>TON Connect</span>
          </div>
        </div>
      </div>
    </section>
  );
}
