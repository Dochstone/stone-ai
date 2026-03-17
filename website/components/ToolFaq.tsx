"use client";

import { useState } from "react";

interface FaqItem {
  q: string;
  a: string;
}

interface ToolFaqProps {
  items: FaqItem[];
}

export default function ToolFaq({ items }: ToolFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-12">
          Частые вопросы
        </h2>

        <div className="space-y-3">
          {items.map((faq, i) => (
            <div key={i} className="bg-bg rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-text/[0.02] transition-colors"
              >
                <span className="font-semibold text-sm pr-4">{faq.q}</span>
                <span
                  className={`text-text/30 text-xl shrink-0 transition-transform duration-200 ${
                    openIndex === i ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === i ? "max-h-60 pb-5" : "max-h-0"
                }`}
              >
                <div className="px-5 text-sm text-text/60 leading-relaxed">{faq.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
