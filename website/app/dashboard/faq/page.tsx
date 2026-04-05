"use client";

import { useState } from "react";
import { homeFaqData } from "@/lib/faq-data";

export default function DashboardFAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        <div className="mb-8">
          <h1 className="text-xl sm:text-2xl font-extrabold text-text">Частые вопросы</h1>
          <p className="text-sm text-text/40 mt-1">Ответы на популярные вопросы о Stone AI</p>
        </div>

        <div className="space-y-2">
          {homeFaqData.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-text/5 overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold text-text pr-4">{faq.q}</span>
                <svg
                  className={`w-4 h-4 text-text/30 shrink-0 transition-transform duration-200 ${openIdx === i ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIdx === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-text/60 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 bg-accent/5 border border-accent/10 rounded-2xl p-5 text-center">
          <p className="text-sm text-text/60 mb-2">Не нашли ответ?</p>
          <a href="https://t.me/StoneAIsupport" target="_blank" rel="noopener noreferrer"
            className="text-accent font-bold text-sm hover:underline">
            Написать в поддержку →
          </a>
        </div>
      </div>
    </div>
  );
}
