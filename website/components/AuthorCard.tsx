import Link from "next/link";
import type { PersonData } from "@/lib/schema";

interface Props {
  author: PersonData;
  /** Compact mode = no bio, smaller avatar. Used at top of blog posts. */
  compact?: boolean;
  /** Show "Все статьи автора →" link. */
  showLink?: boolean;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AuthorCard({ author, compact = false, showLink = true }: Props) {
  if (compact) {
    return (
      <Link
        href={`/authors/${author.slug}`}
        className="inline-flex items-center gap-2 text-sm font-semibold text-text/70 hover:text-accent transition-colors"
      >
        {author.image ? (
          <img src={author.image} alt={author.name} className="w-7 h-7 rounded-full object-cover" />
        ) : (
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-teal text-white font-bold flex items-center justify-center text-[11px]">
            {initials(author.name)}
          </span>
        )}
        <span>{author.name}</span>
      </Link>
    );
  }

  return (
    <article className="bg-bg border border-text/5 rounded-2xl p-6 hover:border-accent/30 hover:shadow-md transition-all">
      <div className="flex items-start gap-4 mb-4">
        {author.image ? (
          <img
            src={author.image}
            alt={author.name}
            className="shrink-0 w-14 h-14 rounded-full object-cover ring-2 ring-text/5"
          />
        ) : (
          <div className="shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-accent to-teal text-white font-bold flex items-center justify-center text-lg">
            {initials(author.name)}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-extrabold text-base mb-0.5">
            {showLink ? (
              <Link href={`/authors/${author.slug}`} className="hover:text-accent transition-colors">
                {author.name}
              </Link>
            ) : (
              author.name
            )}
          </h3>
          <p className="text-xs text-text/50">{author.jobTitle}</p>
        </div>
      </div>
      <p className="text-sm text-text/70 leading-relaxed line-clamp-4">{author.bio}</p>
      {author.knowsAbout && author.knowsAbout.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {author.knowsAbout.slice(0, 4).map((topic) => (
            <span
              key={topic}
              className="text-[10px] font-semibold px-2 py-1 rounded-md bg-text/[0.04] text-text/50"
            >
              {topic}
            </span>
          ))}
          {author.knowsAbout.length > 4 && (
            <span className="text-[10px] font-semibold px-2 py-1 text-text/30">
              +{author.knowsAbout.length - 4}
            </span>
          )}
        </div>
      )}
      {showLink && (
        <Link
          href={`/authors/${author.slug}`}
          className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
        >
          Все статьи автора →
        </Link>
      )}
    </article>
  );
}
