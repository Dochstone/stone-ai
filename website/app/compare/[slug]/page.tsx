import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MODELS } from "@/lib/models";
import { COMPARISONS } from "@/lib/seo-data";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Props { params: { slug: string } }

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
    openGraph: { title: comp.title, description: comp.description, url: `${SITE_URL}/compare/${comp.slug}`, type: "article", siteName: "Stone AI" },
  };
}

function ModelCard({ id }: { id: string }) {
  const m = MODELS.find((x) => x.id === id);
  if (!m) return null;
  const catLabel: Record<string, string> = { chat: "Чат", image: "Картинки", video: "Видео", reason: "Reasoning", code: "Код", search: "Поиск", "3d": "3D" };
  return (
    <div className="bg-bg rounded-2xl border border-text/5 p-6">
      <div className="text-[10px] text-text/30 font-semibold uppercase tracking-wider mb-1">{m.company}</div>
      <h3 className="text-lg font-extrabold text-text mb-2">{m.name}</h3>
      <p className="text-sm text-text/50 mb-4 leading-relaxed">{m.description}</p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-text/30">Контекст</span><span className="font-bold text-text/70">{m.context || "—"}</span></div>
        <div className="flex justify-between"><span className="text-text/30">Категория</span><span className="font-bold text-text/70">{catLabel[m.category] || m.category}</span></div>
        <div className="flex justify-between"><span className="text-text/30">Цена</span><span className="font-bold text-text/70">{m.tier === "free" ? "Бесплатно" : `$${m.pricePerMillion}${m.priceUnit || "/1M"}`}</span></div>
      </div>
      {m.strengths && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {m.strengths.map((s) => <span key={s} className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold">{s}</span>)}
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
    { q: `Какая модель лучше: ${m1?.name} или ${m2?.name}?`, a: comp.verdict },
    { q: "Можно ли попробовать обе модели бесплатно?", a: "Да, Stone AI даёт 15 бесплатных запросов в день к быстрым моделям. Зарегистрируйтесь и попробуйте обе модели." },
    { q: "Сколько стоит подписка?", a: "Подписка Start — 390₽/мес (20+ моделей). Pro — 890₽/мес (все 65+ моделей). Elite — 1990₽/мес (максимум)." },
  ];

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Article", headline: comp.h1, description: comp.description,
    datePublished: "2026-04-07", dateModified: "2026-04-07",
    author: { "@type": "Organization", name: "Stone AI", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Stone AI", url: SITE_URL },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/compare/${comp.slug}` },
  };
  const faqJsonLd = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ label: "Сравнения", href: "/compare" }, { label: comp.h1 }]} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="text-3xl md:text-5xl font-extrabold text-text mb-4 leading-tight">{comp.h1}</h1>
        <p className="text-lg text-text/50 mb-12 max-w-2xl">{comp.description}</p>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-14">
          <ModelCard id={comp.model1} />
          <ModelCard id={comp.model2} />
        </div>

        {/* Table */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Сравнительная таблица</h2>
          <div className="bg-bg rounded-2xl border border-text/5 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-text/5">
                  <th className="text-left px-5 py-3 text-text/30 font-semibold text-xs uppercase tracking-wider">Параметр</th>
                  <th className="text-center px-5 py-3 text-text font-bold">{m1?.name}</th>
                  <th className="text-center px-5 py-3 text-text font-bold">{m2?.name}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-text/[0.04]">
                <tr><td className="px-5 py-3 text-text/40">Компания</td><td className="px-5 py-3 text-center font-medium text-text/70">{m1?.company}</td><td className="px-5 py-3 text-center font-medium text-text/70">{m2?.company}</td></tr>
                <tr><td className="px-5 py-3 text-text/40">Контекст</td><td className="px-5 py-3 text-center font-medium text-text/70">{m1?.context || "—"}</td><td className="px-5 py-3 text-center font-medium text-text/70">{m2?.context || "—"}</td></tr>
                <tr><td className="px-5 py-3 text-text/40">Цена / 1M</td><td className="px-5 py-3 text-center font-medium text-text/70">${m1?.pricePerMillion}</td><td className="px-5 py-3 text-center font-medium text-text/70">${m2?.pricePerMillion}</td></tr>
                <tr><td className="px-5 py-3 text-text/40">Доступ</td><td className="px-5 py-3 text-center font-medium text-text/70">{m1?.tier === "free" ? "Бесплатно" : "Подписка"}</td><td className="px-5 py-3 text-center font-medium text-text/70">{m2?.tier === "free" ? "Бесплатно" : "Подписка"}</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Для каких задач подходят</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-bg rounded-2xl border border-text/5 p-6">
              <h3 className="font-bold text-text mb-3">{m1?.name} лучше для:</h3>
              <ul className="space-y-2">
                {comp.useCases.model1.map((uc) => (
                  <li key={uc} className="flex items-center gap-2.5 text-sm text-text/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />{uc}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-bg rounded-2xl border border-text/5 p-6">
              <h3 className="font-bold text-text mb-3">{m2?.name} лучше для:</h3>
              <ul className="space-y-2">
                {comp.useCases.model2.map((uc) => (
                  <li key={uc} className="flex items-center gap-2.5 text-sm text-text/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal shrink-0" />{uc}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Verdict */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-4">Вердикт</h2>
          <div className="bg-gradient-to-r from-accent/5 to-teal/5 rounded-2xl p-6 border border-accent/10">
            <p className="text-text/70 text-base leading-relaxed">{comp.verdict}</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Частые вопросы</h2>
          <div className="space-y-3">
            {faqItems.map((f) => (
              <details key={f.q} className="bg-bg rounded-xl border border-text/5 group">
                <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-text/80 list-none flex items-center justify-between">
                  {f.q}
                  <svg className="w-4 h-4 text-text/20 group-open:rotate-180 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </summary>
                <p className="px-5 pb-4 text-sm text-text/50 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-dark text-white rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-xl font-extrabold mb-3">Попробуйте обе модели бесплатно</h2>
          <p className="text-white/40 text-sm mb-6">15 бесплатных запросов в день. Без карты. Без VPN.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25">
            Попробовать бесплатно
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </section>

        {/* Related */}
        <section className="mt-14">
          <h2 className="text-lg font-bold text-text mb-4">Другие сравнения</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {COMPARISONS.filter((c) => c.slug !== comp.slug).slice(0, 6).map((c) => (
              <Link key={c.slug} href={`/compare/${c.slug}`} className="bg-bg rounded-xl border border-text/5 px-4 py-3 text-sm font-medium text-text/60 hover:border-accent/20 hover:text-accent transition-colors">
                {c.h1.replace(/ — .*/, "")}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
