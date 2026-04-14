import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs, { breadcrumbJsonLd } from "@/components/Breadcrumbs";
import RelatedModels from "@/components/RelatedModels";
import { CrossLinks } from "@/components/CrossLinks";
import Callout from "@/components/content/Callout";
import Quote from "@/components/content/Quote";
import StatBlock from "@/components/content/StatBlock";
import FaqExtended from "@/components/content/FaqExtended";
import ComparisonTable from "@/components/content/ComparisonTable";
import { PILLARS, type PillarTopic, getPillarModels } from "@/lib/content-graph";
import { ALTERNATIVES } from "@/lib/seo-data";
import { POSTS } from "@/lib/blog";
import { buildFAQPage } from "@/lib/schema";
import { getAuthor } from "@/lib/authors";

interface Props {
  params: { topic: string };
}

export function generateStaticParams() {
  return Object.keys(PILLARS).map((topic) => ({ topic }));
}

export function generateMetadata({ params }: Props): Metadata {
  const pillar = PILLARS[params.topic as PillarTopic];
  if (!pillar) return {};
  return {
    title: `${pillar.title} — полный гайд и каталог 2026`,
    description: `Всё про ${pillar.title.toLowerCase()} в одном месте: обзоры моделей, сравнения, альтернативы, практические гайды, FAQ. Работает без VPN из России.`,
    alternates: { canonical: `/hub/${params.topic}` },
    openGraph: {
      title: `${pillar.title} — Stone AI`,
      description: `Полный гайд по ${pillar.title.toLowerCase()} в 2026 году.`,
      type: "article",
    },
  };
}

export default function HubPage({ params }: Props) {
  const topic = params.topic as PillarTopic;
  const pillar = PILLARS[topic];
  if (!pillar) return notFound();

  // Only implement /hub/image-ai fully for now — others fall through to notFound
  if (topic !== "image-ai") return notFound();

  const models = getPillarModels(topic);
  const alternatives = pillar.alternatives
    .map((slug) => ALTERNATIVES.find((a) => a.slug === slug))
    .filter((a): a is NonNullable<typeof a> => !!a);
  const blogs = pillar.relatedBlogs
    .map((slug) => POSTS.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => !!p);

  const bcItems = [
    { label: "Нейросети", href: "/models" },
    { label: pillar.title, href: `/hub/${topic}` },
  ];

  const faqItems = [
    {
      q: "Какая нейросеть лучше всего генерирует картинки в 2026 году?",
      a: "По качеству художественного арта лидирует Midjourney V7. По фотореализму и работе с лицами — Nano Banana Pro (Google DeepMind). По реалистичной текстуре кожи и документальной фотографии — Flux 1.1 Pro. Все три доступны в Stone AI в тарифе Pro (1 290₽/мес).",
    },
    {
      q: "Можно ли генерировать картинки нейросетью бесплатно?",
      a: "Да. Nano Banana (базовая версия) доступна на Free-тарифе Stone AI — 2 картинки при регистрации + новые по мере использования. Дополнительно можно попробовать GPT-4o Image Mini и Stable Diffusion XL (через Pay-per-use).",
    },
    {
      q: "Нужен ли VPN для Midjourney из России?",
      a: "Midjourney напрямую требует VPN и Discord. В Stone AI доступ к Midjourney V7 идёт через наш API-прокси — без VPN, без Discord, оплата в рублях. То же самое для Nano Banana, Flux, GPT-5 Image и других моделей.",
    },
    {
      q: "Сколько стоит генерация одной картинки?",
      a: "Зависит от тарифа и модели. На Free-тарифе — пакет картинок в месяц (2 бесплатно, далее pay-per-use). Start (590₽/мес) — 60 картинок в месяц. Pro (1 290₽/мес) — 140 картинок. Elite (2 990₽/мес) — 280 картинок. Pay-per-use от 3₽ за простую модель до 15₽ за Midjourney V7 / Nano Banana Pro.",
    },
    {
      q: "Какая нейросеть лучше для создания аватарок?",
      a: "Для стилизованных аватарок (аниме, арт, мультипликация) — Midjourney V7. Для реалистичных фото-аватарок — Nano Banana Pro или Flux 1.1 Pro. Для логотипов и иконок — DALL-E (через GPT-5 Image). Загрузите своё фото и попросите изменить стиль в любой из этих моделей.",
    },
    {
      q: "Может ли нейросеть редактировать уже готовое изображение?",
      a: "Да. Nano Banana Pro умеет inpainting (замена части картинки), смену фона, добавление/удаление объектов, изменение стиля. GPT-5 Image — редактирование через текстовые инструкции. Flux 1.1 Pro — контроль через LoRA-адаптеры. В Stone AI все три модели поддерживают загрузку исходной картинки.",
    },
    {
      q: "Какой размер картинки можно сгенерировать?",
      a: "Midjourney V7 — до 2048×2048 в стандарте, до 4096×4096 с upscale. Nano Banana Pro — до 2048×2048. Flux 1.1 Pro — до 2048×2048. Для очень больших изображений используйте upscale-функцию (отдельный запрос через Stone AI Tools → Image → Upscale).",
    },
    {
      q: "Можно ли генерировать картинки для коммерческого использования?",
      a: "Да. Все основные AI-модели (Midjourney V7, Nano Banana Pro, Flux, GPT-5 Image, Stable Diffusion XL) разрешают коммерческое использование сгенерированных изображений. Stone AI не ограничивает права пользователей на свой контент. Для использования в публикациях указание источника опционально, но хорошим тоном считается отметить, что изображение сгенерировано AI.",
    },
    {
      q: "Почему у нейросетей иногда лица получаются неестественными?",
      a: "Это известная проблема diffusion-моделей 2024-2025 годов, называемая «uncanny valley». В 2026 Nano Banana Pro и Flux 1.1 Pro решили её — они специально обучены на реальных портретах. Если получается неестественное лицо — попробуйте эти модели вместо Midjourney или DALL-E (Midjourney иногда даёт «стеклянные» лица).",
    },
    {
      q: "Можно ли сгенерировать одного и того же персонажа на нескольких картинках?",
      a: "Да. В Stone AI есть специальный инструмент «Фотосессия персонажа» на тарифе Pro: загружаете одну фотографию — модель генерирует серию изображений с этим персонажем в разных сценах. Также можно использовать Midjourney V7 с параметром --cref или Flux с LoRA.",
    },
    {
      q: "Сколько времени занимает генерация одной картинки?",
      a: "Зависит от модели: Flux Schnell — 2-5 секунд (самая быстрая), Nano Banana — 5-10 секунд, Flux 1.1 Pro — 8-15 секунд, GPT-5 Image — 10-20 секунд, Midjourney V7 — 15-30 секунд, Nano Banana Pro (с высоким качеством) — 15-25 секунд.",
    },
    {
      q: "Как написать хороший промпт для генерации картинки?",
      a: "Опишите: (1) субъект — что на картинке, (2) стиль — фотореализм/арт/мультяшный, (3) композиция — крупный план/общий, (4) освещение — закатное/студийное/природное, (5) настроение. Пример: «портрет женщины 30 лет, улыбающейся, фотореализм, студийное освещение, softbox, портретный объектив 85mm, глубина резкости». Подробный гайд — <a href=\"/blog/kak-napisat-prompt-dlya-nejroseti\">в нашем блоге</a>.",
    },
    {
      q: "Какие типы картинок нельзя сгенерировать?",
      a: "Большинство моделей (Midjourney, Nano Banana, GPT Image) блокируют генерацию: контента с насилием, нарушающего копирайт (известные персонажи, логотипы брендов), сексуального контента, контента с детьми в неподобающих ситуациях. Stable Diffusion XL имеет меньше ограничений, но права пользователя не освобождают от закона.",
    },
    {
      q: "Можно ли улучшить (upscale) старое фото?",
      a: "Да. В Stone AI есть отдельные инструменты для upscale: Real-ESRGAN (2×/4×), SUPIR (для старых/размытых фото), Face Restoration (для лиц). Доступны в разделе Tools → Image → Upscale. Цена от 5₽ за upscale одного фото до 4K.",
    },
    {
      q: "Как это сравнить с Photoshop?",
      a: "Photoshop — ручной редактор для точной работы. AI-генерация — быстрый способ получить концепт или готовое изображение из текстового описания. Лучшая практика 2026: сгенерировать базовую картинку через Midjourney/Nano Banana, довести в Photoshop до финального качества. Многие профессиональные дизайнеры работают именно в таком workflow.",
    },
  ];

  return (
    <div className="min-h-screen pt-4 pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(bcItems)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFAQPage(faqItems)) }} />

      <Breadcrumbs items={bcItems} />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Hero */}
        <header className="mb-10">
          <div className="inline-block bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-bold mb-4">
            Pillar-страница · 15 мин чтения
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-5">
            Нейросети для генерации картинок в 2026 году
          </h1>
          <p className="text-lg text-text/60 leading-relaxed">
            Полный гайд по AI-моделям для создания изображений: Midjourney V7, Nano Banana Pro, Flux 1.1, GPT-5 Image, Stable Diffusion XL. Сравнение качества, цен, доступа в России. Как начать без VPN и с оплатой рублями. Ссылки на конкретные инструменты, альтернативы и практические use-cases.
          </p>
        </header>

        {/* TLDR */}
        <section className="mb-10">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4">Ответ за 30 секунд</h2>
          <p className="text-text/75 text-[15px] leading-[1.8] mb-4">
            В 2026 году три топовые нейросети для картинок: <b>Midjourney V7</b> (художественное качество — #1), <b>Nano Banana Pro</b> (фотореализм и лица — #1), <b>Flux 1.1 Pro</b> (реалистичная текстура и кожа). Все три работают без VPN через Stone AI с оплатой в рублях — в одной подписке Pro за 1 290₽/мес. Бесплатно можно попробовать Nano Banana и Stable Diffusion XL (2 картинки при регистрации + pay-per-use).
          </p>
        </section>

        {/* Stats */}
        <StatBlock stats={[
          { value: "6+", label: "Image-моделей в Stone AI", sub: "Midjourney, Nano Banana, Flux, GPT-5 Image, SDXL" },
          { value: "2-25", label: "Секунд на генерацию", sub: "от Flux Schnell до Midjourney V7", accent: true },
          { value: "140", label: "Картинок в тарифе Pro", sub: "за 1 290₽/мес" },
          { value: "2", label: "Бесплатно навсегда", sub: "при регистрации + 100₽ бонус" },
        ]} />

        <Callout variant="tip" title="Коротко: какую модель выбрать">
          <b>Арт, иллюстрация, концепт:</b> Midjourney V7. <b>Портреты, фотореализм, продуктовая съёмка:</b> Nano Banana Pro. <b>Реалистичная текстура, документальные фото:</b> Flux 1.1 Pro. <b>Редактирование готового фото:</b> Nano Banana Pro (inpaint). <b>Быстрые массовые иллюстрации:</b> Flux Schnell. <b>Бесплатно:</b> Nano Banana (базовая).
        </Callout>

        {/* Models */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-extrabold mb-2">Все модели в Stone AI для генерации картинок</h2>
          <p className="text-sm text-text/50 mb-6">Переключайтесь между моделями в одном чате одним кликом</p>
        </section>

        <RelatedModels
          models={models.slice(0, 6)}
          title=""
          description=""
        />

        {/* Comparison */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-extrabold mb-4">Сравнение трёх топовых моделей</h2>
          <ComparisonTable
            columns={[
              { title: "Midjourney V7", subtitle: "Pro · 1 290₽", accent: true, badge: "#1 арт" },
              { title: "Nano Banana Pro", subtitle: "Pro · 1 290₽", badge: "#1 фотореализм" },
              { title: "Flux 1.1 Pro", subtitle: "Start · 590₽" },
            ]}
            rows={[
              { criterion: "Художественное качество", values: ["🏆 Топ", "Хорошее", "Среднее"] },
              { criterion: "Фотореализм", values: ["Хорошее", "🏆 Топ", "🏆 Топ"] },
              { criterion: "Работа с лицами", values: ["Среднее", "🏆 Отлично", "🏆 Отлично"] },
              { criterion: "Текст на картинке", values: ["Слабо", "Хорошо", "Средне"] },
              { criterion: "Скорость", values: ["15-30 сек", "8-15 сек", "5-10 сек"] },
              { criterion: "Inpaint / edit", values: [false, true, true] },
              { criterion: "В каком тарифе", values: ["Pro", "Pro", "Start"], highlight: true },
            ]}
            caption="Сравнение по 7 критериям на основе тестов Stone AI team"
            footnote="Результаты на 50 тестовых промптах апреля 2026"
          />
        </section>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl md:text-2xl font-extrabold mb-4">Альтернативы и посадочные страницы</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {alternatives.map((a) => (
                <Link
                  key={a.slug}
                  href={`/alternatives/${a.slug}`}
                  className="block bg-bg border border-text/5 rounded-2xl p-5 hover:border-accent/30 hover:shadow-md transition-all"
                >
                  <h3 className="font-bold text-sm mb-1.5">Альтернативы {a.service}</h3>
                  <p className="text-xs text-text/50 line-clamp-2">{a.description}</p>
                </Link>
              ))}
              <Link href="/tools/image-generation" className="block bg-bg border border-accent/20 rounded-2xl p-5 hover:border-accent/50 transition-all">
                <h3 className="font-bold text-sm mb-1.5 text-accent">Инструменты для генерации картинок →</h3>
                <p className="text-xs text-text/50">Все image-инструменты Stone AI в одном месте</p>
              </Link>
            </div>
          </section>
        )}

        {/* Founder quote */}
        <Quote
          accent
          text="В 2026-м нет смысла спорить «какая модель для картинок лучшая» — это всегда зависит от задачи. Правильный вопрос: «какие 3-4 модели должны быть у меня под рукой, чтобы закрыть 90% задач». Для контент-мейкера это Midjourney V7 + Nano Banana Pro + Flux. Три модели, одна подписка, без переключений между сервисами."
          author="Марина Колесникова"
          role="AI-маркетолог Stone AI"
          url="/authors/marketing-expert"
        />

        {/* Related blog */}
        {blogs.length > 0 && (
          <section className="mb-12 mt-12">
            <h2 className="text-xl md:text-2xl font-extrabold mb-4">Глубокие гайды в блоге</h2>
            <div className="grid gap-3">
              {blogs.map((b) => (
                <Link
                  key={b.slug}
                  href={`/blog/${b.slug}`}
                  className="block bg-bg border border-text/5 rounded-2xl p-5 hover:border-accent/30 hover:shadow-sm transition-all group"
                >
                  <h3 className="font-bold text-sm mb-1 group-hover:text-accent transition-colors">{b.title}</h3>
                  <p className="text-xs text-text/50 line-clamp-2">{b.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-text/30">
                    <span>{b.readTime}</span>
                    <span aria-hidden="true">·</span>
                    <span>{b.dateModified}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-accent/10 to-teal/5 border border-accent/20 rounded-2xl p-8 text-center">
          <h2 className="font-extrabold text-xl mb-2">Попробуйте все 6 image-моделей бесплатно</h2>
          <p className="text-text/60 text-sm mb-5">2 картинки в подарок + 100₽ бонус за регистрацию. Без VPN, оплата картой РФ.</p>
          <Link href="/dashboard/chat" className="inline-block bg-accent text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors">
            Начать бесплатно →
          </Link>
        </div>

        {/* FAQ */}
        <FaqExtended items={faqItems} />

        <CrossLinks prefer={["image", "tools", "professions"]} limit={6} />
      </article>
    </div>
  );
}
