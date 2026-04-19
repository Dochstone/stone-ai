import Link from "next/link";
import type { AIModel } from "@/lib/models";
import ProviderIcon from "@/components/ProviderIcon";

interface Props {
  models: AIModel[];
  title?: string;
  description?: string;
}

const categoryLabels: Record<string, string> = {
  chat: "Чат",
  image: "Картинки",
  video: "Видео",
  reason: "Reasoning",
  code: "Код",
  search: "Поиск",
  "3d": "3D",
};

export default function RelatedModels({
  models,
  title = "Похожие модели",
  description = "Другие нейросети для тех же задач",
}: Props) {
  if (models.length === 0) return null;

  return (
    <section className="mt-14" aria-label={title}>
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-extrabold mb-1">{title}</h2>
        {description && <p className="text-sm text-text/50">{description}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {models.map((m) => (
          <Link
            key={m.id}
            href={`/models/${m.id}`}
            className="group block bg-bg border border-text/5 rounded-2xl p-5 hover:border-accent/30 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <ProviderIcon company={m.company} size={20} />
                <span className="text-[10px] font-bold text-text/50">{m.company}</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  m.tier === "free"
                    ? "bg-teal/15 text-teal"
                    : "bg-accent/15 text-accent"
                }`}
              >
                {m.tier === "free" ? "Free" : "Подписка"}
              </span>
            </div>
            <h3 className="font-bold text-sm mb-1.5 group-hover:text-accent transition-colors">
              {m.name}
            </h3>
            {m.description && (
              <p className="text-[12px] text-text/60 leading-relaxed line-clamp-2 mb-2">
                {m.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-[10px] text-text/40">
              <span>{categoryLabels[m.category] ?? m.category}</span>
              {m.context && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{m.context}</span>
                </>
              )}
              <span className="ml-auto text-accent font-semibold">Открыть →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
