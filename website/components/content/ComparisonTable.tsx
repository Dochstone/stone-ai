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
  showIcons?: boolean; // default true
}

/** Map model/provider keywords to icon paths. */
const ICON_MAP: [RegExp, string][] = [
  [/GPT|OpenAI|o3|o4/i, "/logos/openai-icon.png"],
  [/Claude|Anthropic|Sonnet|Opus|Haiku/i, "/logos/claude-icon.png"],
  [/Gemini/i, "/logos/gemini-pro-icon.png"],
  [/Google/i, "/logos/google-icon.jpg"],
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
      <span className="inline-flex items-center text-emerald-500" aria-label="Да">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
      </span>
    ) : (
      <span className="inline-flex items-center text-red-400/70" aria-label="Нет">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </span>
    );
  }
  const str = String(v);
  // Replace trophy emoji with compact inline text (no round badge — keeps rows even)
  if (str.startsWith("🏆")) {
    const label = str.replace("🏆", "").trim();
    return (
      <span className="inline-flex items-baseline gap-1 text-[14px] font-semibold text-amber-600">
        <span className="text-amber-500">🏆</span>
        <span>{label}</span>
      </span>
    );
  }
  return <span className="text-[14px] text-text/85">{str}</span>;
}

export default function ComparisonTable({ columns, rows, caption, footnote, showIcons = true }: Props) {
  const dataColWidth = `${(80 / columns.length).toFixed(2)}%`;
  return (
    <figure className="my-8">
      {caption && (
        <p className="text-xs font-medium text-text/50 mb-3 px-4 sm:px-0">{caption}</p>
      )}
      <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-xl border border-text/15 shadow-md">
        <table className="w-full border-collapse text-left min-w-[520px] table-fixed">
          <thead>
            <tr className="bg-gradient-to-r from-text/[0.06] to-text/[0.03]">
              <th className="px-3 py-4 text-[11px] font-bold uppercase tracking-wider text-text/50 w-[20%] border-b-2 border-text/15 align-top">
                Критерий
              </th>
              {columns.map((c, i) => {
                const iconSrc = showIcons ? (c.icon || autoIcon(c.title)) : undefined;
                return (
                  <th
                    key={i}
                    style={{ width: dataColWidth }}
                    className={`px-3 py-4 text-[11px] font-bold uppercase tracking-wider border-b-2 border-text/15 align-top ${
                      c.accent ? "text-accent" : "text-text/60"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {iconSrc && (
                        <span className="w-10 h-10 rounded-xl bg-text/[0.03] flex items-center justify-center overflow-hidden">
                          <img
                            src={iconSrc}
                            alt={c.title}
                            className={`object-contain ${iconSrc.includes("openai") ? "w-9 h-9" : "w-8 h-8"}`}
                            loading="lazy"
                          />
                        </span>
                      )}
                      <span className="text-[13px] text-center">{c.title}</span>
                      {c.subtitle && <span className="text-[10px] text-text/40 normal-case font-normal text-center">{c.subtitle}</span>}
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
                <td className="px-3 py-3 text-[14px] font-semibold text-text/75 align-middle h-[48px]">{r.criterion}</td>
                {r.values.map((v, ci) => (
                  <td key={ci} className="px-3 py-3 align-middle h-[48px]">
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
