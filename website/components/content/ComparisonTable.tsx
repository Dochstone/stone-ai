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
  icon?: string; // path to provider icon, e.g. "/logos/openai-icon.png"
}

interface Props {
  columns: ComparisonColumn[];
  rows: ComparisonRow[];
  caption?: string;
  footnote?: string;
}

/** Map model/provider keywords to icon paths. */
const ICON_MAP: [RegExp, string][] = [
  [/GPT|OpenAI|o3|o4/i, "/logos/openai-icon.png"],
  [/Claude|Anthropic|Sonnet|Opus|Haiku/i, "/logos/claude-icon.png"],
  [/Gemini|Google/i, "/logos/google-icon.jpg"],
  [/DeepSeek/i, "/logos/deepseek-icon.png"],
  [/Midjourney/i, "/logos/midjourney-icon.jpg"],
  [/Grok|xAI/i, "/logos/grok-icon.png"],
  [/Perplexity|Sonar/i, "/logos/perplexity.svg"],
  [/Qwen|Alibaba/i, "/logos/qwen-icon.png"],
  [/Nano Banana|Veo/i, "/logos/google-icon.jpg"],
  [/Ideogram/i, "/logos/midjourney-icon.jpg"],
  [/Flux|Stable|SDXL/i, "/logos/openai-icon.png"],
  [/Kling|Kuaishou/i, "/logos/kling-icon.png"],
  [/Sora|DALL/i, "/logos/sora-icon.png"],
  [/Llama|Meta/i, "/logos/openai-icon.png"],
  [/Mistral|Devstral/i, "/logos/openai-icon.png"],
];

function autoIcon(title: string): string | undefined {
  for (const [re, path] of ICON_MAP) {
    if (re.test(title)) return path;
  }
  return undefined;
}

function renderCell(v: Cell) {
  if (typeof v === "boolean") {
    return v ? (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-500 font-bold text-sm" aria-label="Да">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
      </span>
    ) : (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-500/15 text-red-400 text-sm" aria-label="Нет">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </span>
    );
  }
  const str = String(v);
  // Replace trophy emoji with styled badge
  if (str.startsWith("🏆")) {
    const label = str.replace("🏆", "").trim();
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400/20">
          <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3h14l-1.5 5H20a1 1 0 011 1v1a5 5 0 01-4 4.9V17h2a1 1 0 110 2H5a1 1 0 110-2h2v-2.1A5 5 0 013 10V9a1 1 0 011-1h1.5L4 3h1zm2.34 0L8.5 7h7l1.16-4H7.34zM5 9v1a3 3 0 003 3h8a3 3 0 003-3V9H5z"/></svg>
        </span>
        <span className="text-[14px] font-semibold text-amber-600">{label}</span>
      </span>
    );
  }
  return <span className="text-[14px] text-text/85">{str}</span>;
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
              {columns.map((c, i) => {
                const iconSrc = c.icon || autoIcon(c.title);
                return (
                  <th
                    key={i}
                    className={`px-5 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 border-text/15 ${
                      c.accent ? "text-accent" : "text-text/60"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {iconSrc && (
                        <img
                          src={iconSrc}
                          alt={c.title}
                          className="w-8 h-8 rounded-lg object-contain bg-white border border-text/5 p-0.5"
                          loading="lazy"
                        />
                      )}
                      <span className="text-[13px]">{c.title}</span>
                      {c.subtitle && <span className="text-[10px] text-text/40 normal-case font-normal">{c.subtitle}</span>}
                      {c.badge && (
                        <span className="inline-flex w-fit text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/20">
                          {c.badge}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
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
