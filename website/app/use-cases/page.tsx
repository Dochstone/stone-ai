import type { Metadata } from "next";
import Link from "next/link";
import { USE_CASES } from "@/lib/use-cases";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "AI-задачи — что умеет нейросеть | Stone AI",
  description:
    "Примеры использования нейросетей: тексты, картинки, видео, код, бизнес, обучение. Готовые промпты и лучшие модели для каждой задачи.",
  alternates: { canonical: "/use-cases" },
  openGraph: {
    title: "AI-задачи — что умеет нейросеть | Stone AI",
    description:
      "Примеры использования нейросетей: тексты, картинки, видео, код, бизнес, обучение.",
  },
};

const CATEGORY_ORDER = ["text", "image", "video", "code", "business", "education"] as const;

const categoryLabels: Record<string, string> = {
  text: "Тексты",
  image: "Картинки",
  video: "Видео",
  code: "Код",
  business: "Бизнес",
  education: "Обучение",
};

const categoryDescriptions: Record<string, string> = {
  text: "Генерация статей, рерайт, SEO-тексты, переводы и другие текстовые задачи",
  image: "Создание иллюстраций, фото, дизайнов и визуального контента",
  video: "Генерация и редактирование видео с помощью нейросетей",
  code: "Написание, отладка и рефакторинг кода на любом языке",
  business: "Автоматизация бизнес-процессов, аналитика и стратегия",
  education: "Обучение, подготовка к экзаменам и объяснение сложных тем",
};

export default function UseCasesPage() {
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: categoryLabels[cat] || cat,
    description: categoryDescriptions[cat] || "",
    items: USE_CASES.filter((uc) => uc.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="pt-24 pb-20 min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: "AI-задачи", href: "/use-cases" }]} />
        <h1 className="text-3xl font-extrabold text-text mt-6 mb-2">
          AI-задачи — что умеет нейросеть
        </h1>
        <p className="text-text/50 mb-10">
          Готовые примеры использования AI для разных задач. Выберите категорию и попробуйте прямо
          сейчас.
        </p>

        <div className="space-y-12">
          {grouped.map((group) => (
            <section key={group.category}>
              <h2 className="text-2xl font-extrabold text-text mb-1">{group.label}</h2>
              <p className="text-sm text-text/40 mb-4">{group.description}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {group.items.map((uc) => (
                  <Link
                    key={uc.slug}
                    href={`/use-cases/${uc.slug}`}
                    className="bg-surface rounded-2xl border border-text/[0.06] p-6 hover:border-accent/20 hover:shadow-md transition-all group"
                  >
                    <h3 className="text-lg font-bold text-text group-hover:text-accent transition-colors">
                      {uc.h1}
                    </h3>
                    <p className="text-sm text-text/50 mt-1 line-clamp-2">{uc.description}</p>
                    <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent">
                      Подробнее →
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-accent/5 border border-accent/10 rounded-2xl p-8 text-center mt-12">
          <h2 className="text-xl font-bold text-text mb-2">Попробуйте AI прямо сейчас</h2>
          <p className="text-sm text-text/50 mb-4">
            10 бесплатных запросов в день. 65+ нейросетей. Без VPN.
          </p>
          <Link
            href="/dashboard/chat"
            className="inline-flex bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors"
          >
            Открыть AI-чат →
          </Link>
        </div>
      </div>
    </div>
  );
}
