"use client";

import { useState } from "react";
import { PROMPT_CATEGORIES, PROMPT_TEMPLATES } from "@/lib/prompt-templates";

const WELCOME_CONFIG: Record<string, { icon: string; bg: string; title: string; subtitle: string }> = {
  all: { icon: "💬", bg: "bg-accent", title: "Чем могу помочь?", subtitle: "Выберите шаблон или напишите свой запрос" },
  free: { icon: "✨", bg: "bg-teal", title: "Бесплатные модели", subtitle: "8 моделей без ограничений — 10 запросов в день" },
  image: { icon: "🎨", bg: "bg-pink-500", title: "Генерация изображений", subtitle: "2 бесплатные картинки · Опишите — AI создаст за секунды" },
  video: { icon: "🎬", bg: "bg-red-500", title: "Генерация видео", subtitle: "1 бесплатное видео через Veo 3 · Опишите сцену — AI создаст видео" },
  "3d": { icon: "🧊", bg: "bg-cyan-500", title: "Генерация 3D", subtitle: "Опишите объект или загрузите фото" },
  health: { icon: "🏥", bg: "bg-emerald-500", title: "AI Консультант", subtitle: "Загрузите фото или опишите симптомы" },
};

export default function WelcomeScreen({ onSuggestion, activeTab, plan }: { onSuggestion: (text: string, modelId: string) => void; activeTab: string; plan?: string }) {
  const [promptCat, setPromptCat] = useState("popular");
  const cfg = WELCOME_CONFIG[activeTab] || WELCOME_CONFIG.all;
  const isChat = activeTab === "all" || activeTab === "chat";
  const isFree = activeTab === "free";

  return (
    <div className="flex-1 flex items-start justify-center px-4 overflow-y-auto">
      <div className="text-center max-w-2xl w-full py-6 sm:py-8">
        <div className="mb-6">
          <img src="/mascots/stone-mascot-chat.webp" alt="Stone AI" width="72" height="72" className="mx-auto mb-3" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-text mb-1">{cfg.title}</h1>
          <p className="text-xs sm:text-sm text-text/40">{cfg.subtitle}</p>
        </div>

        {isFree ? (
          <>
            {/* Free models guide */}
            <div className="max-w-lg mx-auto text-left space-y-2">
              {[
                { id: "gpt-4o-mini", name: "GPT-4o mini", icon: "🟢", desc: "Универсальная модель от OpenAI. Тексты, переводы, код, ответы на вопросы.", best: "Лучшая для большинства задач", prompt: "Привет! Расскажи что ты умеешь и чем можешь помочь" },
                { id: "gemini-2.0-flash", name: "Gemini Flash", icon: "⚡", desc: "Самая быстрая модель от Google. Ответ за доли секунды.", best: "Когда важна скорость", prompt: "Быстро объясни что такое нейросети простыми словами" },
                { id: "claude-haiku-4.5", name: "Claude Haiku", icon: "🟣", desc: "Аккуратная модель от Anthropic. Вежливые, структурированные ответы.", best: "Деловые письма, анализ", prompt: "Напиши деловое письмо клиенту с благодарностью за сотрудничество" },
                { id: "deepseek-v3", name: "DeepSeek V3", icon: "🔵", desc: "Мощная open-source модель. Отлично пишет код и решает задачи.", best: "Код и математика", prompt: "Напиши функцию на Python для сортировки списка словарей по ключу" },
                { id: "llama-4-maverick", name: "Llama 4", icon: "🦙", desc: "Креативная модель от Meta. Хороша для мозговых штурмов и идей.", best: "Креатив и брейншторм", prompt: "Придумай 5 креативных идей для Telegram-канала о путешествиях" },
                { id: "mistral-large-25", name: "Mistral Large", icon: "🌊", desc: "Европейская модель. Хорошо работает с русским и другими языками.", best: "Мультиязычные задачи", prompt: "Переведи на английский сохранив стиль: Добро пожаловать в Stone AI — AI-студию нового поколения" },
                { id: "nano-banana", name: "Nano Banana", icon: "🎨", desc: "Генерация картинок из текста. Бесплатная модель для изображений.", best: "2 бесплатно", prompt: "Нарисуй уютную кофейню в стиле Pixar с тёплым освещением" },
                { id: "veo-3", name: "Veo 3", icon: "🎬", desc: "Генерация видео от Google. 4K, lip-sync, звуковой дизайн.", best: "1 бесплатно/день", prompt: "Создай 5-секундное видео: закат на океане, волны бьются о скалы" },
              ].map((m) => (
                <button key={m.id} onClick={() => onSuggestion(m.prompt, m.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-text/[0.06] bg-bg hover:border-accent/30 hover:shadow-sm transition-all group">
                  <span className="text-2xl shrink-0">{m.icon}</span>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-text group-hover:text-accent transition-colors">{m.name}</span>
                      <span className="text-[9px] bg-teal/10 text-teal font-bold px-1.5 py-0.5 rounded-full">{m.best}</span>
                    </div>
                    <p className="text-[11px] text-text/40 leading-snug mt-0.5">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : isChat ? (
          <>
            {/* Category tabs */}
            <div className="flex gap-1 pb-2 mb-4 justify-center flex-wrap">
              {PROMPT_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setPromptCat(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    promptCat === cat.id ? "bg-accent text-white" : "bg-bg text-text/40 border border-text/[0.06] hover:text-text/60"
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
            {/* Prompt cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg mx-auto text-left">
              {(PROMPT_TEMPLATES[promptCat] || []).map((tmpl, i) => (
                <button
                  key={i}
                  onClick={() => onSuggestion(tmpl.text, tmpl.model)}
                  className="p-3 rounded-xl border border-text/[0.06] bg-bg hover:border-accent/30 hover:shadow-sm transition-all group"
                >
                  <span className="text-[12px] sm:text-[13px] text-text/70 group-hover:text-accent transition-colors leading-snug line-clamp-2">{tmpl.text}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto text-left">
            {(activeTab === "image" ? [
              { text: "Фотореалистичный портрет девушки в осеннем парке", model: "nano-banana-pro" },
              { text: "Минималистичный логотип кофейни, flat design", model: "nano-banana-pro" },
              { text: "Космическая станция на орбите Юпитера", model: "nano-banana-pro" },
              { text: "Милый кот в костюме астронавта", model: "nano-banana" },
            ] : activeTab === "video" ? [
              { text: "Камера пролетает над зелёным лесом на рассвете", model: "sora-2" },
              { text: "Девушка идёт по пляжу, закат, кинематографично", model: "veo-3" },
              { text: "Таймлапс ночного города, огни, 4K", model: "runway-gen3" },
              { text: "Золотая рыбка в коралловом рифе", model: "luma-ray2" },
            ] : activeTab === "3d" ? [
              { text: "Средневековый замок, low-poly стиль", model: "tripo-v2.5" },
              { text: "Спортивная машина, фотореалистичная", model: "tripo-v2.5" },
              { text: "Стилизованное дерево для игры", model: "triposr" },
              { text: "Фигурка робота для 3D-печати", model: "tripo-v2.5" },
            ] : /* health */ [
              { text: "Покраснение и раздражение глаза", model: "gpt-4o-mini" },
              { text: "Высыпания на коже рук, 3 дня назад", model: "gpt-4o-mini" },
              { text: "Изменился цвет и форма ногтей", model: "gpt-4o-mini" },
              { text: "Частые головные боли, что делать?", model: "gpt-4o-mini" },
            ]).map((tmpl, i) => (
              <button
                key={i}
                onClick={() => onSuggestion(tmpl.text, tmpl.model)}
                className="p-3 rounded-xl border border-text/[0.06] bg-bg hover:border-accent/30 hover:shadow-sm transition-all group"
              >
                <span className="text-[12px] sm:text-[13px] text-text/70 group-hover:text-accent transition-colors leading-snug line-clamp-2">{tmpl.text}</span>
              </button>
            ))}
          </div>
        )}

        {/* Upgrade CTA — only for free/mini */}
        {activeTab === "all" && plan !== "max" && plan !== "max-pro" && (
          <div className="mt-6 max-w-lg mx-auto">
            <a href="/pricing" className="flex items-center justify-between bg-accent/5 hover:bg-accent/10 border border-accent/15 rounded-xl px-4 py-3 transition-colors">
              <div>
                <p className="text-[12px] font-bold text-text">Хотите GPT-5.4 и Claude Opus?</p>
                <p className="text-[10px] text-text/40">Безлимит от 590₽/мес</p>
              </div>
              <span className="text-accent text-xs font-bold shrink-0">Тарифы →</span>
            </a>
            <a href="/referral" className="flex items-center justify-between bg-teal/5 hover:bg-teal/10 border border-teal/10 rounded-xl px-4 py-2.5 mt-2 transition-colors">
              <div className="flex items-center gap-2">
                <span>🎁</span>
                <span className="text-[11px] text-text/50">Пригласи друга — <span className="font-bold text-teal">+5 запросов обоим</span></span>
              </div>
              <span className="text-teal text-[10px] font-semibold shrink-0">Пригласить →</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
