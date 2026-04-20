"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface Step {
  mascot: string; title: string; desc: string;
  highlight?: string; cta?: { label: string; href: string };
  registerCta?: boolean;
}

const M = "/mascots/stone-mascot-";
const V = ".webp?v=2";

const GUEST_STEPS: Step[] = [
  { mascot: `${M}idle${V}`, title: "Привет! Я Stone — твой AI-помощник 👋", desc: "Помогу с текстами, картинками, видео и рекламой. 65+ нейросетей в одном месте — бесплатно." },
  { mascot: `${M}chat${V}`, title: "Попробуй написать что-нибудь ✍️", desc: "Просто напиши вопрос в поле ввода внизу. Первые 10 запросов в день — бесплатно!", highlight: "[data-onboard='chat-input']" },
  { mascot: `${M}success${V}`, title: "Понравилось? Создай аккаунт 🎁", desc: "Регистрация за 10 секунд — и все инструменты твои. Плюс 100\u20BD на баланс в подарок.", registerCta: true },
];

const USER_STEPS: Step[] = [
  { mascot: `${M}success${V}`, title: "Добро пожаловать! 🎁 100\u20BD на балансе", desc: "Мы начислили бонус — используй его на любые AI-инструменты." },
  { mascot: `${M}chat${V}`, title: "🧠 Чат бесплатный — 10 запросов в день", desc: "Выбирай модель в меню слева. GPT-5, Claude, Gemini и другие — каждая со своей суперсилой.", highlight: "[data-onboard='model-picker']" },
  { mascot: `${M}chat${V}`, title: "✨ Попробуй AI-шаблоны", desc: "50+ готовых промптов для маркетинга, SEO и бизнеса. Заполни форму — получи результат. От 3\u20BD.", highlight: "[data-onboard='templates-link']", cta: { label: "Открыть шаблоны", href: "/dashboard/templates" } },
  { mascot: `${M}idle${V}`, title: "🖼️ Сгенерируй картинку или видео", desc: "2 бесплатные картинки + 1 видео в подарок. Остальное — от 5\u20BD за генерацию.", highlight: "[data-onboard='media-tabs']" },
  { mascot: `${M}idle${V}`, title: "🚀 Твоя AI-студия готова!", desc: "Всё настроено. Начни с чата, шаблонов или создай рекламную кампанию.", cta: { label: "Начать работу", href: "/dashboard" } },
];

interface Props { mode: "guest" | "user"; onComplete: () => void; onRegister?: () => void }

export function OnboardingFlow({ mode, onComplete, onRegister }: Props) {
  const steps = mode === "guest" ? GUEST_STEPS : USER_STEPS;
  const lsKey = mode === "guest" ? "stone_guest_onboarded" : "stone_user_onboarded";
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null);
  const rafRef = useRef(0);
  const current = steps[idx];

  const updateSpot = useCallback(() => {
    if (!current.highlight) { setSpotRect(null); return; }
    const el = document.querySelector(current.highlight);
    if (!el) { setSpotRect(null); return; }
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    requestAnimationFrame(() => {
      setSpotRect(el.getBoundingClientRect());
    });
  }, [current.highlight]);

  useEffect(() => {
    updateSpot();
    const onResize = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateSpot);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      cancelAnimationFrame(rafRef.current);
    };
  }, [updateSpot]);

  const finish = useCallback(() => {
    localStorage.setItem(lsKey, "1");
    onComplete();
  }, [lsKey, onComplete]);

  const next = () => {
    setVisible(false);
    setTimeout(() => {
      if (idx < steps.length - 1) { setIdx(idx + 1); setVisible(true); }
      else finish();
    }, 200);
  };

  const cardStyle: React.CSSProperties = {};
  if (spotRect && typeof window !== "undefined" && window.innerWidth >= 640) {
    const below = spotRect.bottom + 16;
    cardStyle.position = "absolute";
    cardStyle.left = Math.max(16, Math.min(spotRect.left, window.innerWidth - 380));
    cardStyle.top = below + 260 < window.innerHeight ? below : Math.max(16, spotRect.top - 276);
  }

  return (
    <div className="fixed inset-0 z-[200]">
      {/* backdrop with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "auto" }} onClick={finish}>
        <defs>
          <mask id="ob-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotRect && (
              <rect x={spotRect.left - 6} y={spotRect.top - 6}
                width={spotRect.width + 12} height={spotRect.height + 12} rx="12" fill="black" />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#ob-mask)" />
      </svg>

      {/* spotlight ring */}
      {spotRect && (
        <div className="absolute rounded-xl border-2 border-accent pointer-events-none animate-pulse"
          style={{ left: spotRect.left - 6, top: spotRect.top - 6,
            width: spotRect.width + 12, height: spotRect.height + 12 }} />
      )}

      {/* card — centered on mobile, positioned near spotlight on desktop */}
      <div
        className={[
          "sm:absolute fixed inset-0 sm:inset-auto flex items-center justify-center sm:block",
          "sm:w-[360px] pointer-events-none",
          "transition-all duration-200 ease-out",
          visible ? "opacity-100" : "opacity-0",
        ].join(" ")}
        style={{ ...cardStyle, zIndex: 201 }}
      >
        <div
          className={[
            "pointer-events-auto w-[90vw] max-w-[360px] sm:w-full rounded-2xl",
            "bg-bg border border-text/5 shadow-2xl",
            "transition-transform duration-200 ease-out",
            visible ? "translate-y-0 scale-100" : "translate-y-4 scale-95",
          ].join(" ")}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-1 rounded-t-2xl bg-gradient-to-r from-[#C4623D] to-[#E8945A]" />
          <div className="p-5">
            {/* progress dots */}
            <div className="flex items-center justify-center gap-2 mb-5">
              {steps.map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all duration-300 ${
                  i === idx ? "w-8 bg-accent" : i < idx ? "w-4 bg-accent/40" : "w-4 bg-text/10"
                }`} />
              ))}
            </div>

            {/* mascot — large and centered on mobile */}
            <div className="flex justify-center mb-4">
              <img src={current.mascot} alt="" className="w-24 h-24 sm:w-20 sm:h-20 rounded-2xl object-contain bg-text/[0.03]" />
            </div>

            {/* content — centered */}
            <div className="text-center">
              <h3 className="font-extrabold text-lg sm:text-base text-text leading-snug mb-2">{current.title}</h3>
              <p className="text-sm sm:text-sm text-text/50 leading-relaxed">{current.desc}</p>
            </div>

            {current.cta && (
              <div className="flex justify-center mt-3">
                <a href={current.cta.href} onClick={finish}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
                  {current.cta.label} <span className="text-[10px]">&rarr;</span>
                </a>
              </div>
            )}

            {/* buttons */}
            <div className="flex items-center justify-between mt-5 gap-3">
              <button onClick={finish} className="min-h-[48px] px-3 text-sm text-text/35 hover:text-text/55 transition-colors font-medium">
                {current.registerCta ? "Позже" : "Пропустить"}
              </button>
              {current.registerCta && onRegister ? (
                <button onClick={() => { finish(); onRegister(); }} className="min-h-[48px] bg-accent text-white px-6 rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors flex-1 max-w-[200px]">
                  Создать аккаунт
                </button>
              ) : (
                <button onClick={next} className="min-h-[48px] bg-accent text-white px-6 rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors flex-1 max-w-[160px]">
                  {idx < steps.length - 1 ? "Далее" : "Начать"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
