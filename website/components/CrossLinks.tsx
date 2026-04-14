import { crossLinksFor, type CrossLink } from "@/lib/content-graph";

interface Props {
  /** Backward-compatible: href substrings or category IDs to exclude. */
  exclude?: string[];
  /** Preferred categories — hubs matching these appear first. */
  prefer?: CrossLink["category"][];
  /** Override title. */
  title?: string;
  /** How many links to show (default 6). */
  limit?: number;
}

export function CrossLinks({ exclude, prefer, title = "Полезные разделы", limit = 6 }: Props) {
  const links = crossLinksFor({ exclude, prefer, limit });

  if (links.length === 0) return null;

  return (
    <section className="mt-12 mb-8" aria-label="Полезные разделы">
      <h2 className="text-lg font-bold text-text mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-text/[0.06] bg-bg hover:border-accent/30 hover:shadow-sm transition-all group"
          >
            <span className="text-lg" aria-hidden="true">{link.icon}</span>
            <span className="text-[13px] font-medium text-text/70 group-hover:text-accent transition-colors">
              {link.label}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
