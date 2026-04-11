import type { Metadata } from "next";
import Link from "next/link";
import { ALTERNATIVES } from "@/lib/seo-data";
import { CrossLinks } from "@/components/CrossLinks";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Альтернативы нейросетям 2026 — аналоги ChatGPT, Midjourney, Sora",
  description: "Лучшие альтернативы популярным AI-сервисам: ChatGPT, Midjourney, Sora, Claude, Gemini, Perplexity, DeepSeek, Grok. Без VPN, на русском, дешевле.",
  alternates: { canonical: `${SITE_URL}/alternatives` },
  openGraph: {
    title: "Альтернативы нейросетям 2026 | Stone AI",
    description: "Лучшие аналоги ChatGPT, Midjourney, Sora и других AI-сервисов. 65+ моделей от 590₽/мес.",
    url: `${SITE_URL}/alternatives`,
    type: "website",
    siteName: "Stone AI",
    images: [{ url: `${SITE_URL}/og-alternatives.png`, width: 1200, height: 630, alt: "Альтернативы нейросетям — Stone AI" }],
  },
};

export default function AlternativesHubPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Альтернативы AI-сервисам",
    description: metadata.description,
    url: `${SITE_URL}/alternatives`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: ALTERNATIVES.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `Альтернативы ${a.service}`,
        url: `${SITE_URL}/alternatives/${a.slug}`,
      })),
    },
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Breadcrumbs items={[{ label: "Альтернативы" }]} />
        <h1 className="text-3xl md:text-5xl font-extrabold text-text mt-6 mb-2">Альтернативы популярным AI-сервисам</h1>
        <p className="text-text/50 mb-8 max-w-2xl">ChatGPT, Midjourney, Sora — все они дорогие или недоступны в России. Stone AI объединяет 65+ нейросетей в одном интерфейсе от 590₽/мес без VPN.</p>

        <div className="grid gap-4">
          {ALTERNATIVES.map((a) => (
            <Link key={a.slug} href={`/alternatives/${a.slug}`}
              className="bg-surface rounded-2xl border border-text/[0.06] p-6 hover:border-accent/20 hover:shadow-md transition-all group">
              <h2 className="text-lg font-bold text-text group-hover:text-accent transition-colors">Альтернативы {a.service}</h2>
              <p className="text-sm text-text/50 mt-1">{a.description}</p>
              <ul className="flex flex-wrap gap-2 mt-3" aria-label={`Причины искать альтернативы ${a.service}`}>
                {a.reasons.slice(0, 3).map((r) => (
                  <li key={r} className="text-[11px] bg-accent/5 text-accent/70 px-2.5 py-1 rounded-lg font-medium">{r}</li>
                ))}
              </ul>
            </Link>
          ))}
        </div>

        <CrossLinks exclude={["alternatives"]} />

        <section className="mt-12 bg-dark text-white rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-xl font-extrabold mb-3">65+ нейросетей в одном месте</h2>
          <p className="text-white/40 text-sm mb-6">GPT-5, Claude Opus, Gemini, DeepSeek, Grok и другие. Без VPN, на русском, от 590₽/мес.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25">
            Попробовать бесплатно
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </section>
      </div>
    </div>
  );
}
