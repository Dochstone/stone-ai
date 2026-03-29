"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const TonPayButton = dynamic(() => import("./TonPayButton"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

const plans = [
  {
    id: "free", name: "Free", price: "0₽", priceNum: 0, premium: false, period: "", desc: "Для знакомства",
    badge: null, accent: false,
    features: ["7 моделей (GPT-4o mini, Gemini Flash, DeepSeek V3...)", "15 запросов в день", "2 картинки в день", "История чатов"],
    locked: ["Премиум модели", "Видео, аудио, 3D", "Голосовой ассистент"],
    cta: "Начать бесплатно",
  },
  {
    id: "mini", name: "Mini", price: "390₽", priceNum: 390, premium: false, period: "/мес", desc: "20+ моделей",
    badge: null, accent: false,
    features: ["20+ моделей (+ GPT-5.1, Claude Sonnet, DeepSeek R1)", "500 запросов/мес к быстрым", "20 к премиум (до 5 к Claude Opus)", "15 картинок, 3 видео/мес", "История чатов"],
    locked: ["Аудио, 3D"],
    cta: "Выбрать Mini",
  },
  {
    id: "max", name: "Max", price: "890₽", priceNum: 890, premium: false, period: "/мес", desc: "Все 65+ моделей",
    badge: "Популярный", accent: true,
    features: ["Все 65+ моделей", "2 000 запросов/мес к быстрым", "100 к премиум (до 20 к Opus)", "50 картинок, 10 видео/мес", "5 3D, 20 озвучек", "Голосовой ассистент"],
    locked: [],
    cta: "Выбрать Max",
  },
  {
    id: "max-pro", name: "Max Pro", price: "1 990₽", priceNum: 1990, premium: true, period: "/мес", desc: "Максимум возможностей",
    badge: "Легенда", accent: false,
    features: ["Все 65+ моделей + API доступ", "10 000 запросов/мес к быстрым", "500 к премиум (до 80 к Opus)", "300 картинок, 50 видео/мес", "30 3D, 100 озвучек", "Приоритетная скорость", "Ранний доступ к новым моделям"],
    locked: [],
    cta: "Стать Max Pro",
  },
];

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<typeof plans[0] | null>(null);
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
                <div className="mt-1">
                  <span className={`text-2xl font-extrabold ${plan.premium ? "text-amber-400" : ""}`}>{plan.price}</span>
                  {plan.period && <span className={`text-sm ${plan.premium ? "text-white/40" : "text-text/40"}`}>{plan.period}</span>}
                </div>
                <p className={`text-xs mt-1 ${plan.premium ? "text-white/50" : "text-text/50"}`}>{plan.desc}</p>
              </div>

              <ul className="space-y-2 text-sm mb-4 flex-1">
                {plan.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className={`mt-0.5 shrink-0 text-xs ${plan.premium ? "text-amber-400" : plan.accent ? "text-accent" : "text-teal"}`}>&#10003;</span>
                    <span className={`text-xs ${plan.premium ? "text-white/70" : "text-text/70"}`}>{f}</span>
                  </li>
                ))}
                {plan.locked.map((f: string) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-xs text-text/20">&#128274;</span>
                    <span className="text-text/40 text-xs line-through">{f}</span>
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <h3 className="text-xl font-extrabold mb-1">Тариф {modal.name}</h3>
              <p className="text-3xl font-extrabold text-accent">{modal.price}<span className="text-sm text-text/40 font-medium">{modal.period}</span></p>
            </div>

            {/* Promo code */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-text/50 mb-2">Промокод (если есть)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value.toUpperCase())}
                  placeholder="STONE7"
                  className="flex-1 bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
                <button
                  onClick={applyPromo}
                  disabled={!promo.trim()}
                  className="px-4 py-2.5 bg-bg border border-text/10 rounded-xl text-sm font-bold hover:border-accent hover:text-accent transition-colors disabled:opacity-30"
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

            {/* Subscribe button */}
            <button
              onClick={() => pay(modal.id)}
              disabled={loading}
              className="w-full bg-accent text-white py-3.5 min-h-[48px] rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50 mb-3 shadow-md shadow-accent/20"
            >
              {loading ? "Создание счёта..." : `Оплатить ${modal.price}${modal.period}`}
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-text/10" />
              <span className="text-[10px] text-text/30">или</span>
              <div className="flex-1 h-px bg-text/10" />
            </div>

            <TonPayButton
              tier={modal.id}
              onSuccess={() => {
                setModal(null);
                setResult({ ok: true, message: `Тариф ${modal.name} активирован через TON!` });
              }}
            />

            <p className="text-text/30 text-[10px] text-center mt-3 mb-1">Крипто: USDT, BTC, ETH (Heleket) · TON (Tonkeeper)</p>

            {result && (
              <p className={`text-center text-xs font-medium ${result.ok ? "text-teal" : "text-red-500"}`}>
                {result.message}
              </p>
            )}

            <button onClick={() => setModal(null)} className="w-full text-text/40 text-xs hover:text-accent transition-colors py-2 mt-2">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
