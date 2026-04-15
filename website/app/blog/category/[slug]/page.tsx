import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumbs, { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import { SITE_URL } from "@/lib/constants";
import {
  BLOG_CATEGORIES,
  BLOG_CATEGORY_BY_SLUG,
  SORTED_POSTS,
  getPostsByCategory,
  type BlogCategorySlug,
} from "@/lib/blog";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return BLOG_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const category = BLOG_CATEGORY_BY_SLUG[params.slug];
  if (!category) return {};
  return {
    title: category.metaTitle,
    description: category.description,
    alternates: { canonical: `/blog/category/${category.slug}` },
    openGraph: {
      title: `${category.name} — Блог Stone AI`,
      description: category.description,
      type: "website",
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

export default function BlogCategoryPage({ params }: Props) {
  const category = BLOG_CATEGORY_BY_SLUG[params.slug];
  if (!category) return notFound();

  const posts = getPostsByCategory(category.slug as BlogCategorySlug);
  const otherCategories = BLOG_CATEGORIES.filter((c) => c.slug !== category.slug);

  const bcItems = [
    { label: "Блог", href: "/blog" },
    { label: category.name, href: `/blog/category/${category.slug}` },
  ];

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category.name,
    description: category.description,
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
        <header className="text-center mb-14">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            <span aria-hidden="true" className="mr-1">{category.icon}</span>
            Категория блога
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{category.name}</h1>
          <p className="text-text/60 max-w-2xl mx-auto">{category.description}</p>
        </header>

        <nav aria-label="Категории блога" className="flex flex-wrap justify-center gap-2 mb-10 max-w-4xl mx-auto">
          <Link
            href="/blog"
            className="px-4 py-2 rounded-full bg-text/5 text-text/70 hover:bg-accent/10 hover:text-accent text-sm font-semibold transition-colors"
          >
            Все ({SORTED_POSTS.length})
          </Link>
          {BLOG_CATEGORIES.map((c) => {
            const count = SORTED_POSTS.filter((p) => p.category === c.slug).length;
            const active = c.slug === category.slug;
            return (
              <Link
                key={c.slug}
                href={`/blog/category/${c.slug}`}
                className={
                  active
                    ? "px-4 py-2 rounded-full bg-accent text-white text-sm font-semibold"
                    : "px-4 py-2 rounded-full bg-text/5 text-text/70 hover:bg-accent/10 hover:text-accent text-sm font-semibold transition-colors"
                }
              >
                <span aria-hidden="true" className="mr-1">{c.icon}</span>
                {c.name} ({count})
              </Link>
            );
          })}
        </nav>

        {posts.length === 0 ? (
          <p className="text-center text-text/50">Пока нет статей в этой категории.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {posts.map((post) => (
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
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-accent/10 text-accent">
                      {category.icon} {category.name}
                    </span>
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
            ))}
          </div>
        )}

        <section className="mt-16 max-w-5xl mx-auto">
          <h2 className="text-xl md:text-2xl font-extrabold mb-6">Другие категории</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {otherCategories.map((c) => {
              const count = SORTED_POSTS.filter((p) => p.category === c.slug).length;
              return (
                <Link
                  key={c.slug}
                  href={`/blog/category/${c.slug}`}
                  className="bg-bg border border-text/5 rounded-xl p-4 hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span aria-hidden="true">{c.icon}</span>
                    <span className="font-bold text-sm">{c.name}</span>
                    <span className="text-xs text-text/40 ml-auto">{count}</span>
                  </div>
                  <p className="text-xs text-text/50 line-clamp-2">{c.description}</p>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="text-center mt-16">
          <a
            href="/dashboard/chat"
            className="inline-block bg-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
          >
            Попробовать бесплатно
          </a>
          <p className="mt-3 text-sm text-text/40">10 быстрых + 2 премиум запроса каждый день</p>
        </div>
      </div>
    </div>
  );
}
