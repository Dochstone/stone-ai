"use client";

import {
  Megaphone,
  FileText,
  LayoutTemplate,
  Palette,
  Film,
  Presentation,
  Camera,
  Bot,
  Sparkles,
  Store,
  Search,
  Zap,
  HeartPulse,
  type LucideIcon,
} from "lucide-react";

type Task = { label: string; href: string; Icon: LucideIcon; color: string };

const POPULAR_TASKS: Task[] = [
  { label: "Рекламные кампании",     href: "/dashboard/campaigns",          Icon: Megaphone,      color: "#F59E0B" },
  { label: "SEO-статьи",             href: "/dashboard/seo/article",        Icon: FileText,       color: "#14B8A6" },
  { label: "AI-шаблоны",             href: "/dashboard/templates",          Icon: LayoutTemplate, color: "#A855F7" },
  { label: "Генерация картинок",     href: "/dashboard/chat?tab=image",     Icon: Palette,        color: "#EC4899" },
  { label: "AI Видео",               href: "/dashboard/chat?tab=video",     Icon: Film,           color: "#3B82F6" },
  { label: "Презентации",            href: "/dashboard/presentations",      Icon: Presentation,   color: "#0EA5E9" },
  { label: "Фотосессия товаров",     href: "/dashboard/photo-session",      Icon: Camera,         color: "#F43F5E" },
  { label: "AI Чат-бот",             href: "/dashboard/bots",               Icon: Bot,            color: "#6366F1" },
  { label: "AI-Агент",               href: "/dashboard/agent",              Icon: Sparkles,       color: "#C4623D" },
  { label: "AI Консультант",         href: "/health",                       Icon: HeartPulse,     color: "#10B981" },
  { label: "Маркетплейс шаблонов",   href: "/dashboard/marketplace",        Icon: Store,          color: "#10B981" },
  { label: "Анализ текста",          href: "/dashboard/seo/analyze",        Icon: Search,         color: "#22D3EE" },
  { label: "A/B тест",               href: "/dashboard/seo/ab-test",        Icon: Zap,            color: "#EAB308" },
];

export default function PopularTasks() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-lg font-bold text-text mb-6">
          Популярные задачи
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {POPULAR_TASKS.map(({ label, href, Icon, color }) => (
            <a
              key={label}
              href={href}
              className="group inline-flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full
                         bg-text/[0.03] hover:bg-accent/10 border border-text/5 hover:border-accent/20
                         text-sm text-text/60 hover:text-accent transition-all"
              style={{ ["--pad-c" as string]: color }}
            >
              <span className="glass-pad flex items-center justify-center w-7 h-7 rounded-full shrink-0">
                <Icon className="block" size={14} strokeWidth={2.4} />
              </span>
              {label}
            </a>
          ))}
        </div>
        <p className="text-xs text-text/25 mt-4">
          и сотни других задач с 65+ AI-моделями
        </p>
      </div>
    </section>
  );
}
