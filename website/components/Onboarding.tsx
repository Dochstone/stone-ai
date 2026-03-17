"use client";

import { useState, useEffect } from "react";

const STEPS = [
  {
    title: "Выберите модель",
    desc: "Слева — 50+ AI-моделей. Бесплатные отмечены FREE. Фильтруйте по цене или компании.",
    icon: "🤖",
    anchor: "left",
  },
  {
    title: "Пишите в чат",
    desc: "Введите сообщение внизу. Прикрепите файл (PDF, фото) через скрепку. Enter — отправить.",
    icon: "💬",
    anchor: "bottom",
  },
  {
    title: "Баланс и оплата",
    desc: "Справа вверху — ваш баланс в $. Кликните, чтобы пополнить. 10 запросов в день бесплатно.",
    icon: "💰",
    anchor: "top-right",
  },
  {
    title: "Готово!",
    desc: "Выберите модель и начните диалог. Стоимость каждого запроса видна по клику на ответ.",
    icon: "🚀",
    anchor: "center",
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

  // Position styles based on anchor
  const positionClass = {
    left: "left-[290px] top-1/3",
    bottom: "bottom-24 left-1/2 -translate-x-1/2",
    "top-right": "top-16 right-8",
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  }[current.anchor] || "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={skip} />

      {/* Card */}
      <div className={`absolute ${positionClass} z-10`}>
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-[320px] animate-fade-in-up">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === step ? "w-6 bg-accent" : i < step ? "w-3 bg-accent/40" : "w-3 bg-text/10"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className="text-3xl mb-3">{current.icon}</div>

          {/* Content */}
          <h3 className="font-bold text-base mb-1.5">{current.title}</h3>
          <p className="text-text/55 text-sm leading-relaxed mb-5">{current.desc}</p>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={skip}
              className="text-xs text-text/30 hover:text-text/50 transition-colors"
            >
              Пропустить
            </button>
            <button
              onClick={next}
              className="bg-accent text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors"
            >
              {step < STEPS.length - 1 ? "Далее" : "Начать"}
            </button>
          </div>

          {/* Step counter */}
          <p className="text-[10px] text-text/20 text-center mt-3">
            {step + 1} из {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
