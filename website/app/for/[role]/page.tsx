import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MODELS } from "@/lib/models";
import { PROFESSIONS } from "@/lib/seo-data";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });

interface Props { params: { role: string } }

export function generateStaticParams() { return PROFESSIONS.map((p) => ({ role: p.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const prof = PROFESSIONS.find((p) => p.slug === params.role);
  if (!prof) return {};
  return {
    title: prof.title, description: prof.description,
    alternates: { canonical: `${SITE_URL}/for/${prof.slug}` },
    openGraph: { title: prof.title, description: prof.description, url: `${SITE_URL}/for/${prof.slug}`, type: "article", siteName: "Stone AI" },
  };
}

export default function ProfessionPage({ params }: Props) {
  const prof = PROFESSIONS.find((p) => p.slug === params.role);
  if (!prof) notFound();

  const benefitsMap: Record<string, string[]> = {
    marketer: ["Экономия 10+ часов в неделю на создании контента", "Генерация текстов и изображений за минуты", "A/B тестирование заголовков и описаний", "SEO-оптимизация текстов с учётом ключевых слов", "Автоматизация рутинных задач маркетинга", "Анализ конкурентов и трендов"],
    developer: ["Генерация кода на любом языке за секунды", "Автоматический code review и поиск багов", "Ускорение разработки в 3-10 раз", "Написание тестов и документации", "Помощь с архитектурными решениями", "Поддержка 50+ языков программирования"],
    copywriter: ["Черновик статьи на 2000 слов за 5 минут", "Рерайт и уникализация текстов", "Адаптация тона под бренд и аудиторию", "SEO-оптимизация без специальных знаний", "Генерация контент-планов на месяц", "Работа с 65+ моделями для разных задач"],
    designer: ["Генерация 10+ вариантов за минуту", "Продуктовые фото без фотостудии", "Поддержка любых стилей и направлений", "Экономия на фотостоках и фрилансерах", "Быстрое прототипирование идей", "Создание видео и 3D из текста"],
    student: ["10 бесплатных запросов каждый день", "Пошаговое объяснение сложных тем", "Помощь с математикой и программированием", "Генерация конспектов и планов работ", "Подготовка к экзаменам с AI-тренажёром", "Перевод и работа с иностранными текстами"],
  };
  const benefits = benefitsMap[prof.slug] || benefitsMap.student;

  const faqItemsMap: Record<string, { q: string; a: string }[]> = {
    marketer: [
      { q: "Какие AI модели лучше для маркетолога?", a: `Для контент-маркетинга — GPT-5 и Claude Sonnet 4. Для SEO — GPT-4.1 и DeepSeek R1. Для аналитики — DeepSeek R1 и o4-mini. Для изображений — Nano Banana (бесплатно) и GPT-5 Image.` },
      { q: "Можно ли использовать бесплатно?", a: "Да, 10 бесплатных запросов в день к 8 моделям. Для генерации изображений — 2 бесплатные генерации. Без привязки карты." },
      { q: "AI заменит маркетолога?", a: "Нет. AI ускоряет работу маркетолога в 3-10 раз, автоматизируя рутину: написание текстов, создание изображений, анализ данных. Стратегия, креатив и принятие решений — за вами." },
      { q: "Подходит ли AI для малого бизнеса?", a: "Да, AI особенно полезен для малого бизнеса, где один человек совмещает роли маркетолога, копирайтера и дизайнера. Stone AI от 590₽/мес заменяет несколько инструментов." },
      { q: "Как AI помогает с SEO?", a: "AI генерирует SEO-статьи с правильной структурой (H2, списки, FAQ), подбирает ключевые слова, пишет мета-теги и title. Модели DeepSeek R1 и GPT-4.1 особенно хороши для SEO-задач." },
      { q: "Можно ли генерировать изображения для рекламы?", a: "Да, в Stone AI доступны 4 модели для генерации изображений. Nano Banana — бесплатная для быстрых иллюстраций. GPT-5 Image — для фотореалистичного качества в рекламных материалах." },
    ],
    developer: [
      { q: "Какая модель лучше всего пишет код?", a: "Claude Opus 4 — лучшая модель для программирования: сложный рефакторинг, архитектура, длинный контекст. Devstral — специализированная код-модель от Mistral. GPT-5 — универсальный вариант." },
      { q: "Можно ли использовать бесплатно?", a: "Да, 10 бесплатных запросов в день. Бесплатные модели: GPT-4o mini, Claude Haiku, Gemini Flash, DeepSeek V3, Llama 4 — все подходят для кода." },
      { q: "AI заменит программиста?", a: "Нет. AI ускоряет разработку в 3-10 раз, но не заменяет инженерное мышление. AI генерирует код, но проектирование архитектуры, выбор решений и ответственность — за разработчиком." },
      { q: "Какие языки программирования поддерживаются?", a: "Все популярные: Python, JavaScript/TypeScript, Java, C++, Go, Rust, PHP, Ruby, Swift, Kotlin, SQL и десятки других. AI понимает фреймворки: React, Next.js, FastAPI, Spring и т.д." },
      { q: "Безопасно ли отправлять код в AI?", a: "Stone AI не хранит и не использует ваш код для обучения моделей. Данные передаются по HTTPS и удаляются после обработки. Для конфиденциальных проектов рекомендуем не отправлять секреты и API-ключи." },
      { q: "Чем Stone AI лучше GitHub Copilot?", a: "Stone AI даёт доступ к 65+ моделям (Claude Opus, GPT-5, Devstral) в одном интерфейсе. Copilot привязан к VS Code и одной модели. Stone AI дешевле и универсальнее — код, тексты, картинки, видео." },
    ],
    copywriter: [
      { q: "Какие модели лучше для текстов?", a: "GPT-5.1 — лучший для креативных и продающих текстов. Claude Sonnet 4 — для экспертных статей и длинных форматов. Claude Opus 4 — для редактуры и стилистической правки." },
      { q: "Можно ли использовать бесплатно?", a: "Да, 10 бесплатных запросов в день к 8 моделям. Для большинства задач копирайтера хватает GPT-4o mini (бесплатный) — он хорошо пишет на русском." },
      { q: "AI пишет уникальные тексты?", a: "Да, AI генерирует оригинальный контент, не копируя из интернета. Уникальность обычно 90-100% по text.ru и Advego. Рекомендуем редактировать и дополнять тексты своей экспертизой." },
      { q: "AI заменит копирайтера?", a: "AI ускоряет работу копирайтера в 5 раз, но не заменяет экспертизу. AI создаёт черновики, копирайтер доводит их до совершенства, добавляет личный опыт и факт-чекинг." },
      { q: "Подходит ли для SEO-копирайтинга?", a: "Да. AI генерирует SEO-статьи с правильной структурой, вписывает ключевые слова естественно, создаёт мета-теги и FAQ-блоки. Stone AI также имеет встроенные SEO-инструменты." },
      { q: "Можно ли задать тон и стиль?", a: "Да, в промпте указывайте тон (деловой, дружелюбный, экспертный), целевую аудиторию и примеры желаемого стиля. AI адаптирует текст под ваши требования." },
    ],
    designer: [
      { q: "Какие модели генерируют изображения?", a: "В Stone AI 4 модели: Nano Banana (бесплатная, быстрая), Nano Banana Pro (высокое качество), GPT-5 Image (фотореализм), GPT-5 Image Mini (быстрая от OpenAI)." },
      { q: "Можно ли использовать бесплатно?", a: "Да, 2 бесплатные генерации изображений для новых пользователей. Для текстовых задач (описание концептов) — 10 бесплатных запросов в день." },
      { q: "AI заменит дизайнера?", a: "Нет. AI генерирует концепты и черновики, но финальная доработка, брендинг и дизайн-система — работа дизайнера. AI экономит часы на поиске референсов и создании вариантов." },
      { q: "Можно ли генерировать в определённом стиле?", a: "Да, в промпте укажите стиль: flat design, isometric, watercolor, photorealistic, cyberpunk, minimalism и другие. AI понимает стили и художественные направления." },
      { q: "Какое разрешение у сгенерированных изображений?", a: "До 1024x1024 и выше в зависимости от модели. GPT-5 Image даёт высокое разрешение, подходящее для печати и маркетинговых материалов." },
      { q: "Можно ли использовать изображения коммерчески?", a: "Да, сгенерированные изображения можно использовать в коммерческих целях: реклама, сайты, социальные сети, печатная продукция." },
    ],
    student: [
      { q: "Это действительно бесплатно?", a: "Да, 10 бесплатных запросов каждый день к 8 моделям: GPT-4o mini, Claude Haiku, Gemini Flash, DeepSeek V3, Llama 4 и другие. Без привязки карты, без подписки." },
      { q: "Можно ли использовать для курсовых и дипломных?", a: "AI помогает с составлением плана, поиском источников, оформлением по ГОСТу и объяснением сложных тем. Но работа должна быть вашей — AI это инструмент, а не автор." },
      { q: "AI решает задачи по математике?", a: "Да, модели DeepSeek R1 и o4-mini специализируются на математике и логике. Они решают задачи пошагово, объясняя каждое действие — это помогает разобраться в методе решения." },
      { q: "AI заменит преподавателя?", a: "Нет, AI дополняет обучение. Он терпеливо объясняет тему столько раз, сколько нужно, простыми словами и с примерами. Но проверка знаний и оценка — за преподавателем." },
      { q: "Можно ли загружать PDF и документы?", a: "Да, в Stone AI можно загрузить документ и задать вопросы по его содержимому. AI проанализирует текст и даст ответы на основе загруженного материала." },
      { q: "Работает ли без VPN?", a: "Да, Stone AI полностью работает из России без VPN. Сайт, Telegram-бот и все 65+ нейросетей доступны без ограничений." },
    ],
  };

  const faqItems = faqItemsMap[prof.slug] || [
    { q: `Какие AI модели лучше для ${prof.role.toLowerCase()}а?`, a: `Лучшие: ${prof.tasks.flatMap((t) => t.models).filter((v, i, a) => a.indexOf(v) === i).slice(0, 5).map((id) => MODELS.find((m) => m.id === id)?.name || id).join(", ")}.` },
    { q: "Можно ли использовать бесплатно?", a: "Да, 10 бесплатных запросов в день к 8 моделям. Без карты." },
    { q: "AI заменит мою работу?", a: `Нет. AI ускоряет работу ${prof.role.toLowerCase()}а в 3-10 раз, автоматизируя рутину. Творческие решения — за вами.` },
  ];

  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: prof.h1, description: prof.description, datePublished: "2026-04-07", author: { "@type": "Organization", name: "Stone AI", url: SITE_URL } };
  const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ label: "AI по профессиям" }, { label: `AI для ${prof.role.toLowerCase()}а` }]} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="text-3xl md:text-5xl font-extrabold text-text mb-4 leading-tight">{prof.h1}</h1>
        <p className="text-lg text-text/50 mb-12 max-w-2xl">{prof.intro}</p>

        {/* Benefits */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Преимущества AI для {prof.role.toLowerCase()}а</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {benefits.map((b) => (
              <div key={b} className="flex items-start gap-3 bg-bg rounded-xl border border-text/5 p-4">
                <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span className="text-sm text-text/70 font-medium">{b}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Tasks */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Задачи которые решает AI</h2>
          <div className="space-y-3">
            {prof.tasks.map((t) => (
              <div key={t.name} className="bg-bg rounded-2xl border border-text/5 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{t.icon}</span>
                  <h3 className="font-bold text-text">{t.name}</h3>
                </div>
                <p className="text-sm text-text/50 mb-3">{t.description}</p>
                <div className="flex flex-wrap gap-2">
                  {t.models.map((id) => {
                    const m = MODELS.find((x) => x.id === id);
                    return m ? (
                      <Link key={id} href={`/models/${id}`} className="text-[11px] bg-accent/10 text-accent px-2.5 py-1 rounded-lg font-bold hover:bg-accent/20 transition-colors">
                        {m.name}
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Prompts */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Готовые промпты</h2>
          <div className="space-y-3">
            {prof.prompts.map((p) => (
              <div key={p.title} className="bg-bg rounded-2xl border border-text/5 p-6">
                <h3 className="font-bold text-text mb-2">{p.title}</h3>
                <pre className="text-sm text-text/50 bg-text/[0.03] rounded-xl p-4 whitespace-pre-wrap font-sans leading-relaxed">{p.prompt}</pre>
                <Link href="/dashboard/chat" className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-accent hover:underline">
                  Попробовать в чате <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Частые вопросы</h2>
          <div className="space-y-3">
            {faqItems.map((f) => (
              <details key={f.q} className="bg-bg rounded-xl border border-text/5 group">
                <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-text/80 list-none flex items-center justify-between">{f.q}<svg className="w-4 h-4 text-text/20 group-open:rotate-180 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></summary>
                <p className="px-5 pb-4 text-sm text-text/50 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Try it */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-4">Попробуйте AI для вашей задачи</h2>
          <ChatWidget placeholder={`Задайте вопрос как ${prof.role.toLowerCase()}`} />
        </section>

        {/* CTA */}
        <section className="bg-dark text-white rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-xl font-extrabold mb-3">Начните использовать AI в работе</h2>
          <p className="text-white/40 text-sm mb-6">10 бесплатных запросов/день. 65+ нейросетей. Без VPN.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25">
            Попробовать бесплатно <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </section>

        {/* Other */}
        <section className="mt-14">
          <h2 className="text-lg font-bold text-text mb-4">AI для других профессий</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {PROFESSIONS.filter((p) => p.slug !== prof.slug).map((p) => (
              <Link key={p.slug} href={`/for/${p.slug}`} className="bg-bg rounded-xl border border-text/5 px-4 py-3 text-sm font-medium text-text/60 hover:border-accent/20 hover:text-accent transition-colors">
                AI для {p.role.toLowerCase()}а
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
