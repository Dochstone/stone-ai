import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import AnswerSnapshot from "@/components/AnswerSnapshot";
import { SITE_URL } from "@/lib/constants";
import { PROFESSIONS } from "@/lib/seo-data";

export const metadata: Metadata = {
  title: "AI для профессионалов — нейросети по профессиям 2026",
  description: "AI-инструменты для маркетологов, программистов, копирайтеров, дизайнеров и студентов. Лучшие нейросети для каждой профессии.",
  alternates: { canonical: `${SITE_URL}/for` },
  openGraph: {
    title: "AI для профессионалов | Stone AI",
    description: "Нейросети по профессиям: маркетинг, разработка, копирайтинг, дизайн, учеба.",
    url: `${SITE_URL}/for`,
    type: "website",
    siteName: "Stone AI",
    images: [{ url: `${SITE_URL}/og-for.png`, width: 1200, height: 630, alt: "AI для профессионалов — Stone AI" }],
  },
};

const faqItems = [
  {
    q: "Каким профессиям нейросети помогают больше всего?",
    a: "Заметнее всего AI ускоряет работу разработчиков, маркетологов, SMM-специалистов, копирайтеров, дизайнеров и студентов — везде, где много текста, кода или визуала. На странице каждой роли собраны подходящие модели и сценарии.",
  },
  {
    q: "Как понять, какая модель нужна именно для моей работы?",
    a: "Откройте страницу своей профессии: там показано, какие задачи закрывает AI в этой роли и какие модели для них лучше подходят — например, Claude и GPT для кода, Midjourney для дизайна, Perplexity для ресёрча.",
  },
  {
    q: "Нужно ли разбираться в промптах, чтобы получить пользу?",
    a: "Нет. Для каждой профессии есть готовые промпты и примеры под типовые задачи — их можно скопировать и адаптировать под себя, не изучая промпт-инжиниринг с нуля.",
  },
];

export default function ForPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "AI по профессиям",
    description: metadata.description,
    url: `${SITE_URL}/for`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: PROFESSIONS.map((profession, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: profession.role,
        url: `${SITE_URL}/for/${profession.slug}`,
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
        <Breadcrumbs items={[{ label: "AI по профессиям", href: "/for" }]} />
        <h1 className="mt-6 mb-2 text-3xl font-extrabold text-text">AI для профессионалов — нейросети по профессиям</h1>
        <p className="mb-8 text-text/50">Подборки подходящих AI-моделей и готовых промптов для каждой профессии. Узнайте, какие задачи нейросети закрывают в вашей роли и с чего начать.</p>

        <AnswerSnapshot
          title="Какие нейросети нужны под вашу профессию"
          answer="Выберите свою роль, чтобы увидеть, какие задачи закрывает AI именно в ней и какими моделями их удобнее решать. В Stone AI все нужные модели доступны в одном интерфейсе без VPN и с оплатой в рублях."
          bullets={[
            "Разработчикам — Claude и GPT для кода, рефакторинга и работы с документацией.",
            "Маркетологам и SMM — генерация текстов, контент-планов и картинок под посты.",
            "Бизнесу и аналитикам — разбор документов, анализ данных, черновики стратегий и презентаций.",
            "Студентам и копирайтерам — конспекты, рерайт и структурирование длинных текстов.",
          ]}
          links={[
            { href: "/for/developer", label: "AI для разработчиков" },
            { href: "/for/marketer", label: "AI для маркетологов" },
            { href: "/pricing", label: "Посмотреть тарифы" },
          ]}
        />

        <div className="grid gap-4">
          {PROFESSIONS.map((profession) => (
            <Link
              key={profession.slug}
              href={`/for/${profession.slug}`}
              className="group rounded-2xl border border-text/[0.06] bg-surface p-6 transition-all hover:border-accent/20 hover:shadow-md"
            >
              <h2 className="text-lg font-bold text-text transition-colors group-hover:text-accent">
                {profession.role} — {profession.title}
              </h2>
              <p className="mt-1 text-sm text-text/50">{profession.description}</p>
            </Link>
          ))}
        </div>

        <section className="mt-8 space-y-3">
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
      </div>
    </div>
  );
}
