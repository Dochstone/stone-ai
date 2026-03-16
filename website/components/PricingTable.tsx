import { MODELS } from "@/lib/models";

const VOLUMES = [50, 200, 500, 1000];
const AVG_TOKENS = 1500;

const popularModels = [
  "gpt-4o-mini",
  "claude-haiku-4.5",
  "gemini-2.0-flash",
  "deepseek-r1",
  "gpt-4.1",
  "gpt-5.1",
  "claude-opus-4",
  "gemini-2.5-pro",
  "grok-3",
  "command-r7",
  "flux-schnell",
];

function calcCost(model: (typeof MODELS)[number], reqs: number) {
  if (model.priceUnit) return model.pricePerMillion * reqs;
  return (reqs * AVG_TOKENS * model.pricePerMillion) / 1_000_000;
}

function formatCost(c: number) {
  if (c < 0.01) return `$${c.toFixed(4)}`;
  if (c < 1) return `$${c.toFixed(2)}`;
  return `$${c.toFixed(2)}`;
}

export default function PricingTable() {
  const models = popularModels
    .map((id) => MODELS.find((m) => m.id === id)!)
    .filter(Boolean);

  return (
    <section className="mb-20">
      <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-3">
        Сколько стоит месяц использования
      </h2>
      <p className="text-text/60 text-center mb-10 max-w-lg mx-auto text-sm">
        Примерная стоимость при ~{AVG_TOKENS.toLocaleString()} токенов на запрос
      </p>

      <div className="overflow-x-auto rounded-2xl border border-text/5">
        <table className="w-full text-sm bg-white">
          <thead>
            <tr className="bg-bg">
              <th className="text-left py-3.5 px-4 font-semibold">Модель</th>
              <th className="text-left py-3.5 px-3 font-semibold text-text/50 whitespace-nowrap">
                $/1M
              </th>
              {VOLUMES.map((v) => (
                <th
                  key={v}
                  className="text-right py-3.5 px-3 font-semibold text-text/50 whitespace-nowrap"
                >
                  {v} запр.
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {models.map((model) => (
              <tr
                key={model.id}
                className="border-t border-text/5 hover:bg-bg/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{model.name}</span>
                    {model.tier === "free" && (
                      <span className="bg-teal-light text-teal px-2 py-0.5 rounded-full text-[10px] font-semibold">
                        FREE
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-text/35">{model.company}</span>
                </td>
                <td className="py-3 px-3 text-text/50 whitespace-nowrap">
                  {model.priceUnit
                    ? `$${model.pricePerMillion}${model.priceUnit}`
                    : `$${model.pricePerMillion}`}
                </td>
                {VOLUMES.map((v) => {
                  const c = calcCost(model, v);
                  return (
                    <td
                      key={v}
                      className="py-3 px-3 text-right font-medium whitespace-nowrap"
                    >
                      {formatCost(c)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
