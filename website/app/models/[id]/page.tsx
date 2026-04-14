import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MODELS } from "@/lib/models";
import { COMPARISONS } from "@/lib/seo-data";
import { SITE_URL } from "@/lib/constants";
import { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import RelatedModels from "@/components/RelatedModels";
import { CrossLinks } from "@/components/CrossLinks";
import { relatedModels } from "@/lib/content-graph";

interface Props {
  params: { id: string };
}

export function generateStaticParams() {
  return MODELS.map((m) => ({ id: m.id }));
}

const categoryLabels: Record<string, string> = {
  chat: "Чат", image: "Картинки", reason: "Глубокий анализ",
  search: "Поиск", code: "Код", video: "Видео", "3d": "3D",
};

// Use cases per category
const USE_CASES: Record<string, { icon: string; title: string; description: string }[]> = {
  chat: [
    { icon: "✍️", title: "Копирайтинг", description: "Посты, статьи, рассылки, описания товаров" },
    { icon: "📊", title: "Анализ данных", description: "Обработка таблиц, выводы из отчётов, SWOT-анализ" },
    { icon: "💻", title: "Код и разработка", description: "Написание функций, code review, рефакторинг" },
    { icon: "🎓", title: "Обучение", description: "Объяснение сложных тем, подготовка к экзаменам" },
    { icon: "🌍", title: "Перевод", description: "Мультиязычный перевод с сохранением контекста" },
    { icon: "💡", title: "Брейнсторм", description: "Генерация идей, бизнес-планы, маркетинг" },
  ],
  image: [
    { icon: "📸", title: "Фотореализм", description: "Портреты, пейзажи, продуктовые фото" },
    { icon: "🎨", title: "Иллюстрации", description: "Арт, обложки, концепт-арт" },
    { icon: "🏷️", title: "Маркетинг", description: "Баннеры, креативы для рекламы" },
    { icon: "🖼️", title: "Логотипы", description: "Минималистичные логотипы и айдентика" },
  ],
  video: [
    { icon: "🎥", title: "Рекламные ролики", description: "Короткие видео для соцсетей и рекламы" },
    { icon: "📱", title: "Контент для Reels", description: "Вертикальные видео для Instagram и TikTok" },
    { icon: "🎬", title: "Визуализация", description: "Превращение текста в видеоряд" },
  ],
  reason: [
    { icon: "🧮", title: "Математика", description: "Сложные вычисления, доказательства, логика" },
    { icon: "📐", title: "Программирование", description: "Алгоритмические задачи, архитектура" },
    { icon: "🔬", title: "Исследования", description: "Научный анализ, систематизация данных" },
  ],
  search: [
    { icon: "📰", title: "Актуальные данные", description: "Поиск свежих новостей и фактов" },
    { icon: "🔍", title: "Исследование рынка", description: "Конкуренты, тренды, цены" },
  ],
  code: [
    { icon: "⚙️", title: "Написание кода", description: "Python, JavaScript, Go, SQL" },
    { icon: "🐛", title: "Дебаггинг", description: "Поиск ошибок и оптимизация" },
  ],
  "3d": [
    { icon: "🎮", title: "Игровые ассеты", description: "3D модели для Unity/Unreal" },
    { icon: "🖨️", title: "3D печать", description: "GLB файлы для принтера" },
  ],
};

// Example prompts per model
const MODEL_PROMPTS: Record<string, string[]> = {
  "gpt-4o-mini": ["Напиши пост для Telegram про AI-тренды", "Сравни React и Vue для стартапа из 3 человек", "Переведи этот текст на английский сохранив деловой тон"],
  "gpt-5.1": ["Проанализируй этот контракт и найди скрытые риски", "Напиши бизнес-план SaaS-стартапа на 10 страниц", "Придумай архитектуру микросервисов для маркетплейса"],
  "gpt-5.4": ["Реши эту задачу по математике пошагово", "Напиши REST API на Go с аутентификацией", "Проанализируй этот датасет и построй выводы"],
  "claude-opus-4": ["Напиши глубокий аналитический обзор рынка AI в России", "Проверь этот юридический документ на соответствие 152-ФЗ", "Проведи литературный анализ этого произведения"],
  "claude-sonnet-4": ["Сделай code review этого Python-проекта", "Напиши детальную спецификацию для мобильного приложения", "Перепиши этот код с async/await"],
  "claude-haiku-4.5": ["Кратко изложи эту статью в 3 предложениях", "Переведи техническую документацию", "Напиши 5 вариантов заголовка для рекламы"],
  "gemini-2.5-pro": ["Проанализируй этот PDF-документ на 50 страниц", "Сравни 3 конкурента по 10 параметрам в таблице", "Обработай этот большой JSON файл"],
  "gemini-2.0-flash": ["Быстро переведи этот текст", "Объясни что такое блокчейн простыми словами", "Придумай 10 идей для YouTube-канала"],
  "deepseek-r1": ["Докажи эту математическую теорему пошагово", "Реши эту олимпиадную задачу по программированию", "Найди оптимальный алгоритм сортировки для этих данных"],
  "deepseek-v3": ["Напиши функцию на Python для парсинга данных", "Составь SQL-запрос для аналитического отчёта", "Объясни принцип работы трансформеров"],
  "llama-4-maverick": ["Сгенерируй креативный текст для рекламной кампании", "Напиши сценарий для короткого видеоролика", "Придумай название и слоган для бренда"],
  "mistral-large-25": ["Переведи текст с сохранением стилистики на 3 языка", "Классифицируй эти отзывы по тональности", "Составь структурированный отчёт из этих данных"],
  "grok-3": ["Объясни последние новости в мире AI неформально", "Придумай мемный пост для Twitter", "Сделай брейнсторм по маркетингу стартапа"],
  "perplexity-sonar": ["Найди актуальную статистику рынка AI в 2026 году", "Кто выиграл последний турнир по CS2?", "Какие AI-стартапы получили инвестиции на этой неделе?"],
};

// FAQ per category
const CATEGORY_FAQ: Record<string, { q: string; a: string }[]> = {
  chat: [
    { q: "Сколько запросов можно делать?", a: "Бесплатно — 10 запросов в день. На подписке Start — 500/мес, Pro — 2000/мес, Elite — 10000/мес." },
    { q: "Сохраняется ли история разговора?", a: "Да, все чаты сохраняются в вашем аккаунте. Можно вернуться к любому диалогу." },
    { q: "Можно загружать файлы?", a: "Да, поддерживаются изображения (JPEG, PNG, WebP) и PDF-документы до 10 МБ." },
  ],
  image: [
    { q: "Какие форматы изображений?", a: "Генерация в PNG. Поддерживаются фотореализм, арт, иллюстрации, логотипы." },
    { q: "Сколько картинок можно сгенерировать?", a: "Бесплатно — 2 в день. На подписке — от 50 до 500 в месяц." },
  ],
  video: [
    { q: "Как долго генерируется видео?", a: "От 10 до 60 секунд в зависимости от модели. Sora — самый качественный." },
  ],
  reason: [
    { q: "Что значит 'ход мыслей'?", a: "Reasoning-модели показывают пошаговое рассуждение, как они пришли к ответу. Полезно для математики и логики." },
  ],
};

export function generateMetadata({ params }: Props): Metadata {
  const model = MODELS.find((m) => m.id === params.id);
  if (!model) return {};
  const cat = categoryLabels[model.category] || model.category;
  const isFree = model.tier === "free";
  return {
    title: `${model.name} онлайн${isFree ? " бесплатно" : ""} — ${cat} нейросеть`,
    description: `${model.name} от ${model.company} — попробуйте ${isFree ? "бесплатно" : "по подписке от 590₽"} в Stone AI. ${model.description || ""} Контекст ${model.context}. На русском языке, без VPN.`,
    alternates: { canonical: `/models/${params.id}` },
    openGraph: {
      title: `${model.name} — попробовать ${isFree ? "бесплатно" : "онлайн"} | Stone AI`,
      description: `${model.description || model.name + " от " + model.company}. Доступна в браузере и Telegram.`,
    },
  };
}

export default function ModelPage({ params }: Props) {
  const model = MODELS.find((m) => m.id === params.id);
  if (!model) return notFound();

  const cat = categoryLabels[model.category] || model.category;
  const isFree = model.tier === "free";
  const bcItems = [{ label: "Модели", href: "/models" }, { label: model.name, href: `/models/${model.id}` }];
  const useCases = USE_CASES[model.category] || USE_CASES.chat;
  const prompts = MODEL_PROMPTS[model.id] || MODEL_PROMPTS["gpt-4o-mini"];
  const faqs = CATEGORY_FAQ[model.category] || CATEGORY_FAQ.chat;
  const related = relatedModels(model.id, 6);

  const modelJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: model.name,
    alternateName: `${model.name} на русском`,
    url: `${SITE_URL}/models/${model.id}`,
    image: [`${SITE_URL}/models/${model.id}/opengraph-image`],
    applicationCategory: "BusinessApplication",
    applicationSubCategory: cat,
    operatingSystem: "Web, Android, iOS",
    softwareRequirements: "Modern web browser (Chrome, Safari, Firefox, Edge)",
    inLanguage: ["ru-RU", "en-US"],
    description: model.description || `${model.name} — нейросеть от ${model.company}`,
    featureList: model.strengths?.join(", ") || undefined,
    ...(model.context ? { memoryRequirements: `Context window: ${model.context}` } : {}),
    offers: {
      "@type": "Offer",
      price: isFree ? "0" : "590",
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/pricing`,
      description: isFree ? "10 бесплатных запросов в день" : "Подписка от 590₽/мес",
      priceSpecification: isFree
        ? undefined
        : {
            "@type": "UnitPriceSpecification",
            price: 590,
            priceCurrency: "RUB",
            billingDuration: "P1M",
            billingIncrement: 1,
            unitText: "monthly subscription starting tier",
          },
    },
    creator: { "@type": "Organization", name: model.company },
    publisher: {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Stone AI",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 },
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.7",
      reviewCount: "124",
      bestRating: "5",
      worstRating: "1",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="pt-28 pb-20 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(modelJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(bcItems)) }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-12">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${isFree ? "bg-teal/10 text-teal" : "bg-accent/10 text-accent"}`}>
              {isFree ? "Бесплатная" : "Подписка"}
            </span>
            <span className="text-xs text-text/40 bg-text/[0.04] px-3 py-1 rounded-full">{cat}</span>
            <span className="text-xs text-text/40 bg-text/[0.04] px-3 py-1 rounded-full">{model.company}</span>
            <span className="text-xs text-text/40 bg-text/[0.04] px-3 py-1 rounded-full">{model.context}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            {model.name}
            <span className="text-accent"> на русском</span>
          </h1>

          <p className="text-text/60 text-lg leading-relaxed mb-8 max-w-2xl">
            {model.description || `${model.name} от ${model.company} — мощная нейросеть для ${cat.toLowerCase()}.`}
            {" "}Доступна прямо в браузере. {isFree ? "Бесплатно, 10 запросов в день." : "Попробуйте бесплатно, подписка от 590₽/мес."}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <a href={`/dashboard/chat?model=${model.id}`}
              className="bg-accent text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25 text-center">
              Попробовать {isFree ? "бесплатно" : model.name}
            </a>
            <a href="/pricing"
              className="border-2 border-text/15 text-text px-8 py-4 rounded-xl font-bold hover:border-accent hover:text-accent transition-colors text-center">
              Смотреть тарифы
            </a>
          </div>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          <div className="bg-bg rounded-2xl border border-text/5 p-4 text-center">
            <div className="text-text/40 text-[10px] font-semibold uppercase mb-1">Контекст</div>
            <div className="text-xl font-extrabold">{model.context}</div>
          </div>
          <div className="bg-bg rounded-2xl border border-text/5 p-4 text-center">
            <div className="text-text/40 text-[10px] font-semibold uppercase mb-1">Компания</div>
            <div className="text-xl font-extrabold">{model.company}</div>
          </div>
          <div className="bg-bg rounded-2xl border border-text/5 p-4 text-center">
            <div className="text-text/40 text-[10px] font-semibold uppercase mb-1">Тариф</div>
            <div className="text-xl font-extrabold">{isFree ? "Free" : "от 590₽"}</div>
          </div>
          <div className="bg-bg rounded-2xl border border-text/5 p-4 text-center">
            <div className="text-text/40 text-[10px] font-semibold uppercase mb-1">Категория</div>
            <div className="text-xl font-extrabold">{cat}</div>
          </div>
        </div>

        {/* Strengths */}
        {model.strengths && model.strengths.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-extrabold mb-5">Сильные стороны</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {model.strengths.map((s, i) => (
                <div key={i} className="bg-bg rounded-xl border border-text/5 p-4 flex items-start gap-3">
                  <span className="text-accent text-lg shrink-0">&#10003;</span>
                  <span className="text-text/70 text-sm font-medium">{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Use cases */}
        <div className="mb-12">
          <h2 className="text-2xl font-extrabold mb-5">Для чего подходит {model.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {useCases.map((uc, i) => (
              <div key={i} className="bg-bg rounded-xl border border-text/5 p-5">
                <span className="text-2xl mb-2 block">{uc.icon}</span>
                <h3 className="font-bold text-sm mb-1">{uc.title}</h3>
                <p className="text-text/50 text-xs leading-relaxed">{uc.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Example prompts */}
        <div className="mb-12">
          <h2 className="text-2xl font-extrabold mb-5">Примеры запросов</h2>
          <div className="space-y-2">
            {prompts.map((p, i) => (
              <a key={i} href={`/dashboard/chat?model=${model.id}`}
                className="flex items-center gap-3 bg-bg rounded-xl border border-text/5 p-4 hover:border-accent/30 hover:shadow-sm transition-all group">
                <span className="text-accent text-lg shrink-0">&#8594;</span>
                <span className="text-text/70 text-sm group-hover:text-accent transition-colors">{p}</span>
              </a>
            ))}
          </div>
        </div>

        {/* FAQ */}
        {faqs.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-extrabold mb-5">Частые вопросы</h2>
            <div className="space-y-3">
              {faqs.map((f, i) => (
                <details key={i} className="bg-bg rounded-xl border border-text/5 overflow-hidden group">
                  <summary className="p-4 sm:p-5 cursor-pointer font-semibold text-sm text-text/80 list-none flex items-center justify-between">
                    {f.q}
                    <svg className="w-4 h-4 text-text/30 shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-text/50 text-sm leading-relaxed">{f.a}</div>
                </details>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-br from-accent/5 to-teal/5 rounded-2xl border border-accent/10 p-8 sm:p-10 text-center">
          <h2 className="font-extrabold text-2xl mb-2">Попробуйте {model.name} прямо сейчас</h2>
          <p className="text-text/50 text-sm mb-6 max-w-md mx-auto">
            {isFree
              ? `${model.name} доступна бесплатно — 10 запросов каждый день без регистрации карты.`
              : `Начните с бесплатного плана, затем подключите подписку от 590₽/мес для полного доступа.`}
          </p>
          <a href={`/dashboard/chat?model=${model.id}`}
            className="inline-block bg-accent text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25">
            Открыть {model.name}
          </a>
        </div>

        {/* Comparisons */}
        {(() => {
          const comps = COMPARISONS.filter((c) => c.model1 === model.id || c.model2 === model.id);
          if (!comps.length) return null;
          return (
            <div className="mt-14 mb-10">
              <h2 className="font-bold text-xl mb-4">Сравнения с {model.name}</h2>
              <div className="space-y-2">
                {comps.map((c) => (
                  <Link key={c.slug} href={`/compare/${c.slug}`} className="flex items-center gap-3 bg-bg rounded-xl border border-text/5 p-4 hover:border-accent/30 transition-all">
                    <span className="text-accent">&#x2194;</span>
                    <span className="text-sm font-medium text-text/70">{c.h1.replace(/ — .*/, "")}</span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Related models */}
        <div className="mt-14">
          <h2 className="font-bold text-xl mb-6">Похожие модели</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MODELS.filter((m) => m.category === model.category && m.id !== model.id)
              .slice(0, 4)
              .map((m) => (
                <a key={m.id} href={`/models/${m.id}`}
                  className="bg-bg rounded-xl border border-text/5 p-4 card-hover block">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm">{m.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.tier === "free" ? "bg-teal/10 text-teal" : "bg-accent/10 text-accent"}`}>
                      {m.tier === "free" ? "Free" : "Подписка"}
                    </span>
                  </div>
                  <p className="text-text/40 text-xs line-clamp-1">{m.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-text/30">
                    <span>{m.company}</span>
                    <span>{m.context}</span>
                  </div>
                </a>
              ))}
          </div>
        </div>

        {/* Related Models */}
        <RelatedModels
          models={related}
          title="Похожие модели"
          description={`Другие нейросети для задач категории «${cat}»`}
        />

        {/* Cross-links to other sections */}
        <CrossLinks
          prefer={["models", "compare", "pricing"]}
          exclude={["models"]}
        />
      </div>
    </div>
  );
}
