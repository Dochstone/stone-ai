import type { Metadata } from "next";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Тарифы — подписка от 390₽/мес",
  description:
    "4 тарифа Stone AI: Free (0₽), Mini (390₽), Max (890₽), Max Pro (1990₽). 65+ нейросетей, картинки, видео, 3D. Оплата криптовалютой.",
};

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

const faqItems = [
  {
    q: "Как оплатить подписку?",
    a: "Оплата криптовалютой (USDT, BTC, ETH) через Heleket. Также можно оплатить через Telegram Stars в боте @drifttt55bot или промокодом.",
  },
  {
    q: "Можно ли попробовать бесплатно?",
    a: "Да! Тариф Free даёт 15 запросов в день к 7 моделям (GPT-4o mini, Gemini Flash, Claude Haiku и другим). Без оплаты и без регистрации карты.",
  },
  {
    q: "Чем отличается Mini от Max?",
    a: "Mini (390₽) — 20+ моделей и 500 запросов/мес. Max (890₽) — все 65+ моделей, 2000 запросов, видео, 3D, аудио. Для большинства задач хватает Mini.",
  },
  {
    q: "Что входит в Max Pro?",
    a: "10 000 запросов/мес, 500 к премиум моделям, 300 картинок, 50 видео, 30 3D, API доступ, приоритетная скорость и ранний доступ к новым моделям.",
  },
  {
    q: "Подписка автоматически продлевается?",
    a: "Нет. Подписка действует 30 дней с момента оплаты. Для продления нужно оплатить заново. Никаких автосписаний.",
  },
  {
    q: "У меня есть промокод. Где его ввести?",
    a: "Нажмите кнопку тарифа → в модальном окне введите промокод в поле сверху → нажмите ОК. Промокод может дать бесплатные дни подписки.",
  },
];

export default function PricingPage() {
  return (
    <div className="pb-20 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }} />
      <Breadcrumbs items={[{ label: "Тарифы" }]} />

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            4 тарифа
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
            Одна подписка —{" "}
            <span className="bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent">все нейросети</span>
          </h1>
          <p className="text-text/50 max-w-2xl mx-auto text-lg">
            Бесплатный старт — 15 запросов в день. Подписка от 390₽/мес открывает GPT-5.4, Claude Opus, генерацию картинок и видео.
          </p>
        </div>
      </div>

      {/* Pricing cards */}
      <Pricing />

      {/* Features comparison */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <h2 className="text-2xl font-extrabold text-center mb-8">Что входит в каждый тариф</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-text/10">
                <th className="text-left py-3 px-4 text-text/40 font-medium">Функция</th>
                <th className="text-center py-3 px-3 font-bold">Free</th>
                <th className="text-center py-3 px-3 font-bold text-blue-600">Mini</th>
                <th className="text-center py-3 px-3 font-bold text-accent">Max</th>
                <th className="text-center py-3 px-3 font-bold text-amber-600">Max Pro</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {[
                ["Цена", "0₽", "390₽/мес", "890₽/мес", "1 990₽/мес"],
                ["Моделей", "7", "20+", "65+", "65+"],
                ["Текст запросов", "15/день", "500/мес", "2 000/мес", "10 000/мес"],
                ["Премиум модели", "—", "20/мес", "100/мес", "500/мес"],
                ["Claude Opus", "—", "5/мес", "20/мес", "80/мес"],
                ["Картинки", "2/день", "15/мес", "50/мес", "300/мес"],
                ["Видео", "—", "3/мес", "10/мес", "50/мес"],
                ["3D модели", "—", "—", "5/мес", "30/мес"],
                ["Аудио", "—", "—", "20/мес", "100/мес"],
                ["API доступ", "—", "—", "—", "✓"],
                ["Приоритет", "—", "—", "—", "✓"],
              ].map(([feature, free, mini, max, maxpro], i) => (
                <tr key={i} className="border-b border-text/5 hover:bg-text/[0.02]">
                  <td className="py-2.5 px-4 text-text/60">{feature}</td>
                  <td className="py-2.5 px-3 text-center">{free}</td>
                  <td className="py-2.5 px-3 text-center">{mini}</td>
                  <td className="py-2.5 px-3 text-center font-medium">{max}</td>
                  <td className="py-2.5 px-3 text-center font-medium">{maxpro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment methods */}
      <div className="max-w-3xl mx-auto px-4 mt-12 text-center">
        <h3 className="font-bold text-lg mb-4">Способы оплаты</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { icon: "💎", name: "Криптовалюта", desc: "USDT, BTC, ETH" },
            { icon: "⭐", name: "Telegram Stars", desc: "В боте @drifttt55bot" },
            { icon: "💰", name: "TON Connect", desc: "Через Tonkeeper" },
            { icon: "🎁", name: "Промокод", desc: "Бесплатные дни" },
          ].map((m, i) => (
            <div key={i} className="bg-bg border border-text/5 rounded-xl px-5 py-3 text-center min-w-[140px]">
              <span className="text-2xl block mb-1">{m.icon}</span>
              <p className="text-xs font-bold">{m.name}</p>
              <p className="text-[10px] text-text/40">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <h2 className="text-2xl font-extrabold text-center mb-8">Частые вопросы</h2>
        <div className="space-y-3">
          {faqItems.map((f, i) => (
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

      {/* Bottom CTA */}
      <div className="max-w-3xl mx-auto px-4 mt-16">
        <div className="bg-gradient-to-br from-accent/5 to-teal/5 border border-accent/10 rounded-2xl p-8 sm:p-10 text-center">
          <h2 className="text-2xl font-extrabold mb-2">Начните прямо сейчас</h2>
          <p className="text-text/50 text-sm mb-6">15 бесплатных запросов каждый день. Без регистрации карты.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/webchat" className="bg-accent text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-all shadow-md shadow-accent/20">
              Попробовать бесплатно
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
