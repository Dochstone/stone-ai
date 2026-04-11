import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MODELS } from "@/lib/models";
import { ALTERNATIVES } from "@/lib/seo-data";
import { SITE_URL } from "@/lib/constants";
import Breadcrumbs from "@/components/Breadcrumbs";

const ChatWidget = dynamic(() => import("@/components/ChatWidget"), { ssr: false });

interface Props { params: { slug: string } }

export function generateStaticParams() { return ALTERNATIVES.map((a) => ({ slug: a.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const alt = ALTERNATIVES.find((a) => a.slug === params.slug);
  if (!alt) return {};
  return {
    title: alt.title, description: alt.description,
    alternates: { canonical: `${SITE_URL}/alternatives/${alt.slug}` },
    openGraph: { title: alt.title, description: alt.description, url: `${SITE_URL}/alternatives/${alt.slug}`, type: "article", siteName: "Stone AI", images: [{ url: `${SITE_URL}/og-alt-${alt.slug}.png`, width: 1200, height: 630, alt: alt.title }] },
  };
}

export default function AlternativesPage({ params }: Props) {
  const alt = ALTERNATIVES.find((a) => a.slug === params.slug);
  if (!alt) notFound();
  const models = alt.models.map((id) => MODELS.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m);

  const faqMap: Record<string, { q: string; a: string }[]> = {
    chatgpt: [
      { q: "Какие есть альтернативы ChatGPT в России?", a: "Лучшие альтернативы: Claude Sonnet 4, Gemini 2.5 Flash, DeepSeek R1, Grok 3, Llama 4. Все доступны в Stone AI от 590₽/мес без VPN." },
      { q: "Можно ли использовать ChatGPT без VPN?", a: "Сам ChatGPT требует VPN из России. В Stone AI доступны GPT-4o mini и GPT-5 без VPN + 60 других моделей в одном интерфейсе." },
      { q: "Что дешевле — ChatGPT Plus или Stone AI?", a: "ChatGPT Plus стоит $20/мес (~1900₽) за модели только OpenAI. Stone AI Pro — 1290₽/мес за 65+ моделей от всех провайдеров. В 1.5 раза дешевле и в 10 раз больше моделей." },
      { q: "Можно ли пользоваться бесплатно?", a: "Да, Stone AI даёт 10 бесплатных запросов в день к 8 моделям включая GPT-4o mini и Claude Haiku. Без привязки карты." },
      { q: "ChatGPT или Claude — что лучше для кода?", a: "Claude Opus 4 лучше для сложного кода и рефакторинга. GPT-5 сильнее в мультимодальности. В Stone AI доступны оба — переключайтесь одним кликом." },
      { q: "Есть ли генерация картинок и видео?", a: "Да, в отличие от ChatGPT, Stone AI даёт генерацию изображений (4 модели), видео (12 моделей), 3D и аудио — всё в одной подписке." },
    ],
    midjourney: [
      { q: "Какие есть бесплатные альтернативы Midjourney?", a: "Nano Banana — бесплатная модель в Stone AI для генерации изображений. Также GPT-5 Image, GPT-5 Image Mini и Nano Banana Pro в платных планах." },
      { q: "Можно ли генерировать картинки без Discord?", a: "Да, в Stone AI генерация изображений работает прямо в браузере и Telegram-боте. Никакого Discord — просто введите описание и получите картинку." },
      { q: "Какое качество у альтернатив Midjourney?", a: "GPT-5 Image даёт фотореалистичное качество, сопоставимое с Midjourney v6. Nano Banana хороша для быстрых иллюстраций. Все модели поддерживают русские промпты." },
      { q: "Можно ли использовать бесплатно?", a: "Да, 2 бесплатные генерации изображений + 10 текстовых запросов в день. Подписка от 590₽/мес даёт 60+ генераций изображений в месяц." },
      { q: "Поддерживаются ли русские промпты?", a: "Да, все модели в Stone AI понимают промпты на русском языке. Midjourney работает только с английскими промптами." },
      { q: "Можно ли использовать для коммерческих целей?", a: "Да, сгенерированные изображения можно использовать в рекламе, на сайтах, в соцсетях и печатных материалах." },
    ],
    deepseek: [
      { q: "Почему серверы DeepSeek часто перегружены?", a: "DeepSeek — популярная бесплатная модель с ограниченной инфраструктурой. В Stone AI DeepSeek R1 доступен через OpenRouter без очередей и перегрузок." },
      { q: "Какие альтернативы DeepSeek R1 для reasoning?", a: "Claude Opus 4 — лучший для сложных рассуждений. o3 от OpenAI — топ в математике. Gemini 3 Pro — сильный в анализе. Все доступны в Stone AI." },
      { q: "Можно ли использовать DeepSeek и альтернативы бесплатно?", a: "Да, DeepSeek V3 доступен бесплатно в Stone AI (10 запросов/день). Также бесплатны GPT-4o mini, Claude Haiku, Gemini Flash и Llama 4." },
      { q: "DeepSeek или Claude — что лучше для кода?", a: "Claude Opus 4 лучше для сложного кода и архитектуры. DeepSeek R1 сильнее в математике и логике. В Stone AI доступны оба — выбирайте под задачу." },
      { q: "Есть ли API доступ?", a: "Да, план Elite (2990₽/мес) включает API-доступ ко всем 65+ моделям, включая DeepSeek R1 и все альтернативы." },
      { q: "Работает ли без VPN?", a: "Да, Stone AI полностью работает из России без VPN. Все модели, включая DeepSeek, доступны без ограничений." },
    ],
    grok: [
      { q: "Можно ли использовать Grok без подписки на X?", a: "Сам Grok требует X Premium ($16/мес). В Stone AI Grok 3 доступен наряду с 64 другими моделями от 590₽/мес — без привязки к Twitter." },
      { q: "Какие альтернативы Grok для AI-поиска?", a: "Perplexity Sonar и Sonar Pro — специализированные поисковые AI-модели. GPT-5 с browsing. Все доступны в Stone AI." },
      { q: "Grok бесплатный?", a: "Grok требует подписку X Premium от $16/мес. В Stone AI 10 бесплатных запросов в день к 8 моделям. Grok 3 доступен в платных планах от 590₽/мес." },
      { q: "Чем Grok отличается от ChatGPT?", a: "Grok от xAI имеет доступ к данным Twitter/X в реальном времени. ChatGPT универсальнее. В Stone AI доступны оба плюс 60+ других моделей." },
      { q: "Работает ли Grok в России?", a: "Grok через X требует VPN. В Stone AI Grok 3 доступен из России без VPN через OpenRouter." },
      { q: "Есть ли генерация картинок?", a: "Grok имеет ограниченную генерацию. Stone AI даёт 4 модели для изображений + 12 для видео + 3D и аудио — всё в одной подписке." },
    ],
  };
  const defaultFaq = [
    { q: `Какие есть альтернативы ${alt.service}?`, a: `Лучшие альтернативы: ${models.map((m) => m.name).join(", ")}. Все доступны в Stone AI от 590₽/мес.` },
    { q: `Можно ли использовать альтернативы ${alt.service} бесплатно?`, a: "Да, Stone AI даёт 10 бесплатных запросов в день к 8 моделям. Без карты и без VPN." },
    { q: "Почему Stone AI лучше?", a: "65+ нейросетей от всех провайдеров за одну подписку от 590₽/мес. Не нужно платить за каждый сервис отдельно." },
    { q: `${alt.service} работает в России?`, a: `Большинство зарубежных AI-сервисов ограничены в России. Stone AI работает без VPN и принимает оплату в рублях.` },
    { q: "Сколько стоит подписка?", a: "Start — 590₽/мес (20+ моделей), Pro — 1290₽/мес (65+ моделей), Elite — 2990₽/мес (API + приоритет). 10 бесплатных запросов/день." },
    { q: "Можно ли переключаться между моделями?", a: "Да, в Stone AI переключение между 65+ моделями в один клик. Используйте GPT-5 для текстов, Claude для кода, DeepSeek для математики." },
  ];
  const faqItems = faqMap[alt.slug] || defaultFaq;

  const jsonLd = { "@context": "https://schema.org", "@type": "Article", headline: alt.h1, description: alt.description, datePublished: "2026-04-11", dateModified: "2026-04-11", author: { "@type": "Organization", name: "Stone AI", url: SITE_URL }, publisher: { "@type": "Organization", name: "Stone AI", url: SITE_URL } };
  const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };

  return (
    <div className="min-h-screen bg-bg">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ label: "Альтернативы" }, { label: alt.service }]} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-28 pb-20">
        <h1 className="text-3xl md:text-5xl font-extrabold text-text mb-4 leading-tight">{alt.h1}</h1>
        <p className="text-lg text-text/50 mb-12 max-w-2xl">{alt.intro}</p>

        {/* Why */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-5">Почему ищут альтернативы {alt.service}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {alt.reasons.map((r) => (
              <div key={r} className="flex items-start gap-3 bg-accent/5 rounded-xl p-4 border border-accent/10">
                <svg className="w-4 h-4 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                <span className="text-sm text-text/60 font-medium">{r}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Models */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Лучшие альтернативы {alt.service}</h2>
          <div className="space-y-3">
            {models.map((m, i) => (
              <div key={m.id} className="bg-bg rounded-2xl border border-text/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent font-extrabold text-lg shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-text">{m.name}</h3>
                    <span className="text-[10px] text-text/30">{m.company}</span>
                    {m.tier === "free" && <span className="text-[10px] bg-teal/10 text-teal px-1.5 py-0.5 rounded font-bold">Бесплатно</span>}
                  </div>
                  <p className="text-sm text-text/50">{m.description}</p>
                  {m.strengths && <div className="flex flex-wrap gap-1.5 mt-2">{m.strengths.map((s) => <span key={s} className="text-[10px] bg-text/[0.04] text-text/40 px-2 py-0.5 rounded-full font-medium">{s}</span>)}</div>}
                </div>
                <Link href={`/models/${m.id}`} className="text-xs font-bold text-accent hover:underline shrink-0">Подробнее</Link>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="mb-14 bg-gradient-to-r from-accent/5 to-teal/5 rounded-2xl p-8 border border-accent/10">
          <h2 className="text-xl font-extrabold text-text mb-4">Почему Stone AI — лучшая альтернатива</h2>
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            <div className="text-center"><div className="text-3xl font-extrabold text-accent">65+</div><div className="text-xs text-text/40 mt-1">моделей</div></div>
            <div className="text-center"><div className="text-3xl font-extrabold text-accent">590₽</div><div className="text-xs text-text/40 mt-1">от / месяц</div></div>
            <div className="text-center"><div className="text-3xl font-extrabold text-accent">15</div><div className="text-xs text-text/40 mt-1">бесплатных/день</div></div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-6">Частые вопросы</h2>
          <div className="space-y-3">
            {faqItems.map((f) => (
              <details key={f.q} className="bg-bg rounded-xl border border-text/5 group">
                <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-text/80 list-none flex items-center justify-between">{f.q}<svg className="w-4 h-4 text-text/20 group-open:rotate-180 transition-transform shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg></summary>
                <p className="px-5 pb-4 text-sm text-text/50 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Try it */}
        <section className="mb-14">
          <h2 className="text-2xl font-extrabold text-text mb-4">Попробуйте альтернативу прямо здесь</h2>
          <ChatWidget placeholder={`Попробуйте AI вместо ${alt.service}`} />
        </section>

        {/* CTA */}
        <section className="bg-dark text-white rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-xl font-extrabold mb-3">Попробуйте Stone AI бесплатно</h2>
          <p className="text-white/40 text-sm mb-6">65+ нейросетей. Без VPN. На русском. 10 запросов/день бесплатно.</p>
          <Link href="/dashboard/chat" className="inline-flex items-center gap-2 bg-accent text-white font-bold px-8 py-4 rounded-xl hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25">
            Начать бесплатно <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </Link>
        </section>

        {/* Other */}
        <section className="mt-14">
          <h2 className="text-lg font-bold text-text mb-4">Альтернативы другим сервисам</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {ALTERNATIVES.filter((a) => a.slug !== alt.slug).map((a) => (
              <Link key={a.slug} href={`/alternatives/${a.slug}`} className="bg-bg rounded-xl border border-text/5 px-4 py-3 text-sm font-medium text-text/60 hover:border-accent/20 hover:text-accent transition-colors">
                Альтернативы {a.service}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
