"use client";

import { useState } from "react";

const STEPS = [
  {
    title: "Выберите модель",
    desc: "Нажмите на бургер-меню (мобильный) или посмотрите список слева. 50+ моделей, бесплатные отмечены FREE.",
    icon: "🤖",
  },
  {
    title: "Пишите в чат",
    desc: "Введите сообщение внизу экрана. Прикрепите файл (PDF, фото) через скрепку. Enter — отправить.",
    icon: "💬",
  },
  {
    title: "Баланс и оплата",
    desc: "Вверху справа — ваш баланс в $. Нажмите, чтобы пополнить. 10 запросов в день бесплатно!",
    icon: "💰",
  },
  {
    title: "Готово!",
    desc: "Выберите модель и начните диалог. Стоимость каждого запроса видна по клику на ответ AI.",
    icon: "🚀",
  },
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      localStorage.setItem("onboarding_done", "1");
      onDone();
    }
  };

  const skip = () => {
    localStorage.setItem("onboarding_done", "1");
    onDone();
  };

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop — fills screen, clickable to skip */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={skip} />

      {/* Card — always centered, safe on all screens */}
      <div className="relative z-10 w-full max-w-[340px]">
        <div className="bg-white rounded-2xl shadow-2xl p-6 animate-fade-in-up">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-8 bg-accent" : i < step ? "w-4 bg-accent/40" : "w-4 bg-text/10"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="text-4xl mb-4">{current.icon}</div>

          {/* Content */}
          <h3 className="font-bold text-lg mb-2">{current.title}</h3>
          <p className="text-text/55 text-sm leading-relaxed mb-6">{current.desc}</p>

          {/* Buttons — touch-friendly min 44px */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={skip}
              className="min-h-[44px] px-4 text-sm text-text/40 hover:text-text/60 transition-colors font-medium"
            >
              Пропустить
            </button>
            <button
              onClick={next}
              className="min-h-[44px] bg-accent text-white px-6 rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors flex-1 max-w-[160px]"
            >
              {step < STEPS.length - 1 ? "Далее" : "Начать"}
            </button>
          </div>

          {/* Step counter */}
          <p className="text-[11px] text-text/25 text-center mt-4">
            {step + 1} / {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
