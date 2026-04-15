import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { POSTS, getFaq, getHowTo, getPost, getRelated, BLOG_CATEGORY_BY_SLUG } from "@/lib/blog";
import { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import Callout from "@/components/content/Callout";
import ComparisonTable from "@/components/content/ComparisonTable";
import Quote from "@/components/content/Quote";
import StatBlock from "@/components/content/StatBlock";
import TableOfContents from "@/components/content/TableOfContents";
import { toAnchor, type TocItem } from "@/lib/toc";
import { getAuthor, DEFAULT_AUTHOR_SLUG } from "@/lib/authors";

import { SITE_URL } from "@/lib/constants";

const BlogCopyButtons = dynamic(() => import("@/components/BlogCopyButtons"), { ssr: false });
const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });

export const revalidate = 3600;

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const post = getPost(params.slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${params.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.dateModified,
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Ordered longest-first so "Claude Opus 4" wins over "Claude Opus".
const INTERNAL_LINKS: { phrase: string; href: string }[] = [
  { phrase: "Claude Opus 4", href: "/models/claude-opus-4" },
  { phrase: "Claude Sonnet 4", href: "/models/claude-sonnet-4" },
  { phrase: "Claude Haiku 4.5", href: "/models/claude-haiku-4.5" },
  { phrase: "GPT-4o mini", href: "/models/gpt-4o-mini" },
  { phrase: "GPT-5.1", href: "/models/gpt-5.1" },
  { phrase: "GPT-5.4", href: "/models/gpt-5.4" },
  { phrase: "Gemini 2.5 Pro", href: "/models/gemini-2.5-pro" },
  { phrase: "Gemini 2.0 Flash", href: "/models/gemini-2.0-flash" },
  { phrase: "DeepSeek R1", href: "/models/deepseek-r1" },
  { phrase: "DeepSeek V3", href: "/models/deepseek-v3" },
  { phrase: "Llama 4", href: "/models/llama-4-maverick" },
  { phrase: "Mistral Large", href: "/models/mistral-large-25" },
  { phrase: "Grok 3", href: "/models/grok-3" },
  { phrase: "Perplexity Sonar", href: "/models/perplexity-sonar" },
  { phrase: "тариф Elite", href: "/pricing" },
  { phrase: "тариф Pro", href: "/pricing" },
  { phrase: "тариф Start", href: "/pricing" },
  { phrase: "подписку Stone AI", href: "/pricing" },
];

/**
 * Replace first occurrence of each configured phrase in a paragraph
 * with an internal link. Returns React fragments. Case-sensitive to
 * preserve the author's original casing in link text.
 */
function autoLink(text: string): (string | JSX.Element)[] {
  let parts: (string | JSX.Element)[] = [text];
  const used = new Set<string>();
  for (const { phrase, href } of INTERNAL_LINKS) {
    if (used.has(phrase)) continue;
    const newParts: (string | JSX.Element)[] = [];
    let replaced = false;
    for (const part of parts) {
      if (typeof part !== "string" || replaced) {
        newParts.push(part);
        continue;
      }
      const idx = part.indexOf(phrase);
      if (idx < 0) {
        newParts.push(part);
        continue;
      }
      if (idx > 0) newParts.push(part.slice(0, idx));
      newParts.push(
        <a
          key={`${phrase}-${idx}`}
          href={href}
          className="text-accent hover:underline underline-offset-2"
        >
          {phrase}
        </a>
      );
      const tail = part.slice(idx + phrase.length);
      if (tail) newParts.push(tail);
      replaced = true;
      used.add(phrase);
    }
    parts = newParts;
  }
  return parts;
}

export default function BlogPostPage({ params }: Props) {
  const post = getPost(params.slug);
  if (!post) return notFound();

  const ogUrl = `${SITE_URL}/blog/${post.slug}/opengraph-image`;
  const author = getAuthor(post.author ?? DEFAULT_AUTHOR_SLUG) ?? getAuthor(DEFAULT_AUTHOR_SLUG)!;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: [ogUrl],
    datePublished: post.date,
    dateModified: post.dateModified,
    inLanguage: "ru-RU",
    author: {
      "@type": "Person",
      name: author.name,
      url: `${SITE_URL}/authors/${author.slug}`,
      jobTitle: author.jobTitle,
      ...(author.sameAs && author.sameAs.length ? { sameAs: author.sameAs } : {}),
    },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Stone AI",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
  };

  // Collect H2 headings for TOC
  const tocItems: TocItem[] = [];
  for (const block of post.content) {
    if (typeof block === "object" && "h2" in block) {
      tocItems.push({ id: toAnchor(block.h2), text: block.h2, level: 2 });
    } else if (typeof block === "object" && "h3" in block) {
      tocItems.push({ id: toAnchor(block.h3), text: block.h3, level: 3 });
    }
  }

  const faq = getFaq(post.slug);
  const faqJsonLd = faq
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }
    : null;

  const howto = getHowTo(post.slug);
  const howtoJsonLd = howto
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: howto.name,
        description: howto.description,
        image: [ogUrl],
        ...(howto.totalTime ? { totalTime: howto.totalTime } : {}),
        step: howto.steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.name,
          text: s.text,
        })),
      }
    : null;

  const related = getRelated(post.slug);

  const category = post.category ? BLOG_CATEGORY_BY_SLUG[post.category] : null;
  const bcItems = [
    { label: "Блог", href: "/blog" },
    ...(category ? [{ label: category.name, href: `/blog/category/${category.slug}` }] : []),
    { label: post.title, href: `/blog/${post.slug}` },
  ];

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(bcItems)) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      {howtoJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howtoJsonLd) }} />
      )}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <a
          href="/blog"
          className="text-sm text-text/40 hover:text-accent transition-colors mb-6 inline-block"
        >
          &larr; Все статьи
        </a>

        <div className="lg:grid lg:grid-cols-[1fr_16rem] lg:gap-10">
          <article className="min-w-0 max-w-3xl">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-5">
                {post.title}
              </h1>

              {/* Author + meta */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-text/50 mb-2">
                <a
                  href={`/authors/${author.slug}`}
                  className="flex items-center gap-2 font-semibold text-text/70 hover:text-accent transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-teal text-white font-bold flex items-center justify-center text-[11px]">
                    {author.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </span>
                  <span>{author.name}</span>
                </a>
                <span className="w-1 h-1 bg-text/15 rounded-full" aria-hidden="true" />
                <time dateTime={post.date}>Опубликовано {formatDate(post.date)}</time>
                {post.dateModified && post.dateModified !== post.date && (
                  <>
                    <span className="w-1 h-1 bg-text/15 rounded-full" aria-hidden="true" />
                    <time dateTime={post.dateModified} className="text-accent/70">
                      Обновлено {formatDate(post.dateModified)}
                    </time>
                  </>
                )}
                <span className="w-1 h-1 bg-text/15 rounded-full" aria-hidden="true" />
                <span>{post.readTime}</span>
              </div>
            </div>

            {/* Hero image */}
            <img
              src={`/blog/${post.slug}.jpg`}
              alt={post.title}
              className="w-full aspect-square sm:aspect-video object-cover rounded-2xl mb-8 border border-text/5"
              loading="eager"
              width={1024}
              height={1024}
            />

            {/* Mobile TOC */}
            <div className="lg:hidden">
              <TableOfContents items={tocItems} />
            </div>

            {/* Content */}
            <div className="space-y-6">
              {post.content.map((block, i) => {
                if (typeof block === "object" && "h2" in block) {
                  return (
                    <h2
                      key={i}
                      id={toAnchor(block.h2)}
                      className="text-xl md:text-2xl font-extrabold mt-10 mb-2 scroll-mt-28"
                    >
                      {block.h2}
                    </h2>
                  );
                }
                if (typeof block === "object" && "h3" in block) {
                  return (
                    <h3
                      key={i}
                      id={toAnchor(block.h3)}
                      className="text-lg md:text-xl font-bold mt-6 mb-2 scroll-mt-28"
                    >
                      {block.h3}
                    </h3>
                  );
                }
                if (typeof block === "object" && "callout" in block) {
                  const c = block.callout;
                  return (
                    <Callout key={i} variant={c.variant} title={c.title}>
                      <span dangerouslySetInnerHTML={{ __html: c.body }} />
                    </Callout>
                  );
                }
                if (typeof block === "object" && "quote" in block) {
                  return (
                    <Quote
                      key={i}
                      text={block.quote.text}
                      author={block.quote.author}
                      role={block.quote.role}
                      url={block.quote.url}
                      accent={block.quote.accent}
                    />
                  );
                }
                if (typeof block === "object" && "stats" in block) {
                  return (
                    <StatBlock
                      key={i}
                      stats={block.stats.items}
                      source={block.stats.source}
                      sourceUrl={block.stats.sourceUrl}
                    />
                  );
                }
                if (typeof block === "object" && "comparison" in block) {
                  return (
                    <ComparisonTable
                      key={i}
                      columns={block.comparison.columns}
                      rows={block.comparison.rows.map((r) => ({
                        criterion: r.criterion,
                        values: r.values,
                        highlight: r.highlight,
                      }))}
                      caption={block.comparison.caption}
                      footnote={block.comparison.footnote}
                    />
                  );
                }
                if (typeof block === "object" && "img" in block) {
                  return (
                    <figure key={i} className="my-8">
                      <img
                        src={block.img.src}
                        alt={block.img.alt}
                        loading="lazy"
                        className="w-full aspect-square sm:aspect-video object-cover rounded-2xl border border-text/5"
                      />
                      {block.img.caption && (
                        <figcaption className="text-xs text-text/40 mt-2 text-center italic">
                          {block.img.caption}
                        </figcaption>
                      )}
                    </figure>
                  );
                }
                if (typeof block === "object" && "code" in block) {
                  return (
                    <pre
                      key={i}
                      className="my-4 bg-text/[0.05] border border-text/10 rounded-xl p-4 overflow-x-auto text-sm"
                    >
                      <code>{block.code.content}</code>
                    </pre>
                  );
                }
                const text = String(block);
                if (/<(br|b|i|u|strong|em|a|code)\b/i.test(text)) {
                  return (
                    <p
                      key={i}
                      className="text-text/70 text-[15px] leading-[1.8] [&_a]:text-accent [&_a]:hover:underline [&_b]:text-text [&_b]:font-semibold [&_strong]:text-text [&_strong]:font-semibold [&_code]:bg-text/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px]"
                      dangerouslySetInnerHTML={{ __html: text }}
                    />
                  );
                }
                return (
                  <p key={i} className="text-text/70 text-[15px] leading-[1.8]">
                    {autoLink(text)}
                  </p>
                );
              })}
            </div>
            <BlogCopyButtons />
          </article>

          {/* Desktop TOC sidebar */}
          <aside className="hidden lg:block">
            <TableOfContents items={tocItems} />
          </aside>
        </div>

        <div className="max-w-3xl">

        {/* CTA */}
        <div className="mt-10 bg-accent/5 border border-accent/10 rounded-2xl p-6 sm:p-8 text-center">
          <h3 className="font-extrabold text-lg mb-2">Попробуйте Stone AI бесплатно</h3>
          <p className="text-text/50 text-sm mb-4">10 запросов каждый день, 7 моделей. Подписка от 590₽/мес открывает 65+ нейросетей.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/dashboard/chat" className="bg-accent text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors">Начать бесплатно</a>
            <a href="/pricing" className="border-2 border-text/15 text-text px-8 py-3 rounded-xl font-bold text-sm hover:border-accent hover:text-accent transition-colors">Смотреть тарифы</a>
          </div>
        </div>

        {/* FAQ section — rendered if curated for this article */}
        {faq && faq.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl md:text-2xl font-extrabold mb-6">Частые вопросы</h2>
            <div className="space-y-3">
              {faq.map((item, i) => (
                <details
                  key={i}
                  className="bg-surface rounded-xl border border-text/5 overflow-hidden group"
                >
                  <summary className="p-4 sm:p-5 cursor-pointer font-semibold text-sm text-text/80 list-none flex items-center justify-between gap-3">
                    <span>{item.q}</span>
                    <svg
                      className="w-4 h-4 text-text/30 shrink-0 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-text/60 text-sm leading-relaxed">
                    {item.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* Related articles — curated or fallback to recent */}
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-6 border-t border-text/5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-text/40 mb-3">Теги</p>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-accent/8 text-accent/80 hover:bg-accent/15 transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {related.length > 0 && (
          <div className="mt-14">
            <h3 className="font-bold text-lg mb-6">Похожие статьи</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map((p) => (
                <a
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="block bg-surface rounded-xl border border-text/5 p-5 hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-text/35">{formatDate(p.date)}</span>
                    <span className="w-1 h-1 bg-text/15 rounded-full" />
                    <span className="text-xs text-text/35">{p.readTime}</span>
                  </div>
                  <h4 className="font-semibold text-sm leading-snug">{p.title}</h4>
                </a>
              ))}
            </div>
          </div>
        )}
        </div>

        {/* Inline chat — попробовать AI прямо со страницы */}
        <div className="max-w-3xl mt-14">
          <ChatWidget placeholder="Спросите по теме статьи или попробуйте AI на своей задаче" />
        </div>
      </div>
    </div>
  );
}

