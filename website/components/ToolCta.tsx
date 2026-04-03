"use client";

import { useState, useEffect } from "react";

interface ToolCtaProps {
  title?: string;
  subtitle?: string;
  ctaHref?: string;
}

export default function ToolCta({
  title = "Попробуйте прямо сейчас",
  subtitle = "15 бесплатных запросов каждый день. Бесплатный старт.",
  ctaHref = "/webchat",
}: ToolCtaProps) {
  const [hasPaidPlan, setHasPaidPlan] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("stone_auth");
      if (!raw) return;
      const auth = JSON.parse(raw);
      if (auth?.plan && auth.plan !== "free") setHasPaidPlan(true);
    } catch {}
  }, []);

  if (hasPaidPlan) return null;

  return (
    <section className="bg-dark text-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl md:text-4xl font-extrabold mb-4">{title}</h2>
        <p className="text-white/50 mb-10 max-w-lg mx-auto">{subtitle}</p>
        <a
          href={ctaHref}
          className="inline-block bg-accent text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25"
        >
          Попробовать бесплатно
        </a>
      </div>
    </section>
  );
}
