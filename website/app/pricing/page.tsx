import type { Metadata } from "next";
import PricingCalculator from "@/components/PricingCalculator";
import PricingComparison from "@/components/PricingComparison";
import PricingTable from "@/components/PricingTable";

export const metadata: Metadata = {
  title: "Цены",
  description:
    "Прозрачные цены на 50 AI-моделей. Платите только за использованные токены. От $0.24 за 1M. Калькулятор стоимости.",
};

import Breadcrumbs from "@/components/Breadcrumbs";

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Stone AI",
  description: "50+ AI-моделей. Оплата за токены.",
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD", description: "15 запросов в день, 5 моделей" },
    { "@type": "Offer", name: "Per-token", price: "0.24", priceCurrency: "USD", description: "От $0.24 за 1M токенов, 50+ моделей" },
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
            Без подписок
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
            Прозрачные цены
          </h1>
          <p className="text-text/60 max-w-xl mx-auto">
            Платите только за использованные токены. Пополняйте баланс любым удобным способом —
            Stars, криптовалюта или TON.
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
            href="/webchat"
            className="inline-block bg-accent text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
          >
            Начать бесплатно
          </a>
        </section>
      </div>
    </div>
  );
}
