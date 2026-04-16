import type { ReactNode } from "react";

export type CalloutVariant = "info" | "tip" | "warning" | "danger" | "success";

interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
}

const CONFIG: Record<CalloutVariant, { icon: string; border: string; bg: string; text: string; left: string }> = {
  info:    { icon: "💡", border: "border-blue-500/25",    bg: "bg-gradient-to-br from-blue-500/10 to-blue-400/5",    text: "text-blue-700 dark:text-blue-300",       left: "border-l-blue-500" },
  tip:     { icon: "✨", border: "border-accent/25",       bg: "bg-gradient-to-br from-accent/10 to-teal/5",          text: "text-accent",                             left: "border-l-accent" },
  warning: { icon: "⚠️", border: "border-amber-500/25",   bg: "bg-gradient-to-br from-amber-500/10 to-amber-400/5", text: "text-amber-700 dark:text-amber-300",       left: "border-l-amber-500" },
  danger:  { icon: "🚫", border: "border-red-500/25",     bg: "bg-gradient-to-br from-red-500/10 to-red-400/5",     text: "text-red-700 dark:text-red-400",           left: "border-l-red-500" },
  success: { icon: "✅", border: "border-emerald-500/25", bg: "bg-gradient-to-br from-emerald-500/10 to-teal-400/5", text: "text-emerald-700 dark:text-emerald-400",   left: "border-l-emerald-500" },
};

export default function Callout({ variant = "info", title, children }: CalloutProps) {
  const cfg = CONFIG[variant];
  return (
    <aside
      className={`my-6 rounded-2xl border border-l-4 ${cfg.left} ${cfg.border} ${cfg.bg} p-5 sm:p-6 shadow-sm`}
      role="note"
    >
      <div className="flex gap-3 sm:gap-4">
        <div className="shrink-0 text-xl leading-none pt-0.5" aria-hidden="true">
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <p className={`font-bold mb-1 text-sm ${cfg.text}`}>{title}</p>
          )}
          <div className="text-sm leading-relaxed text-text/80">{children}</div>
        </div>
      </div>
    </aside>
  );
}
