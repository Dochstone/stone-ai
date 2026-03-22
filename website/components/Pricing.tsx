"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "0₽",
    period: "",
    desc: "Для знакомства",
    badge: null,
    accent: false,
    features: [
      "7 моделей (GPT-4o mini, Gemini Flash, DeepSeek V3...)",
      "15 запросов в день",
      "2 картинки в день",
      "Регистрация за 10 секунд",
    ],
    locked: ["Премиум модели", "Видео, аудио, 3D", "Голосовой ассистент"],
    cta: "Начать бесплатно",
    href: "/webchat",
  },
  {
    id: "mini",
    name: "Mini",
    price: "390₽",
    period: "/мес",
    desc: "20+ моделей",
    badge: null,
    accent: false,
    features: [
      "20+ моделей (+ GPT-5.1, Claude Sonnet, DeepSeek R1)",
      "500 запросов/мес к быстрым моделям",
      "20 к премиум (до 5 к Claude Opus)",
      "15 картинок, 3 видео/мес",
      "История чатов",
    ],
    locked: ["Аудио, 3D"],
    cta: "Выбрать Mini",
    href: "/topup",
  },
  {
    id: "max",
    name: "Max",
    price: "890₽",
    period: "/мес",
    desc: "Все 65+ моделей",
    badge: "Популярный",
    accent: true,
    features: [
      "Все 65+ моделей",
      "2 000 запросов/мес к быстрым",
      "100 к премиум (до 20 к Opus)",
      "50 картинок, 10 видео/мес",
      "5 3D, 20 озвучек",
      "Голосовой ассистент",
    ],
    locked: [],
    cta: "Выбрать Max",
    href: "/topup",
  },
  {
    id: "max-pro",
    name: "Max Pro",
    price: "1 990₽",
    period: "/мес",
    desc: "Для профессионалов",
    badge: null,
    accent: false,
    features: [
      "Все 65+ моделей + API доступ",
      "10 000 запросов/мес к быстрым",
      "500 к премиум (до 80 к Opus)",
      "300 картинок, 50 видео/мес",
      "30 3D, 100 озвучек",
      "Приоритетная скорость",
    ],
    locked: [],
    cta: "Выбрать Max Pro",
    href: "/topup",
  },
];

export default function Pricing() {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const subscribe = async (tier: string) => {
    const saved = localStorage.getItem("stone_auth");
    if (!saved) { window.location.href = "/webchat"; return; }
    const auth = JSON.parse(saved);
    setLoading(tier);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, message: `Тариф ${data.plan_name} активирован! Действует 30 дней.` });
      } else {
        const detail = typeof data.detail === "object" ? data.detail : { message: data.detail };
        setResult({ ok: false, message: detail.message || "Ошибка" });
      }
    } catch { setResult({ ok: false, message: "Ошибка сети" }); }
    setLoading(null);
  };

  return (
    <section id="pricing" className="py-20 md:py-28 bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4">
          Выберите тариф под свои задачи
        </h2>
        <p className="text-text/60 text-center mb-12 max-w-xl mx-auto">
          Бесплатный старт. Апгрейд когда нужно больше.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 relative flex flex-col ${
                plan.accent
                  ? "bg-bg border-2 border-accent shadow-lg shadow-accent/5"
                  : "bg-bg border border-text/5"
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                  {plan.badge}
                </span>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-extrabold">{plan.name}</h3>
                <div className="mt-1">
                  <span className="text-2xl font-extrabold">{plan.price}</span>
                  {plan.period && <span className="text-text/40 text-sm">{plan.period}</span>}
                </div>
                <p className="text-text/50 text-xs mt-1">{plan.desc}</p>
              </div>

              <ul className="space-y-2 text-sm mb-4 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className={`mt-0.5 shrink-0 text-xs ${plan.accent ? "text-accent" : "text-teal"}`}>&#10003;</span>
                    <span className="text-text/70 text-xs">{f}</span>
                  </li>
                ))}
                {plan.locked.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-xs text-text/20">&#128274;</span>
                    <span className="text-text/30 text-xs line-through">{f}</span>
                  </li>
                ))}
              </ul>

              {plan.id === "free" ? (
                <a
                  href="/webchat"
                  className="block text-center px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-sm border-2 border-text/15 text-text hover:border-accent hover:text-accent transition-all"
                >
                  Начать бесплатно
                </a>
              ) : (
                <button
                  onClick={() => subscribe(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full text-center px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
                    plan.accent
                      ? "bg-accent text-white hover:bg-accent/90 shadow-md shadow-accent/20"
                      : "border-2 border-text/15 text-text hover:border-accent hover:text-accent"
                  }`}
                >
                  {loading === plan.id ? "Активация..." : plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Result message */}
        {result && (
          <div className={`mt-6 max-w-md mx-auto rounded-xl px-5 py-3 text-center text-sm font-medium ${
            result.ok ? "bg-teal/10 text-teal" : "bg-red-50 text-red-600"
          }`}>
            {result.message}
            {!result.ok && (
              <a href="/topup" className="block mt-2 text-accent font-bold hover:underline">
                Пополнить баланс →
              </a>
            )}
          </div>
        )}

        {/* Payment methods */}
        <div className="mt-12 text-center">
          <p className="text-xs text-text/40 font-medium uppercase tracking-wide mb-3">
            Способы оплаты
          </p>
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-xs sm:text-sm text-text/50">
            <span>Telegram Stars</span>
            <span className="w-1 h-1 bg-text/20 rounded-full hidden sm:block" />
            <span>Криптовалюта (USDT, BTC, ETH)</span>
            <span className="w-1 h-1 bg-text/20 rounded-full hidden sm:block" />
            <span>TON Connect</span>
          </div>
        </div>
      </div>
    </section>
  );
}
