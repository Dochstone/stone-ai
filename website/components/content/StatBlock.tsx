export interface Stat {
  value: string; // "+527%" or "15 305"
  label: string;
  sub?: string; // context, source hint
  accent?: boolean;
}

interface Props {
  stats: Stat[]; // recommend 2-4 for grid
  source?: string;
  sourceUrl?: string;
}

export default function StatBlock({ stats, source, sourceUrl }: Props) {
  const cols = stats.length >= 4 ? "sm:grid-cols-4" : stats.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";
  return (
    <figure className="my-8">
      <div className={`grid grid-cols-2 ${cols} gap-3 sm:gap-4`}>
        {stats.map((s, i) => (
          <div
            key={i}
            className={`rounded-2xl p-5 sm:p-6 border ${
              s.accent
                ? "bg-gradient-to-br from-accent/10 to-teal/5 border-accent/25"
                : "bg-text/[0.03] border-text/5"
            }`}
          >
            <div
              className={`text-3xl sm:text-4xl font-extrabold mb-1 leading-none tabular-nums ${
                s.accent ? "text-accent" : "text-text"
              }`}
            >
              {s.value}
            </div>
            <div className="text-[13px] font-bold text-text/80 leading-tight">{s.label}</div>
            {s.sub && (
              <div className="text-xs text-text/40 mt-1.5 leading-snug">{s.sub}</div>
            )}
          </div>
        ))}
      </div>
      {(source || sourceUrl) && (
        <figcaption className="text-xs text-text/40 mt-3">
          Источник:{" "}
          {sourceUrl ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-accent"
            >
              {source ?? sourceUrl}
            </a>
          ) : (
            <span>{source}</span>
          )}
        </figcaption>
      )}
    </figure>
  );
}
