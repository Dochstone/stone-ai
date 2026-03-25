import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MODELS } from "@/lib/models";
import { SITE_URL } from "@/lib/constants";
import { breadcrumbJsonLd } from "@/components/Breadcrumbs";

interface Props {
  params: { id: string };
}

export function generateStaticParams() {
  return MODELS.map((m) => ({ id: m.id }));
}

const categoryLabels: Record<string, string> = {
  chat: "Чат", image: "Картинки", reason: "Глубокий анализ",
  search: "Поиск", code: "Код", video: "Видео", "3d": "3D",
};

export function generateMetadata({ params }: Props): Metadata {
  const model = MODELS.find((m) => m.id === params.id);
  if (!model) return {};
  const cat = categoryLabels[model.category] || model.category;
  return {
    title: `${model.name} — нейросеть ${cat} | Stone AI`,
    description: `${model.name} от ${model.company} в Stone AI. ${model.description || ""} Контекст ${model.context}. ${model.tier === "free" ? "Бесплатно, 15 запросов/день." : "Доступна по подписке от 390₽/мес."}`,
    alternates: { canonical: `/models/${params.id}` },
    openGraph: {
      title: `${model.name} — ${cat} нейросеть в Stone AI`,
      description: `${model.description || model.name + " от " + model.company}. Доступна в Telegram и веб-чате Stone AI.`,
    },
  };
}

export default function ModelPage({ params }: Props) {
  const model = MODELS.find((m) => m.id === params.id);
  if (!model) return notFound();

  const cat = categoryLabels[model.category] || model.category;
  const bcItems = [{ label: "Модели", href: "/models" }, { label: model.name }];

  const modelJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: model.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Android, iOS, Web",
    description: model.description || `${model.name} — нейросеть от ${model.company}`,
    offers: {
      "@type": "Offer",
      price: model.tier === "free" ? "0" : String(model.pricePerMillion),
      priceCurrency: "USD",
      description: model.tier === "free" ? "15 бесплатных запросов в день" : "Доступна по подписке от 390₽/мес",
    },
    author: { "@type": "Organization", name: model.company },
  };

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(modelJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(bcItems)) }} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-text/40 mb-8">
          <a href="/" className="hover:text-accent transition-colors">Главная</a>
          <span>/</span>
          <a href="/models" className="hover:text-accent transition-colors">Модели</a>
          <span>/</span>
          <span className="text-text/60 truncate">{model.name}</span>
        </nav>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${model.tier === "free" ? "bg-teal/10 text-teal" : "bg-accent/10 text-accent"}`}>
              {model.tier === "free" ? "Бесплатная" : "Премиум"}
            </span>
            <span className="text-xs text-text/40 bg-bg px-3 py-1 rounded-full">{cat}</span>
            <span className="text-xs text-text/40">{model.company}</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{model.name}</h1>

          {model.description && (
            <p className="text-text/60 text-lg leading-relaxed mb-6">{model.description}</p>
          )}
        </div>

        {/* Specs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-2xl border border-text/5 p-5">
            <div className="text-text/40 text-xs font-medium mb-1">Цена</div>
            <div className="text-xl font-extrabold">
              {model.tier === "free" ? "Бесплатно" : "от 390₽/мес"}
            </div>
            <div className="text-text/30 text-xs mt-1">
              {model.tier === "free" ? "15 запросов в день" : "по подписке"}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-text/5 p-5">
            <div className="text-text/40 text-xs font-medium mb-1">Контекст</div>
            <div className="text-xl font-extrabold">{model.context}</div>
            <div className="text-text/30 text-xs mt-1">токенов</div>
          </div>
          <div className="bg-white rounded-2xl border border-text/5 p-5">
            <div className="text-text/40 text-xs font-medium mb-1">Компания</div>
            <div className="text-xl font-extrabold">{model.company}</div>
            <div className="text-text/30 text-xs mt-1">провайдер</div>
          </div>
        </div>

        {/* Strengths */}
        {model.strengths && model.strengths.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-extrabold mb-4">Сильные стороны</h2>
            <div className="space-y-2">
              {model.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded-xl border border-text/5 p-4">
                  <span className="text-teal mt-0.5 shrink-0">&#10003;</span>
                  <span className="text-text/70 text-sm">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-white rounded-2xl border border-text/5 p-8 text-center">
          <h2 className="font-bold text-lg mb-2">Попробуйте {model.name}</h2>
          <p className="text-text/50 text-sm mb-6">
            {model.tier === "free"
              ? "Бесплатно, 15 запросов в день. Без регистрации."
              : "Доступна по подписке от 390₽/мес. Попробуйте бесплатно."}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`/webchat?model=${model.id}`}
              className="bg-accent text-white px-8 py-3.5 rounded-xl font-bold hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
            >
              Открыть в чате
            </a>
            <a
              href="/models"
              className="border-2 border-text/15 text-text px-8 py-3.5 rounded-xl font-bold hover:border-accent hover:text-accent transition-colors"
            >
              Все модели
            </a>
          </div>
        </div>

        {/* Related models */}
        <div className="mt-14">
          <h2 className="font-bold text-lg mb-6">Похожие модели</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODELS.filter((m) => m.category === model.category && m.id !== model.id)
              .slice(0, 4)
              .map((m) => (
                <a
                  key={m.id}
                  href={`/models/${m.id}`}
                  className="bg-white rounded-xl border border-text/5 p-4 card-hover block"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{m.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.tier === "free" ? "bg-teal/10 text-teal" : "bg-accent/10 text-accent"}`}>
                      {m.tier === "free" ? "Free" : "Подписка"}
                    </span>
                  </div>
                  <div className="text-text/40 text-xs">{m.company} · {m.context}</div>
                </a>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
