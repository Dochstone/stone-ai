"use client";

import Link from "next/link";

interface Tool {
  href: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
}

const TOOLS: { group: string; items: Tool[] }[] = [
  {
    group: "Рабочее пространство",
    items: [
      { href: "/dashboard/chat", icon: "/tool-icons/tool-chat.png", title: "AI Чат", description: "Общение с 65+ нейросетями в одном окне" },
      { href: "/dashboard/templates", icon: "/tool-icons/tool-templates.png", title: "AI-шаблоны", description: "50+ готовых шаблонов для промптов", badge: "50+" },
      { href: "/dashboard/marketplace", icon: "/tool-icons/tool-marketplace.png", title: "Маркетплейс", description: "Боты и ассистенты от сообщества", badge: "NEW" },
      { href: "/dashboard/agent", icon: "/tool-icons/tool-agent.png", title: "AI-Агент", description: "Автономный агент для сложных задач", badge: "NEW" },
      { href: "/dashboard/bots", icon: "/tool-icons/tool-bots.png", title: "Мои боты", description: "Создавайте своих ботов с system prompt", badge: "NEW" },
      { href: "/dashboard/projects", icon: "/tool-icons/tool-projects.png", title: "Мои проекты", description: "Организуйте чаты и файлы по проектам" },
      { href: "/dashboard/gallery", icon: "/tool-icons/tool-gallery.png", title: "Галерея", description: "История сгенерированных изображений и видео" },
      { href: "/dashboard/photo-session", icon: "/tool-icons/tool-photo-session.png", title: "Фотосессия", description: "Серия консистентных фото одного персонажа" },
      { href: "/dashboard/presentations", icon: "/tool-icons/tool-presentations.png", title: "Презентации", description: "Генерация слайдов за 10 минут" },
    ],
  },
  {
    group: "SEO и маркетинг",
    items: [
      { href: "/dashboard/campaigns", icon: "/tool-icons/tool-campaigns.png", title: "Рекламные кампании", description: "Креативы и тексты для Директа, ВК, МТ", badge: "NEW" },
      { href: "/dashboard/seo", icon: "/tool-icons/tool-seo.png", title: "SEO-модуль", description: "Анализ позиций и подбор ключей" },
      { href: "/dashboard/seo/article", icon: "/tool-icons/tool-seo-article.png", title: "SEO-статьи", description: "Генерация длинных статей под ключи" },
      { href: "/dashboard/seo/analyze", icon: "/tool-icons/tool-seo-analyze.png", title: "Анализ текста", description: "Оценка уникальности и качества текста" },
      { href: "/dashboard/seo/ab-test", icon: "/tool-icons/tool-ab-test.png", title: "A/B тест", description: "Сравнение заголовков и лендингов" },
      { href: "/dashboard/seo/meta", icon: "/tool-icons/tool-meta.png", title: "Мета-теги", description: "Генерация title, description, Open Graph" },
    ],
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-10 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-text tracking-tight">
            Панель инструментов
          </h1>
          <p className="mt-3 text-base sm:text-lg text-text/60 max-w-2xl">
            Все AI-инструменты Stone AI в одном месте. Выберите нужный — и сразу к работе.
          </p>
        </div>

        {TOOLS.map((group) => (
          <div key={group.group} className="mb-12">
            <h2 className="text-sm font-bold text-text/40 uppercase tracking-wider mb-4 px-1">
              {group.group}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {group.items.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="group flex items-start gap-4 p-4 sm:p-5 rounded-2xl bg-surface-2 hover:bg-surface-3 border border-transparent hover:border-accent/30 transition-all"
                >
                  <img
                    src={tool.icon}
                    alt={tool.title}
                    width={72}
                    height={72}
                    className="shrink-0 rounded-2xl shadow-sm"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base sm:text-lg font-bold text-text leading-tight">
                        {tool.title}
                      </h3>
                      {tool.badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                          {tool.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-text/55 leading-snug line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                  <svg className="shrink-0 text-text/30 group-hover:text-accent transition-colors mt-1" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
