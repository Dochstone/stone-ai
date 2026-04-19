import type { PersonData } from "./schema";

/**
 * Stone AI — single organizational author for all content.
 * Blog posts, comparisons, and use-cases all attribute to the Stone AI team.
 */
export const AUTHORS: PersonData[] = [
  {
    slug: "stone-ai",
    name: "Stone AI",
    jobTitle: "AI-платформа",
    bio: "Экспертная команда Stone AI. Тестируем нейросети на реальных задачах, пишем честные обзоры и сравнения. Каждый день работаем с 65+ AI-моделями и делимся практическим опытом.",
    knowsAbout: [
      "Обзоры нейросетей",
      "Сравнения AI-моделей",
      "Промпт-инжиниринг",
      "AI для маркетинга",
      "AI для бизнеса",
      "Генерация изображений",
      "Генерация видео",
    ],
  },
];

export const AUTHORS_BY_SLUG: Record<string, PersonData> = Object.fromEntries(
  AUTHORS.map((a) => [a.slug, a]),
);

export function getAuthor(slug: string | undefined): PersonData | null {
  if (!slug) return null;
  return AUTHORS_BY_SLUG[slug] ?? AUTHORS_BY_SLUG["stone-ai"] ?? null;
}

/**
 * Default author for all posts — the Stone AI team.
 */
export const DEFAULT_AUTHOR_SLUG = "stone-ai";
