"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Нужен ли VPN для использования Stone AI?",
    a: "Нет. Stone AI работает полностью через Telegram — просто откройте бота и начните общаться с любой моделью. Никакой VPN не нужен, все серверы доступны из России.",
  },
  {
    q: "Как работает оплата за токены?",
    a: "Вы пополняете баланс любым удобным способом (Stars, карты, СБП, криптовалюта). За каждый запрос списывается точная стоимость использованных токенов. Никаких подписок — платите только за то, что используете. Один токен — примерно 0.75 слова.",
  },
  {
    q: "Какие модели доступны бесплатно?",
    a: "Бесплатно доступны 5 моделей: GPT-4o mini, Claude Haiku 4.5, Gemini 2.0 Flash, Llama 4 Maverick и Mistral Large. Вы получаете 15 бесплатных запросов в день.",
  },
  {
    q: "Чем Stone AI отличается от ChatGPT Plus?",
    a: "Stone AI даёт доступ к 50+ моделям от разных компаний в одном месте — без VPN и зарубежных карт. Вы можете сравнивать ответы разных моделей и платите только за использованные токены вместо $20/мес подписки.",
  },
  {
    q: "Можно ли генерировать картинки?",
    a: "Да! Доступны Flux Schnell, SDXL, GPT-5 Image и другие модели для генерации и редактирования изображений прямо в чате.",
  },
  {
    q: "Какие способы оплаты поддерживаются?",
    a: "Telegram Stars, банковские карты и СБП (через Lava), а также криптовалюта — USDT, BTC, ETH (через Heleket). Для пользователей из России доступны все способы без ограничений.",
  },
  {
    q: "Сколько стоит один запрос?",
    a: "Зависит от модели. GPT-4o mini — от $0.004 за запрос, Claude Opus 4 — от $0.20 за запрос. Точная стоимость зависит от длины вашего вопроса и ответа. После каждого запроса вы видите, сколько было списано.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 md:py-28 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-12">
          Частые вопросы
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
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
                <div className="px-5 text-sm text-text/60 leading-relaxed">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
