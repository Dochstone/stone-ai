import Link from "next/link";

interface AnswerSnapshotLink {
  href: string;
  label: string;
}

interface AnswerSnapshotProps {
  title: string;
  answer: string;
  bullets: string[];
  links: AnswerSnapshotLink[];
}

export default function AnswerSnapshot({ title, answer, bullets, links }: AnswerSnapshotProps) {
  return (
    <section className="mb-8 rounded-3xl border border-accent/15 bg-gradient-to-br from-accent/8 via-bg to-teal/5 p-6 sm:p-8">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-accent">
        Quick Answer
      </div>
      <h2 className="mb-3 text-2xl font-extrabold text-text">{title}</h2>
      <p className="max-w-3xl text-sm leading-7 text-text/70 sm:text-base">{answer}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {bullets.map((bullet) => (
          <div key={bullet} className="rounded-2xl border border-text/6 bg-bg/80 px-4 py-3 text-sm font-medium text-text/70">
            {bullet}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-text/10 px-4 py-2 text-sm font-bold text-text/75 transition-colors hover:border-accent/30 hover:text-accent"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
