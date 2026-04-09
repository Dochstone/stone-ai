"use client";

import { useState } from "react";
import { MODELS } from "@/lib/models";

const AVG_TOKENS_PER_REQUEST = 1500;

export default function PricingCalculator() {
  const [modelId, setModelId] = useState("gpt-4o-mini");
  const [requests, setRequests] = useState(100);

  const model = MODELS.find((m) => m.id === modelId) ?? MODELS[0];

  let cost: string;
  const ppm = model.pricePerMillion || 0;
  if (model.priceUnit) {
    cost = (ppm * requests).toFixed(2);
  } else {
    const tokens = requests * AVG_TOKENS_PER_REQUEST;
    cost = ((tokens / 1_000_000) * ppm).toFixed(2);
  }

  return (
    <section className="mb-20">
      <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-3">
        Калькулятор стоимости
      </h2>
      <p className="text-text/60 text-center mb-10 max-w-lg mx-auto text-sm">
        Выберите модель и количество запросов, чтобы узнать примерную стоимость.
      </p>

      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-text/5 p-6 md:p-8">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2">Модель</label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.company}
                  {m.tier === "free" ? " (FREE)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Количество {model.priceUnit ? "изображений" : "запросов"}
            </label>
            <input
              type="number"
              min={1}
              max={100000}
              value={requests}
              onChange={(e) =>
                setRequests(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
            />
            <div className="flex gap-2 mt-2">
              {[10, 50, 100, 500, 1000].map((n) => (
                <button
                  key={n}
                  onClick={() => setRequests(n)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    requests === n
                      ? "bg-accent text-white shadow-sm"
                      : "bg-bg text-text/50 hover:bg-text/5"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {!model.priceUnit && (
            <p className="text-xs text-text/35">
              * Расчёт при средних ~{AVG_TOKENS_PER_REQUEST.toLocaleString()} токенов на запрос
            </p>
          )}

          <div className="border-t border-text/10 pt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text/50">Примерная стоимость</p>
                <p className="text-xs text-text/30 mt-0.5">
                  {model.name} &times; {requests}{" "}
                  {model.priceUnit ? "изобр." : "запр."}
                </p>
              </div>
              <p className="text-3xl md:text-4xl font-extrabold text-accent">${cost}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
