import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MODELS } from "@/lib/models";
import { TOOL_HUBS } from "@/lib/seo-data";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

interface Props { params: { category: string } }

export function generateStaticParams() { return TOOL_HUBS.map((t) => ({ category: t.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hub = TOOL_HUBS.find((t) => t.slug === params.category);
  if (!hub) return {};
  return {
    title: hub.title, description: hub.description,
    alternates: { canonical: `${SITE_URL}/tools/${hub.slug}` },
    openGraph: { title: hub.title, description: hub.description, url: `${SITE_URL}/tools/${hub.slug}`, type: "website", siteName: "Stone AI" },
  };
}

export default function ToolHubPage({ params }: Props) {
  const hub = TOOL_HUBS.find((t) => t.slug === params.category);
  if (!hub) notFound();

  const catMap: Record<string, string> = { "image-generation": "image", "video-generation": "video", "text-generation": "chat", "code-generation": "code" };
  const matchCat = catMap[hub.slug];
  const allCatModels = matchCat ? MODELS.filter((m) => m.category === matchCat) : hub.modelIds.map((id) => MODELS.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m);

  const faqItems = [
    { q: `Сколько стоит ${hub.category.toLowerCase()}?`, a: "15 бесплатных запросов/день. Подписки от 390₽/мес." },
    { q: "Какие модели доступны?", a: `${allCatModels.length}+ моделей: ${allCatModels.slice(0, 5).map((m) => m.name).join(", ")} и другие.` },
    { q: "Нужна ли регистрация?", a: "Первые 2 запроса — без регистрации. Далее бесплатная регистрация (15 запросов/день)." },
  ];

  const itemListJsonLd = {
    "@context": "https://schema.org", "@type": "ItemList", name: hub.category,
    itemListElement: allCatModels.slice(0, 10).map((m, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "SoftwareApplication", name: m.name, url: `${SITE_URL}/models/${m.id}` } })),
  };
  const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ label: "Инструменты" }, { label: hub.category }]} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="text-3xl md:text-5xl font-extrabold text-text mb-4 leading-tight">{hub.h1}</h1>
        <p className="text-lg text-text/50 mb-12 max-w-2xl">{hub.intro}</p>

        {/* Models */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Доступные модели</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {allCatModels.map((m) => (
              <Link key={m.id} href={`/models/${m.id}`} className="bg-bg rounded-2xl border border-text/5 p-5 hover:border-accent/20 hover:shadow-sm transition-all group block">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-text group-hover:text-accent transition-colors">{m.name}</h3>
                  <span className="text-[10px] text-text/30">{m.company}</span>
                </div>
                <p className="text-sm text-text/50 mb-3">{m.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {m.strengths?.slice(0, 3).map((s) => <span key={s} className="text-[10px] bg-text/[0.04] text-text/40 px-2 py-0.5 rounded-full font-medium">{s}</span>)}
                  </div>
                  <span className="text-xs font-bold text-accent">{m.tier === "free" ? "Бесплатно" : `$${m.pricePerMillion}${m.priceUnit || "/1M"}`}</span>
                </div>
              </Link>
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
          <h2 className="text-xl font-extrabold mb-3">Попробуйте {hub.category.toLowerCase()} бесплатно</h2>
          <p className="text-white/40 text-sm mb-6">Без VPN. На русском языке. Бесплатный старт.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25">
            Начать бесплатно <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </section>

        {/* Other */}
        <section className="mt-14">
          <h2 className="text-lg font-bold text-text mb-4">Другие инструменты</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {TOOL_HUBS.filter((t) => t.slug !== hub.slug).map((t) => (
              <Link key={t.slug} href={`/tools/${t.slug}`} className="bg-bg rounded-xl border border-text/5 px-4 py-3 text-sm font-medium text-text/60 hover:border-accent/20 hover:text-accent transition-colors">
                {t.category}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
