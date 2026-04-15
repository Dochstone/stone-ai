import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import AuthorCard from "@/components/AuthorCard";
import { CrossLinks } from "@/components/CrossLinks";
import { AUTHORS, AUTHORS_BY_SLUG, DEFAULT_AUTHOR_SLUG } from "@/lib/authors";
import { POSTS } from "@/lib/blog";
import { buildPerson } from "@/lib/schema";
import { SITE_URL } from "@/lib/constants";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return AUTHORS.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const author = AUTHORS_BY_SLUG[params.slug];
  if (!author) return {};
  return {
    title: `${author.name} — ${author.jobTitle}`,
    description: `${author.bio.slice(0, 160)}`,
    alternates: { canonical: `/authors/${author.slug}` },
    openGraph: {
      title: `${author.name} — автор Stone AI`,
      description: author.bio.slice(0, 200),
      type: "profile",
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

export default function AuthorPage({ params }: Props) {
  const author = AUTHORS_BY_SLUG[params.slug];
  if (!author) return notFound();

  // All posts by this author. The default editor catches posts without explicit author.
  const myPosts = POSTS.filter((p) => {
    const slug = p.author ?? DEFAULT_AUTHOR_SLUG;
    return slug === author.slug;
  }).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const otherAuthors = AUTHORS.filter((a) => a.slug !== author.slug);

  const personJsonLd = buildPerson(author);
  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: { "@id": `${SITE_URL}/authors/${author.slug}#person` },
    inLanguage: "ru-RU",
    dateCreated: "2026-04-14",
    dateModified: new Date().toISOString().split("T")[0],
  };

  const bcItems = [
    { label: "Авторы", href: "/authors" },
    { label: author.name, href: `/authors/${author.slug}` },
  ];

  return (
    <div className="min-h-screen pt-28 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }}
      />

      <Breadcrumbs items={bcItems} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Hero */}
        <header className="mb-10">
          <div className="flex items-start gap-6 mb-6">
            {author.image ? (
              <img
                src={author.image}
                alt={author.name}
                className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-2 ring-text/5"
              />
            ) : (
              <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-accent to-teal text-white font-bold flex items-center justify-center text-3xl">
                {author.name
                  .split(" ")
                  .map((n) => n[0])
                  .filter(Boolean)
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1">{author.name}</h1>
              <p className="text-sm sm:text-base text-text/60">{author.jobTitle}</p>
              {author.sameAs && author.sameAs.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {author.sameAs.map((url) => {
                    const label = url.includes("t.me")
                      ? "Telegram"
                      : url.includes("github")
                        ? "GitHub"
                        : url.includes("linkedin")
                          ? "LinkedIn"
                          : url.includes("twitter") || url.includes("x.com")
                            ? "X (Twitter)"
                            : "Профиль";
                    return (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold px-3 py-1 rounded-full bg-text/[0.04] text-text/60 hover:text-accent hover:bg-accent/10 transition-colors"
                      >
                        {label} →
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <p className="text-base text-text/75 leading-relaxed">{author.bio}</p>

          {author.knowsAbout && author.knowsAbout.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-text/40 mb-2">Темы</p>
              <div className="flex flex-wrap gap-1.5">
                {author.knowsAbout.map((topic) => (
                  <span
                    key={topic}
                    className="text-xs font-semibold px-2.5 py-1 rounded-md bg-text/[0.04] text-text/60"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Posts by this author */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-extrabold mb-1">
            {myPosts.length === 0
              ? "Пока нет публикаций"
              : `Статьи автора (${myPosts.length})`}
          </h2>
          {myPosts.length === 0 ? (
            <p className="text-text/50 text-sm mt-3">
              Скоро здесь появятся материалы. А пока — почитайте{" "}
              <Link href="/blog" className="text-accent hover:underline">
                наш блог
              </Link>
              .
            </p>
          ) : (
            <div className="mt-6 grid gap-3">
              {myPosts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="block bg-bg border border-text/5 rounded-2xl p-5 hover:border-accent/30 hover:shadow-sm transition-all group"
                >
                  <h3 className="font-bold text-base mb-1.5 group-hover:text-accent transition-colors">
                    {p.title}
                  </h3>
                  <p className="text-sm text-text/60 line-clamp-2 mb-2">{p.description}</p>
                  <div className="flex items-center gap-2 text-[11px] text-text/40">
                    <time dateTime={p.date}>{formatDate(p.date)}</time>
                    {p.dateModified && p.dateModified !== p.date && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-accent/70">
                          обновлено {formatDate(p.dateModified)}
                        </span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{p.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Other authors */}
        {otherAuthors.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl md:text-2xl font-extrabold mb-6">Другие авторы Stone AI</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {otherAuthors.map((a) => (
                <AuthorCard key={a.slug} author={a} />
              ))}
            </div>
          </section>
        )}

        <CrossLinks prefer={["blog", "compare", "models"]} />
      </div>
    </div>
  );
}
