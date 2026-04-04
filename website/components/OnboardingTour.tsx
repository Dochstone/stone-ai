"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    gradient: "from-amber-500 to-orange-500",
    title: "Добро пожаловать в Stone AI!",
    description: "Ваша панель инструментов с AI-модулями. Давайте познакомимся!",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    gradient: "from-blue-500 to-indigo-500",
    title: "AI-шаблоны",
    description: "50+ готовых промптов для маркетинга, SMM, SEO и бизнеса. Заполните форму — AI сгенерирует результат.",
    link: "/dashboard/templates",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
      </svg>
    ),
    gradient: "from-purple-500 to-pink-500",
    title: "Презентации",
    description: "Введите тему — AI создаст слайды за 30 секунд. 6 тем оформления, экспорт в PDF и PPTX.",
    link: "/dashboard/presentations",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
      </svg>
    ),
    gradient: "from-emerald-500 to-teal-500",
    title: "Фотосессия товаров",
    description: "Загрузите фото товара — AI сменит фон, поставит на модель или создаст карточку для маркетплейса.",
    link: "/dashboard/photo-session",
  },
  {
    icon: (
      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
      </svg>
    ),
    gradient: "from-rose-500 to-red-500",
    title: "Пополните баланс",
    description: "Инструменты работают за баланс (от 5\u20BD). Пополните картой РФ или СБП прямо в панели.",
  },
];

export function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [animating, setAnimating] = useState(false);
  const router = useRouter();
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const goTo = useCallback(
    (next: number, dir: "next" | "prev") => {
      if (animating) return;
      setAnimating(true);
      setDirection(dir);
      setTimeout(() => {
        setStep(next);
        setAnimating(false);
      }, 150);
    },
    [animating],
  );

  const handleNext = () => {
    if (isLast) {
      onComplete();
      router.push("/dashboard/templates");
      return;
    }
    goTo(step + 1, "next");
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Card */}
      <div className="relative bg-bg rounded-2xl p-8 max-w-md w-full shadow-2xl border border-text/5">
        {/* Step dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, i > step ? "next" : "prev")}
              className={`
                h-2 rounded-full transition-all duration-300
                ${i === step ? "w-6 bg-accent" : "w-2 bg-text/15 hover:bg-text/25"}
              `}
            />
          ))}
        </div>

        {/* Content with fade */}
        <div
          className={`transition-opacity duration-150 ${animating ? "opacity-0" : "opacity-100"}`}
        >
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div
              className={`w-12 h-12 rounded-full bg-gradient-to-br ${current.gradient} flex items-center justify-center shadow-lg`}
            >
              {current.icon}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-extrabold text-text text-center mb-2">
            {current.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-text/50 text-center leading-relaxed mb-8">
            {current.description}
          </p>
        </div>

        {/* Action button */}
        <button
          onClick={handleNext}
          className="w-full py-3 rounded-xl bg-accent text-white text-sm font-bold hover:opacity-90 transition-opacity"
        >
          {isLast ? "Начать работу" : "Далее"}
        </button>

        {/* Skip link */}
        <button
          onClick={handleSkip}
          className="w-full mt-3 text-xs text-text/30 hover:text-text/50 transition-colors text-center"
        >
          Пропустить
        </button>
      </div>
    </div>
  );
}
