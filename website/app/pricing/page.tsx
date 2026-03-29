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

      {/* Payment methods — between cards and comparison */}
      <div className="max-w-4xl mx-auto px-4 mt-12 mb-16">
        <h3 className="font-extrabold text-2xl text-center mb-8">Способы оплаты</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <a href="/webchat" className="group bg-white border border-text/5 rounded-2xl p-5 text-center hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <p className="font-bold text-sm mb-1">Криптовалюта</p>
            <p className="text-xs text-text/40">USDT · BTC · ETH</p>
            <p className="text-[10px] text-accent mt-2 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Оплатить на сайте →</p>
          </a>
          <a href="https://t.me/drifttt55bot" target="_blank" className="group bg-white border border-text/5 rounded-2xl p-5 text-center hover:border-[#2AABEE]/30 hover:shadow-lg hover:shadow-[#2AABEE]/5 transition-all cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2AABEE] to-[#229ED9] rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <p className="font-bold text-sm mb-1">Telegram Stars</p>
            <p className="text-xs text-text/40">Оплата в боте</p>
            <p className="text-[10px] text-[#2AABEE] mt-2 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Открыть бота →</p>
          </a>
          <div className="group bg-white border border-text/5 rounded-2xl p-5 text-center hover:border-blue-400/30 hover:shadow-lg hover:shadow-blue-400/5 transition-all relative">
            <div className="absolute top-2 right-2 bg-text/5 text-text/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md">Скоро</div>
            <div className="w-12 h-12 bg-gradient-to-br from-[#0098EA] to-[#0080C0] rounded-xl flex items-center justify-center mx-auto mb-3 opacity-50">
              <span className="text-white font-extrabold text-lg">T</span>
            </div>
            <p className="font-bold text-sm mb-1 text-text/50">TON Connect</p>
            <p className="text-xs text-text/30">Через Tonkeeper</p>
          </div>
          <div className="group bg-white border border-text/5 rounded-2xl p-5 text-center hover:border-teal/30 hover:shadow-lg hover:shadow-teal/5 transition-all cursor-default">
            <div className="w-12 h-12 bg-gradient-to-br from-teal to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <p className="font-bold text-sm mb-1">Промокод</p>
            <p className="text-xs text-text/40">Бесплатные дни подписки</p>
            <p className="text-[10px] text-teal mt-2 font-semibold">Введите при оплате</p>
          </div>
        </div>
        <p className="text-center text-xs text-text/30 mt-4">Без VPN. Оплата в рублях через конвертацию. Подписка активируется мгновенно.</p>
      </div>

      {/* Features comparison */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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
