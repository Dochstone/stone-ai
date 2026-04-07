import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MODELS } from "@/lib/models";
import { PROFESSIONS } from "@/lib/seo-data";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Props { params: { role: string } }

export function generateStaticParams() {
  return PROFESSIONS.map((p) => ({ role: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const prof = PROFESSIONS.find((p) => p.slug === params.role);
  if (!prof) return {};
  return {
    title: prof.title,
    description: prof.description,
    alternates: { canonical: `${SITE_URL}/for/${prof.slug}` },
    openGraph: { title: prof.title, description: prof.description, url: `${SITE_URL}/for/${prof.slug}`, type: "article", siteName: "Stone AI" },
  };
}

export default function ProfessionPage({ params }: Props) {
  const prof = PROFESSIONS.find((p) => p.slug === params.role);
  if (!prof) notFound();

  const faqItems = [
    { q: `Какие AI модели лучше для ${prof.role.toLowerCase()}а?`, a: `Лучшие модели: ${prof.tasks.flatMap((t) => t.models).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5).map((id) => MODELS.find((m) => m.id === id)?.name || id).join(", ")}. Все доступны в Stone AI.` },
    { q: "Можно ли использовать AI бесплатно?", a: "Да, Stone AI даёт 15 бесплатных запросов в день к 8 моделям. Достаточно для ежедневных задач." },
    { q: "AI заменит мою работу?", a: `Нет. AI — это инструмент который ускоряет работу ${prof.role.toLowerCase()}а в 3-10 раз. Он помогает с рутиной, а творческие решения остаются за вами.` },
  ];

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Article",
    headline: prof.h1, description: prof.description,
    datePublished: "2026-04-07", dateModified: "2026-04-07",
    author: { "@type": "Organization", name: "Stone AI", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Stone AI", url: SITE_URL },
  };

  const faqJsonLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ label: "AI по профессиям" }, { label: `AI для ${prof.role.toLowerCase()}а` }]} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{prof.h1}</h1>
        <p className="text-lg text-gray-500 mb-10 max-w-2xl">{prof.intro}</p>

        {/* Tasks */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Задачи которые решает AI</h2>
          <div className="space-y-4">
            {prof.tasks.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{t.icon}</span>
                  <h3 className="font-bold text-gray-900">{t.name}</h3>
                </div>
                <p className="text-sm text-gray-500 mb-3">{t.description}</p>
                <div className="flex flex-wrap gap-2">
                  {t.models.map((id) => {
                    const m = MODELS.find((x) => x.id === id);
                    return m ? (
                      <Link key={id} href={`/models/${id}`} className="text-[11px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg font-semibold hover:bg-blue-100 transition-colors">
                        {m.name}
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ready prompts */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Готовые промпты</h2>
          <div className="space-y-4">
            {prof.prompts.map((p) => (
              <div key={p.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
                <pre className="text-sm text-gray-600 bg-gray-50 rounded-xl p-4 whitespace-pre-wrap font-sans leading-relaxed">{p.prompt}</pre>
                <Link href="/dashboard/chat" className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-blue-600 hover:underline">
                  Попробовать в чате
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
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
          <h2 className="text-xl font-bold text-gray-900 mb-3">Начните использовать AI в работе</h2>
          <p className="text-sm text-gray-500 mb-6">15 бесплатных запросов в день. 65+ моделей. Без VPN.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors">
            Попробовать бесплатно
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </section>

        {/* Other professions */}
        <section className="mt-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4">AI для других профессий</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {PROFESSIONS.filter((p) => p.slug !== prof.slug).map((p) => (
              <Link key={p.slug} href={`/for/${p.slug}`} className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-200 transition-colors">
                AI для {p.role.toLowerCase()}а
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
