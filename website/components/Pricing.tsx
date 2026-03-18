export default function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Технология Per-token — плати только за реальное использование
        </h2>
        <p className="text-text/60 text-center mb-12 max-w-xl mx-auto">
          Без подписок. Платите только за то, что используете.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <div className="bg-bg rounded-2xl p-8 border border-text/5">
            <span className="bg-teal-light text-teal px-3 py-1 rounded-full text-sm font-semibold">
              Бесплатно
            </span>
            <h3 className="text-2xl font-extrabold mt-4 mb-1">Free</h3>
            <p className="text-text/50 text-sm mb-6">Для знакомства с AI</p>

            <ul className="space-y-3 text-sm mb-8">
              <li className="flex items-start gap-3">
                <span className="text-teal mt-0.5 shrink-0">&#10003;</span>
                <span>5 моделей (GPT-4o mini, Claude Haiku, Gemini Flash...)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal mt-0.5 shrink-0">&#10003;</span>
                <span>10 запросов в день</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal mt-0.5 shrink-0">&#10003;</span>
                <span>+5 запросов за просмотр рекламы</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-teal mt-0.5 shrink-0">&#10003;</span>
                <span>Без регистрации</span>
              </li>
            </ul>

            <a
              href="/webchat"
              className="block text-center border-2 border-text/15 text-text px-6 py-3 min-h-[44px] rounded-xl font-bold hover:border-accent hover:text-accent transition-colors"
            >
              Начать бесплатно
            </a>
          </div>

          {/* Per-token */}
          <div className="bg-bg rounded-2xl p-8 border-2 border-accent relative shadow-lg shadow-accent/5">
            <span className="absolute -top-3 right-6 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold">
              Популярный
            </span>
            <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-semibold">
              Per-token
            </span>
            <h3 className="text-2xl font-extrabold mt-4 mb-1">Оплата за токены</h3>
            <p className="text-text/50 text-sm mb-6">Полный доступ ко всем 50+ моделям</p>

            <ul className="space-y-3 text-sm mb-8">
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5 shrink-0">&#10003;</span>
                <span>Все 50 моделей включая GPT-5, Claude Opus</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5 shrink-0">&#10003;</span>
                <span>Безлимитные запросы</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5 shrink-0">&#10003;</span>
                <span>От $0.24 за 1M токенов</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent mt-0.5 shrink-0">&#10003;</span>
                <span>Stars, карты, СБП, криптовалюта</span>
              </li>
            </ul>

            <a
              href="/topup"
              className="block text-center bg-accent text-white px-6 py-3 min-h-[44px] rounded-xl font-bold hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
            >
              Пополнить баланс
            </a>
          </div>
        </div>

        {/* Payment methods */}
        <div className="mt-12 text-center">
          <p className="text-xs text-text/40 font-medium uppercase tracking-wide mb-3">
            Способы оплаты
          </p>
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-xs sm:text-sm text-text/50">
            <span>Telegram Stars</span>
            <span className="w-1 h-1 bg-text/20 rounded-full hidden sm:block" />
            <span>Карты / СБП</span>
            <span className="w-1 h-1 bg-text/20 rounded-full hidden sm:block" />
            <span>USDT / BTC / ETH</span>
          </div>
        </div>
      </div>
    </section>
  );
}
