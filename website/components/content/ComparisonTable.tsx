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
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-500 font-bold text-sm" aria-label="Да">✓</span>
    ) : (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/15 text-red-400 text-sm" aria-label="Нет">✗</span>
    );
  }
  return <span className="text-[14px] text-text/85">{v}</span>;
}

export default function ComparisonTable({ columns, rows, caption, footnote }: Props) {
  return (
    <figure className="my-8">
      {caption && (
        <p className="text-xs font-medium text-text/50 mb-3 px-4 sm:px-0">{caption}</p>
      )}
      <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl border border-text/15 shadow-md">
        <table className="w-full border-collapse text-left min-w-[520px]">
          <thead>
            <tr className="bg-gradient-to-r from-text/[0.06] to-text/[0.03]">
              <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-text/50 w-[30%] border-b-2 border-text/15">
                Критерий
              </th>
              {columns.map((c, i) => (
                <th
                  key={i}
                  className={`px-5 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 border-text/15 ${
                    c.accent ? "text-accent" : "text-text/60"
                  }`}
                >
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[13px]">{c.title}</span>
                    {c.subtitle && <span className="text-[10px] text-text/40 normal-case font-normal">{c.subtitle}</span>}
                    {c.badge && (
                      <span className="inline-flex w-fit text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/20">
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
                className={`border-b border-text/[0.08] transition-colors hover:bg-text/[0.04] ${
                  r.highlight
                    ? "bg-accent/[0.08]"
                    : ri % 2 === 1
                      ? "bg-text/[0.02]"
                      : ""
                }`}
              >
                <td className="px-5 py-3.5 text-[14px] font-semibold text-text/75">{r.criterion}</td>
                {r.values.map((v, ci) => (
                  <td key={ci} className="px-5 py-3.5">
                    {renderCell(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footnote && (
        <p className="text-xs text-text/40 mt-3 px-4 sm:px-1 italic">{footnote}</p>
      )}
    </figure>
  );
}
