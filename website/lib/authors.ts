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
    bio: "Основатель Stone AI. Собрал платформу с 65+ нейросетями, чтобы россияне могли пользоваться AI без VPN и платить картой РФ. Вместе с командой тестировщиков прогоняет модели на реальных задачах, сверяет результаты и публикует только то, что проверено на практике.",
    image: "/authors/dochstone.jpg",
    sameAs: [
      "https://t.me/stonemvp",
    ],
    knowsAbout: [
      "Агрегаторы нейросетей",
      "Оплата AI-сервисов из России",
      "Сравнение AI-моделей",
      "Практика использования LLM",
      "Промпт-инжиниринг",
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
  {
    slug: "tech-lead",
    name: "Кирилл Громов",
    jobTitle: "Tech Lead Stone AI",
    bio: "Отвечает за техническую сторону Stone AI: интеграции с API нейросетей, Telegram-бот, инфраструктуру. До Stone AI — backend-разработчик в финтехе и EdTech. Пишет про сравнения моделей на реальном коде, latency, контекстные окна и то, как выбрать модель под задачу.",
    image: "/authors/tech-lead.jpg",
    knowsAbout: [
      "API нейросетей",
      "Сравнение LLM на бенчмарках",
      "Telegram-боты",
      "Python, Node.js",
      "AI для программирования",
      "Архитектура SaaS",
    ],
  },
  {
    slug: "ai-researcher",
    name: "Евгений Лазарев",
    jobTitle: "AI-ресёрчер",
    bio: "Тестирует новые нейросети на задачах из реальной жизни — от написания статей до разбора таблиц. Составляет внутренние бенчмарки Stone AI, следит за релизами OpenAI, Anthropic, Google, DeepSeek. В статьях делится честными результатами: где модель действительно хороша, а где переоценена.",
    image: "/authors/ai-researcher.jpg",
    knowsAbout: [
      "Бенчмарки LLM",
      "Обзоры новых нейросетей",
      "Evaluation AI-моделей",
      "Reasoning-модели",
      "Тесты промптов",
    ],
  },
  {
    slug: "support-lead",
    name: "Анна Соколова",
    jobTitle: "Руководитель поддержки",
    bio: "Ведёт клиентский саппорт Stone AI: помогает пользователям с оплатой, подписками, настройкой моделей. Каждый день разбирает десятки кейсов — от «как оплатить без VPN» до «почему Midjourney ругается на промпт». В статьях отвечает на самые частые вопросы простым языком.",
    image: "/authors/support-lead.jpg",
    knowsAbout: [
      "Оплата AI-сервисов из России",
      "Подписки и возвраты",
      "Работа без VPN",
      "Клиентская поддержка",
      "Troubleshooting AI-моделей",
    ],
  },
  {
    slug: "designer",
    name: "Алиса Рябцева",
    jobTitle: "AI-дизайнер",
    bio: "Визуальный редактор Stone AI. Работает с Midjourney, Flux, Stable Diffusion, Ideogram на коммерческих проектах — от SMM-визуалов до продуктовых карточек. Пишет про то, как выжать из image-моделей максимум: промпты, стили, reference-фото, апскейл, ретушь.",
    image: "/authors/designer.jpg",
    knowsAbout: [
      "Midjourney",
      "Flux и Stable Diffusion",
      "AI-визуал для маркетинга",
      "Продуктовая съёмка на AI",
      "Style reference и промпты",
    ],
  },
  {
    slug: "copywriter",
    name: "Дмитрий Волков",
    jobTitle: "AI-копирайтер",
    bio: "Копирайтер с фокусом на нейросети: пишет лендинги, email-рассылки, сценарии для соцсетей с помощью ChatGPT, Claude, Gemini. Собирает и тестирует промпты для разных задач — от SEO-статей до продающих постов. Делится шаблонами и фреймворками, которые реально работают.",
    image: "/authors/copywriter.jpg",
    knowsAbout: [
      "Промпт-инжиниринг для текстов",
      "ChatGPT для копирайтинга",
      "Claude для длинных текстов",
      "Фреймворки копирайтинга",
      "SEO-тексты с AI",
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
