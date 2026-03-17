const reviews = [
  {
    name: "Алексей М.",
    role: "Разработчик",
    text: "Наконец-то нормальный доступ к Claude и GPT без VPN. Пользуюсь каждый день для работы с кодом. Per-token дешевле подписки в разы.",
    stars: 5,
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    name: "Мария К.",
    role: "Маркетолог",
    text: "Удобно, что все модели в одном месте. Генерирую тексты через GPT-5 и картинки через Flux — всё в Telegram, не нужно 5 подписок.",
    stars: 5,
    gradient: "from-pink-500 to-rose-600",
  },
  {
    name: "Дмитрий С.",
    role: "Студент",
    text: "Бесплатного плана хватает для учёбы. А когда нужно больше — пополняю на $1 и хватает на неделю. Лучше любой подписки.",
    stars: 5,
    gradient: "from-teal to-emerald-600",
  },
  {
    name: "Елена В.",
    role: "Предприниматель",
    text: "Perplexity для исследований рынка, Claude для документов, Flux для картинок. Экономлю кучу времени и денег. Оплата через СБП — удобно.",
    stars: 5,
    gradient: "from-amber-500 to-orange-600",
  },
];

export default function Reviews() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">
          Что говорят пользователи
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {reviews.map((r) => (
            <div key={r.name} className="bg-white rounded-2xl p-6 border border-text/5 card-hover">
              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: r.stars }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">&#9733;</span>
                ))}
              </div>
              <p className="text-text/70 text-sm leading-relaxed mb-5">
                &ldquo;{r.text}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${r.gradient} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                  {r.name[0]}
                </div>
                <div>
                  <p className="font-bold text-sm">{r.name}</p>
                  <p className="text-text/40 text-xs">{r.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
