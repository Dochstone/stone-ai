"use client";

import { useEffect, useState } from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import ModelComparison from "@/components/ModelComparison";
import ModelsTable from "@/components/ModelsTable";
import Pricing from "@/components/Pricing";
import {
  FREE_CHAT_MODEL_COUNT,
  PLAN_DISPLAY,
  PLAN_LIMIT_LABELS,
  PLAN_SUMMARY,
  PRICING_PLANS,
} from "@/lib/pricing";

const startPlan = PRICING_PLANS.find((plan) => plan.id === "mini")!;
const proPlan = PRICING_PLANS.find((plan) => plan.id === "max")!;
const elitePlan = PRICING_PLANS.find((plan) => plan.id === "max-pro")!;

const comparisonRows = [
  { icon: "🧠", feature: "AI модели", free: PLAN_LIMIT_LABELS.free.models, mini: PLAN_LIMIT_LABELS.mini.models, max: PLAN_LIMIT_LABELS.max.models, maxpro: PLAN_LIMIT_LABELS["max-pro"].models },
  { icon: "💬", feature: "Чат", free: PLAN_LIMIT_LABELS.free.chat, mini: PLAN_LIMIT_LABELS.mini.chat, max: PLAN_LIMIT_LABELS.max.chat, maxpro: PLAN_LIMIT_LABELS["max-pro"].chat },
  { icon: "⭐", feature: "Премиум модели", free: PLAN_LIMIT_LABELS.free.premium, mini: PLAN_LIMIT_LABELS.mini.premium, max: PLAN_LIMIT_LABELS.max.premium, maxpro: PLAN_LIMIT_LABELS["max-pro"].premium },
  { icon: "🧾", feature: "Claude Opus", free: PLAN_LIMIT_LABELS.free.opus, mini: PLAN_LIMIT_LABELS.mini.opus, max: PLAN_LIMIT_LABELS.max.opus, maxpro: PLAN_LIMIT_LABELS["max-pro"].opus },
  { icon: "🎨", feature: "Картинки", free: PLAN_LIMIT_LABELS.free.images, mini: PLAN_LIMIT_LABELS.mini.images, max: PLAN_LIMIT_LABELS.max.images, maxpro: PLAN_LIMIT_LABELS["max-pro"].images },
  { icon: "🎬", feature: "Видео", free: PLAN_LIMIT_LABELS.free.video, mini: PLAN_LIMIT_LABELS.mini.video, max: PLAN_LIMIT_LABELS.max.video, maxpro: PLAN_LIMIT_LABELS["max-pro"].video },
  { icon: "🧊", feature: "3D модели", free: PLAN_LIMIT_LABELS.free.threed, mini: PLAN_LIMIT_LABELS.mini.threed, max: PLAN_LIMIT_LABELS.max.threed, maxpro: PLAN_LIMIT_LABELS["max-pro"].threed },
  { icon: "🎤", feature: "Озвучка (TTS)", free: PLAN_LIMIT_LABELS.free.audio, mini: PLAN_LIMIT_LABELS.mini.audio, max: PLAN_LIMIT_LABELS.max.audio, maxpro: PLAN_LIMIT_LABELS["max-pro"].audio },
  { icon: "🔌", feature: "API доступ", free: PLAN_LIMIT_LABELS.free.api, mini: PLAN_LIMIT_LABELS.mini.api, max: PLAN_LIMIT_LABELS.max.api, maxpro: PLAN_LIMIT_LABELS["max-pro"].api },
  { icon: "⚡", feature: "Приоритетная скорость", free: PLAN_LIMIT_LABELS.free.priority, mini: PLAN_LIMIT_LABELS.mini.priority, max: PLAN_LIMIT_LABELS.max.priority, maxpro: PLAN_LIMIT_LABELS["max-pro"].priority },
  { icon: "🚀", feature: "Ранний доступ", free: PLAN_LIMIT_LABELS.free.early, mini: PLAN_LIMIT_LABELS.mini.early, max: PLAN_LIMIT_LABELS.max.early, maxpro: PLAN_LIMIT_LABELS["max-pro"].early },
];

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Stone AI",
  description: `AI-студия нового поколения. Подписка от ${startPlan.price}.`,
  offers: [
    { "@type": "Offer", name: "Free", price: "0", priceCurrency: "RUB", description: `10 запросов в день, ${FREE_CHAT_MODEL_COUNT} моделей` },
    ...PRICING_PLANS
      .filter((plan) => plan.id !== "free")
      .map((plan) => ({
        "@type": "Offer",
        name: plan.name,
        price: String(plan.priceNum),
        priceCurrency: "RUB",
        description: plan.compactSummary ?? plan.desc,
      })),
  ],
};

const faqItems = [
  {
    q: "Как оплатить подписку?",
    a: "Оплата криптовалютой (USDT, BTC, ETH) через Heleket. Также можно оплатить через Telegram Stars в боте @drifttt55bot или промокодом.",
  },
  {
    q: "Можно ли попробовать бесплатно?",
    a: `Да. Тариф Free даёт 10 запросов в день к ${FREE_CHAT_MODEL_COUNT} моделям. Без оплаты и без регистрации карты.`,
  },
  {
    q: "Чем отличается Start от Pro?",
    a: `${PLAN_DISPLAY.mini.name} (${PLAN_DISPLAY.mini.price}) — ${PLAN_SUMMARY.mini}. ${PLAN_DISPLAY.max.name} (${PLAN_DISPLAY.max.price}) — ${PLAN_SUMMARY.max}.`,
  },
  {
    q: "Что входит в Elite?",
    a: `${PLAN_DISPLAY["max-pro"].name} (${PLAN_DISPLAY["max-pro"].price}) — ${PLAN_SUMMARY["max-pro"]}. ${elitePlan.features[4]}. ${elitePlan.features[5]}. ${elitePlan.features[6]}.`,
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
  const [hasPaidPlan, setHasPaidPlan] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("stone_auth");
      if (!raw) return;
      const auth = JSON.parse(raw);
      if (auth?.plan && auth.plan !== "free") setHasPaidPlan(true);
    } catch {}
  }, []);

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }} />
      <Breadcrumbs items={[{ label: "Тарифы" }]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            4 тарифа
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4">
            Тарифы{" "}
            <span className="bg-gradient-to-r from-accent to-teal bg-clip-text text-transparent">Stone AI</span>
          </h1>
          <p className="text-text/50 max-w-2xl mx-auto text-lg">
            {hasPaidPlan
              ? "Управляйте подпиской и сравнивайте тарифы."
              : "Бесплатный старт — 10 запросов в день. Подписка от 590₽/мес открывает GPT-5, Claude Opus, генерацию картинок и видео."}
          </p>
        </div>
      </div>

      <Pricing />
      <ModelComparison />

      <div className="max-w-4xl mx-auto px-4 mt-12 mb-16">
        <h3 className="font-extrabold text-2xl text-center mb-8">Способы оплаты</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <a href="/topup" className="group bg-bg border border-text/5 rounded-2xl p-5 text-center hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <p className="font-bold text-sm mb-1">Криптовалюта</p>
            <p className="text-xs text-text/40">USDT · BTC · ETH</p>
            <p className="text-[10px] text-accent mt-2 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Пополнить баланс →</p>
          </a>
          <a href="https://t.me/drifttt55bot" target="_blank" className="group bg-bg border border-text/5 rounded-2xl p-5 text-center hover:border-[#2AABEE]/30 hover:shadow-lg hover:shadow-[#2AABEE]/5 transition-all cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-[#2AABEE] to-[#229ED9] rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <p className="font-bold text-sm mb-1">Telegram Stars</p>
            <p className="text-xs text-text/40">Оплата в боте</p>
            <p className="text-[10px] text-[#2AABEE] mt-2 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Открыть бота →</p>
          </a>
          <a href="#pricing" className="group bg-bg border border-text/5 rounded-2xl p-5 text-center hover:border-[#0098EA]/30 hover:shadow-lg hover:shadow-[#0098EA]/5 transition-all cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0098EA] to-[#0080C0] rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <span className="text-white font-extrabold text-lg">T</span>
            </div>
            <p className="font-bold text-sm mb-1">TON Connect</p>
            <p className="text-xs text-text/40">Через Tonkeeper</p>
            <p className="text-[10px] text-[#0098EA] mt-2 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">Выбрать тариф ↑</p>
          </a>
          <div className="group bg-bg border border-text/5 rounded-2xl p-5 text-center hover:border-teal/30 hover:shadow-lg hover:shadow-teal/5 transition-all cursor-default">
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-3">Что входит в каждый тариф</h2>
        <p className="text-text/40 text-sm text-center mb-6">Подробное сравнение всех возможностей</p>

        <div className="bg-accent/[0.03] border border-accent/15 rounded-2xl p-4 sm:p-5 mb-8 max-w-3xl mx-auto">
          <div className="text-[13px] text-text/70 leading-relaxed">
            <span className="font-bold text-accent">Как считается лимит:</span>{" "}
            один запрос к обычной модели = 1 единица. Тяжёлые модели тратят больше:
            <span className="inline-block bg-amber-500/15 text-amber-700 font-semibold px-1.5 py-0.5 rounded text-[11px] mx-1">×2</span>
            Sonnet, GPT-5.1, Mistral Large;
            <span className="inline-block bg-rose-500/15 text-rose-700 font-semibold px-1.5 py-0.5 rounded text-[11px] mx-1">×5</span>
            Claude Opus, Nano Banana Pro.
            <br />
            <span className="font-bold">Видео-поинты</span> отдельный счётчик: дешёвое видео = 1 поинт, премиум 1080P/10 сек = 2-4 поинта.
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-text/[0.06] bg-bg shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-text/[0.02]">
                <th className="text-left py-4 px-5 text-text/50 font-semibold text-xs uppercase tracking-wider">Функция</th>
                <th className="text-center py-4 px-4 min-w-[90px]">
                  <span className="text-xs font-bold text-[#14B8A6]">Pay-per-Use</span>
                  <p className="text-[10px] text-text/30 mt-0.5">от 3₽/запрос</p>
                </th>
                <th className="text-center py-4 px-4 min-w-[90px]">
                  <span className="text-xs font-bold text-[#22D3EE]">{startPlan.name}</span>
                  <p className="text-[10px] text-text/30 mt-0.5">{startPlan.price}</p>
                </th>
                <th className="text-center py-4 px-4 min-w-[90px] bg-[#A855F7]/[0.03]">
                  <span className="inline-block bg-[#A855F7] text-white text-[8px] font-bold px-2.5 py-0.5 rounded-full mb-1.5">{proPlan.badge}</span>
                  <br />
                  <span className="text-xs font-bold text-[#A855F7]">{proPlan.name}</span>
                  <p className="text-[10px] text-text/30 mt-0.5">{proPlan.price}</p>
                </th>
                <th className="text-center py-4 px-4 min-w-[90px]">
                  <span className="text-xs font-bold text-[#F43F5E]">{elitePlan.name}</span>
                  <p className="text-[10px] text-text/30 mt-0.5">{elitePlan.price}</p>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, i) => (
                <tr key={i} className={`border-t border-text/[0.04] ${i % 2 === 0 ? "" : "bg-text/[0.01]"} hover:bg-accent/[0.02] transition-colors`}>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">{row.icon}</span>
                      <span className="text-[13px] font-medium text-text/70">{row.feature}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center text-[13px] text-text/50">{row.free === "—" ? <span className="text-text/15">—</span> : row.free}</td>
                  <td className="py-3.5 px-4 text-center text-[13px] text-text/60">{row.mini === "—" ? <span className="text-text/15">—</span> : row.mini}</td>
                  <td className="py-3.5 px-4 text-center text-[13px] font-semibold text-text/80 bg-[#A855F7]/[0.03]">{row.max === "—" ? <span className="text-text/15">—</span> : row.max}</td>
                  <td className="py-3.5 px-4 text-center text-[13px] font-semibold text-text/80">{row.maxpro === "✓" ? <span className="text-accent text-base">✓</span> : row.maxpro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModelsTable />

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

      {!hasPaidPlan && (
        <div className="max-w-3xl mx-auto px-4 mt-16">
          <div className="bg-gradient-to-br from-accent/5 to-teal/5 border border-accent/10 rounded-2xl p-8 sm:p-10 text-center">
            <h2 className="text-2xl font-extrabold mb-2">Начните прямо сейчас</h2>
            <p className="text-text/50 text-sm mb-6">10 бесплатных запросов каждый день. Без регистрации карты.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/dashboard/chat" className="bg-accent text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-all shadow-md shadow-accent/20">
                Попробовать бесплатно
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
