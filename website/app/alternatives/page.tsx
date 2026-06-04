import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import AnswerSnapshot from "@/components/AnswerSnapshot";
import { CrossLinks } from "@/components/CrossLinks";
import { SITE_URL } from "@/lib/constants";
import { ALTERNATIVES } from "@/lib/seo-data";
import { planPriceFull } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Альтернативы нейросетям 2026 — аналоги ChatGPT, Midjourney, Sora",
  description: "Лучшие альтернативы популярным AI-сервисам: ChatGPT, Midjourney, Sora, Claude, Gemini, Perplexity, DeepSeek, Grok. Без VPN, на русском и с оплатой в рублях.",
  alternates: { canonical: `${SITE_URL}/alternatives` },
  openGraph: {
    title: "Альтернативы нейросетям 2026 | Stone AI",
    description: `Лучшие аналоги ChatGPT, Midjourney, Sora и других AI-сервисов. 65+ моделей от ${planPriceFull("mini")}.`,
    url: `${SITE_URL}/alternatives`,
    type: "website",
    siteName: "Stone AI",
    images: [{ url: `${SITE_URL}/og-alternatives.png`, width: 1200, height: 630, alt: "Альтернативы нейросетям — Stone AI" }],
  },
};

const faqItems = [
  {
    q: "Каким нейросетям чаще всего ищут альтернативы в России?",
    a: "Чаще всего это ChatGPT, Claude, Midjourney, Sora и Perplexity — сервисы, для которых нужен VPN, зарубежная карта или дорогая подписка. Stone AI заменяет их в одном интерфейсе без VPN и с оплатой в рублях.",
  },
  {
    q: "Эти альтернативы работают в России без VPN?",
    a: "Да. Stone AI работает из России напрямую: VPN и иностранная карта не нужны, а доступ к моделям GPT, Claude, Gemini, Midjourney и другим идёт через один аккаунт.",
  },
  {
    q: "Как выбрать подходящую альтернативу?",
    a: "Отталкивайтесь от задачи: для текста и кода — Claude и GPT, для поиска с источниками — аналог Perplexity, для картинок — Midjourney и DALL·E, для видео — Sora, Kling и Veo. На странице каждого сервиса есть сравнение по сценариям и цена.",
  },
];

export default function AlternativesHubPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Альтернативы AI-сервисам",
    description: metadata.description,
    url: `${SITE_URL}/alternatives`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: ALTERNATIVES.map((alternative, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: `Альтернативы ${alternative.service}`,
        url: `${SITE_URL}/alternatives/${alternative.slug}`,
      })),
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-bg pt-24 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Breadcrumbs items={[{ label: "Альтернативы", href: "/alternatives" }]} />
        <h1 className="mt-6 mb-2 text-3xl font-extrabold text-text md:text-5xl">Альтернативы популярным AI-сервисам</h1>
        <p className="mb-8 max-w-2xl text-text/50">ChatGPT, Midjourney и Sora часто упираются в VPN, карту или цену. Stone AI объединяет 65+ нейросетей в одном интерфейсе от {planPriceFull("mini")} без VPN.</p>

        <AnswerSnapshot
          title="Какие альтернативы выбрать и работают ли они в России"
          answer="Если нужный сервис требует VPN, зарубежной карты или дорогой подписки, его можно заменить через Stone AI: GPT, Claude, Gemini, Perplexity, Midjourney, Sora и ещё 60+ моделей доступны в одном интерфейсе без VPN и с оплатой картой РФ."
          bullets={[
            "Для текста и кода — аналоги ChatGPT и Claude (GPT-5, Claude Opus 4.5).",
            "Для поиска с источниками — альтернатива Perplexity прямо в чате.",
            "Для картинок и видео — Midjourney, DALL·E, Sora, Kling и Veo без отдельных подписок.",
            "Любую модель можно протестировать бесплатно по дневному лимиту, без привязки карты.",
          ]}
          links={[
            { href: "/alternatives/chatgpt", label: "Аналоги ChatGPT" },
            { href: "/alternatives/claude", label: "Альтернативы Claude" },
            { href: "/alternatives/perplexity", label: "Альтернативы Perplexity" },
          ]}
        />

        <div className="grid gap-4">
          {ALTERNATIVES.map((alternative) => (
            <Link
              key={alternative.slug}
              href={`/alternatives/${alternative.slug}`}
              className="group rounded-2xl border border-text/[0.06] bg-surface p-6 transition-all hover:border-accent/20 hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-text transition-colors group-hover:text-accent">Альтернативы {alternative.service}</h2>
              <p className="mt-1 text-sm text-text/50">{alternative.description}</p>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label={`Причины искать альтернативы ${alternative.service}`}>
                {alternative.reasons.slice(0, 3).map((reason) => (
                  <li key={reason} className="rounded-lg bg-accent/5 px-2.5 py-1 text-[11px] font-medium text-accent/70">
                    {reason}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>

        <section className="mt-8 mb-8 space-y-3">
          <h2 className="text-xl font-extrabold text-text">Частые вопросы</h2>
          {faqItems.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-text/[0.06] bg-surface">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-text/85">
                {item.q}
                <svg className="h-4 w-4 text-text/25 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <p className="px-5 pb-4 text-sm leading-relaxed text-text/55">{item.a}</p>
            </details>
          ))}
        </section>

        <CrossLinks exclude={["alternatives"]} />

        <section className="mt-12 rounded-2xl bg-dark p-8 text-center text-white sm:p-10">
          <h2 className="mb-3 text-xl font-extrabold">65+ нейросетей в одном месте</h2>
          <p className="mb-6 text-sm text-white/40">GPT-5, Claude Opus, Gemini, DeepSeek, Grok и другие. Без VPN, на русском, от {planPriceFull("mini")}.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-4 font-bold text-white transition-all hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/25">
            Попробовать бесплатно
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </section>
      </div>
    </div>
  );
}
