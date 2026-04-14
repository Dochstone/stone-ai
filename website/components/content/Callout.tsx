import type { ReactNode } from "react";

export type CalloutVariant = "info" | "tip" | "warning" | "danger" | "success";

interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
}

const CONFIG: Record<CalloutVariant, { icon: string; border: string; bg: string; text: string }> = {
  info:    { icon: "💡", border: "border-blue-500/30",    bg: "bg-blue-500/5",    text: "text-blue-700 dark:text-blue-300" },
  tip:     { icon: "✨", border: "border-accent/30",       bg: "bg-accent/5",      text: "text-accent" },
  warning: { icon: "⚠️", border: "border-amber-500/30",   bg: "bg-amber-500/5",   text: "text-amber-700 dark:text-amber-300" },
  danger:  { icon: "🚫", border: "border-red-500/30",     bg: "bg-red-500/5",     text: "text-red-700 dark:text-red-400" },
  success: { icon: "✅", border: "border-emerald-500/30", bg: "bg-emerald-500/5", text: "text-emerald-700 dark:text-emerald-400" },
};

export default function Callout({ variant = "info", title, children }: CalloutProps) {
  const cfg = CONFIG[variant];
  return (
    <aside
      className={`my-6 rounded-2xl border ${cfg.border} ${cfg.bg} p-5 sm:p-6`}
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
