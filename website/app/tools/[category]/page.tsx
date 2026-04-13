import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MODELS } from "@/lib/models";
import { TOOL_HUBS } from "@/lib/seo-data";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });

interface Props { params: { category: string } }

export function generateStaticParams() { return TOOL_HUBS.map((t) => ({ category: t.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hub = TOOL_HUBS.find((t) => t.slug === params.category);
  if (!hub) return {};
  return {
    title: hub.title, description: hub.description,
    alternates: { canonical: `${SITE_URL}/tools/${hub.slug}` },
    openGraph: { title: hub.title, description: hub.description, url: `${SITE_URL}/tools/${hub.slug}`, type: "website", siteName: "Stone AI" },
  };
}

export default function ToolHubPage({ params }: Props) {
  const hub = TOOL_HUBS.find((t) => t.slug === params.category);
  if (!hub) notFound();

  const catMap: Record<string, string> = { "image-generation": "image", "video-generation": "video", "text-generation": "chat", "code-generation": "code" };
  const matchCat = catMap[hub.slug];
  const allCatModels = matchCat ? MODELS.filter((m) => m.category === matchCat) : hub.modelIds.map((id) => MODELS.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m);

  const baseFaqItems = [
    { q: `Сколько стоит ${hub.category.toLowerCase()}?`, a: "10 бесплатных запросов/день к текстовым моделям. Для генерации изображений — 2 бесплатные генерации. Подписки от 590₽/мес с доступом ко всем 65+ моделям." },
    { q: "Какие модели доступны?", a: `${allCatModels.length}+ моделей: ${allCatModels.slice(0, 5).map((m) => m.name).join(", ")} и другие. Все модели доступны в одном интерфейсе — переключайтесь между ними в один клик.` },
    { q: "Нужна ли регистрация?", a: "Первые 2 запроса — без регистрации. Далее бесплатная регистрация (10 запросов/день). Без привязки карты." },
  ];

  const extraFaqMap: Record<string, { q: string; a: string }[]> = {
    "image-generation": [
      { q: "Можно ли генерировать изображения на русском языке?", a: "Да, все модели в Stone AI поддерживают промпты на русском языке. Опишите изображение как хотите — AI поймёт и создаст картинку по вашему описанию." },
      { q: "Какая модель лучше для фотореалистичных изображений?", a: "GPT-5 Image от OpenAI даёт наиболее фотореалистичное качество. Для быстрых иллюстраций и концептов используйте бесплатную Nano Banana. Nano Banana Pro — золотая середина между скоростью и качеством." },
      { q: "Можно ли использовать сгенерированные картинки коммерчески?", a: "Да, изображения, сгенерированные в Stone AI, можно использовать в коммерческих целях: реклама, сайты, социальные сети, маркетплейсы, печатная продукция." },
      { q: "Какое разрешение у сгенерированных изображений?", a: "Разрешение зависит от модели: до 1024x1024 и выше. GPT-5 Image даёт высокое качество, подходящее для маркетинговых материалов и печати." },
      { q: "Чем Stone AI лучше Midjourney для генерации картинок?", a: "Stone AI работает в браузере (не нужен Discord), поддерживает русский язык, предлагает 4 модели на выбор и стоит от 590₽/мес. Midjourney требует Discord и стоит от $10/мес." },
    ],
    "video-generation": [
      { q: "Какие видео-модели самые качественные?", a: "Veo 3 от Google и Sora 2 Pro от OpenAI дают наилучшее качество. Luma Ray 2 хорош для динамичных сцен. MiniMax Hailuo — быстрый и недорогой вариант." },
      { q: "Какая длительность сгенерированного видео?", a: "Длительность зависит от модели: от 3 до 10 секунд. Некоторые модели поддерживают генерацию более длинных роликов." },
      { q: "Можно ли генерировать видео из изображения?", a: "Да, несколько моделей поддерживают режим image-to-video: загрузите изображение и опишите желаемое движение." },
    ],
    "text-generation": [
      { q: "Какая модель лучше для русского языка?", a: "GPT-5.1 и Claude Sonnet 4 лучше всего работают на русском. Из бесплатных — GPT-4o mini отлично справляется с русскоязычными задачами." },
      { q: "Можно ли загружать документы для анализа?", a: "Да, Stone AI поддерживает загрузку PDF, DOCX и других документов. AI проанализирует содержимое и ответит на ваши вопросы." },
      { q: "Сохраняется ли история чатов?", a: "Да, все чаты сохраняются в вашем аккаунте. Вы можете вернуться к любому разговору в любое время." },
    ],
    "code-generation": [
      { q: "Какие языки программирования поддерживаются?", a: "Все популярные: Python, JavaScript, TypeScript, Java, C++, Go, Rust, PHP, Ruby, Swift, Kotlin, SQL и десятки других. AI также знает фреймворки: React, Next.js, FastAPI, Django, Spring и т.д." },
      { q: "Какая модель лучше для кода?", a: "Claude Opus 4 — лидер в программировании (сложный рефакторинг, архитектура). Devstral — специализированная код-модель от Mistral. GPT-5 — сильный универсальный вариант." },
      { q: "Безопасно ли отправлять код?", a: "Stone AI не хранит и не использует ваш код для обучения моделей. Данные передаются по HTTPS. Рекомендуем не отправлять секреты и API-ключи." },
    ],
  };

  const faqItems = [...baseFaqItems, ...(extraFaqMap[hub.slug] || [])];

  const itemListJsonLd = {
    "@context": "https://schema.org", "@type": "ItemList", name: hub.category,
    itemListElement: allCatModels.slice(0, 10).map((m, i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "SoftwareApplication", name: m.name, url: `${SITE_URL}/models/${m.id}` } })),
  };
  const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ label: "Инструменты", href: "/tools" }, { label: hub.category, href: `/tools/${hub.slug}` }]} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="text-3xl md:text-5xl font-extrabold text-text mb-4 leading-tight">{hub.h1}</h1>
        <p className="text-lg text-text/50 mb-12 max-w-2xl">{hub.intro}</p>

        {/* Models */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Доступные модели</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {allCatModels.map((m) => (
              <Link key={m.id} href={`/models/${m.id}`} className="bg-bg rounded-2xl border border-text/5 p-5 hover:border-accent/20 hover:shadow-sm transition-all group block">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-text group-hover:text-accent transition-colors">{m.name}</h3>
                  <span className="text-[10px] text-text/30">{m.company}</span>
                </div>
                <p className="text-sm text-text/50 mb-3">{m.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {m.strengths?.slice(0, 3).map((s) => <span key={s} className="text-[10px] bg-text/[0.04] text-text/40 px-2 py-0.5 rounded-full font-medium">{s}</span>)}
                  </div>
                  <span className="text-xs font-bold text-accent">{m.tier === "free" ? "Бесплатно" : `$${m.pricePerMillion}${m.priceUnit || "/1M"}`}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Tips / Use cases */}
        {hub.slug === "image-generation" && (
          <section className="mb-14">
            <h2 className="text-2xl font-extrabold text-text mb-6">Советы по генерации изображений</h2>
            <div className="space-y-3">
              {[
                { title: "Будьте конкретны в описании", desc: "Вместо «красивый пейзаж» напишите «горное озеро на закате, отражение снежных вершин в воде, тёплые оранжевые тона, фотореалистичный стиль». Чем подробнее промпт — тем точнее результат." },
                { title: "Указывайте стиль и технику", desc: "Добавляйте ключевые слова стиля: photorealistic, oil painting, watercolor, flat design, isometric, cyberpunk, minimalism. Это помогает AI понять желаемую эстетику." },
                { title: "Используйте отрицательные указания", desc: "Если хотите избежать чего-то, укажите это: «без текста», «без людей», «без рамки». Это помогает исключить нежелательные элементы." },
                { title: "Экспериментируйте с моделями", desc: "Nano Banana хороша для иллюстраций и концептов. GPT-5 Image — для фотореализма и маркетинга. Попробуйте один промпт на разных моделях — результаты будут различаться." },
              ].map((tip) => (
                <div key={tip.title} className="bg-bg rounded-2xl border border-text/5 p-6">
                  <h3 className="font-bold text-text mb-2">{tip.title}</h3>
                  <p className="text-sm text-text/50 leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

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
          <h2 className="text-2xl font-extrabold text-text mb-4">Попробуйте прямо сейчас</h2>
          <ChatWidget placeholder={`Попробуйте ${hub.category.toLowerCase()}`} />
        </section>

        {/* CTA */}
        <section className="bg-dark text-white rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-xl font-extrabold mb-3">Попробуйте {hub.category.toLowerCase()} бесплатно</h2>
          <p className="text-white/40 text-sm mb-6">Без VPN. На русском языке. Бесплатный старт.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25">
            Начать бесплатно <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </section>

        {/* Other */}
        <section className="mt-14">
          <h2 className="text-lg font-bold text-text mb-4">Другие инструменты</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {TOOL_HUBS.filter((t) => t.slug !== hub.slug).map((t) => (
              <Link key={t.slug} href={`/tools/${t.slug}`} className="bg-bg rounded-xl border border-text/5 px-4 py-3 text-sm font-medium text-text/60 hover:border-accent/20 hover:text-accent transition-colors">
                {t.category}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
