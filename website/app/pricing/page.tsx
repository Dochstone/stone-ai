import type { Metadata } from "next";
import PricingCalculator from "@/components/PricingCalculator";
import PricingComparison from "@/components/PricingComparison";
import PricingTable from "@/components/PricingTable";

export const metadata: Metadata = {
  title: "Цены",
  description:
    "Прозрачные цены на 65+ нейросетей. Бесплатный старт — 15 запросов в день. Подписка от 390₽/мес. Free / Mini / Max / Max Pro.",
};

import Breadcrumbs from "@/components/Breadcrumbs";

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Stone AI",
  description: "65+ нейросетей в одном окне. Подписка от 390₽/мес.",
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "RUB", description: "15 запросов в день, 7 моделей" },
    { "@type": "Offer", name: "Mini", price: "390", priceCurrency: "RUB", description: "500 запросов/мес, 20+ моделей" },
    { "@type": "Offer", name: "Max", price: "890", priceCurrency: "RUB", description: "2000 запросов/мес, 65+ моделей" },
    { "@type": "Offer", name: "Max Pro", price: "1990", priceCurrency: "RUB", description: "10000 запросов/мес, 65+ моделей + API" },
  ],
};

export default function PricingPage() {
  return (
    <div className="pb-20 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }} />
      <Breadcrumbs items={[{ label: "Цены" }]} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            Подписка от 390₽/мес
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
            Прозрачные цены
          </h1>
          <p className="text-text/60 max-w-xl mx-auto">
            Бесплатный старт — 15 запросов в день. Выберите тариф под свои задачи:
            Free, Mini, Max или Max Pro.
          </p>
        </div>

        <PricingCalculator />
        <PricingTable />
        <PricingComparison />

        {/* CTA */}
        <section className="mt-16 bg-dark text-white rounded-2xl p-10 md:p-16 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-4">
            Готовы начать?
          </h2>
          <p className="text-white/50 mb-8 max-w-md mx-auto">
            15 бесплатных запросов каждый день. Без регистрации.
          </p>
          <a
            href="/studio"
            className="inline-block bg-accent text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
          >
            Начать бесплатно
          </a>
        </section>
      </div>
    </div>
  );
}
