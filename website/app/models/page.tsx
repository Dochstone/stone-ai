import type { Metadata } from "next";
import ModelCatalog from "@/components/ModelCatalog";

export const metadata: Metadata = {
  title: "Все 50 AI-моделей",
  description:
    "Каталог из 50 AI-моделей: GPT-5, Claude Opus, Gemini Pro, DeepSeek, Flux и другие. Цены от $0.24 за 1M токенов. Без VPN, прямо в Telegram.",
};

import Breadcrumbs from "@/components/Breadcrumbs";

export default function ModelsPage() {
  return (
    <div className="pb-20 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", name: "AI модели Stone AI", description: "Каталог 50+ AI-моделей: чат, картинки, видео, 3D, аудио, поиск", numberOfItems: 57, itemListElement: [{ "@type": "ListItem", position: 1, name: "GPT-5.4", url: "https://website-production-907e.up.railway.app/webchat?model=gpt-5.4" }, { "@type": "ListItem", position: 2, name: "Claude Opus 4", url: "https://website-production-907e.up.railway.app/webchat?model=claude-opus-4" }, { "@type": "ListItem", position: 3, name: "Gemini 2.5 Pro", url: "https://website-production-907e.up.railway.app/webchat?model=gemini-2.5-pro" }] }) }} />
      <Breadcrumbs items={[{ label: "Модели" }]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            50+ моделей
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

        {/* CTA */}
        <div className="mt-16 text-center">
          <a
            href="/webchat"
            className="inline-block bg-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
          >
            Попробовать бесплатно
          </a>
          <p className="mt-3 text-sm text-text/40">15 бесплатных запросов каждый день</p>
        </div>
      </div>
    </div>
  );
}
