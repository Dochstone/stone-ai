interface Tool {
  href: string;
  icon: string;
  title: string;
  description: string;
  badge?: string;
}

const TOOLS: Tool[] = [
  { href: "/dashboard/chat", icon: "/tool-icons/tool-chat.png", title: "AI Чат", description: "65+ нейросетей в одном окне" },
  { href: "/health", icon: "/tool-icons/tool-seo.png", title: "AI Консультант", description: "Анализ фото симптомов и общая health-консультация", badge: "NEW" },
  { href: "/dashboard/templates", icon: "/tool-icons/tool-templates.png", title: "AI-шаблоны", description: "Готовые промпты под задачи", badge: "50+" },
  { href: "/dashboard/photo-session", icon: "/tool-icons/tool-photo-session.png", title: "Фотосессия", description: "Серия фото одного персонажа" },
  { href: "/dashboard/presentations", icon: "/tool-icons/tool-presentations.png", title: "Презентации", description: "Слайды с текстом и дизайном" },
  { href: "/dashboard/gallery", icon: "/tool-icons/tool-gallery.png", title: "Галерея", description: "История генераций" },
  { href: "/dashboard/agent", icon: "/tool-icons/tool-agent.png", title: "AI-Агент", description: "Автономный агент", badge: "NEW" },
  { href: "/dashboard/bots", icon: "/tool-icons/tool-bots.png", title: "Мои боты", description: "Конструктор ботов с промптами", badge: "NEW" },
  { href: "/dashboard/marketplace", icon: "/tool-icons/tool-marketplace.png", title: "Маркетплейс", description: "Боты от сообщества", badge: "NEW" },
  { href: "/dashboard/projects", icon: "/tool-icons/tool-projects.png", title: "Проекты", description: "Рабочее пространство" },
  { href: "/dashboard/campaigns", icon: "/tool-icons/tool-campaigns.png", title: "Рекламные кампании", description: "Креативы для Директа и ВК", badge: "NEW" },
  { href: "/dashboard/seo", icon: "/tool-icons/tool-seo.png", title: "SEO-модуль", description: "Анализ позиций и ключей" },
  { href: "/dashboard/seo/article", icon: "/tool-icons/tool-seo-article.png", title: "SEO-статьи", description: "Генерация длинных статей" },
];

export default function ToolsGallery() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            Панель инструментов
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-text tracking-tight max-w-3xl mx-auto">
            15 AI-инструментов в одном окне
          </h2>
          <p className="mt-4 text-base md:text-lg text-text/60 max-w-2xl mx-auto">
            От чата и SEO до презентаций и рекламных кампаний. Всё работает через 65+ нейросетей без VPN, в рублях.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {TOOLS.map((tool) => (
            <a
              key={tool.href}
              href={tool.href}
              className="group flex flex-col items-center text-center p-5 rounded-2xl bg-surface-2 hover:bg-surface-3 border border-transparent hover:border-accent/30 transition-all"
            >
              <img
                src={tool.icon}
                alt={tool.title}
                width={80}
                height={80}
                className="rounded-2xl shadow-sm mb-3 group-hover:scale-105 transition-transform"
                loading="lazy"
              />
              <div className="flex items-center gap-1.5 mb-1">
                <h3 className="text-sm md:text-base font-bold text-text leading-tight">{tool.title}</h3>
                {tool.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-accent/15 text-accent">
                    {tool.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-text/50 leading-snug">{tool.description}</p>
            </a>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="/dashboard/tools"
            className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
          >
            Открыть все инструменты
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
