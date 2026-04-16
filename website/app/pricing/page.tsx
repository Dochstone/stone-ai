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
  planPrice,
  planPriceFull,
} from "@/lib/pricing";
import {
  Sparkles,
  BotMessageSquare,
  Star,
  FileText,
  Palette,
  Film,
  Box,
  Mic,
  Plug,
  Zap,
  Rocket,
  type LucideIcon,
} from "lucide-react";

const startPlan = PRICING_PLANS.find((plan) => plan.id === "mini")!;
const proPlan = PRICING_PLANS.find((plan) => plan.id === "max")!;
const elitePlan = PRICING_PLANS.find((plan) => plan.id === "max-pro")!;

type ComparisonRow = {
  Icon: LucideIcon;
  color: string;
  feature: string;
  free: string;
  mini: string;
  max: string;
  maxpro: string;
};

const comparisonRows: ComparisonRow[] = [
  { Icon: Sparkles,         color: "#C4623D", feature: "AI модели",             free: PLAN_LIMIT_LABELS.free.models,   mini: PLAN_LIMIT_LABELS.mini.models,   max: PLAN_LIMIT_LABELS.max.models,   maxpro: PLAN_LIMIT_LABELS["max-pro"].models },
  { Icon: BotMessageSquare, color: "#22D3EE", feature: "Чат",                   free: PLAN_LIMIT_LABELS.free.chat,     mini: PLAN_LIMIT_LABELS.mini.chat,     max: PLAN_LIMIT_LABELS.max.chat,     maxpro: PLAN_LIMIT_LABELS["max-pro"].chat },
  { Icon: Star,             color: "#EAB308", feature: "Премиум модели",        free: PLAN_LIMIT_LABELS.free.premium,  mini: PLAN_LIMIT_LABELS.mini.premium,  max: PLAN_LIMIT_LABELS.max.premium,  maxpro: PLAN_LIMIT_LABELS["max-pro"].premium },
  { Icon: FileText,         color: "#14B8A6", feature: "Claude Opus",           free: PLAN_LIMIT_LABELS.free.opus,     mini: PLAN_LIMIT_LABELS.mini.opus,     max: PLAN_LIMIT_LABELS.max.opus,     maxpro: PLAN_LIMIT_LABELS["max-pro"].opus },
  { Icon: Palette,          color: "#EC4899", feature: "Картинки",              free: PLAN_LIMIT_LABELS.free.images,   mini: PLAN_LIMIT_LABELS.mini.images,   max: PLAN_LIMIT_LABELS.max.images,   maxpro: PLAN_LIMIT_LABELS["max-pro"].images },
  { Icon: Film,             color: "#3B82F6", feature: "Видео",                 free: PLAN_LIMIT_LABELS.free.video,    mini: PLAN_LIMIT_LABELS.mini.video,    max: PLAN_LIMIT_LABELS.max.video,    maxpro: PLAN_LIMIT_LABELS["max-pro"].video },
  { Icon: Box,              color: "#06B6D4", feature: "3D модели",             free: PLAN_LIMIT_LABELS.free.threed,   mini: PLAN_LIMIT_LABELS.mini.threed,   max: PLAN_LIMIT_LABELS.max.threed,   maxpro: PLAN_LIMIT_LABELS["max-pro"].threed },
  { Icon: Mic,              color: "#8B5CF6", feature: "Озвучка (TTS)",         free: PLAN_LIMIT_LABELS.free.audio,    mini: PLAN_LIMIT_LABELS.mini.audio,    max: PLAN_LIMIT_LABELS.max.audio,    maxpro: PLAN_LIMIT_LABELS["max-pro"].audio },
  { Icon: Plug,             color: "#10B981", feature: "API доступ",            free: PLAN_LIMIT_LABELS.free.api,      mini: PLAN_LIMIT_LABELS.mini.api,      max: PLAN_LIMIT_LABELS.max.api,      maxpro: PLAN_LIMIT_LABELS["max-pro"].api },
  { Icon: Zap,              color: "#F59E0B", feature: "Приоритетная скорость", free: PLAN_LIMIT_LABELS.free.priority, mini: PLAN_LIMIT_LABELS.mini.priority, max: PLAN_LIMIT_LABELS.max.priority, maxpro: PLAN_LIMIT_LABELS["max-pro"].priority },
  { Icon: Rocket,           color: "#F43F5E", feature: "Ранний доступ",         free: PLAN_LIMIT_LABELS.free.early,    mini: PLAN_LIMIT_LABELS.mini.early,    max: PLAN_LIMIT_LABELS.max.early,    maxpro: PLAN_LIMIT_LABELS["max-pro"].early },
];

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Stone AI",
  description: `AI-студия нового поколения. 65+ нейросетей в одной подписке. Тарифы от 0 до ${planPrice("max-pro")} в месяц.`,
  image: ["https://stoneai.ru/pricing/opengraph-image"],
  url: "https://stoneai.ru/pricing",
  brand: { "@type": "Brand", name: "Stone AI" },
  category: "AI Software Subscription",
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "RUB",
      availability: "https://schema.org/InStock",
      url: "https://stoneai.ru/pricing",
      description: `10 запросов в день, ${FREE_CHAT_MODEL_COUNT} моделей`,
    },
    ...PRICING_PLANS
      .filter((plan) => plan.id !== "free")
      .map((plan) => ({
        "@type": "Offer",
        name: plan.name,
        price: String(plan.priceNum),
        priceCurrency: "RUB",
        availability: "https://schema.org/InStock",
        url: "https://stoneai.ru/pricing",
        description: plan.compactSummary ?? plan.desc,
      })),
  ],
};


const faqItems = [
  {
    q: "Как оплатить подписку из России?",
    a: "Три способа: российская карта через СБП (Platega — Visa/Mastercard российских банков или быстрый перевод), Telegram Stars в боте @stonetgbot (можно купить через App Store/Google Play), криптовалюта (USDT, BTC, ETH) через Heleket. Иностранная карта не требуется.",
  },
  {
    q: "Нужен ли VPN?",
    a: "Нет. Stone AI работает с российского IP-адреса без VPN. Мы выступаем как прокси-сервис, который держит API-ключи западных провайдеров (OpenAI, Anthropic, Google, Midjourney и др.) и перепродаёт доступ через российское юрлицо с оплатой рублями.",
  },
  {
    q: "Можно ли попробовать бесплатно?",
    a: `Да. Тариф Free даёт 10 запросов в день к ${FREE_CHAT_MODEL_COUNT} базовым моделям (GPT-4o mini, Claude Haiku 4.5, Gemini Flash, DeepSeek V3, Llama 4, Mistral, Nano Banana). Плюс 100₽ приветственный бонус за регистрацию и 2 картинки + 1 видео-поинт навсегда как пробный период.`,
  },
  {
    q: "Чем отличается Start от Pro?",
    a: `${PLAN_DISPLAY.mini.name} (${PLAN_DISPLAY.mini.price}) — ${PLAN_SUMMARY.mini}. ${PLAN_DISPLAY.max.name} (${PLAN_DISPLAY.max.price}) — ${PLAN_SUMMARY.max}. Главное отличие — Pro открывает все 65+ моделей включая Claude Opus 4.5, GPT-5.4 и Gemini 3 Pro, плюс 3D-генерацию и Suno.`,
  },
  {
    q: "Что входит в Elite?",
    a: `${PLAN_DISPLAY["max-pro"].name} (${PLAN_DISPLAY["max-pro"].price}) — ${PLAN_SUMMARY["max-pro"]}. Увеличенные квоты запросов (в 3× больше чем Pro), приоритет в очереди, ранний доступ к новым моделям до общего релиза и API-доступ для разработчиков.`,
  },
  {
    q: "Подписка автоматически продлевается?",
    a: "Нет. Подписка действует 30 дней с момента оплаты. Для продления нужно оплатить заново через тот же способ. Автосписаний и скрытых платежей нет.",
  },
  {
    q: "Можно ли вернуть деньги за подписку?",
    a: "Да, в течение 14 дней с момента оплаты возвращаем пропорциональную стоимость неиспользованных дней. Пишите в поддержку @StoneAIsupport — возврат в течение 3 рабочих дней тем же способом, что был оплачен.",
  },
  {
    q: "Что если лимит запросов закончится раньше месяца?",
    a: "Можно докупить запросы по-факту (pay-per-use) или перейти на следующий тариф с пересчётом пропорционально оставшимся дням. В Pro хватает 1 500 быстрых + 112 премиум запросов для типичного контент-маркетолога — это 50+ запросов в день с запасом.",
  },
  {
    q: "У меня есть промокод. Где его ввести?",
    a: "Нажмите кнопку тарифа → в модальном окне введите промокод в поле сверху → нажмите ОК. Промокод может дать бесплатные дни подписки, скидку или бонусный баланс.",
  },
  {
    q: "Сохраняются ли баланс и подписка между веб и Telegram-ботом?",
    a: "Да. Аккаунт привязан к единому ID — войдёте ли вы через email на stoneai.ru или через Telegram-бот, это одна учётная запись. Баланс, активная подписка, история покупок и галерея генераций — общие.",
  },
  {
    q: "Какие модели доступны на каждом тарифе?",
    a: "Free — 8 базовых моделей для чата и картинок. Start — 20+ моделей включая GPT-5.1, Claude Sonnet 4, DeepSeek R1. Pro — все 65+ моделей включая Opus, GPT-5.4, Nano Banana Pro, Kling v2, Pika 2, Suno, Tripo 3D. Elite — все модели с увеличенными квотами и приоритетом.",
  },
  {
    q: "Можно ли оплатить на несколько месяцев вперёд?",
    a: "Да. При оплате на 3 месяца — скидка 10%, на 6 месяцев — 15%, на 12 месяцев — 20%. Пишите в поддержку @StoneAIsupport для индивидуального счёта.",
  },
  {
    q: "Корпоративная подписка для команды — есть?",
    a: "Да. Для команд от 3 человек есть командный тариф с общим биллингом, ролевым доступом и расширенной отчётностью по расходам. Минимум 3 места, цена от 2 490₽/место при оплате на 6+ месяцев. Запросы — на @StoneAIsupport.",
  },
  {
    q: "Что будет с моими данными? Stone AI использует их для обучения?",
    a: "Нет. Все запросы идут через API провайдеров с явным opt-out из training. Stone AI не собирает данные для собственного обучения. История чатов хранится на серверах в России, доступна только вам. Удалить историю можно в профиле.",
  },
];

const pricingFaqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqJsonLd) }} />
      <Breadcrumbs items={[{ label: "Тарифы", href: "/pricing" }]} />

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
              : `Бесплатный старт — 10 запросов в день. Подписка от ${planPriceFull("mini")} открывает GPT-5, Claude Opus, генерацию картинок и видео.`}
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
          <a href="https://t.me/stonetgbot" target="_blank" className="group bg-bg border border-text/5 rounded-2xl p-5 text-center hover:border-[#2AABEE]/30 hover:shadow-lg hover:shadow-[#2AABEE]/5 transition-all cursor-pointer">
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
              {comparisonRows.map((row, i) => {
                const { Icon } = row;
                return (
                <tr key={row.feature} className={`border-t border-text/[0.04] ${i % 2 === 0 ? "" : "bg-text/[0.01]"} hover:bg-accent/[0.02] transition-colors`}>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2.5" style={{ ["--pad-c" as string]: row.color }}>
                      <span className="glass-pad flex items-center justify-center w-6 h-6 rounded-lg shrink-0">
                        <Icon className="block" size={13} strokeWidth={2.4} />
                      </span>
                      <span className="text-[13px] font-medium text-text/70">{row.feature}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center text-[13px] text-text/50">{row.free === "—" ? <span className="text-text/15">—</span> : row.free}</td>
                  <td className="py-3.5 px-4 text-center text-[13px] text-text/60">{row.mini === "—" ? <span className="text-text/15">—</span> : row.mini}</td>
                  <td className="py-3.5 px-4 text-center text-[13px] font-semibold text-text/80 bg-[#A855F7]/[0.03]">{row.max === "—" ? <span className="text-text/15">—</span> : row.max}</td>
                  <td className="py-3.5 px-4 text-center text-[13px] font-semibold text-text/80">{row.maxpro === "✓" ? <span className="text-accent text-base">✓</span> : row.maxpro}</td>
                </tr>
                );
              })}
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
