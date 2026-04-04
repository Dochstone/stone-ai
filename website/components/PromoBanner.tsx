"use client";

import { useState, useEffect } from "react";

export default function PromoBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const auth = localStorage.getItem("stone_auth");
      if (auth) {
        // Logged in — check if they need to see promo
        // If they have a paid plan, hide completely
        // We can't know plan from localStorage, so just hide for logged-in users
        // They already know about the product
        return;
      }
    } catch {}
    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <section className="bg-gradient-to-r from-accent/90 to-teal/90 py-4">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
        <p className="text-white text-center text-sm sm:text-base font-bold tracking-tight">
          15 бесплатных запросов каждый день — без регистрации
        </p>
        <a
          href="/dashboard/chat"
          className="shrink-0 bg-white/20 hover:bg-white/30 backdrop-blur text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors"
        >
          Попробовать
        </a>
      </div>
    </section>
  );
}
