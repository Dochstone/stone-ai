import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";
import dynamic from "next/dynamic";
import { buildHowTo } from "@/lib/schema";
import { getAuthor, DEFAULT_AUTHOR_SLUG } from "@/lib/authors";
import RelatedModels from "@/components/RelatedModels";
import { CrossLinks } from "@/components/CrossLinks";
import { relatedUseCases, modelsForUseCase } from "@/lib/content-graph";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });

import { USE_CASES } from "@/lib/use-cases";

export function generateStaticParams() {
  return USE_CASES.map((uc) => ({ slug: uc.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const uc = USE_CASES.find((u) => u.slug === params.slug);
  if (!uc) return {};
  return {
    title: uc.title,
    description: uc.description,
    alternates: { canonical: `/use-cases/${uc.slug}` },
    openGraph: {
      title: uc.title,
      description: uc.description,
      type: "article",
    },
  };
}

export default function UseCasePage({ params }: { params: { slug: string } }) {
  const uc = USE_CASES.find((u) => u.slug === params.slug);
  if (!uc) return notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: uc.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const author = getAuthor(DEFAULT_AUTHOR_SLUG)!;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: uc.h1,
    description: uc.description,
    author: {
      "@type": "Person",
      name: author.name,
      url: `${SITE_URL}/authors/${author.slug}`,
    },
    publisher: {
      "@type": "Organization",
      name: "Stone AI",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png` },
    },
    mainEntityOfPage: `${SITE_URL}/use-cases/${uc.slug}`,
    datePublished: "2026-04-09",
    dateModified: new Date().toISOString().split("T")[0],
    inLanguage: "ru-RU",
  };

  // HowTo: use the first 3-5 prompts as HowTo steps for step-by-step tasks
  const howToJsonLd = uc.prompts.length >= 3
    ? buildHowTo({
        name: uc.h1,
        description: uc.description,
        totalTime: "PT10M",
        steps: uc.prompts.slice(0, 6).map((p) => ({
          name: p.title,
          text: p.prompt.slice(0, 300),
          url: `${SITE_URL}/dashboard/chat`,
        })),
      })
    : null;

  const categoryLabels: Record<string, string> = {
    text: "Тексты",
    image: "Картинки",
    video: "Видео",
    code: "Код",
    business: "Бизнес",
    education: "Обучение",
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
        {howToJsonLd && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
        )}
        <Breadcrumbs
          items={[
            { label: "AI-задачи", href: "/use-cases" },
            { label: categoryLabels[uc.category] || uc.category, href: `/use-cases/${uc.slug}` },
          ]}
        />

        <h1 className="text-3xl font-extrabold text-text mt-6 mb-3">{uc.h1}</h1>
        <p className="text-text/60 text-lg mb-8 leading-relaxed">{uc.intro}</p>

        {/* Recommended models */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-text mb-4">Лучшие модели для этой задачи</h2>
          <div className="flex flex-wrap gap-2">
            {uc.models.map((m) => (
              <Link
                key={m}
                href={`/models/${m}`}
                className="bg-surface border border-text/[0.06] px-4 py-2 rounded-xl text-sm font-medium text-text hover:border-accent/30 transition-colors"
              >
                {m}
              </Link>
            ))}
          </div>
        </div>

        {/* Ready prompts */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-text mb-4">Готовые промпты</h2>
          <div className="space-y-3">
            {uc.prompts.map((p, i) => (
              <div key={i} className="bg-surface rounded-2xl border border-text/[0.06] p-5">
                <h3 className="text-sm font-bold text-text mb-2">{p.title}</h3>
                <p className="text-sm text-text/60 bg-bg rounded-xl p-3 font-mono">{p.prompt}</p>
                <Link
                  href={`/dashboard/chat?prompt=${encodeURIComponent(p.prompt)}`}
                  className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-accent hover:underline"
                >
                  Попробовать в чате →
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-text mb-4">Частые вопросы</h2>
          <div className="space-y-2">
            {uc.faq.map((f, i) => (
              <details key={i} className="bg-surface rounded-xl border border-text/[0.06] group">
                <summary className="px-5 py-4 text-sm font-semibold text-text cursor-pointer list-none flex items-center justify-between">
                  {f.q}
                  <svg
                    className="w-4 h-4 text-text/30 group-open:rotate-180 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-text/60">{f.a}</div>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-accent/5 border border-accent/10 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-text mb-2">Попробуйте прямо сейчас</h2>
          <p className="text-sm text-text/50 mb-4">10 бесплатных запросов в день. Без регистрации карты.</p>
          <Link
            href="/dashboard/chat"
            className="inline-flex bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors"
          >
            Открыть AI-чат →
          </Link>
        </div>

        {/* Related models for this use-case */}
        <RelatedModels
          models={modelsForUseCase(uc.slug, 4)}
          title="Рекомендованные модели для этой задачи"
          description={`Из каталога Stone AI — лучшие нейросети для «${uc.h1}»`}
        />

        {/* Related use-cases */}
        {(() => {
          const related = relatedUseCases(uc.slug, 4);
          if (related.length === 0) return null;
          return (
            <section className="mt-14">
              <h2 className="text-xl md:text-2xl font-extrabold mb-1">Похожие задачи</h2>
              <p className="text-sm text-text/50 mb-6">Другие сценарии в категории «{categoryLabels[uc.category] ?? uc.category}»</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/use-cases/${r.slug}`}
                    className="block bg-bg rounded-xl border border-text/5 px-5 py-4 hover:border-accent/30 hover:shadow-sm transition-all group"
                  >
                    <h3 className="font-bold text-sm mb-1 group-hover:text-accent transition-colors">{r.h1}</h3>
                    <p className="text-xs text-text/50 line-clamp-2">{r.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })()}

        <CrossLinks prefer={["tools", "professions", "models"]} exclude={["use-cases"]} />

        <ChatWidget />
      </div>
    </div>
  );
}
