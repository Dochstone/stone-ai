const features = [
  { name: "AI модели", free: "5 моделей", paid: "50+ моделей" },
  { name: "Запросы в день", free: "10 + 5 за рекламу", paid: "Безлимитно" },
  { name: "GPT-5, Claude Opus", free: "---", paid: "check" },
  { name: "Генерация картинок", free: "---", paid: "check" },
  { name: "AI Поиск (Perplexity)", free: "---", paid: "check" },
  { name: "Reasoning (o3, R1)", free: "---", paid: "check" },
  { name: "Стоимость", free: "Бесплатно", paid: "От $0.24/1M токенов" },
  { name: "Оплата", free: "—", paid: "Stars, карты, СБП, крипто" },
];

function Cell({ value }: { value: string }) {
  if (value === "check") return <span className="text-accent text-lg">&#10003;</span>;
  if (value === "---") return <span className="text-text/20">&#10005;</span>;
  return <span>{value}</span>;
}

export default function FeaturesTable() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Free vs Per-token
        </h2>
        <p className="text-text/60 text-center mb-12 max-w-lg mx-auto">
          Бесплатного хватает для знакомства. Для серьёзной работы — пополните баланс.
        </p>

        <div className="max-w-2xl mx-auto overflow-hidden rounded-2xl border border-text/10 bg-white">
          {/* Header */}
          <div className="grid grid-cols-3 bg-bg text-xs sm:text-sm font-semibold">
            <div className="px-5 py-4" />
            <div className="px-5 py-4 text-center">
              <span className="bg-teal-light text-teal px-3 py-1 rounded-full text-xs font-bold">Free</span>
            </div>
            <div className="px-5 py-4 text-center">
              <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold">Per-token</span>
            </div>
          </div>

          {/* Rows */}
          {features.map((f, i) => (
            <div
              key={f.name}
              className={`grid grid-cols-3 text-xs sm:text-sm ${
                i < features.length - 1 ? "border-b border-text/5" : ""
              }`}
            >
              <div className="px-5 py-3.5 font-medium text-text/70">{f.name}</div>
              <div className="px-5 py-3.5 text-center text-text/60">
                <Cell value={f.free} />
              </div>
              <div className="px-5 py-3.5 text-center font-medium">
                <Cell value={f.paid} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
