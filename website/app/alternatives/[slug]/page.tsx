import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MODELS } from "@/lib/models";
import { ALTERNATIVES } from "@/lib/seo-data";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Props { params: { slug: string } }

export function generateStaticParams() {
  return ALTERNATIVES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const alt = ALTERNATIVES.find((a) => a.slug === params.slug);
  if (!alt) return {};
  return {
    title: alt.title,
    description: alt.description,
    alternates: { canonical: `${SITE_URL}/alternatives/${alt.slug}` },
    openGraph: { title: alt.title, description: alt.description, url: `${SITE_URL}/alternatives/${alt.slug}`, type: "article", siteName: "Stone AI" },
  };
}

export default function AlternativesPage({ params }: Props) {
  const alt = ALTERNATIVES.find((a) => a.slug === params.slug);
  if (!alt) notFound();

  const models = alt.models.map((id) => MODELS.find((m) => m.id === id)).filter(Boolean);

  const faqItems = [
    { q: `Какие есть альтернативы ${alt.service}?`, a: `Лучшие альтернативы: ${models.map((m) => m!.name).join(", ")}. Все доступны в Stone AI от 390₽/мес с доступом к 65+ моделям.` },
    { q: `Можно ли использовать ${alt.service} бесплатно?`, a: "В Stone AI доступно 15 бесплатных запросов в день к 8 моделям. Без карты и без VPN." },
    { q: "Почему Stone AI лучше?", a: `Stone AI даёт доступ к 65+ моделям от всех провайдеров (OpenAI, Anthropic, Google, Meta и других) за одну подписку от 390₽/мес. Не нужно платить за каждый сервис отдельно.` },
  ];

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Article",
    headline: alt.h1, description: alt.description,
    datePublished: "2026-04-07", dateModified: "2026-04-07",
    author: { "@type": "Organization", name: "Stone AI", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Stone AI", url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/alternatives/${alt.slug}` },
  };

  const faqJsonLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ label: "Альтернативы", href: "/alternatives" }, { label: alt.service }]} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{alt.h1}</h1>
        <p className="text-lg text-gray-500 mb-10 max-w-2xl">{alt.intro}</p>

        {/* Why look for alternatives */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Почему ищут альтернативы {alt.service}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {alt.reasons.map((r) => (
              <div key={r} className="flex items-start gap-3 bg-red-50 rounded-xl p-4 border border-red-100">
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                <span className="text-sm text-red-700 font-medium">{r}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Recommended models */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Лучшие альтернативы {alt.service}</h2>
          <div className="space-y-4">
            {models.map((m, i) => m && (
              <div key={m.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-extrabold text-lg shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{m.name}</h3>
                    <span className="text-xs text-gray-400">{m.company}</span>
                    {m.tier === "free" && <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded font-bold">Бесплатно</span>}
                  </div>
                  <p className="text-sm text-gray-500">{m.description}</p>
                  {m.strengths && <div className="flex flex-wrap gap-1.5 mt-2">{m.strengths.map((s) => <span key={s} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{s}</span>)}</div>}
                </div>
                <Link href={`/models/${m.id}`} className="text-xs font-bold text-blue-600 hover:underline shrink-0">Подробнее</Link>
              </div>
            ))}
          </div>
        </section>

        {/* Stone AI advantage */}
        <section className="mb-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-100">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Почему Stone AI — лучшая альтернатива</h2>
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            <div className="text-center"><div className="text-2xl font-extrabold text-blue-600">65+</div><div className="text-xs text-gray-500">моделей</div></div>
            <div className="text-center"><div className="text-2xl font-extrabold text-blue-600">390₽</div><div className="text-xs text-gray-500">от / месяц</div></div>
            <div className="text-center"><div className="text-2xl font-extrabold text-blue-600">15</div><div className="text-xs text-gray-500">бесплатных запросов/день</div></div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Частые вопросы</h2>
          <div className="space-y-4">
            {faqItems.map((f) => (
              <details key={f.q} className="bg-white rounded-xl border border-gray-100 shadow-sm group">
                <summary className="px-6 py-4 cursor-pointer text-sm font-semibold text-gray-900 list-none flex items-center justify-between">
                  {f.q}
                  <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <p className="px-6 pb-4 text-sm text-gray-500 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Попробуйте Stone AI бесплатно</h2>
          <p className="text-sm text-gray-500 mb-6">65+ моделей. Без VPN. На русском языке. 15 запросов в день бесплатно.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors">
            Начать бесплатно
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </section>

        {/* Other alternatives */}
        <section className="mt-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Альтернативы другим сервисам</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {ALTERNATIVES.filter((a) => a.slug !== alt.slug).map((a) => (
              <Link key={a.slug} href={`/alternatives/${a.slug}`} className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-200 transition-colors">
                Альтернативы {a.service}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
