import type { Metadata } from "next";
import ModelCatalog from "@/components/ModelCatalog";
import { TELEGRAM_BOT_URL } from "@/lib/models";

export const metadata: Metadata = {
  title: "Все 50 AI-моделей — Stone AI",
  description:
    "Каталог из 50 AI-моделей: GPT-5, Claude Opus, Gemini Pro, DeepSeek, Flux и другие. Цены от $0.24 за 1M токенов. Без VPN, прямо в Telegram.",
};

export default function ModelsPage() {
  return (
    <div className="pt-28 pb-20 min-h-screen">
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
            href={TELEGRAM_BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-accent text-white px-8 py-4 rounded-xl font-bold hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
          >
            Попробовать в Telegram
          </a>
          <p className="mt-3 text-sm text-text/40">10 бесплатных запросов каждый день</p>
        </div>
      </div>
    </div>
  );
}
