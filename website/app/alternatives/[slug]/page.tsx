import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MODELS } from "@/lib/models";
import { ALTERNATIVES } from "@/lib/seo-data";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });

interface Props { params: { slug: string } }

export function generateStaticParams() { return ALTERNATIVES.map((a) => ({ slug: a.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const alt = ALTERNATIVES.find((a) => a.slug === params.slug);
  if (!alt) return {};
  return {
    title: alt.title, description: alt.description,
    alternates: { canonical: `${SITE_URL}/alternatives/${alt.slug}` },
    openGraph: { title: alt.title, description: alt.description, url: `${SITE_URL}/alternatives/${alt.slug}`, type: "article", siteName: "Stone AI" },
  };
}

export default function AlternativesPage({ params }: Props) {
  const alt = ALTERNATIVES.find((a) => a.slug === params.slug);
  if (!alt) notFound();
  const models = alt.models.map((id) => MODELS.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m);

  const faqItems = [
    { q: `Какие есть альтернативы ${alt.service}?`, a: `Лучшие альтернативы: ${models.map((m) => m.name).join(", ")}. Все доступны в Stone AI от 390₽/мес.` },
    { q: `Можно ли использовать альтернативы ${alt.service} бесплатно?`, a: "Да, Stone AI даёт 15 бесплатных запросов в день к 8 моделям. Без карты и без VPN." },
    { q: "Почему Stone AI лучше?", a: "65+ моделей от всех провайдеров за одну подписку от 390₽/мес. Не нужно платить за каждый сервис отдельно." },
  ];

  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: alt.h1, description: alt.description, datePublished: "2026-04-07", author: { "@type": "Organization", name: "Stone AI", url: SITE_URL } };
  const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ label: "Альтернативы" }, { label: alt.service }]} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="text-3xl md:text-5xl font-extrabold text-text mb-4 leading-tight">{alt.h1}</h1>
        <p className="text-lg text-text/50 mb-12 max-w-2xl">{alt.intro}</p>

        {/* Why */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-5">Почему ищут альтернативы {alt.service}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {alt.reasons.map((r) => (
              <div key={r} className="flex items-start gap-3 bg-accent/5 rounded-xl p-4 border border-accent/10">
                <svg className="w-4 h-4 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                <span className="text-sm text-text/60 font-medium">{r}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Models */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Лучшие альтернативы {alt.service}</h2>
          <div className="space-y-3">
            {models.map((m, i) => (
              <div key={m.id} className="bg-bg rounded-2xl border border-text/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent font-extrabold text-lg shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-text">{m.name}</h3>
                    <span className="text-[10px] text-text/30">{m.company}</span>
                    {m.tier === "free" && <span className="text-[10px] bg-teal/10 text-teal px-1.5 py-0.5 rounded font-bold">Бесплатно</span>}
                  </div>
                  <p className="text-sm text-text/50">{m.description}</p>
                  {m.strengths && <div className="flex flex-wrap gap-1.5 mt-2">{m.strengths.map((s) => <span key={s} className="text-[10px] bg-text/[0.04] text-text/40 px-2 py-0.5 rounded-full font-medium">{s}</span>)}</div>}
                </div>
                <Link href={`/models/${m.id}`} className="text-xs font-bold text-accent hover:underline shrink-0">Подробнее</Link>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="mb-14 bg-gradient-to-r from-accent/5 to-teal/5 rounded-2xl p-8 border border-accent/10">
          <h2 className="text-xl font-extrabold text-text mb-4">Почему Stone AI — лучшая альтернатива</h2>
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            <div className="text-center"><div className="text-3xl font-extrabold text-accent">65+</div><div className="text-xs text-text/40 mt-1">моделей</div></div>
            <div className="text-center"><div className="text-3xl font-extrabold text-accent">390₽</div><div className="text-xs text-text/40 mt-1">от / месяц</div></div>
            <div className="text-center"><div className="text-3xl font-extrabold text-accent">15</div><div className="text-xs text-text/40 mt-1">бесплатных/день</div></div>
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

        {/* Try it */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-4">Попробуйте альтернативу прямо здесь</h2>
          <ChatWidget placeholder={`Попробуйте AI вместо ${alt.service}`} />
        </section>

        {/* CTA */}
        <section className="bg-dark text-white rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-xl font-extrabold mb-3">Попробуйте Stone AI бесплатно</h2>
          <p className="text-white/40 text-sm mb-6">65+ моделей. Без VPN. На русском. 15 запросов/день бесплатно.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25">
            Начать бесплатно <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </section>

        {/* Other */}
        <section className="mt-14">
          <h2 className="text-lg font-bold text-text mb-4">Альтернативы другим сервисам</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {ALTERNATIVES.filter((a) => a.slug !== alt.slug).map((a) => (
              <Link key={a.slug} href={`/alternatives/${a.slug}`} className="bg-bg rounded-xl border border-text/5 px-4 py-3 text-sm font-medium text-text/60 hover:border-accent/20 hover:text-accent transition-colors">
                Альтернативы {a.service}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
