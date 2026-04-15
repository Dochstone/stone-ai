import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs, { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import RelatedModels from "@/components/RelatedModels";
import { CrossLinks } from "@/components/CrossLinks";
import Callout from "@/components/content/Callout";
import Quote from "@/components/content/Quote";
import StatBlock from "@/components/content/StatBlock";
import FaqExtended from "@/components/content/FaqExtended";
import ComparisonTable from "@/components/content/ComparisonTable";
import { PILLARS, type PillarTopic, getPillarModels } from "@/lib/content-graph";
import { ALTERNATIVES } from "@/lib/seo-data";
import { POSTS } from "@/lib/blog";
import { buildFAQPage } from "@/lib/schema";
import { renderPriceDeep } from "@/lib/pricing";
import { PILLAR_CONTENT } from "./content";

interface Props {
  params: { topic: string };
}

export function generateStaticParams() {
  // Only generate pages for topics that have content defined
  return Object.keys(PILLAR_CONTENT).map((topic) => ({ topic }));
}

export function generateMetadata({ params }: Props): Metadata {
  const raw = PILLAR_CONTENT[params.topic];
  if (!raw) return {};
  const meta = renderPriceDeep(raw);
  return {
    title: meta.metaTitle,
    description: meta.description,
    alternates: { canonical: `/hub/${params.topic}` },
    openGraph: {
      title: `${meta.title} — Stone AI`,
      description: meta.description.slice(0, 200),
      type: "article",
    },
  };
}

export default function HubPage({ params }: Props) {
  const topic = params.topic as PillarTopic;
  const pillar = PILLARS[topic];
  const raw = PILLAR_CONTENT[params.topic];
  if (!pillar || !raw) return notFound();
  const meta = renderPriceDeep(raw);

  const models = getPillarModels(topic);
  const alternatives = pillar.alternatives
    .map((slug) => ALTERNATIVES.find((a) => a.slug === slug))
    .filter((a): a is NonNullable<typeof a> => !!a);
  const blogs = pillar.relatedBlogs
    .map((slug) => POSTS.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => !!p);

  const bcItems = [
    { label: "Нейросети", href: "/models" },
    { label: meta.title, href: `/hub/${topic}` },
  ];

  return (
    <div className="min-h-screen pt-28 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(bcItems)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFAQPage(meta.faq)) }} />

      <Breadcrumbs items={bcItems} />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Hero */}
        <header className="mb-10">
          <div className="inline-block bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold mb-4">
            Pillar-страница · 15 мин чтения
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-5">{meta.h1}</h1>
          <p className="text-lg text-text/60 leading-relaxed">{meta.description}</p>
        </header>

        {/* TLDR */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4">Ответ за 30 секунд</h2>
          <p className="text-text/75 text-[15px] leading-[1.8] mb-4">{meta.tldr}</p>
        </section>

        {/* Stats */}
        <StatBlock stats={meta.stats} />

        <Callout variant="tip" title={meta.calloutTip.title}>
          <span dangerouslySetInnerHTML={{ __html: meta.calloutTip.body }} />
        </Callout>

        {/* Models grid */}
        <section className="mb-12 mt-12">
          <h2 className="text-xl md:text-2xl font-extrabold mb-2">{meta.modelsTitle}</h2>
          <p className="text-sm text-text/50 mb-6">{meta.modelsDescription}</p>
        </section>

        <RelatedModels models={models.slice(0, 6)} title="" description="" />

        {/* Comparison */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4">{meta.comparisonTitle}</h2>
          <ComparisonTable
            columns={meta.comparison.columns}
            rows={meta.comparison.rows}
            caption={meta.comparison.caption}
            footnote={meta.comparison.footnote}
          />
        </section>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl md:text-2xl font-extrabold mb-4">Альтернативы и посадочные страницы</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {alternatives.map((a) => (
                <Link
                  key={a.slug}
                  href={`/alternatives/${a.slug}`}
                  className="block bg-bg border border-text/5 rounded-2xl p-5 hover:border-accent/30 hover:shadow-md transition-all"
                >
                  <h3 className="font-bold text-sm mb-1.5">Альтернативы {a.service}</h3>
                  <p className="text-xs text-text/50 line-clamp-2">{a.description}</p>
                </Link>
              ))}
              <Link
                href={topic === "image-ai" ? "/tools/image-generation" : "/models"}
                className="block bg-bg border border-accent/20 rounded-2xl p-5 hover:border-accent/50 transition-all"
              >
                <h3 className="font-bold text-sm mb-1.5 text-accent">
                  {topic === "image-ai" ? "Инструменты для генерации картинок →" : "Каталог всех моделей →"}
                </h3>
                <p className="text-xs text-text/50">Все инструменты Stone AI в одном месте</p>
              </Link>
            </div>
          </section>
        )}

        {/* Quote */}
        <Quote
          accent
          text={meta.quote.text}
          author={meta.quote.author}
          role={meta.quote.role}
          url={meta.quote.url}
        />

        {/* Related blog */}
        {blogs.length > 0 && (
          <section className="mb-12 mt-12">
            <h2 className="text-xl md:text-2xl font-extrabold mb-4">Глубокие гайды в блоге</h2>
            <div className="grid gap-3">
              {blogs.map((b) => (
                <Link
                  key={b.slug}
                  href={`/blog/${b.slug}`}
                  className="block bg-bg border border-text/5 rounded-2xl p-5 hover:border-accent/30 hover:shadow-sm transition-all group"
                >
                  <h3 className="font-bold text-sm mb-1 group-hover:text-accent transition-colors">{b.title}</h3>
                  <p className="text-xs text-text/50 line-clamp-2">{b.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-text/30">
                    <span>{b.readTime}</span>
                    <span aria-hidden="true">·</span>
                    <span>{b.dateModified}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-accent/10 to-teal/5 border border-accent/20 rounded-2xl p-8 text-center">
          <h2 className="font-extrabold text-xl mb-2">Попробуйте все модели бесплатно</h2>
          <p className="text-text/60 text-sm mb-5">10 запросов в день в подарок + 100₽ бонус за регистрацию. Без VPN, оплата картой РФ.</p>
          <Link href="/dashboard/chat" className="inline-block bg-accent text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors">
            Начать бесплатно →
          </Link>
        </div>

        {/* FAQ */}
        <FaqExtended items={meta.faq} />

        <CrossLinks prefer={meta.preferCategories} limit={6} />
      </article>
    </div>
  );
}
