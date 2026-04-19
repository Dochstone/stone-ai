import { MODELS, type AIModel } from "@/lib/models";
import ProviderIcon from "@/components/ProviderIcon";

function formatPrice(m: AIModel) {
  if (m.tier === "free") return "FREE";
  const s = m.speed || "medium";
  if (s === "instant") return "Мгновенная";
  if (s === "fast") return "Быстрая";
  if (s === "slow") return "Глубокая";
  return "Средняя";
}

interface ToolModelsProps {
  title?: string;
  subtitle?: string;
  modelIds: string[];
  descriptions?: Record<string, string>;
}

export default function ToolModels({
  title = "Подходящие модели",
  subtitle,
  modelIds,
  descriptions,
}: ToolModelsProps) {
  const models = modelIds.map((id) => MODELS.find((m) => m.id === id)!).filter(Boolean);

  return (
    <section className="py-20 md:py-28 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-3">
          {title}
        </h2>
        {subtitle && (
          <p className="text-text/60 text-center mb-12 max-w-lg mx-auto">{subtitle}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {models.map((m) => (
            <div key={m.id} className="bg-bg rounded-2xl p-5 card-hover border border-text/5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <ProviderIcon company={m.company} size={22} />
                  <span className="text-[10px] font-semibold text-text/50">{m.company}</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    m.tier === "free" ? "bg-teal-light text-teal" : "bg-accent/10 text-accent"
                  }`}
                >
                  {formatPrice(m)}
                </span>
              </div>
              <h3 className="font-bold mb-1">{m.name}</h3>
              {descriptions?.[m.id] && (
                <p className="text-text/50 text-sm leading-relaxed mb-2">{descriptions[m.id]}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-text/35">
                {m.context && <span>Контекст: {m.context}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="/dashboard/chat"
            className="inline-block bg-accent text-white px-8 py-3.5 rounded-xl font-bold hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
          >
            Попробовать в чате
          </a>
        </div>
      </div>
    </section>
  );
}
