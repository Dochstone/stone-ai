import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MODELS } from "@/lib/models";
import { PROFESSIONS } from "@/lib/seo-data";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Props { params: { role: string } }

export function generateStaticParams() { return PROFESSIONS.map((p) => ({ role: p.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const prof = PROFESSIONS.find((p) => p.slug === params.role);
  if (!prof) return {};
  return {
    title: prof.title, description: prof.description,
    alternates: { canonical: `${SITE_URL}/for/${prof.slug}` },
    openGraph: { title: prof.title, description: prof.description, url: `${SITE_URL}/for/${prof.slug}`, type: "article", siteName: "Stone AI" },
  };
}

export default function ProfessionPage({ params }: Props) {
  const prof = PROFESSIONS.find((p) => p.slug === params.role);
  if (!prof) notFound();

  const faqItems = [
    { q: `Какие AI модели лучше для ${prof.role.toLowerCase()}а?`, a: `Лучшие: ${prof.tasks.flatMap((t) => t.models).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5).map((id) => MODELS.find((m) => m.id === id)?.name || id).join(", ")}.` },
    { q: "Можно ли использовать бесплатно?", a: "Да, 15 бесплатных запросов в день к 8 моделям. Без карты." },
    { q: "AI заменит мою работу?", a: `Нет. AI ускоряет работу ${prof.role.toLowerCase()}а в 3-10 раз, автоматизируя рутину. Творческие решения — за вами.` },
  ];

  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: prof.h1, description: prof.description, datePublished: "2026-04-07", author: { "@type": "Organization", name: "Stone AI", url: SITE_URL } };
  const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ label: "AI по профессиям" }, { label: `AI для ${prof.role.toLowerCase()}а` }]} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="text-3xl md:text-5xl font-extrabold text-text mb-4 leading-tight">{prof.h1}</h1>
        <p className="text-lg text-text/50 mb-12 max-w-2xl">{prof.intro}</p>

        {/* Tasks */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Задачи которые решает AI</h2>
          <div className="space-y-3">
            {prof.tasks.map((t) => (
              <div key={t.name} className="bg-bg rounded-2xl border border-text/5 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{t.icon}</span>
                  <h3 className="font-bold text-text">{t.name}</h3>
                </div>
                <p className="text-sm text-text/50 mb-3">{t.description}</p>
                <div className="flex flex-wrap gap-2">
                  {t.models.map((id) => {
                    const m = MODELS.find((x) => x.id === id);
                    return m ? (
                      <Link key={id} href={`/models/${id}`} className="text-[11px] bg-accent/10 text-accent px-2.5 py-1 rounded-lg font-bold hover:bg-accent/20 transition-colors">
                        {m.name}
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Prompts */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Готовые промпты</h2>
          <div className="space-y-3">
            {prof.prompts.map((p) => (
              <div key={p.title} className="bg-bg rounded-2xl border border-text/5 p-6">
                <h3 className="font-bold text-text mb-2">{p.title}</h3>
                <pre className="text-sm text-text/50 bg-text/[0.03] rounded-xl p-4 whitespace-pre-wrap font-sans leading-relaxed">{p.prompt}</pre>
                <Link href="/dashboard/chat" className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-accent hover:underline">
                  Попробовать в чате <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Частые вопросы</h2>
          <div className="space-y-3">
            {faqItems.map((f) => (
              <details key={f.q} className="bg-bg rounded-xl border border-text/5 group">
                <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-text/80 list-none flex items-center justify-between">{f.q}<svg className="w-4 h-4 text-text/20 group-open:rotate-180 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></summary>
                <p className="px-5 pb-4 text-sm text-text/50 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-dark text-white rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-xl font-extrabold mb-3">Начните использовать AI в работе</h2>
          <p className="text-white/40 text-sm mb-6">15 бесплатных запросов/день. 65+ моделей. Без VPN.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25">
            Попробовать бесплатно <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </section>

        {/* Other */}
        <section className="mt-14">
          <h2 className="text-lg font-bold text-text mb-4">AI для других профессий</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {PROFESSIONS.filter((p) => p.slug !== prof.slug).map((p) => (
              <Link key={p.slug} href={`/for/${p.slug}`} className="bg-bg rounded-xl border border-text/5 px-4 py-3 text-sm font-medium text-text/60 hover:border-accent/20 hover:text-accent transition-colors">
                AI для {p.role.toLowerCase()}а
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
