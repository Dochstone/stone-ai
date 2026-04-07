import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MODELS } from "@/lib/models";
import { COMPARISONS } from "@/lib/seo-data";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const comp = COMPARISONS.find((c) => c.slug === params.slug);
  if (!comp) return {};
  return {
    title: comp.title,
    description: comp.description,
    alternates: { canonical: `${SITE_URL}/compare/${comp.slug}` },
    openGraph: {
      title: comp.title,
      description: comp.description,
      url: `${SITE_URL}/compare/${comp.slug}`,
      type: "article",
      siteName: "Stone AI",
    },
  };
}

function ModelCard({ id }: { id: string }) {
  const m = MODELS.find((x) => x.id === id);
  if (!m) return null;
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="text-xs text-gray-400 font-medium mb-1">{m.company}</div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{m.name}</h3>
      <p className="text-sm text-gray-500 mb-4">{m.description}</p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-gray-400">Контекст</span><span className="font-semibold text-gray-700">{m.context || "—"}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Категория</span><span className="font-semibold text-gray-700">{{ chat: "Чат", image: "Картинки", video: "Видео", reason: "Reasoning", code: "Код", search: "Поиск", "3d": "3D" }[m.category]}</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Цена</span><span className="font-semibold text-gray-700">{m.tier === "free" ? "Бесплатно" : `$${m.pricePerMillion}${m.priceUnit || "/1M"}`}</span></div>
      </div>
      {m.strengths && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {m.strengths.map((s) => (
            <span key={s} className="text-[11px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ComparePage({ params }: Props) {
  const comp = COMPARISONS.find((c) => c.slug === params.slug);
  if (!comp) notFound();

  const m1 = MODELS.find((x) => x.id === comp.model1);
  const m2 = MODELS.find((x) => x.id === comp.model2);

  const faqItems = [
    { q: `Какая модель лучше: ${m1?.name || comp.model1} или ${m2?.name || comp.model2}?`, a: comp.verdict },
    { q: "Можно ли попробовать обе модели бесплатно?", a: "Да, Stone AI даёт 15 бесплатных запросов в день к быстрым моделям. Зарегистрируйтесь и попробуйте обе модели прямо сейчас." },
    { q: "Сколько стоит подписка на Stone AI?", a: "Подписка начинается от 390 рублей в месяц (Start). В неё входят 20+ моделей, 50 картинок и 15 видео. Тариф Pro (890₽) даёт доступ ко всем 65+ моделям." },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: comp.h1,
    description: comp.description,
    datePublished: "2026-04-07",
    dateModified: "2026-04-07",
    author: { "@type": "Organization", name: "Stone AI", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Stone AI", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/compare/${comp.slug}` },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ label: "Сравнения", href: "/compare" }, { label: comp.h1 }]} />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">{comp.h1}</h1>
        <p className="text-lg text-gray-500 mb-10 max-w-2xl">{comp.description}</p>

        {/* Model Cards Side by Side */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <ModelCard id={comp.model1} />
          <ModelCard id={comp.model2} />
        </div>

        {/* Comparison Table */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Сравнительная таблица</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-6 py-3 text-gray-400 font-medium">Параметр</th>
                  <th className="text-center px-6 py-3 text-gray-700 font-bold">{m1?.name || comp.model1}</th>
                  <th className="text-center px-6 py-3 text-gray-700 font-bold">{m2?.name || comp.model2}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                <tr><td className="px-6 py-3 text-gray-500">Компания</td><td className="px-6 py-3 text-center font-medium">{m1?.company}</td><td className="px-6 py-3 text-center font-medium">{m2?.company}</td></tr>
                <tr><td className="px-6 py-3 text-gray-500">Контекстное окно</td><td className="px-6 py-3 text-center font-medium">{m1?.context || "—"}</td><td className="px-6 py-3 text-center font-medium">{m2?.context || "—"}</td></tr>
                <tr><td className="px-6 py-3 text-gray-500">Категория</td><td className="px-6 py-3 text-center font-medium">{m1?.category}</td><td className="px-6 py-3 text-center font-medium">{m2?.category}</td></tr>
                <tr><td className="px-6 py-3 text-gray-500">Цена (за 1M токенов)</td><td className="px-6 py-3 text-center font-medium">${m1?.pricePerMillion}</td><td className="px-6 py-3 text-center font-medium">${m2?.pricePerMillion}</td></tr>
                <tr><td className="px-6 py-3 text-gray-500">Доступ в Stone AI</td><td className="px-6 py-3 text-center font-medium">{m1?.tier === "free" ? "Бесплатно" : "По подписке"}</td><td className="px-6 py-3 text-center font-medium">{m2?.tier === "free" ? "Бесплатно" : "По подписке"}</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Для каких задач подходят</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">{m1?.name} лучше для:</h3>
              <ul className="space-y-2">
                {comp.useCases.model1.map((uc) => (
                  <li key={uc} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    {uc}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">{m2?.name} лучше для:</h3>
              <ul className="space-y-2">
                {comp.useCases.model2.map((uc) => (
                  <li key={uc} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                    {uc}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Verdict */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Вердикт</h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
            <p className="text-gray-700 text-base leading-relaxed">{comp.verdict}</p>
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
          <h2 className="text-xl font-bold text-gray-900 mb-3">Попробуйте обе модели бесплатно</h2>
          <p className="text-sm text-gray-500 mb-6">15 бесплатных запросов в день. Без карты. Без VPN.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors">
            Попробовать бесплатно
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </section>

        {/* Related Comparisons */}
        <section className="mt-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Другие сравнения</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {COMPARISONS.filter((c) => c.slug !== comp.slug).slice(0, 6).map((c) => (
              <Link key={c.slug} href={`/compare/${c.slug}`} className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-blue-200 transition-colors">
                {c.h1.replace(/ — .*/, "")}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
