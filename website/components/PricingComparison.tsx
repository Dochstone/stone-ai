const rows = [
  {
    feature: "Доступ к GPT-5",
    stone: "Per-token, от $0.04/запрос",
    chatgpt: "$20/мес (Plus)",
    competitors: "Per-token, ~на 30% дороже",
  },
  {
    feature: "Claude Opus 4",
    stone: "Per-token, от $0.20/запрос",
    chatgpt: "---",
    competitors: "Per-token",
  },
  {
    feature: "Кол-во моделей",
    stone: "50+",
    chatgpt: "Только OpenAI",
    competitors: "~30",
  },
  {
    feature: "Бесплатный тариф",
    stone: "10+5 запросов/день, 5 моделей",
    chatgpt: "Ограниченный GPT-4o mini",
    competitors: "3 запроса/день",
  },
  {
    feature: "VPN для России",
    stone: "Не нужен",
    chatgpt: "Нужен",
    competitors: "Не нужен",
  },
  {
    feature: "Генерация картинок",
    stone: "Flux, SDXL, GPT-5 Image",
    chatgpt: "DALL-E",
    competitors: "Flux",
  },
  {
    feature: "Оплата из России",
    stone: "Stars, СБП, карты, крипто",
    chatgpt: "Зарубежная карта",
    competitors: "Stars, карты",
  },
  {
    feature: "AI Поиск",
    stone: "Perplexity Sonar/Pro/Deep",
    chatgpt: "ChatGPT Search",
    competitors: "---",
  },
];

export default function PricingComparison() {
  return (
    <section className="mb-20">
      <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-3">
        Сравнение с конкурентами
      </h2>
      <p className="text-text/60 text-center mb-10 max-w-lg mx-auto text-sm">
        Stone AI vs ChatGPT Plus vs конкурентные Telegram-боты
      </p>

      <div className="overflow-x-auto rounded-2xl border border-text/5">
        <table className="w-full text-sm bg-white">
          <thead>
            <tr className="bg-bg">
              <th className="text-left py-3.5 px-4 font-semibold" />
              <th className="text-left py-3.5 px-4 font-semibold">
                <span className="text-accent">Stone AI</span>
              </th>
              <th className="text-left py-3.5 px-4 font-semibold text-text/40">
                ChatGPT Plus
              </th>
              <th className="text-left py-3.5 px-4 font-semibold text-text/40">
                Конкуренты
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.feature}
                className="border-t border-text/5 hover:bg-bg/50 transition-colors"
              >
                <td className="py-3 px-4 font-medium text-text/60">
                  {row.feature}
                </td>
                <td className="py-3 px-4 font-medium">{row.stone}</td>
                <td className="py-3 px-4 text-text/40">
                  {row.chatgpt === "---" ? <span className="text-text/15">&#10005;</span> : row.chatgpt}
                </td>
                <td className="py-3 px-4 text-text/40">
                  {row.competitors === "---" ? <span className="text-text/15">&#10005;</span> : row.competitors}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
