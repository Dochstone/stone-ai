"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const TonPayButton = dynamic(() => import("./TonPayButton"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

const plans = [
  {
    id: "free", name: "Free", price: "0₽", oldPrice: "", priceNum: 0, premium: false, period: "", desc: "Для знакомства",
    badge: null, accent: false,
    features: ["7 моделей (GPT-4o mini, Gemini Flash, Claude Haiku)", "15 запросов в день", "2 картинки в день", "Сохранение истории чатов"],
    locked: ["Премиум модели (GPT-5, Claude Opus)", "Генерация видео, аудио, 3D", "Голосовой ассистент"],
    cta: "Начать бесплатно", icon: "🆓", color: "#14B8A6", img: "/plan-free.jpg?v=2",
  },
  {
    id: "mini", name: "Start", price: "390₽", oldPrice: "590₽", priceNum: 390, premium: false, period: "/мес", desc: "20+ моделей",
    badge: null, accent: false,
    features: ["20+ моделей включая GPT-5.1 и Claude Sonnet", "500 запросов к быстрым моделям", "20 запросов к премиум моделям", "До 5 запросов к Claude Opus", "15 картинок и 3 видео в месяц"],
    locked: ["3D модели и озвучка"],
    cta: "Выбрать Start", icon: "⚡", color: "#22D3EE", img: "/plan-mini.jpg?v=2",
  },
  {
    id: "max", name: "Pro", price: "890₽", oldPrice: "1 490₽", priceNum: 890, premium: false, period: "/мес", desc: "Все 65+ моделей",
    badge: "Популярный", accent: true,
    features: ["Все 65+ моделей без ограничений", "2 000 запросов к быстрым моделям", "100 запросов к премиум (20 к Opus)", "50 картинок и 10 видео в месяц", "5 3D-моделей и 20 озвучек", "Голосовой ассистент"],
    locked: [],
    cta: "Выбрать Pro", icon: "🔥", color: "#A855F7", img: "/plan-max.jpg?v=2",
  },
  {
    id: "max-pro", name: "Elite", price: "1 990₽", oldPrice: "2 990₽", priceNum: 1990, premium: true, period: "/мес", desc: "Максимум возможностей",
    badge: "Легенда", accent: false,
    features: ["Все 65+ моделей + доступ к API", "10 000 запросов к быстрым моделям", "500 запросов к премиум (80 к Opus)", "300 картинок и 50 видео в месяц", "30 3D-моделей и 100 озвучек", "Приоритетная скорость ответов", "Ранний доступ к новым моделям"],
    locked: [],
    cta: "Стать Elite", icon: "💎", color: "#F43F5E", img: "/plan-maxpro.jpg?v=3",
  },
];

/* ═══ Keyframes ═══ */
const KEYFRAMES = `
@keyframes pricingModalIn {
  0% { transform: translateY(100%) scale(0.95); opacity: 0; }
  50% { transform: translateY(-2%) scale(1.01); opacity: 1; }
  70% { transform: translateY(0.5%); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes pricingModalOut {
  0% { transform: translateY(0) scale(1); opacity: 1; }
  100% { transform: translateY(100%) scale(0.95); opacity: 0; }
}
@keyframes pricingBackdropIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes pricingBackdropOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
@keyframes pricingStagger {
  from { opacity: 0; transform: translateY(14px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes pricingShimmer {
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
}
@keyframes pricingFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}
@keyframes pricingPulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--pulse-color, rgba(217,119,87,0.5)); }
  50% { box-shadow: 0 0 0 8px var(--pulse-color, rgba(217,119,87,0)); }
}
@keyframes pricingGlow {
  0%, 100% { box-shadow: 0 0 20px var(--glow-color, rgba(217,119,87,0.1)), 0 0 40px var(--glow-color, rgba(217,119,87,0.05)); }
  50% { box-shadow: 0 0 30px var(--glow-color, rgba(217,119,87,0.2)), 0 0 60px var(--glow-color, rgba(217,119,87,0.08)); }
}
@keyframes pricingBreathe {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}
@keyframes pricingGradientBorder {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes pricingTagSlide {
  from { opacity: 0; transform: translateX(8px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes pricingCheckDraw {
  to { stroke-dashoffset: 0; }
}
@keyframes pricingSuccessRing {
  from { stroke-dashoffset: 283; opacity: 0; }
  to { stroke-dashoffset: 0; opacity: 1; }
}
@keyframes pricingSuccessFade {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes pricingCardHover {
  from { transform: translateY(0); }
  to { transform: translateY(-4px); }
}
@keyframes pricingDesktopModalIn {
  0% { opacity: 0; transform: scale(0.92) translateY(10px); }
  60% { transform: scale(1.01) translateY(-2px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes pricingDesktopModalOut {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(0.92) translateY(10px); }
}
@keyframes pricingBorderSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

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
  const [closing, setClosing] = useState(false);
  const [promo, setPromo] = useState("");
  const [promoResult, setPromoResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [successAnim, setSuccessAnim] = useState(false);
  const stylesRef = useRef(false);

  // Inject keyframes
  useEffect(() => {
    if (stylesRef.current) return;
    stylesRef.current = true;
    const s = document.createElement("style");
    s.textContent = KEYFRAMES;
    document.head.appendChild(s);
  }, []);

  const getAuth = () => {
    try { const s = localStorage.getItem("stone_auth"); return s ? JSON.parse(s) : null; } catch { return null; }
  };

  const closeModal = () => {
    setClosing(true);
    setTimeout(() => { setModal(null); setClosing(false); }, 300);
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
          closeModal();
          setResult({ ok: true, message: data.message });
        }
      } else {
        setPromoResult({ ok: false, message: typeof data.detail === "string" ? data.detail : "Ошибка" });
      }
    } catch { setPromoResult({ ok: false, message: "Ошибка сети" }); }
  };

  const pay = async (tier: string, method: "platega" | "crypto" = "platega") => {
    const auth = getAuth();
    if (!auth) { window.location.href = "/webchat"; return; }
    setLoading(true);
    setResult(null);
    try {
      const prices: Record<string, number> = { mini: 4.1, max: 9.4, "max-pro": 21 };
      const usdAmount = prices[tier] || 10;

      if (method === "platega") {
        const res = await fetch(`${API_URL}/api/payment/platega/create-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
          body: JSON.stringify({ usd_amount: usdAmount }),
        });
        const data = await res.json();
        if (res.ok && data.payment_url) {
          window.location.href = data.payment_url;
        } else {
          setResult({ ok: false, message: data.detail || "Ошибка создания платежа" });
        }
      } else {
        const res = await fetch(`${API_URL}/api/payment/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
          body: JSON.stringify({ tier }),
        });
        const data = await res.json();
        if (res.ok && data.payment_url) {
          window.location.href = data.payment_url;
        } else {
          const detail = typeof data.detail === "object" ? data.detail : { message: data.detail || "Ошибка" };
          setResult({ ok: false, message: typeof detail === "string" ? detail : detail.message || "Ошибка" });
        }
      }
    } catch { setResult({ ok: false, message: "Ошибка сети" }); }
    setLoading(false);
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
              onClick={() => openPlan(plan)}
              className={`rounded-2xl p-6 relative flex flex-col cursor-pointer group transition-all duration-300 hover:-translate-y-1 ${
                plan.premium
                  ? "bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] text-white border-2 border-[#F43F5E]/30 shadow-xl shadow-[#F43F5E]/10 hover:shadow-2xl hover:shadow-[#F43F5E]/20 hover:border-[#F43F5E]/50"
                  : plan.accent
                  ? "bg-bg border-2 border-[#A855F7] shadow-lg shadow-[#A855F7]/5 hover:shadow-2xl hover:shadow-[#A855F7]/15 hover:border-[#A855F7]/80"
                  : "bg-bg border border-text/5 hover:border-text/15 hover:shadow-lg"
              }`}
              style={plan.accent ? {
                animation: "pricingGlow 3s ease-in-out infinite",
                ["--glow-color" as any]: "rgba(168,85,247,0.12)",
              } : undefined}
            >
              {plan.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                    plan.premium ? "bg-gradient-to-r from-[#F43F5E] to-[#E11D48] text-white" : "bg-[#A855F7] text-white"
                  }`}
                  style={{
                    animation: "pricingPulse 2.5s ease-in-out infinite",
                    ["--pulse-color" as any]: plan.premium ? "rgba(244,63,94,0.4)" : "rgba(168,85,247,0.4)",
                  }}
                >
                  {plan.premium ? "⭐ " : ""}{plan.badge}
                </span>
              )}

              <div className="mb-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <span
                    className="text-2xl"
                    style={{ animation: "pricingFloat 3s ease-in-out infinite", display: "inline-block" }}
                  >
                    {plan.icon}
                  </span>
                  <h3 className={`text-lg font-extrabold ${plan.premium ? "text-white" : ""}`}>{plan.name}</h3>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  {plan.oldPrice && (
                    <span className={`text-sm line-through ${plan.premium ? "text-white/30" : "text-text/30"}`}>{plan.oldPrice}</span>
                  )}
                  <span className={`text-2xl font-extrabold ${plan.premium ? "text-amber-400" : ""}`}>{plan.price}</span>
                  {plan.period && <span className={`text-sm ${plan.premium ? "text-white/40" : "text-text/40"}`}>{plan.period}</span>}
                  {plan.oldPrice && (
                    <span className="text-[10px] font-bold bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full">-{Math.round((1 - plan.priceNum / parseInt(plan.oldPrice.replace(/\s/g, ""))) * 100)}%</span>
                  )}
                </div>
                <p className={`text-xs mt-1 ${plan.premium ? "text-white/50" : "text-text/50"}`}>{plan.desc}</p>
              </div>

              <ul className="space-y-2.5 text-sm mb-4 flex-1">
                {plan.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <svg className={`w-4 h-4 mt-0.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${plan.premium ? "text-[#F43F5E]" : plan.accent ? "text-[#A855F7]" : "text-teal"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                className={`w-full text-center px-4 py-2.5 min-h-[44px] rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.97] ${
                  plan.premium
                    ? "text-white shadow-md shadow-[#F43F5E]/20"
                    : plan.accent
                    ? "text-white shadow-md shadow-[#A855F7]/20"
                    : `border-2 border-text/15 text-text hover:border-[${plan.color}] hover:text-[${plan.color}]`
                }`}
                style={plan.premium ? {
                  backgroundImage: "linear-gradient(90deg, #F43F5E, #FB7185, #F43F5E)",
                  backgroundSize: "200% 100%",
                  animation: "pricingShimmer 3s ease-in-out infinite",
                } : plan.accent ? {
                  backgroundImage: "linear-gradient(90deg, #A855F7, #C084FC, #A855F7)",
                  backgroundSize: "200% 100%",
                  animation: "pricingShimmer 3s ease-in-out infinite",
                  border: "none",
                } : undefined}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Success message */}
        {result && !modal && (
          <div className={`mt-6 max-w-md mx-auto rounded-xl px-5 py-3 text-center text-sm font-medium ${
            result.ok ? "bg-teal/10 text-teal" : "bg-red-50 text-red-600 dark:bg-red-500/10"
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

      {/* ═══ Payment Modal ═══ */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          onClick={closeModal}
          style={{
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            animation: closing ? "pricingBackdropOut 0.3s ease forwards" : "pricingBackdropIn 0.25s ease",
          }}
        >
          {/* Outer wrapper for animated border */}
          <div
            className="w-full sm:max-w-[750px] sm:rounded-3xl rounded-t-3xl relative overflow-hidden p-[2px]"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: closing
                ? "pricingModalOut 0.3s ease forwards"
                : "pricingModalIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Spinning gradient border */}
            <div
              className="absolute inset-[-50%] z-0"
              style={{
                background: `conic-gradient(from 0deg, ${modal.color}, ${modal.color}33, transparent, transparent, transparent, ${modal.color}33, ${modal.color})`,
                animation: "pricingBorderSpin 4s linear infinite",
              }}
            />
            {/* Inner content */}
            <div className="bg-bg relative z-[1] sm:rounded-[22px] rounded-t-[22px] shadow-2xl overflow-hidden">

            {/* Drag handle (mobile) */}
            <div className="w-9 h-1 rounded-full bg-text/10 mx-auto mt-3 sm:hidden relative z-10" />

            {/* Close button — global, above everything */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all z-20 backdrop-blur-sm"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex flex-col sm:flex-row">

              {/* ─── Left: Girl image ─── */}
              {modal.img && (
                <div className="relative sm:w-[280px] h-[220px] sm:h-auto shrink-0 overflow-hidden">
                  <img
                    src={modal.img}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ objectPosition: "center 45%", animation: "pricingStagger 0.5s ease both 0.05s" }}
                  />
                  {/* Gradient overlays for blend */}
                  <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-bg via-transparent to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg sm:to-transparent opacity-80" />
                  {/* Color tint matching plan */}
                  <div
                    className="absolute inset-0 mix-blend-soft-light opacity-30"
                    style={{ background: modal.color }}
                  />

                  {/* Mobile: overlay text on image */}
                  <div className="absolute bottom-3 left-4 right-4 sm:hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-3xl" style={{ animation: "pricingFloat 3s ease-in-out infinite" }}>{modal.icon}</span>
                      <div>
                        <h3 className="text-xl font-extrabold text-text">{modal.name}</h3>
                        <div className="flex items-baseline gap-1.5">
                          {modal.oldPrice && <span className="text-sm line-through text-text/30">{modal.oldPrice}</span>}
                          <span className="text-2xl font-extrabold" style={{ color: modal.color }}>{modal.price}</span>
                          <span className="text-xs text-text/40 font-semibold">{modal.period}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Right: Content ─── */}
              <div className="flex-1 relative">

                {/* Desktop header (hidden on mobile since it's over image) */}
                <div className="hidden sm:block px-6 pt-5 pb-2">
                  <div className="flex items-center gap-3 mb-2" style={{ animation: "pricingStagger 0.4s ease both 0.1s" }}>
                    <span className="text-3xl" style={{ animation: "pricingFloat 3s ease-in-out infinite" }}>{modal.icon}</span>
                    <div>
                      {modal.badge && (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold mb-1 ${
                            modal.premium ? "bg-amber-500/15 text-amber-500" : "bg-accent/10 text-accent"
                          }`}
                        >
                          {modal.premium ? "⭐ " : ""}{modal.badge}
                        </span>
                      )}
                      <h3 className="text-xl font-extrabold text-text">Тариф {modal.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1" style={{ animation: "pricingStagger 0.4s ease both 0.15s" }}>
                    {modal.oldPrice && <span className="text-lg line-through text-text/25">{modal.oldPrice}</span>}
                    <span className="text-3xl font-extrabold" style={{ color: modal.color }}>{modal.price}</span>
                    <span className="text-sm text-text/40 font-semibold">{modal.period}</span>
                    {modal.oldPrice && <span className="text-[10px] font-bold bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">-{Math.round((1 - modal.priceNum / parseInt(modal.oldPrice.replace(/\s/g, ""))) * 100)}%</span>}
                  </div>
                </div>

                {/* Features */}
                <div className="px-6 pt-3 sm:pt-1 pb-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    {modal.features.slice(0, 6).map((f: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 py-1"
                        style={{ animation: `pricingStagger 0.35s ease both ${0.2 + i * 0.04}s` }}
                      >
                        <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 text-[9px]"
                          style={{ background: `${modal.color}15`, color: modal.color }}>
                          ✓
                        </span>
                        <span className="text-[12px] text-text/60">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment section */}
                <div className="px-6 pb-5 pt-2">
                  {/* Promo code */}
                  <div className="mb-3" style={{ animation: "pricingStagger 0.4s ease both 0.35s" }}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promo}
                        onChange={(e) => setPromo(e.target.value.toUpperCase())}
                        placeholder="Промокод"
                        className="flex-1 bg-text/[0.04] border border-text/[0.08] rounded-xl px-4 py-2.5 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-accent/30 placeholder:text-text/20 placeholder:normal-case placeholder:tracking-normal placeholder:font-sans transition-all duration-200"
                      />
                      <button
                        onClick={applyPromo}
                        disabled={!promo.trim()}
                        className="px-5 py-2.5 bg-text/[0.04] border border-text/[0.08] rounded-xl text-sm font-bold hover:border-accent hover:text-accent transition-all duration-200 disabled:opacity-30 active:scale-95"
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

                  {/* Payment methods */}
                  <div className="space-y-2" style={{ animation: "pricingStagger 0.4s ease both 0.4s" }}>
                    <p className="text-[10px] text-text/30 font-semibold uppercase tracking-wider mb-2">Способ оплаты</p>

                    {/* Platega — Cards RU / SBP */}
                    <button
                      onClick={() => pay(modal.id, "platega")}
                      disabled={loading}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-text/[0.08] hover:border-accent/30 hover:bg-accent/5 transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                      <span className="text-xl shrink-0">💳</span>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-bold text-text">Карта РФ / СБП</div>
                        <div className="text-[10px] text-text/40">Мир · Visa · MC · СБП</div>
                      </div>
                      <span className="text-xs font-bold text-accent shrink-0">{modal.price}</span>
                    </button>

                    {/* Crypto via Heleket */}
                    <button
                      onClick={() => pay(modal.id, "crypto")}
                      disabled={loading}
                      className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-text/[0.08] hover:border-accent/30 hover:bg-accent/5 transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                      <span className="text-xl shrink-0">🪙</span>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-bold text-text">Криптовалюта</div>
                        <div className="text-[10px] text-text/40">USDT · BTC · ETH · SOL</div>
                      </div>
                      <span className="text-xs font-bold text-text/40 shrink-0">Heleket</span>
                    </button>

                    {/* TON Wallet */}
                    <div className="rounded-xl border border-text/[0.08] overflow-hidden">
                      <TonPayButton
                        tier={modal.id}
                        onSuccess={() => {
                          setSuccessAnim(true);
                          setTimeout(() => {
                            setSuccessAnim(false);
                            closeModal();
                            setResult({ ok: true, message: `Тариф ${modal.name} активирован через TON!` });
                          }, 2000);
                        }}
                      />
                    </div>
                  </div>

                  {loading && (
                    <div className="flex items-center justify-center gap-2 mt-3 text-text/40 text-xs">
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Создание счёта...
                    </div>
                  )}

                  {result && (
                    <p className={`text-center text-xs font-medium mt-2 ${result.ok ? "text-teal" : "text-red-500"}`}>
                      {result.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>{/* /inner content */}
          </div>{/* /outer border wrapper */}
        </div>
      )}

      {/* ═══ Success overlay ═══ */}
      {successAnim && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            animation: "pricingBackdropIn 0.3s ease",
          }}
        >
          <div style={{ animation: "pricingSuccessFade 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle
                cx="40" cy="40" r="36" fill="none"
                stroke="#D97757" strokeWidth="3"
                strokeDasharray="226" strokeDashoffset="226"
                style={{ animation: "pricingSuccessRing 0.6s ease forwards 0.1s" }}
              />
              <path
                d="M24 40 L35 51 L56 30" fill="none"
                stroke="#D97757" strokeWidth="3.5"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="50" strokeDashoffset="50"
                style={{ animation: "pricingCheckDraw 0.4s ease forwards 0.5s" }}
              />
            </svg>
          </div>
          <p
            className="text-xl font-extrabold text-white mt-5"
            style={{ animation: "pricingStagger 0.4s ease both 0.6s" }}
          >
            Оплата прошла!
          </p>
          <p
            className="text-sm text-white/50 mt-2"
            style={{ animation: "pricingStagger 0.4s ease both 0.7s" }}
          >
            Подписка активирована
          </p>
        </div>
      )}
    </section>
  );
}
