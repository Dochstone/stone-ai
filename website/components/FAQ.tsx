"use client";

import { useState } from "react";
import { homeFaqData } from "@/lib/faq-data";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 md:py-28 bg-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">
          Частые вопросы
        </h2>

        <div className="space-y-3">
          {homeFaqData.map((faq, i) => (
            <div
              key={i}
              className="bg-bg rounded-2xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
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
                  openIndex === i ? "max-h-96 pb-5" : "max-h-0"
                }`}
              >
                <div className="px-5 text-sm text-text/60 leading-relaxed" dangerouslySetInnerHTML={{ __html: faq.a }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
