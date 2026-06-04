import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { SITE_URL } from "@/lib/constants";
import { MODELS } from "@/lib/models";
import { HOW_TO_GUIDES } from "@/lib/how-to";
import { buildHowTo } from "@/lib/schema";
import Breadcrumbs from "@/components/Breadcrumbs";
import AnswerSnapshot from "@/components/AnswerSnapshot";
import { CrossLinks } from "@/components/CrossLinks";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });

interface Props {
  params: { slug: string };
}

const categoryLabels: Record<string, string> = {
  text: "Текст и чат",
  image: "Изображения",
  video: "Видео",
};

export function generateStaticParams() {
  return HOW_TO_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = HOW_TO_GUIDES.find((g) => g.slug === params.slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `${SITE_URL}/how-to/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: `${SITE_URL}/how-to/${guide.slug}`,
      type: "article",
      siteName: "Stone AI",
    },
  };
}

export default function HowToPage({ params }: Props) {
  const guide = HOW_TO_GUIDES.find((g) => g.slug === params.slug);
  if (!guide) notFound();

  const models = guide.models
    .map((id) => MODELS.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => !!m);

  const snapshotLinks = [
    ...(guide.alternativeSlug
      ? [{ href: `/alternatives/${guide.alternativeSlug}`, label: `Аналоги ${guide.tool}` }]
      : []),
    { href: "/pricing", label: "Посмотреть тарифы" },
    { href: "/dashboard/chat", label: "Открыть чат" },
  ];

  const howToJsonLd = buildHowTo({
    name: guide.h1,
    description: guide.description,
    totalTime: "PT5M",
    steps: guide.steps.map((s) => ({
      name: s.name,
      text: s.text,
      url: `${SITE_URL}/how-to/${guide.slug}`,
    })),
  });

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.h1,
    description: guide.description,
    author: { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Stone AI", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Stone AI", logo: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png` } },
    mainEntityOfPage: `${SITE_URL}/how-to/${guide.slug}`,
    datePublished: "2026-05-31",
    dateModified: new Date().toISOString().split("T")[0],
    inLanguage: "ru-RU",
  };

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <Breadcrumbs
          items={[
            { label: "Как пользоваться", href: "/how-to" },
            { label: guide.tool, href: `/how-to/${guide.slug}` },
          ]}
        />

        <h1 className="text-3xl md:text-5xl font-extrabold text-text mt-6 mb-4 leading-tight">{guide.h1}</h1>
        <p className="text-lg text-text/50 mb-10 max-w-2xl">{guide.intro}</p>

        <AnswerSnapshot
          title={`Коротко: как пользоваться ${guide.tool} в России`}
          answer={guide.snapshot.answer}
          bullets={guide.snapshot.bullets}
          links={snapshotLinks}
        />

        {/* Steps */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Пошаговая инструкция</h2>
          <ol className="space-y-4">
            {guide.steps.map((step, i) => (
              <li key={step.name} className="flex gap-4 bg-bg rounded-2xl border border-text/5 p-5">
                <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center text-accent font-extrabold shrink-0">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-text mb-1">{step.name}</h3>
                  <p className="text-sm text-text/55 leading-relaxed">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Models */}
        {models.length > 0 && (
          <section className="mb-14">
            <h2 className="text-2xl font-extrabold text-text mb-5">Какие модели использовать</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {models.map((m) => (
                <Link
                  key={m.id}
                  href={`/models/${m.id}`}
                  className="bg-bg rounded-2xl border border-text/5 p-5 hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-text">{m.name}</h3>
                    <span className="text-[10px] text-text/30">{m.company}</span>
                    {m.tier === "free" && (
                      <span className="text-[10px] bg-teal/10 text-teal px-1.5 py-0.5 rounded font-bold">Бесплатно</span>
                    )}
                  </div>
                  <p className="text-sm text-text/50">{m.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Tips */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-5">Советы, чтобы получить лучший результат</h2>
          <div className="space-y-3">
            {guide.tips.map((tip) => (
              <div key={tip} className="flex items-start gap-3 bg-accent/5 rounded-xl p-4 border border-accent/10">
                <svg className="w-4 h-4 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-text/60 font-medium">{tip}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Try it */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-4">Попробуйте прямо здесь</h2>
          <ChatWidget placeholder={`Попробуйте ${guide.tool} в Stone AI`} />
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Частые вопросы</h2>
          <div className="space-y-3">
            {guide.faq.map((f) => (
              <details key={f.q} className="bg-bg rounded-xl border border-text/5 group">
                <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-text/80 list-none flex items-center justify-between">
                  {f.q}
                  <svg className="w-4 h-4 text-text/20 group-open:rotate-180 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-5 pb-4 text-sm text-text/50 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-dark text-white rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-xl font-extrabold mb-3">Начните пользоваться {guide.tool} прямо сейчас</h2>
          <p className="text-white/40 text-sm mb-6">Без VPN. На русском. Оплата картой РФ. 10 запросов в день бесплатно.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25">
              Начать бесплатно
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 border border-white/20 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/5 transition-colors">
              Посмотреть тарифы
            </Link>
          </div>
        </section>

        {/* Related how-to guides */}
        {(() => {
          const related = HOW_TO_GUIDES.filter((g) => g.slug !== guide.slug && g.category === guide.category).slice(0, 4);
          if (related.length === 0) return null;
          return (
            <section className="mt-14">
              <h2 className="text-lg font-bold text-text mb-4">Похожие инструкции — {categoryLabels[guide.category]}</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {related.map((g) => (
                  <Link
                    key={g.slug}
                    href={`/how-to/${g.slug}`}
                    className="bg-bg rounded-xl border border-text/5 px-5 py-4 hover:border-accent/30 transition-colors"
                  >
                    <h3 className="font-bold text-sm text-text mb-1">Как пользоваться {g.tool}</h3>
                    <p className="text-xs text-text/50 line-clamp-2">{g.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}

        <CrossLinks prefer={["tools", "models", "compare"]} />
      </div>
    </div>
  );
}
