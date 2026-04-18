"use client";

import Link from "next/link";

interface Tool {
  href: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
  popular?: boolean;
  preview?: string[]; // up to 3 preview images for visual tools
}

const TOOLS: { group: string; items: Tool[] }[] = [
  {
    group: "Рабочее пространство",
    items: [
      { href: "/dashboard/chat", icon: "/tool-icons/tool-chat.png", title: "AI Чат", description: "Общение с 65+ нейросетями в одном окне", popular: true },
      { href: "/dashboard/templates", icon: "/tool-icons/tool-templates.png", title: "AI-шаблоны", description: "50+ готовых шаблонов для промптов", badge: "50+" },
      { href: "/dashboard/marketplace", icon: "/tool-icons/tool-marketplace.png", title: "Маркетплейс", description: "Боты и ассистенты от сообщества", badge: "NEW" },
      { href: "/dashboard/agent", icon: "/tool-icons/tool-agent.png", title: "AI-Агент", description: "Автономный агент для сложных задач", badge: "NEW", popular: true },
      { href: "/dashboard/bots", icon: "/tool-icons/tool-bots.png", title: "Мои боты", description: "Создавайте своих ботов с system prompt", badge: "NEW" },
      { href: "/dashboard/projects", icon: "/tool-icons/tool-projects.png", title: "Мои проекты", description: "Организуйте чаты и файлы по проектам" },
      {
        href: "/dashboard/gallery", icon: "/tool-icons/tool-gallery.png", title: "Галерея",
        description: "История сгенерированных изображений и видео",
        preview: ["/demo/img-cosmos.webp", "/demo/img-portrait.webp", "/demo/img-cyberpunk.webp"],
      },
      {
        href: "/dashboard/photo-session", icon: "/tool-icons/tool-photo-session.png", title: "Фотосессия",
        description: "Серия консистентных фото одного персонажа", popular: true,
        preview: ["/demo/avatar-maria.webp", "/demo/avatar-elena.webp", "/demo/avatar-dmitry.webp"],
      },
      {
        href: "/dashboard/presentations", icon: "/tool-icons/tool-presentations.png", title: "Презентации",
        description: "Генерация слайдов за 10 минут",
        preview: ["/demo/hero-1.webp", "/demo/hero-2.webp", "/demo/hero-3.webp"],
      },
    ],
  },
  {
    group: "SEO и маркетинг",
    items: [
      { href: "/dashboard/campaigns", icon: "/tool-icons/tool-campaigns.png", title: "Рекламные кампании", description: "Креативы и тексты для Директа, ВК, МТ", badge: "NEW" },
      { href: "/dashboard/seo", icon: "/tool-icons/tool-seo.png", title: "SEO-модуль", description: "Анализ позиций и подбор ключей", popular: true },
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
                  className={`group relative flex flex-col rounded-2xl transition-all overflow-hidden ${
                    tool.popular
                      ? "bg-gradient-to-br from-accent/10 via-surface-2 to-surface-2 border-2 border-accent/30 hover:border-accent/60 hover:shadow-lg hover:shadow-accent/10"
                      : "bg-surface-2 hover:bg-surface-3 border border-transparent hover:border-accent/30"
                  }`}
                >
                  {tool.popular && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-accent/20 text-accent text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full z-10">
                      <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 0 0 .95.69h4.17c.969 0 1.371 1.24.588 1.81l-3.374 2.45a1 1 0 0 0-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118l-3.374-2.45a1 1 0 0 0-1.176 0l-3.374 2.45c-.784.57-1.838-.197-1.539-1.118l1.287-3.966a1 1 0 0 0-.364-1.118L2.04 9.393c-.784-.57-.38-1.81.588-1.81h4.17a1 1 0 0 0 .95-.69l1.286-3.966z" />
                      </svg>
                      ТОП
                    </div>
                  )}

                  <div className="flex items-start gap-4 p-4 sm:p-5">
                    <img
                      src={tool.icon}
                      alt={tool.title}
                      width={72}
                      height={72}
                      className="shrink-0 rounded-2xl shadow-sm group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0 pr-8">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                    <svg className="shrink-0 absolute bottom-5 right-5 text-text/30 group-hover:text-accent transition-colors" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  {tool.preview && (
                    <div className="mx-4 sm:mx-5 mb-4 sm:mb-5 grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
                      {tool.preview.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt=""
                          loading="lazy"
                          className="w-full h-16 sm:h-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
