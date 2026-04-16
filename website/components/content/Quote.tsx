interface Props {
  text: string;
  author: string;
  role?: string;
  url?: string; // link to source (expert profile, article)
  accent?: boolean;
}

export default function Quote({ text, author, role, url, accent = false }: Props) {
  const AuthorName = url ? (
    <a
      href={url}
      target={url.startsWith("http") ? "_blank" : undefined}
      rel={url.startsWith("http") ? "noopener noreferrer" : undefined}
      className="hover:text-accent transition-colors"
    >
      {author}
    </a>
  ) : (
    <>{author}</>
  );

  return (
    <figure
      className={`my-8 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-sm ${
        accent
          ? "bg-gradient-to-br from-accent/10 via-teal/5 to-transparent border-l-4 border-l-accent border border-accent/20"
          : "bg-text/[0.03] border-l-4 border-l-text/20 border border-text/5"
      }`}
    >
      {/* Decorative quote mark */}
      <div
        aria-hidden="true"
        className={`absolute top-2 left-4 text-6xl leading-none font-serif select-none ${
          accent ? "text-accent/20" : "text-text/10"
        }`}
      >
        “
      </div>
      <blockquote className="relative z-10 pl-6 sm:pl-8">
        <p className="text-base sm:text-lg leading-relaxed text-text/90 italic">
          {text}
        </p>
        <figcaption className="mt-4 flex items-center gap-2 text-sm">
          <span className="font-bold text-text">— {AuthorName}</span>
          {role && <span className="text-text/40">· {role}</span>}
        </figcaption>
      </blockquote>
    </figure>
  );
}
