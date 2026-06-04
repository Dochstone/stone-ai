import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import AnswerSnapshot from "@/components/AnswerSnapshot";
import { CrossLinks } from "@/components/CrossLinks";
import { SITE_URL } from "@/lib/constants";
import { COMPARISONS } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "Сравнения AI-сервисов и нейросетей 2026",
  description: "Детальные сравнения AI-моделей и платформ: GPT-5 vs Claude, Stone AI vs ChatGPT и другие. Цены, возможности и практические различия.",
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Сравнения AI-сервисов | Stone AI",
    description: "GPT-5 vs Claude, Stone AI vs ChatGPT и другие сравнения нейросетей.",
  },
};

const faqItems = [
  {
    q: "Что выбрать: отдельный сервис или Stone AI со всеми моделями?",
    a: "Если вы регулярно пользуетесь только одной моделью — хватит и отдельного сервиса. Но за GPT, Claude, Perplexity и Midjourney по отдельности придётся платить несколько подписок и иметь VPN. Stone AI даёт их все в одном интерфейсе и за одну подписку в рублях.",
  },
  {
    q: "С чего начать сравнение, если ещё не выбрали сервис?",
    a: "Сначала сравните платформы целиком — например, Stone AI vs ChatGPT Plus или Stone AI vs Perplexity, чтобы понять доступность в России, цену и набор моделей. Потом уже сравнивайте отдельные модели под конкретную задачу.",
  },
  {
    q: "Можно ли попробовать обе модели перед выбором?",
    a: "Да. В Stone AI модели переключаются в одном интерфейсе, поэтому один и тот же запрос можно прогнать через GPT и Claude и сравнить ответы — без VPN и зарубежных карт.",
  },
];

export default function ComparePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Сравнения AI-сервисов и нейросетей",
    description: metadata.description,
    url: `${SITE_URL}/compare`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: COMPARISONS.map((comparison, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: comparison.h1,
        url: `${SITE_URL}/compare/${comparison.slug}`,
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
        <Breadcrumbs items={[{ label: "Сравнения", href: "/compare" }]} />
        <h1 className="mt-6 mb-2 text-3xl font-extrabold text-text">Сравнения AI-сервисов и нейросетей</h1>
        <p className="mb-8 text-text/50">Детальные сравнения моделей, платформ и тарифов. Помогаем выбрать лучший AI-инструмент под задачу и бюджет.</p>

        <AnswerSnapshot
          title="Как выбрать AI-сервис или модель по сравнению"
          answer="Сравнения помогают решить два вопроса: какой сервис подключить целиком и какой моделью решать конкретную задачу. Для пользователей из России ключевые критерии — доступность без VPN, оплата в рублях, набор моделей и цена подписки."
          bullets={[
            "Если выбираете сервис целиком — начните со сравнения платформ: Stone AI vs ChatGPT Plus, Stone AI vs Perplexity.",
            "Если сервис уже выбран — сравните модели под задачу: GPT-5 vs Claude для текста и кода.",
            "Смотрите на доступность в России, цену и набор моделей, а не только на бенчмарки.",
            "В Stone AI любую сравниваемую модель можно сразу попробовать в одном интерфейсе.",
          ]}
          links={[
            { href: "/compare/stone-ai-vs-chatgpt-plus", label: "Stone AI vs ChatGPT Plus" },
            { href: "/compare/stone-ai-vs-perplexity", label: "Stone AI vs Perplexity" },
            { href: "/pricing", label: "Тарифы Stone AI" },
          ]}
        />

        <div className="grid gap-4">
          {COMPARISONS.map((comparison) => (
            <Link
              key={comparison.slug}
              href={`/compare/${comparison.slug}`}
              className="group rounded-2xl border border-text/[0.06] bg-surface p-6 transition-all hover:border-accent/20 hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-text transition-colors group-hover:text-accent">{comparison.title}</h2>
              <p className="mt-1 text-sm text-text/50">{comparison.description}</p>
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

        <CrossLinks exclude={["compare"]} />
      </div>
    </div>
  );
}
