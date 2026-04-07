"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const TonPayButton = dynamic(() => import("./TonPayButton"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

const plans = [
  {
    id: "free", name: "Pay-per-Use", price: "от 3₽", oldPrice: "", priceNum: 0, premium: false, period: "/запрос", desc: "Без подписки",
    badge: "Гибкий", accent: false,
    features: ["15 бесплатных чат-запросов/день", "7 бесплатных моделей", "2 картинки + 1 видео (Veo 3) навсегда", "AI-шаблоны от 3₽", "Презентации, SEO, кампании — с баланса", "Бонус 100₽ при регистрации"],
    locked: [],
    cta: "Пополнить баланс", icon: "💰", color: "#14B8A6", img: "/plan-payperuse.jpg",
  },
  {
    id: "mini", name: "Start", price: "390₽", oldPrice: "590₽", priceNum: 390, premium: false, period: "/мес", desc: "20+ моделей",
    badge: "Старт", accent: false,
    features: ["20+ моделей включая GPT-5.1 и Claude Sonnet", "1 500 запросов к быстрым моделям", "90 запросов к премиум моделям", "240 картинок и 60 видео в месяц", "Все инструменты со скидкой"],
    locked: ["Claude Opus", "3D модели"],
    cta: "Выбрать Start", icon: "⚡", color: "#22D3EE", img: "/plan-mini.jpg?v=2",
  },
  {
    id: "max", name: "Pro", price: "890₽", oldPrice: "1\u00A0490₽", priceNum: 890, premium: false, period: "/мес", desc: "Все 65+ моделей",
    badge: "Популярный", accent: true,
    features: ["Все 65+ моделей включая Opus", "2 100 запросов к быстрым моделям", "120 запросов к премиум (30 к Opus)", "450 картинок и 90 видео в месяц", "5 3D-моделей и 20 озвучек", "Голосовой ассистент"],
    locked: [],
    cta: "Выбрать Pro", icon: "🔥", color: "#A855F7", img: "/plan-max.jpg?v=2",
  },
  {
    id: "max-pro", name: "Elite", price: "1\u00A0990₽", oldPrice: "2\u00A0990₽", priceNum: 1990, premium: true, period: "/мес", desc: "Максимум возможностей",
    badge: "Легенда", accent: false,
    features: ["Все 65+ моделей + доступ к API", "10 500 запросов к быстрым моделям", "540 запросов к премиум (90 к Opus)", "3 000 картинок и 450 видео в месяц", "30 3D-моделей и 100 озвучек", "Приоритетная скорость ответов", "Ранний доступ к новым моделям"],
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
  const [payExpanded, setPayExpanded] = useState(false);
  const [topupMode, setTopupMode] = useState(false);
  const [topupAmount, setTopupAmount] = useState(300);
  const [swipeY, setSwipeY] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const swipeStartRef = useRef<number | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modal) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => { document.body.style.overflow = ""; document.body.style.touchAction = ""; };
  }, [modal]);
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
    const auth = getAuth();
    if (!auth && plan.id !== "free") { window.location.href = "/profile"; return; }
    setModal(plan);
    setTopupMode(plan.id === "free");
    setPayExpanded(false);
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

  const payTopup = async (amountRub: number) => {
    const auth = getAuth();
    if (!auth) { window.location.href = "/profile"; return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/payment/platega/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ usd_amount: amountRub / 95 }),
      });
      const data = await res.json();
      if (res.ok && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setResult({ ok: false, message: typeof data.detail === "string" ? data.detail : "Ошибка создания платежа" });
      }
    } catch { setResult({ ok: false, message: "Ошибка сети" }); }
    setLoading(false);
  };

  const pay = async (tier: string, method: "platega" | "crypto" = "platega") => {
    const auth = getAuth();
    if (!auth) { window.location.href = "/profile"; return; }
    setLoading(true);
    setResult(null);
    try {
      const pricesRub: Record<string, number> = { mini: 390, max: 890, "max-pro": 1990 };
      const usdAmount = (pricesRub[tier] || 950) / 95;

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
                  : plan.id === "mini"
                  ? "bg-bg border-2 border-[#22D3EE]/30 shadow-md hover:shadow-xl hover:shadow-[#22D3EE]/10 hover:border-[#22D3EE]/60"
                  : "bg-bg border-2 border-[#14B8A6]/20 shadow-md hover:shadow-xl hover:shadow-[#14B8A6]/10 hover:border-[#14B8A6]/50"
              }`}
              style={plan.accent ? {
                animation: "pricingGlow 3s ease-in-out infinite",
                ["--glow-color" as any]: "rgba(168,85,247,0.12)",
              } : undefined}
            >
              {plan.badge && (
                <span
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                    plan.premium ? "bg-gradient-to-r from-[#F43F5E] to-[#E11D48] text-white"
                    : plan.accent ? "bg-[#A855F7] text-white"
                    : plan.id === "mini" ? "bg-[#22D3EE] text-white"
                    : "bg-[#14B8A6] text-white"
                  }`}
                  style={{
                    animation: "pricingPulse 2.5s ease-in-out infinite",
                    ["--pulse-color" as any]: plan.premium ? "rgba(244,63,94,0.4)" : plan.accent ? "rgba(168,85,247,0.4)" : plan.id === "mini" ? "rgba(34,211,238,0.4)" : "rgba(20,184,166,0.4)",
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
                    <svg className={`w-4 h-4 mt-0.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${plan.premium ? "text-[#F43F5E]" : plan.accent ? "text-[#A855F7]" : plan.id === "mini" ? "text-[#22D3EE]" : "text-[#14B8A6]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
                    : plan.id === "mini"
                    ? "text-white shadow-md shadow-[#22D3EE]/20"
                    : "text-white shadow-md shadow-[#14B8A6]/20"
                }`}
                style={plan.premium ? {
                  backgroundImage: "linear-gradient(90deg, #F43F5E, #FB7185, #F43F5E)",
                  backgroundSize: "200% 100%",
                  animation: "pricingShimmer 3s ease-in-out infinite",
                } : plan.accent ? {
                  backgroundImage: "linear-gradient(90deg, #A855F7, #C084FC, #A855F7)",
                  backgroundSize: "200% 100%",
                  animation: "pricingShimmer 3s ease-in-out infinite",
                } : plan.id === "mini" ? {
                  backgroundImage: "linear-gradient(90deg, #22D3EE, #67E8F9, #22D3EE)",
                  backgroundSize: "200% 100%",
                  animation: "pricingShimmer 4s ease-in-out infinite",
                } : {
                  backgroundImage: "linear-gradient(90deg, #14B8A6, #2DD4BF, #14B8A6)",
                  backgroundSize: "200% 100%",
                  animation: "pricingShimmer 4s ease-in-out infinite",
                }}
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
              <a href="/dashboard/chat" className="block mt-2 text-accent font-bold hover:underline">
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
            onTouchStart={(e) => {
              // Don't start swipe on interactive elements
              const tag = (e.target as HTMLElement).closest("button, a, input, select");
              if (tag) return;
              swipeStartRef.current = e.touches[0].clientY;
              setSwiping(true);
            }}
            onTouchMove={(e) => {
              if (swipeStartRef.current === null) return;
              const dy = e.touches[0].clientY - swipeStartRef.current;
              if (dy > 0) setSwipeY(dy);
            }}
            onTouchEnd={() => {
              if (swipeY > 120) closeModal();
              setSwipeY(0);
              setSwiping(false);
              swipeStartRef.current = null;
            }}
            style={{
              animation: !swiping ? (closing
                ? "pricingModalOut 0.3s ease forwards"
                : "pricingModalIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)") : "none",
              transform: swipeY > 0 ? `translateY(${swipeY}px)` : undefined,
              transition: swiping ? "none" : "transform 0.3s ease",
              opacity: swipeY > 0 ? Math.max(0.3, 1 - swipeY / 400) : undefined,
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
            <div className="bg-bg relative z-[1] sm:rounded-[22px] rounded-t-[22px] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">

            {/* Drag handle (mobile) — overlays image */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-9 h-1 rounded-full bg-white/30 sm:hidden z-20" />

            {/* Close button — overlays image */}
            <button
              onClick={closeModal}
              className="absolute top-2.5 right-3 w-9 h-9 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all z-20 backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex flex-col sm:flex-row">

              {/* ─── Left: Girl image ─── */}
              {modal.img && (
                <div className="relative sm:w-[280px] h-[300px] sm:h-auto shrink-0 overflow-hidden">
                  <img
                    src={modal.img}
                    alt=""
                    className="w-full h-full object-cover"
                    style={{ objectPosition: "center 25%", animation: "pricingStagger 0.5s ease both 0.05s" }}
                  />
                  {/* Darken overlay for contrast */}
                  <div className="absolute inset-0 bg-black/45" />
                  {/* Desktop: side gradient blend */}
                  <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-bg" />
                  {/* Mobile: bottom gradient only — keeps image visible, text readable */}
                  <div className="sm:hidden absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-bg via-bg/80 to-transparent" />
                  {/* Color tint matching plan */}
                  <div
                    className="absolute inset-0 mix-blend-soft-light opacity-30"
                    style={{ background: modal.color }}
                  />

                  {/* Mobile: overlay text on image */}
                  <div className="absolute bottom-4 left-4 right-4 sm:hidden">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl" style={{ animation: "pricingFloat 3s ease-in-out infinite" }}>{modal.icon}</span>
                      <div>
                        {modal.badge && (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold text-white mb-1" style={{ backgroundColor: modal.color }}>
                            {modal.premium ? "⭐ " : ""}{modal.badge}
                          </span>
                        )}
                        <h3 className="text-xl font-extrabold text-white drop-shadow-lg">{modal.name}</h3>
                        <div className="flex items-baseline gap-1.5">
                          {modal.oldPrice && <span className="text-sm line-through text-white/40">{modal.oldPrice}</span>}
                          <span className="text-2xl font-extrabold drop-shadow-lg" style={{ color: modal.color }}>{modal.price}</span>
                          <span className="text-xs text-white/60 font-semibold">{modal.period}</span>
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
                          className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold mb-1 text-white"
                          style={{ backgroundColor: modal.color }}
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

                {/* Features — compact on mobile */}
                <div className="px-6 pt-2 sm:pt-1 pb-1">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {modal.features.slice(0, 4).map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-1.5 py-0.5"
                        style={{ animation: `pricingStagger 0.35s ease both ${0.2 + i * 0.04}s` }}>
                        <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[8px]"
                          style={{ background: `${modal.color}15`, color: modal.color }}>✓</span>
                        <span className="text-[11px] text-text/60 leading-tight">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment section */}
                <div className="px-6 pb-5 pt-2">

                  {modal.id === "free" ? (
                    /* ═══ Pay-per-Use: top-up with promo + payment methods ═══ */
                    <div>
                      <p className="text-[11px] text-text/40 mb-3 hidden sm:block" style={{ animation: "pricingStagger 0.4s ease both 0.3s" }}>Платите только за инструменты. Без подписки.</p>
                      <div className="flex gap-2 mb-3" style={{ animation: "pricingStagger 0.4s ease both 0.33s" }}>
                        {[100, 300, 500, 1000].map((amt) => (
                          <button
                            key={amt}
                            onClick={() => setTopupAmount(amt)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                              topupAmount === amt ? "text-white shadow-sm" : "bg-text/[0.04] text-text/50 hover:bg-text/[0.08]"
                            }`}
                            style={topupAmount === amt ? { backgroundImage: "linear-gradient(90deg, #14B8A6, #2DD4BF, #14B8A6)", backgroundSize: "200% 100%", animation: "pricingShimmer 4s ease-in-out infinite" } : undefined}
                          >
                            {amt}₽
                          </button>
                        ))}
                      </div>

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

                      <button
                        onClick={() => payTopup(topupAmount)}
                        disabled={loading}
                        className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white disabled:opacity-50 transition-all active:scale-[0.97] relative overflow-hidden"
                        style={{
                          backgroundImage: "linear-gradient(90deg, #14B8A6, #2DD4BF, #14B8A6)",
                          backgroundSize: "200% 100%",
                          animation: "pricingShimmer 3s ease-in-out infinite, pricingStagger 0.4s ease both 0.38s",
                          boxShadow: "0 8px 24px rgba(20,184,166,0.3)",
                        }}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Создание платежа...
                          </span>
                        ) : `Пополнить ${topupAmount}₽`}
                      </button>
                      <p className="text-[10px] text-text/25 text-center mt-1.5" style={{ animation: "pricingStagger 0.4s ease both 0.42s" }}>
                        Карта РФ · Мир · Visa · MC · СБП
                      </p>

                      {/* Other methods for topup */}
                      <button
                        onClick={() => setPayExpanded(!payExpanded)}
                        className="w-full flex items-center justify-center gap-2 py-3 min-h-[48px] mt-3 text-sm font-medium text-text/50 bg-text/[0.03] border border-text/[0.08] rounded-xl hover:bg-text/[0.06] hover:border-text/15 active:scale-[0.98] transition-all"
                        style={{ animation: "pricingStagger 0.4s ease both 0.45s" }}
                      >
                        Другие способы оплаты
                        <svg className={`w-3.5 h-3.5 transition-transform ${payExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {payExpanded && (
                        <div className="space-y-2 mt-1 animate-fadeIn">
                          <a
                            href="/topup"
                            className="w-full flex items-center gap-3 p-3 rounded-xl border border-text/[0.06] hover:border-accent/20 hover:bg-accent/5 transition-all active:scale-[0.98]"
                          >
                            <span className="text-lg shrink-0">🪙</span>
                            <div className="flex-1 text-left">
                              <div className="text-xs font-bold text-text">Криптовалюта</div>
                              <div className="text-[9px] text-text/35">USDT · BTC · ETH · SOL · TON</div>
                            </div>
                          </a>
                        </div>
                      )}

                      {result && (
                        <p className={`text-center text-xs font-medium mt-3 ${result.ok ? "text-teal" : "text-red-500"}`}>{result.message}</p>
                      )}
                    </div>
                  ) : (
                  <>
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

                  {/* Main pay button */}
                  <button
                    onClick={() => pay(modal.id, "platega")}
                    disabled={loading}
                    className="w-full py-3.5 min-h-[50px] rounded-2xl font-bold text-[15px] text-white transition-all duration-200 disabled:opacity-50 active:scale-[0.97] relative overflow-hidden"
                    style={{
                      backgroundImage: `linear-gradient(90deg, ${modal.color}, ${modal.color}cc, ${modal.color})`,
                      backgroundSize: "200% 100%",
                      animation: "pricingShimmer 3s ease-in-out infinite, pricingStagger 0.4s ease both 0.4s",
                      boxShadow: `0 8px 24px ${modal.color}30`,
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Создание счёта...
                      </span>
                    ) : `Оплатить ${modal.price}${modal.period}`}
                  </button>
                  <p className="text-[10px] text-text/25 text-center mt-1.5" style={{ animation: "pricingStagger 0.4s ease both 0.45s" }}>
                    Карта РФ · Мир · Visa · MC · СБП
                  </p>

                  {/* Other methods toggle */}
                  <button
                    onClick={() => setPayExpanded(!payExpanded)}
                    className="w-full flex items-center justify-center gap-2 py-3 min-h-[48px] mt-3 text-sm font-medium text-text/50 bg-text/[0.03] border border-text/[0.08] rounded-xl hover:bg-text/[0.06] hover:border-text/15 active:scale-[0.98] transition-all"
                    style={{ animation: "pricingStagger 0.4s ease both 0.5s" }}
                  >
                    Другие способы оплаты
                    <svg className={`w-3.5 h-3.5 transition-transform ${payExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {payExpanded && (
                    <div className="space-y-2 mt-1 animate-fadeIn">
                      <button
                        onClick={() => pay(modal.id, "crypto")}
                        disabled={loading}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-text/[0.06] hover:border-accent/20 hover:bg-accent/5 transition-all disabled:opacity-50 active:scale-[0.98]"
                      >
                        <span className="text-lg shrink-0">🪙</span>
                        <div className="flex-1 text-left">
                          <div className="text-xs font-bold text-text">Криптовалюта</div>
                          <div className="text-[9px] text-text/35">USDT · BTC · ETH · SOL</div>
                        </div>
                      </button>
                      <div className="rounded-xl border border-text/[0.06] overflow-hidden">
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
                  )}



                  {result && (
                    <p className={`text-center text-xs font-medium mt-2 ${result.ok ? "text-teal" : "text-red-500"}`}>
                      {result.message}
                    </p>
                  )}
                  </>
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
