import type { ReactNode } from "react";

export type Cell = string | number | boolean | ReactNode;

export interface ComparisonRow {
  criterion: string;
  values: Cell[]; // one per column
  highlight?: boolean; // emphasise this row
}

export interface ComparisonColumn {
  title: string;
  subtitle?: string;
  badge?: string; // e.g. "лучший выбор"
  accent?: boolean; // visual emphasis
}

interface Props {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  caption?: string;
  footnote?: string;
}

function renderCell(v: Cell) {
  if (typeof v === "boolean") {
    return v ? (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600" aria-label="Да">✓</span>
    ) : (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500/15 text-red-500" aria-label="Нет">✗</span>
    );
  }
  return <span className="text-sm text-text/80">{v}</span>;
}

export default function ComparisonTable({ columns, rows, caption, footnote }: Props) {
  return (
    <figure className="my-8 -mx-4 sm:mx-0 overflow-x-auto rounded-xl sm:border sm:border-text/10 sm:shadow-sm">
      <table className="w-full border-collapse text-left min-w-[480px]">
        {caption && (
          <caption className="text-xs text-text/40 mb-3 text-left px-4 sm:px-0">{caption}</caption>
        )}
        <thead>
          <tr className="border-b-2 border-text/10 bg-text/[0.02]">
            <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text/40 w-[32%]">
              Критерий
            </th>
            {columns.map((c, i) => (
              <th
                key={i}
                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${
                  c.accent ? "text-accent" : "text-text/60"
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span>{c.title}</span>
                  {c.subtitle && <span className="text-[10px] text-text/40 normal-case font-normal">{c.subtitle}</span>}
                  {c.badge && (
                    <span className="inline-flex w-fit text-[9px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                      {c.badge}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr
              key={ri}
              className={`border-b border-text/[0.05] transition-colors hover:bg-text/[0.02] ${r.highlight ? "bg-accent/[0.06]" : ""}`}
            >
              <td className="px-4 py-3 text-sm font-semibold text-text/70">{r.criterion}</td>
              {r.values.map((v, ci) => (
                <td key={ci} className="px-4 py-3">
                  {renderCell(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {footnote && (
        <figcaption className="text-xs text-text/40 mt-3 px-4 sm:px-0">{footnote}</figcaption>
      )}
    </figure>
  );
}
