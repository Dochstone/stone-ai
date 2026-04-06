"use client";

const POPULAR_TASKS = [
  { label: "Рекламные кампании", href: "/dashboard/campaigns", emoji: "🎯" },
  { label: "SEO-статьи", href: "/dashboard/seo/article", emoji: "📝" },
  { label: "AI-шаблоны", href: "/dashboard/templates", emoji: "📅" },
  { label: "Генерация картинок", href: "/dashboard/chat?tab=image", emoji: "🎨" },
  { label: "AI Видео", href: "/dashboard/chat?tab=video", emoji: "🎬" },
  { label: "Презентации", href: "/dashboard/presentations", emoji: "📊" },
  { label: "Фотосессия товаров", href: "/dashboard/photo-session", emoji: "📸" },
  { label: "AI Чат-бот", href: "/dashboard/bots", emoji: "🤖" },
  { label: "AI-Агент", href: "/dashboard/agent", emoji: "🧠" },
  { label: "Маркетплейс шаблонов", href: "/dashboard/marketplace", emoji: "🏪" },
  { label: "Анализ текста", href: "/dashboard/seo/analyze", emoji: "🔍" },
  { label: "A/B тест", href: "/dashboard/seo/ab-test", emoji: "⚡" },
];

export default function PopularTasks() {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-lg font-bold text-text mb-6">
          Популярные задачи
        </h2>
        <div className="flex flex-wrap justify-center gap-2">
          {POPULAR_TASKS.map(task => (
            <a
              key={task.label}
              href={task.href}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full
                         bg-text/[0.03] hover:bg-accent/10 border border-text/5 hover:border-accent/20
                         text-sm text-text/60 hover:text-accent transition-all"
            >
              <span className="text-base">{task.emoji}</span>
              {task.label}
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
