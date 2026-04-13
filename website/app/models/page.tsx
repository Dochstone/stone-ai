import type { Metadata } from "next";
import ModelCatalog from "@/components/ModelCatalog";

export const metadata: Metadata = {
  title: "Все 65+ нейросетей",
  description:
    "Каталог из 65+ нейросетей: GPT-5, Claude Opus, Gemini Pro, DeepSeek, Flux и другие. Бесплатный старт. Подписка от 590₽/мес.",
  alternates: { canonical: "/models" },
  openGraph: {
    title: "65+ нейросетей в одном каталоге | Stone AI",
    description:
      "GPT-5, Claude Opus, Gemini Pro, DeepSeek, Flux, Sora и другие. Сравнение моделей, цены, возможности.",
  },
};

import Breadcrumbs from "@/components/Breadcrumbs";
import { CrossLinks } from "@/components/CrossLinks";
import { SITE_URL } from "@/lib/constants";

const faqItems = [
  { q: "Сколько моделей доступно бесплатно?", a: "8 моделей бесплатно: GPT-4o mini, Claude Haiku, Gemini Flash, DeepSeek V3, Llama 4, Mistral Large, Nano Banana и другие. 10 запросов в день." },
  { q: "Чем отличаются тарифы по доступу к моделям?", a: "Free — 8 моделей. Start (590₽/мес) — 20+ моделей. Pro (1290₽/мес) и Elite (2990₽/мес) — все 65+ моделей включая Claude Opus и GPT-5." },
  { q: "Можно ли переключаться между моделями в чате?", a: "Да, переключение между моделями — один клик в нижней панели чата. История сохраняется." },
  { q: "Какие модели лучше для генерации картинок?", a: "Nano Banana Pro — лучшее качество. GPT-5 Image — фотореализм. Flux — скорость. Все доступны в Stone AI." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function ModelsPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", name: "AI модели Stone AI", description: "Каталог 65+ нейросетей: чат, картинки, видео, 3D, аудио, поиск", numberOfItems: 57, itemListElement: [{ "@type": "ListItem", position: 1, name: "GPT-5.4", url: `${SITE_URL}/dashboard/chat?model=gpt-5.4` }, { "@type": "ListItem", position: 2, name: "Claude Opus 4", url: `${SITE_URL}/dashboard/chat?model=claude-opus-4` }, { "@type": "ListItem", position: 3, name: "Gemini 2.5 Pro", url: `${SITE_URL}/dashboard/chat?model=gemini-2.5-pro` }] }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs items={[{ label: "Модели", href: "/models" }]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            65+ нейросетей
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
            Каталог AI-моделей
          </h1>
          <p className="text-text/60 max-w-xl mx-auto">
            От бесплатных до самых мощных. Фильтруйте по провайдеру, категории или тарифу.
            Все модели доступны прямо в Telegram.
          </p>
        </div>
        <ModelCatalog />

        {/* FAQ */}
        <section className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-10">Часто задаваемые вопросы</h2>
          <div className="space-y-4">
            {faqItems.map((f) => (
              <details key={f.q} className="group bg-white rounded-2xl border border-text/5 overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-5 font-semibold text-sm select-none">
                  {f.q}
                  <span className="ml-4 shrink-0 text-text/30 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <div className="px-6 pb-5 text-sm text-text/60 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </section>

        <CrossLinks exclude={["models"]} />

        {/* CTA */}
        <div className="mt-16 text-center">
          <a
            href="/dashboard/chat"
            className="inline-block bg-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
          >
            Попробовать бесплатно
          </a>
          <p className="mt-3 text-sm text-text/40">10 бесплатных запросов каждый день</p>
        </div>
      </div>
    </div>
  );
}
