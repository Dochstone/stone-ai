import type { PersonData } from "./schema";

/**
 * Stone AI authors — used for E-E-A-T signals on blog, use-cases, and guides.
 *
 * Each author has a dedicated /authors/[slug] page (Person schema).
 * Blog posts reference author by slug; renderer pulls full data from here.
 *
 * Adding a new author: append to the array below, add markdown bio to
 * app/authors/[slug]/page.tsx (auto-rendered from `bio`).
 */
export const AUTHORS: PersonData[] = [
  {
    slug: "dochstone",
    name: "Артём Доченков",
    jobTitle: "Основатель Stone AI",
    bio: "Основатель и CEO Stone AI. Отвечает за продукт и техническую сторону платформы. Более 10 лет в IT: backend-разработка, продакт-менеджмент, запуск SaaS-продуктов. Пишет про архитектуру агрегаторов нейросетей, платёжную инфраструктуру в РФ и развитие российского AI-рынка.",
    image: "/authors/dochstone.jpg",
    sameAs: [
      "https://t.me/Dochstone",
      "https://github.com/dochstone",
    ],
    knowsAbout: [
      "Искусственный интеллект",
      "Large Language Models",
      "SaaS-продукты",
      "Агрегаторы нейросетей",
      "FastAPI",
      "Next.js",
      "Платёжные системы в РФ",
    ],
  },
  {
    slug: "ai-editor",
    name: "Редакция Stone AI",
    jobTitle: "Редакция блога",
    bio: "Экспертная редакция Stone AI. Тестирует нейросети на реальных задачах, пишет честные обзоры и сравнения. В команде — маркетологи, копирайтеры и разработчики, которые каждый день работают с AI-моделями и делятся практическим опытом.",
    image: "/authors/editorial.jpg",
    knowsAbout: [
      "Обзоры нейросетей",
      "Сравнения AI-моделей",
      "Промпт-инжиниринг",
      "Контент-маркетинг",
      "Автоматизация с AI",
    ],
  },
  {
    slug: "marketing-expert",
    name: "Марина Колесникова",
    jobTitle: "AI-маркетолог, автор гайдов",
    bio: "Практикующий маркетолог с фокусом на AI-инструменты для контента и продвижения. 7 лет опыта в digital-маркетинге, работала с e-commerce и SaaS-компаниями. Автор гайдов по использованию нейросетей для SMM, контент-планирования и рекламных кампаний.",
    image: "/authors/marina.jpg",
    knowsAbout: [
      "AI для маркетинга",
      "SMM с нейросетями",
      "Контент-маркетинг",
      "Промпт-инжиниринг",
      "ChatGPT для бизнеса",
      "Midjourney для дизайна",
    ],
  },
];

export const AUTHORS_BY_SLUG: Record<string, PersonData> = Object.fromEntries(
  AUTHORS.map((a) => [a.slug, a]),
);

export function getAuthor(slug: string | undefined): PersonData | null {
  if (!slug) return null;
  return AUTHORS_BY_SLUG[slug] ?? null;
}

/**
 * Default author for posts without explicit attribution — falls back to
 * the editorial team rather than leaving as anonymous Organization.
 */
export const DEFAULT_AUTHOR_SLUG = "ai-editor";
