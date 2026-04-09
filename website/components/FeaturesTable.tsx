const features = [
  { name: "AI модели", free: "5 моделей", paid: "65+ нейросетей" },
  { name: "Запросы в день", free: "15", paid: "До 10 000/мес" },
  { name: "GPT-5.1, Claude Opus 4", free: "---", paid: "check" },
  { name: "Генерация картинок", free: "---", paid: "check" },
  { name: "AI Поиск (Perplexity)", free: "---", paid: "check" },
  { name: "Глубокий анализ (o3, R1)", free: "---", paid: "check" },
  { name: "Стоимость", free: "Бесплатно", paid: "От 590₽/мес" },
  { name: "Оплата", free: "—", paid: "Карта РФ, СБП, крипто" },
];

function Cell({ value }: { value: string }) {
  if (value === "check") return <span className="text-accent text-lg" aria-label="Доступно">&#10003;</span>;
  if (value === "---") return <span className="text-text/20" aria-label="Недоступно">&#10005;</span>;
  return <span>{value}</span>;
}

export default function FeaturesTable() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Free vs Подписка
        </h2>
        <p className="text-text/60 text-center mb-12 max-w-lg mx-auto">
          Бесплатного хватает для знакомства. Для серьёзной работы — выберите тариф.
        </p>

        <div className="max-w-2xl mx-auto overflow-x-auto -mx-4 px-4 sm:mx-auto sm:px-0">
          <div className="min-w-[420px] overflow-hidden rounded-2xl border border-text/10 bg-surface">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-bg">
                  <th className="px-3 sm:px-5 py-4 text-left font-semibold" />
                  <th className="px-3 sm:px-5 py-4 text-center font-semibold">
                    <span className="bg-teal-light text-teal px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold">Free</span>
                  </th>
                  <th className="px-3 sm:px-5 py-4 text-center font-semibold">
                    <span className="bg-accent/10 text-accent px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold">Подписка</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {features.map((f, i) => (
                  <tr
                    key={f.name}
                    className={i < features.length - 1 ? "border-b border-text/5" : ""}
                  >
                    <td className="px-3 sm:px-5 py-3 sm:py-3.5 font-medium text-text/70">{f.name}</td>
                    <td className="px-3 sm:px-5 py-3 sm:py-3.5 text-center text-text/60">
                      <Cell value={f.free} />
                    </td>
                    <td className="px-3 sm:px-5 py-3 sm:py-3.5 text-center font-medium">
                      <Cell value={f.paid} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
