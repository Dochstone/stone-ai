import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { POSTS, getPost } from "@/lib/blog";
import { breadcrumbJsonLd } from "@/components/Breadcrumbs";

import { SITE_URL } from "@/lib/constants";

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

  const bcItems = [{ label: "Блог", href: "/blog" }, { label: post.title }];

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(bcItems)) }} />
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-text/40 mb-6">
          <a href="/" className="hover:text-accent transition-colors">Главная</a>
          <span>&rarr;</span>
          <a href="/blog" className="hover:text-accent transition-colors">Блог</a>
          <span>&rarr;</span>
          <span className="text-text/60 truncate">{post.title}</span>
        </nav>

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
        <div className="mt-14 bg-white rounded-2xl border border-text/5 p-8 text-center">
          <h3 className="font-bold text-lg mb-2">Попробуйте Stone AI</h3>
          <p className="text-text/50 text-sm mb-6">
            50+ AI-моделей прямо в Telegram. 15 бесплатных запросов каждый день.
          </p>
          <a
            href="/webchat"
            className="inline-block bg-accent text-white px-8 py-3.5 rounded-xl font-bold hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
          >
            Попробовать бесплатно
          </a>
        </div>

        {/* More articles */}
        <div className="mt-14">
          <h3 className="font-bold text-lg mb-6">Другие статьи</h3>
          <div className="space-y-4">
            {POSTS.filter((p) => p.slug !== post.slug).map((p) => (
              <a
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="block bg-white rounded-xl border border-text/5 p-5 card-hover"
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs text-text/35">{formatDate(p.date)}</span>
                  <span className="w-1 h-1 bg-text/15 rounded-full" />
                  <span className="text-xs text-text/35">{p.readTime}</span>
                </div>
                <h4 className="font-semibold text-sm">{p.title}</h4>
              </a>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
