import type { Metadata } from "next";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { POSTS, getFaq, getPost, getRelated } from "@/lib/blog";
import { breadcrumbJsonLd } from "@/components/Breadcrumbs";

import { SITE_URL } from "@/lib/constants";

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

export default function BlogPostPage({ params }: Props) {
  const post = getPost(params.slug);
  if (!post) return notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.dateModified,
    author: { "@type": "Organization", name: "Stone AI" },
    publisher: { "@type": "Organization", name: "Stone AI", logo: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png` } },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

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

  const related = getRelated(post.slug);

  const bcItems = [{ label: "Блог", href: "/blog" }, { label: post.title, href: `/blog/${post.slug}` }];

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(bcItems)) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <a
            href="/blog"
            className="text-sm text-text/40 hover:text-accent transition-colors mb-6 inline-block"
          >
            &larr; Все статьи
          </a>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight mb-4">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-text/40">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span className="w-1 h-1 bg-text/15 rounded-full" />
            <span>{post.readTime}</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {post.content.map((block, i) => {
            if (typeof block === "object" && "h2" in block) {
              return <h2 key={i} className="text-xl md:text-2xl font-extrabold mt-10 mb-2">{block.h2}</h2>;
            }
            return <p key={i} className="text-text/70 text-[15px] leading-[1.8]">{String(block)}</p>;
          })}
        </div>

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
      </article>
      <ChatWidget />
    </div>
  );
}
