import { MODELS } from "@/lib/models";

const FEATURED_IDS = [
  "gpt-4o-mini",
  "claude-haiku-4.5",
  "gemini-2.0-flash",
  "llama-4-maverick",
  "gpt-5.1",
  "claude-opus-4",
  "gemini-2.5-pro",
  "grok-3",
  "deepseek-r1",
  "perplexity-sonar-pro",
  "flux-schnell",
  "o3",
];

const companyColors: Record<string, string> = {
  OpenAI: "bg-green-100 text-green-700",
  Anthropic: "bg-orange-100 text-orange-700",
  Google: "bg-blue-100 text-blue-700",
  Meta: "bg-sky-100 text-sky-700",
  Mistral: "bg-purple-100 text-purple-700",
  DeepSeek: "bg-cyan-100 text-cyan-700",
  xAI: "bg-slate-100 text-slate-700",
  Perplexity: "bg-indigo-100 text-indigo-700",
  BFL: "bg-amber-100 text-amber-700",
};

function formatPrice(model: (typeof MODELS)[number]) {
  if (model.tier === "free") return "FREE";
  if (model.priceUnit) return `$${model.pricePerMillion}${model.priceUnit}`;
  return `$${model.pricePerMillion}/1M`;
}

export default function ModelGrid() {
  const featured = FEATURED_IDS.map((id) => MODELS.find((m) => m.id === id)!).filter(Boolean);

  return (
    <section id="models" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Технологии OpenAI, Anthropic, Google, xAI — под вашим управлением
        </h2>
        <p className="text-text/60 text-center mb-12 max-w-xl mx-auto">
          От бесплатных до самых мощных. Все доступны прямо в Telegram.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {featured.map((model) => (
            <div
              key={model.id}
              className="bg-white rounded-2xl p-4 card-hover border border-text/5"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${companyColors[model.company] ?? "bg-gray-100 text-gray-700"}`}>
                  {model.company}
                </span>
              </div>
              <h3 className="font-bold text-sm mb-3 leading-snug">{model.name}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    model.tier === "free"
                      ? "bg-teal-light text-teal"
                      : "bg-accent/10 text-accent"
                  }`}
                >
                  {formatPrice(model)}
                </span>
                {model.context && (
                  <span className="text-[10px] text-text/35 font-medium">{model.context}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="/models"
            className="inline-flex items-center gap-2 text-accent font-bold hover:underline text-lg"
          >
            Все 50 моделей
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
