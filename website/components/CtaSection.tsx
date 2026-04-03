"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

export default function CtaSection() {
  const [hasPaidPlan, setHasPaidPlan] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("stone_auth");
      if (!raw) return;
      const auth = JSON.parse(raw);
      if (!auth?.token) return;
      // Quick check: if plan cached
      if (auth.plan && auth.plan !== "free") { setHasPaidPlan(true); return; }
      // Fetch plan from API
      fetch(`${API_URL}/api/user/me`, { headers: { Authorization: `Bearer ${auth.token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data) return;
          const plan = data.plan || data.user?.plan || "free";
          if (plan !== "free") setHasPaidPlan(true);
          // Cache plan in localStorage
          auth.plan = plan;
          localStorage.setItem("stone_auth", JSON.stringify(auth));
        })
        .catch(() => {});
    } catch {}
  }, []);

  if (hasPaidPlan) return null;

  return (
    <section className="bg-dark text-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
          Будущее AI — уже доступно. Начните сейчас
        </h2>
        <p className="text-white/50 mb-10 max-w-lg mx-auto text-lg">
          65+ нейросетей в одном окне.
          <br />
          Текст, картинки, видео, аудио, 3D и код.
        </p>
        <a
          href="/webchat"
          className="inline-block bg-accent text-white px-8 py-4 min-h-[48px] rounded-xl font-bold text-sm hover:bg-accent/90 transition-all hover:shadow-lg hover:shadow-accent/25 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:ring-offset-2"
        >
          Начать бесплатно
        </a>
        <p className="mt-6 text-white/30 text-sm">
          15 бесплатных запросов каждый день. Без регистрации.
        </p>
        <a
          href="/referral"
          className="mt-4 inline-block text-accent text-sm font-semibold hover:underline"
        >
          Приглашай друзей — получай бонусы от их подписок &rarr;
        </a>
      </div>
    </section>
  );
}
