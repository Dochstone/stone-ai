import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs, { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { SITE_URL } from "@/lib/constants";
import {
  BLOG_CATEGORY_BY_SLUG,
  getAllTagSlugs,
  getPostsByTagSlug,
  getTagBySlug,
} from "@/lib/blog";

interface Props {
  params: { tag: string };
}

export function generateStaticParams() {
  return getAllTagSlugs().map(({ slug }) => ({ tag: slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const tag = getTagBySlug(params.tag);
  if (!tag) return {};
  const title = `${tag} — статьи блога Stone AI`;
  const description = `Все статьи и гайды Stone AI по теме «${tag}». Обзоры, сравнения и практические инструкции.`;
  return {
    title,
    description,
    alternates: { canonical: `/blog/tag/${params.tag}` },
    openGraph: { title, description, type: "website" },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogTagPage({ params }: Props) {
  const tag = getTagBySlug(params.tag);
  if (!tag) return notFound();
  const posts = getPostsByTagSlug(params.tag);
  if (posts.length === 0) return notFound();

  const bcItems = [
    { label: "Блог", href: "/blog" },
    { label: `#${tag}`, href: `/blog/tag/${params.tag}` },
  ];

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `#${tag}`,
    numberOfItems: posts.length,
    itemListElement: posts.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/blog/${p.slug}`,
      name: p.title,
    })),
  };

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(bcItems)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <Breadcrumbs items={bcItems} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-8 md:mb-14">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            Тег блога
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">#{tag}</h1>
          <p className="text-base text-text/70 max-w-2xl mx-auto">
            {posts.length} {posts.length === 1 ? "статья" : posts.length < 5 ? "статьи" : "статей"} по этой теме.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {posts.map((post) => {
            const cat = post.category ? BLOG_CATEGORY_BY_SLUG[post.category] : null;
            return (
              <a
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="bg-white rounded-2xl border border-text/5 overflow-hidden card-hover block"
              >
                <img
                  src={`/blog/${post.slug}.jpg`}
                  alt={post.title}
                  className="w-full aspect-square object-cover"
                  loading="lazy"
                  width={512}
                  height={512}
                />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    {cat && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-accent/10 text-accent">
                        {cat.icon} {cat.name}
                      </span>
                    )}
                    <span className="text-xs text-text/35">{formatDate(post.date)}</span>
                    <span className="w-1 h-1 bg-text/15 rounded-full" />
                    <span className="text-xs text-text/35">{post.readTime}</span>
                  </div>
                  <h2 className="font-bold text-lg mb-2 leading-snug">{post.title}</h2>
                  <p className="text-text/50 text-sm leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                  <span className="inline-block mt-4 text-accent text-sm font-semibold">
                    Читать &rarr;
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        <div className="text-center mt-14">
          <Link
            href="/blog"
            className="inline-block text-accent font-semibold text-sm hover:underline"
          >
            &larr; Все статьи блога
          </Link>
        </div>
      </div>
    </div>
  );
}
