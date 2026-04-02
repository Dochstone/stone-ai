"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const TonPayButton = dynamic(() => import("./TonPayButton"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

const plans = [
  {
    id: "free", name: "Free", price: "0₽", oldPrice: "", priceNum: 0, premium: false, period: "", desc: "Для знакомства",
    badge: null, accent: false,
    features: ["7 моделей (GPT-4o mini, Gemini Flash, Claude Haiku)", "15 запросов в день", "2 картинки в день", "Сохранение истории чатов"],
    locked: ["Премиум модели (GPT-5, Claude Opus)", "Генерация видео, аудио, 3D", "Голосовой ассистент"],
    cta: "Начать бесплатно",
  },
  {
    id: "mini", name: "Mini", price: "390₽", oldPrice: "590₽", priceNum: 390, premium: false, period: "/мес", desc: "20+ моделей",
    badge: null, accent: false,
    features: ["20+ моделей включая GPT-5.1 и Claude Sonnet", "500 запросов к быстрым моделям", "20 запросов к премиум моделям", "До 5 запросов к Claude Opus", "15 картинок и 3 видео в месяц"],
    locked: ["3D модели и озвучка"],
    cta: "Выбрать Mini",
  },
  {
    id: "max", name: "Max", price: "890₽", oldPrice: "1 490₽", priceNum: 890, premium: false, period: "/мес", desc: "Все 65+ моделей",
    badge: "Популярный", accent: true,
    features: ["Все 65+ моделей без ограничений", "2 000 запросов к быстрым моделям", "100 запросов к премиум (20 к Opus)", "50 картинок и 10 видео в месяц", "5 3D-моделей и 20 озвучек", "Голосовой ассистент"],
    locked: [],
    cta: "Выбрать Max",
  },
  {
    id: "max-pro", name: "Max Pro", price: "1 990₽", oldPrice: "2 990₽", priceNum: 1990, premium: true, period: "/мес", desc: "Максимум возможностей",
    badge: "Легенда", accent: false,
    features: ["Все 65+ моделей + доступ к API", "10 000 запросов к быстрым моделям", "500 запросов к премиум (80 к Opus)", "300 картинок и 50 видео в месяц", "30 3D-моделей и 100 озвучек", "Приоритетная скорость ответов", "Ранний доступ к новым моделям"],
    locked: [],
    cta: "Стать Max Pro",
  },
];

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<typeof plans[0] | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const planId = params.get("plan");
      if (planId) {
        const found = plans.find(p => p.id === planId);
        if (found && found.id !== "free") return found;
      }
    }
    return null;
  });
  const [promo, setPromo] = useState("");
  const [promoResult, setPromoResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const getAuth = () => {
    try { const s = localStorage.getItem("stone_auth"); return s ? JSON.parse(s) : null; } catch { return null; }
  };

  const applyPromo = async () => {
    const auth = getAuth();
    if (!auth || !promo.trim()) return;
    setPromoResult(null);
    try {
      const res = await fetch(`${API_URL}/api/promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ code: promo }),
      });
      const data = await res.json();
      if (res.ok) {
        setPromoResult({ ok: true, message: data.message });
        if (data.tier && data.tier !== "free") {
          // Promo activated a plan — close modal, show success
          setModal(null);
          setResult({ ok: true, message: data.message });
        }
      } else {
        setPromoResult({ ok: false, message: typeof data.detail === "string" ? data.detail : "Ошибка" });
      }
    } catch { setPromoResult({ ok: false, message: "Ошибка сети" }); }
  };

  const pay = async (tier: string) => {
    const auth = getAuth();
    if (!auth) { window.location.href = "/webchat"; return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/payment/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (res.ok && data.payment_url) {
        // Redirect to payment page
        window.location.href = data.payment_url;
      } else {
        const detail = typeof data.detail === "object" ? data.detail : { message: data.detail || "Ошибка" };
        setResult({ ok: false, message: typeof detail === "string" ? detail : detail.message || "Ошибка" });
      }
    } catch { setResult({ ok: false, message: "Ошибка сети" }); }
    setLoading(false);
  };

  const openPlan = (plan: typeof plans[0]) => {
    if (plan.id === "free") { window.location.href = "/webchat"; return; }
    const auth = getAuth();
    if (!auth) { window.location.href = "/webchat"; return; }
    setModal(plan);
    setResult(null);
    setPromoResult(null);
    setPromo("");
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 relative flex flex-col ${
                plan.premium
                  ? "bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] text-white border-2 border-amber-500/30 shadow-xl shadow-amber-500/10"
                  : plan.accent
                  ? "bg-bg border-2 border-accent shadow-lg shadow-accent/5"
                  : "bg-bg border border-text/5"
              }`}
            >
              {plan.badge && (
                <span className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  plan.premium ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" : "bg-accent text-white"
                }`}>
                  {plan.premium ? "⭐ " : ""}{plan.badge}
                </span>
              )}

              <div className="mb-4">
                <h3 className={`text-lg font-extrabold ${plan.premium ? "text-white" : ""}`}>{plan.name}</h3>
                <div className="mt-1 flex items-baseline gap-2">
                  {plan.oldPrice && (
                    <span className={`text-sm line-through ${plan.premium ? "text-white/30" : "text-text/30"}`}>{plan.oldPrice}</span>
                  )}
                  <span className={`text-2xl font-extrabold ${plan.premium ? "text-amber-400" : ""}`}>{plan.price}</span>
                  {plan.period && <span className={`text-sm ${plan.premium ? "text-white/40" : "text-text/40"}`}>{plan.period}</span>}
                  {plan.oldPrice && (
                    <span className="text-[10px] font-bold bg-teal/15 text-teal px-1.5 py-0.5 rounded-full">Скидка</span>
                  )}
                </div>
                <p className={`text-xs mt-1 ${plan.premium ? "text-white/50" : "text-text/50"}`}>{plan.desc}</p>
              </div>

              <ul className="space-y-2.5 text-sm mb-4 flex-1">
                {plan.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg className={`w-4 h-4 mt-0.5 shrink-0 ${plan.premium ? "text-amber-400" : plan.accent ? "text-accent" : "text-teal"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className={`text-[13px] ${plan.premium ? "text-white/70" : "text-text/70"}`}>{f}</span>
                  </li>
                ))}
                {plan.locked.map((f: string) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg className="w-4 h-4 mt-0.5 shrink-0 text-text/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-text/30 text-[13px] line-through">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => openPlan(plan)}
                className={`w-full text-center px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-sm transition-all ${
                  plan.premium
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/20"
                    : plan.accent
                    ? "bg-accent text-white hover:bg-accent/90 shadow-md shadow-accent/20"
                    : "border-2 border-text/15 text-text hover:border-accent hover:text-accent"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Success message */}
        {result && !modal && (
          <div className={`mt-6 max-w-md mx-auto rounded-xl px-5 py-3 text-center text-sm font-medium ${
            result.ok ? "bg-teal/10 text-teal" : "bg-red-50 text-red-600"
          }`}>
            {result.message}
            {result.ok && (
              <a href="/webchat" className="block mt-2 text-accent font-bold hover:underline">
                Открыть чат →
              </a>
            )}
          </div>
        )}

      </div>

      {/* Payment Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center backdrop-blur-sm" onClick={() => setModal(null)}>
          <div className="bg-bg rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className={`px-6 pt-7 pb-5 text-center relative ${
              modal.premium
                ? "bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E]"
                : "bg-gradient-to-br from-accent to-accent/80"
            }`}>
              <button onClick={() => setModal(null)} className="absolute top-3 right-3 w-8 h-8 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              {modal.badge && (
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold mb-3 ${
                  modal.premium ? "bg-amber-500/20 text-amber-400" : "bg-white/20 text-white"
                }`}>
                  {modal.premium ? "⭐ " : ""}{modal.badge}
                </span>
              )}
              <h3 className="text-2xl font-extrabold text-white mb-1">Тариф {modal.name}</h3>
              <div className="flex items-baseline justify-center gap-2">
                {modal.oldPrice && <span className="text-xl line-through text-white/30">{modal.oldPrice}</span>}
                <p className={`text-4xl font-extrabold ${modal.premium ? "text-amber-400" : "text-white"}`}>
                  {modal.price}<span className="text-lg font-bold text-white/40">{modal.period}</span>
                </p>
                {modal.oldPrice && <span className="text-[10px] font-bold bg-teal/20 text-teal px-2 py-0.5 rounded-full">Скидка</span>}
              </div>
            </div>

            {/* Features */}
            <div className="px-6 pt-4 pb-2">
              <div className="grid grid-cols-2 gap-2">
                {modal.features.slice(0, 6).map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 py-1.5">
                    <span className={`text-xs shrink-0 ${modal.premium ? "text-amber-500" : "text-accent"}`}>✓</span>
                    <span className="text-[12px] text-text/60">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="px-6 pb-6 pt-3">
              {/* Promo code */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promo}
                    onChange={(e) => setPromo(e.target.value.toUpperCase())}
                    placeholder="Промокод"
                    className="flex-1 bg-text/[0.04] border border-text/[0.08] rounded-xl px-4 py-2.5 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20 placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
                  />
                  <button
                    onClick={applyPromo}
                    disabled={!promo.trim()}
                    className="px-5 py-2.5 bg-text/[0.04] border border-text/[0.08] rounded-xl text-sm font-bold hover:border-accent hover:text-accent transition-colors disabled:opacity-30"
                  >
                    ОК
                  </button>
                </div>
                {promoResult && (
                  <p className={`mt-2 text-xs font-medium ${promoResult.ok ? "text-teal" : "text-red-500"}`}>
                    {promoResult.message}
                  </p>
                )}
              </div>

              {/* Pay button */}
              <button
                onClick={() => pay(modal.id)}
                disabled={loading}
                className={`w-full py-4 min-h-[52px] rounded-2xl font-bold text-[15px] transition-all disabled:opacity-50 shadow-xl active:scale-[0.98] ${
                  modal.premium
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600"
                    : "bg-accent text-white shadow-accent/25 hover:bg-accent/90"
                }`}
              >
                {loading ? "Создание счёта..." : `Оплатить ${modal.price}${modal.period}`}
              </button>

              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-text/[0.06]" />
                <span className="text-[10px] text-text/25 font-medium">или оплатить криптой</span>
                <div className="flex-1 h-px bg-text/[0.06]" />
              </div>

              <TonPayButton
                tier={modal.id}
                onSuccess={() => {
                  setModal(null);
                  setResult({ ok: true, message: `Тариф ${modal.name} активирован через TON!` });
                }}
              />

              <p className="text-text/20 text-[10px] text-center mt-3">USDT · BTC · ETH · TON</p>

              {result && (
                <p className={`text-center text-xs font-medium mt-2 ${result.ok ? "text-teal" : "text-red-500"}`}>
                  {result.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
