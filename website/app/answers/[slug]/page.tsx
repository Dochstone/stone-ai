import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import AnswerSnapshot from "@/components/AnswerSnapshot";
import Breadcrumbs from "@/components/Breadcrumbs";
import { AEO_PAGES, getAeoPage } from "@/lib/aeo-pages";
import { SITE_URL } from "@/lib/constants";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return AEO_PAGES.map((page) => ({ slug: page.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const page = getAeoPage(params.slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `${SITE_URL}/answers/${page.slug}` },
    openGraph: {
      title: page.title,
      description: page.description,
      url: `${SITE_URL}/answers/${page.slug}`,
      type: "article",
      siteName: "Stone AI",
    },
  };
}

export default function AeoAnswerPage({ params }: Props) {
  const page = getAeoPage(params.slug);
  if (!page) notFound();

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const howToJsonLd = page.steps ? {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: page.h1,
    description: page.shortAnswer,
    totalTime: "PT2M",
    step: page.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  } : null;

  return (
    <main className="min-h-screen bg-bg pt-24 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {howToJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />}

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Breadcrumbs items={[{ label: "Ответы", href: "/answers" }, { label: page.h1, href: `/answers/${page.slug}` }]} />

        <div className="mt-6">
          <AnswerSnapshot
            title={page.h1}
            answer={page.shortAnswer}
            bullets={page.bullets}
            links={page.links}
          />
        </div>

        <section className="mb-10">
          <h2 className="mb-3 text-2xl font-extrabold text-text">Что выбрать</h2>
          <p className="rounded-2xl border border-accent/15 bg-accent/5 p-5 text-text/70 leading-7">{page.verdict}</p>
        </section>

        {page.steps && (
          <section className="mb-10">
            <h2 className="mb-4 text-2xl font-extrabold text-text">Как начать</h2>
            <div className="space-y-3">
              {page.steps.map((step, index) => (
                <div key={step.name} className="flex gap-4 rounded-2xl border border-text/[0.06] bg-surface p-5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-extrabold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-text">{step.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-text/60">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-extrabold text-text">Частые вопросы</h2>
          <div className="space-y-3">
            {page.faq.map((item) => (
              <details key={item.q} className="rounded-2xl border border-text/[0.06] bg-surface p-5">
                <summary className="cursor-pointer font-bold text-text">{item.q}</summary>
                <p className="mt-3 text-sm leading-6 text-text/65">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-text/[0.06] bg-surface p-6">
          <h2 className="text-xl font-extrabold text-text">Связанные страницы</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {page.links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-xl border border-text/10 px-4 py-2 text-sm font-bold text-text/70 hover:border-accent/30 hover:text-accent">
                {link.label}
              </Link>
            ))}
            <Link href="/answers" className="rounded-xl border border-text/10 px-4 py-2 text-sm font-bold text-text/70 hover:border-accent/30 hover:text-accent">
              Все ответы
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
