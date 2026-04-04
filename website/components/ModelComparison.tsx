"use client";

import { useState, useEffect, useRef } from "react";

const METRICS = [
  { label: "Качество текста", free: 65, premium: 98 },
  { label: "Креативность", free: 55, premium: 95 },
  { label: "Следование инструкциям", free: 60, premium: 97 },
  { label: "Скорость ответа", free: 90, premium: 85 },
  { label: "Контекст (память)", free: 50, premium: 95 },
];

export default function ModelComparison() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="max-w-3xl mx-auto my-16 px-4">
      <h2 className="text-2xl font-extrabold text-center mb-2">Качество AI-моделей</h2>
      <p className="text-text/40 text-center mb-10 text-sm">
        Премиум модели дают кардинально лучший результат
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Free */}
        <div className="bg-white rounded-2xl border border-text/5 p-6">
          <h3 className="font-bold text-text mb-1">Бесплатные модели</h3>
          <p className="text-[11px] text-text/35 mb-5">GPT-4o mini, Gemini Flash, Claude Haiku</p>
          {METRICS.map(m => (
            <div key={m.label} className="mb-3.5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text/50">{m.label}</span>
                <span className="text-text/30 font-mono">{m.free}%</span>
              </div>
              <div className="h-2 bg-text/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-text/20 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: visible ? `${m.free}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Premium */}
        <div className="bg-white rounded-2xl border border-accent/20 p-6 relative">
          <div className="absolute -top-3 left-5 px-3 py-0.5 bg-accent text-white text-[10px] font-bold rounded-full">
            Рекомендуем
          </div>
          <h3 className="font-bold text-text mb-1">Премиум модели</h3>
          <p className="text-[11px] text-text/35 mb-5">GPT-5, Claude Opus, DeepSeek R1</p>
          {METRICS.map(m => (
            <div key={m.label} className="mb-3.5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text/60">{m.label}</span>
                <span className="text-accent font-bold font-mono">{m.premium}%</span>
              </div>
              <div className="h-2 bg-text/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-accent to-teal rounded-full transition-all duration-1000 ease-out"
                  style={{ width: visible ? `${m.premium}%` : "0%", transitionDelay: "0.3s" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-text/25 mt-5">
        Премиум модели доступны на тарифах Start, Pro и Elite
      </p>
    </div>
  );
}
