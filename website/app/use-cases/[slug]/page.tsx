import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";
import dynamic from "next/dynamic";

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

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: uc.h1,
    description: uc.description,
    author: { "@type": "Organization", name: "Stone AI" },
    publisher: {
      "@type": "Organization",
      name: "Stone AI",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png` },
    },
    datePublished: "2026-04-09",
  };

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

        <ChatWidget />
      </div>
    </div>
  );
}
