import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MODELS } from "@/lib/models";
import { TOOL_HUBS } from "@/lib/seo-data";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Props { params: { category: string } }

export function generateStaticParams() {
  return TOOL_HUBS.map((t) => ({ category: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hub = TOOL_HUBS.find((t) => t.slug === params.category);
  if (!hub) return {};
  return {
    title: hub.title,
    description: hub.description,
    alternates: { canonical: `${SITE_URL}/tools/${hub.slug}` },
    openGraph: { title: hub.title, description: hub.description, url: `${SITE_URL}/tools/${hub.slug}`, type: "website", siteName: "Stone AI" },
  };
}

export default function ToolHubPage({ params }: Props) {
  const hub = TOOL_HUBS.find((t) => t.slug === params.category);
  if (!hub) notFound();

  const models = hub.modelIds.map((id) => MODELS.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m);
  const catMap: Record<string, string> = { "image-generation": "image", "video-generation": "video", "text-generation": "chat", "code-generation": "code" };
  const matchCat = catMap[hub.slug];
  const allCatModels = matchCat ? MODELS.filter((m) => m.category === matchCat) : models;

  const faqItems = [
    { q: `Сколько стоит ${hub.category.toLowerCase()}?`, a: "15 бесплатных запросов в день к быстрым моделям. Подписки от 390₽/мес для расширенного доступа." },
    { q: "Какие модели доступны?", a: `В Stone AI доступно ${allCatModels.length}+ моделей для ${hub.category.toLowerCase()}. ${allCatModels.slice(0, 5).map((m) => m.name).join(", ")} и другие.` },
    { q: "Нужна ли регистрация?", a: "Для первых 2 запросов — нет. Для продолжения работы нужна бесплатная регистрация (15 запросов/день)." },
  ];

  const itemListJsonLd = {
    "@context": "https://schema.org", "@type": "ItemList",
    name: hub.category,
    itemListElement: allCatModels.slice(0, 10).map((m, i) => ({
      "@type": "ListItem", position: i + 1,
      item: { "@type": "SoftwareApplication", name: m.name, applicationCategory: "AIApplication", url: `${SITE_URL}/models/${m.id}` },
    })),
  };

  const faqJsonLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ label: "Инструменты", href: "/tools" }, { label: hub.category }]} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{hub.h1}</h1>
        <p className="text-lg text-gray-500 mb-10 max-w-2xl">{hub.intro}</p>

        {/* Models grid */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Доступные модели</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {allCatModels.map((m) => (
              <Link key={m.id} href={`/models/${m.id}`} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{m.name}</h3>
                  <span className="text-xs text-gray-400">{m.company}</span>
                </div>
                <p className="text-sm text-gray-500 mb-3">{m.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {m.strengths?.slice(0, 3).map((s) => (
                      <span key={s} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{s}</span>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-blue-600">{m.tier === "free" ? "Бесплатно" : `$${m.pricePerMillion}${m.priceUnit || "/1M"}`}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Частые вопросы</h2>
          <div className="space-y-4">
            {faqItems.map((f) => (
              <details key={f.q} className="bg-white rounded-xl border border-gray-100 shadow-sm group">
                <summary className="px-6 py-4 cursor-pointer text-sm font-semibold text-gray-900 list-none flex items-center justify-between">{f.q}<svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></summary>
                <p className="px-6 pb-4 text-sm text-gray-500 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Попробуйте {hub.category.toLowerCase()} бесплатно</h2>
          <p className="text-sm text-gray-500 mb-6">Без регистрации. Без VPN. На русском языке.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors">
            Начать бесплатно
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </section>

        {/* Other tools */}
        <section className="mt-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Другие инструменты</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {TOOL_HUBS.filter((t) => t.slug !== hub.slug).map((t) => (
              <Link key={t.slug} href={`/tools/${t.slug}`} className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-200 transition-colors">
                {t.category}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
