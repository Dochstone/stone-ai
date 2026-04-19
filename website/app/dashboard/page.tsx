"use client";

import Link from "next/link";
import {
  BotMessageSquare, FileText, Store, Sparkles, Bot, FolderKanban, ImageIcon,
  Camera, Presentation, Megaphone, Search, FileEdit, BarChart3, SplitSquareHorizontal, Tags,
  type LucideIcon,
} from "lucide-react";

interface Tool {
  href: string;
  Icon: LucideIcon;
  color: string;
  title: string;
  description: string;
  badge?: string;
  popular?: boolean;
  preview?: string[];
}

const TOOLS: { group: string; items: Tool[] }[] = [
  {
    group: "Рабочее пространство",
    items: [
      { href: "/dashboard/chat",          Icon: BotMessageSquare, color: "#22D3EE", title: "AI Чат",         description: "Общение с 65+ нейросетями в одном окне", popular: true },
      { href: "/dashboard/templates",     Icon: FileText,         color: "#14B8A6", title: "AI-шаблоны",      description: "50+ готовых шаблонов для промптов", badge: "50+" },
      { href: "/dashboard/marketplace",   Icon: Store,            color: "#F97316", title: "Маркетплейс",     description: "Боты и ассистенты от сообщества", badge: "NEW" },
      { href: "/dashboard/agent",         Icon: Sparkles,         color: "#C4623D", title: "AI-Агент",        description: "Автономный агент для сложных задач", badge: "NEW", popular: true },
      { href: "/dashboard/bots",          Icon: Bot,              color: "#A855F7", title: "Мои боты",        description: "Создавайте своих ботов с system prompt", badge: "NEW" },
      { href: "/dashboard/projects",      Icon: FolderKanban,     color: "#0EA5E9", title: "Мои проекты",     description: "Организуйте чаты и файлы по проектам" },
      {
        href: "/dashboard/gallery",       Icon: ImageIcon,        color: "#EC4899", title: "Галерея",
        description: "История сгенерированных изображений и видео",
        preview: ["/demo/img-cosmos.webp", "/demo/img-portrait.webp", "/demo/img-cyberpunk.webp"],
      },
      {
        href: "/dashboard/photo-session", Icon: Camera,           color: "#F43F5E", title: "Фотосессия",
        description: "Серия консистентных фото одного персонажа", popular: true,
        preview: ["/demo/avatar-maria.webp", "/demo/avatar-elena.webp", "/demo/avatar-dmitry.webp"],
      },
      {
        href: "/dashboard/presentations", Icon: Presentation,     color: "#3B82F6", title: "Презентации",
        description: "Генерация слайдов за 10 минут",
        preview: ["/demo/hero-1.webp", "/demo/hero-2.webp", "/demo/hero-3.webp"],
      },
    ],
  },
  {
    group: "SEO и маркетинг",
    items: [
      { href: "/dashboard/campaigns",   Icon: Megaphone,              color: "#F59E0B", title: "Рекламные кампании", description: "Креативы и тексты для Директа, ВК, МТ", badge: "NEW" },
      { href: "/dashboard/seo",         Icon: Search,                 color: "#10B981", title: "SEO-модуль",         description: "Анализ позиций и подбор ключей", popular: true },
      { href: "/dashboard/seo/article", Icon: FileEdit,               color: "#6366F1", title: "SEO-статьи",         description: "Генерация длинных статей под ключи" },
      { href: "/dashboard/seo/analyze", Icon: BarChart3,              color: "#0891B2", title: "Анализ текста",      description: "Оценка уникальности и качества текста" },
      { href: "/dashboard/seo/ab-test", Icon: SplitSquareHorizontal,  color: "#D946EF", title: "A/B тест",           description: "Сравнение заголовков и лендингов" },
      { href: "/dashboard/seo/meta",    Icon: Tags,                   color: "#8B5CF6", title: "Мета-теги",          description: "Генерация title, description, Open Graph" },
    ],
  },
];

function ToolIcon({ tool }: { tool: Tool }) {
  const Icon = tool.Icon;
  return (
    <span className="glass-pad tile-icon flex items-center justify-center w-16 h-16 rounded-2xl shrink-0" style={{ ["--pad-c" as string]: tool.color }}>
      <Icon size={30} strokeWidth={2.2} />
    </span>
  );
}

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
                  style={{ ["--pad-c" as string]: tool.color }}
                  className={`tile-hover group relative flex flex-col rounded-2xl overflow-hidden ${
                    tool.popular
                      ? "bg-gradient-to-br from-accent/10 via-surface-2 to-surface-2 border-2 border-accent/30"
                      : "bg-surface-2 border border-text/5"
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
                    <ToolIcon tool={tool} />
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
