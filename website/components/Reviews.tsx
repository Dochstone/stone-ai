import { planPrice } from "@/lib/pricing";

const reviews = [
  {
    name: "Алексей М.",
    role: "Разработчик",
    text: `Наконец-то все нейросети в одной студии. Пользуюсь каждый день для работы с кодом. Подписка за ${planPrice("mini")} — дешевле ChatGPT Plus в разы.`,
    stars: 5,
    avatar: "/demo/avatar-alexey.webp",
  },
  {
    name: "Мария К.",
    role: "Маркетолог",
    text: "Удобно, что все модели в одной студии. Генерирую тексты через GPT-5 и картинки через Flux — всё в Telegram, не нужно 5 подписок.",
    stars: 5,
    avatar: "/demo/avatar-maria.webp",
  },
  {
    name: "Дмитрий С.",
    role: "Студент",
    text: "Бесплатного плана хватает для учёбы. А когда нужно больше — пополняю на $1 и хватает на неделю. Лучше любой подписки.",
    stars: 5,
    avatar: "/demo/avatar-dmitry.webp",
  },
  {
    name: "Елена В.",
    role: "Предприниматель",
    text: "Perplexity для исследований рынка, Claude для документов, Flux для картинок. Экономлю кучу времени и денег. Оплата через Stars — удобно.",
    stars: 5,
    avatar: "/demo/avatar-elena.webp",
  },
];

export default function Reviews() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3">
          Что говорят пользователи
        </h2>
        <p className="text-center text-text/40 text-sm mb-12">
          Отзывы от пользователей{" "}
          <a href="https://t.me/stonetgbot" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">@stonetgbot</a>
          {" "}в Telegram
        </p>

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
                <img
                  src={r.avatar}
                  alt={r.name}
                  width={44}
                  height={44}
                  loading="lazy"
                  className="w-11 h-11 rounded-full object-cover shadow-md ring-2 ring-white"
                />
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
