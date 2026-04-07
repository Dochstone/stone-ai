"use client";

import { useState } from "react";

// ─── Prompt Templates ───

const PROMPT_CATEGORIES = [
  { id: "popular", label: "Популярное", icon: "⭐" },
  { id: "marketing", label: "Маркетинг", icon: "📢" },
  { id: "code", label: "Код", icon: "💻" },
  { id: "text", label: "Тексты", icon: "✍️" },
  { id: "images", label: "Картинки", icon: "🎨" },
  { id: "analysis", label: "Анализ", icon: "📊" },
  { id: "translate", label: "Перевод", icon: "🌍" },
];

const PROMPT_TEMPLATES: Record<string, { text: string; model: string }[]> = {
  popular: [
    { text: "Напиши пост для Telegram-канала на тему: ", model: "gpt-4o-mini" },
    { text: "Сгенерируй фотореалистичную картинку: ", model: "nano-banana-pro" },
    { text: "Объясни простыми словами что такое ", model: "gpt-4o-mini" },
    { text: "Найди актуальную информацию про ", model: "perplexity-sonar" },
    { text: "Напиши функцию на Python которая ", model: "devstral" },
    { text: "Переведи на английский сохранив тон: ", model: "gpt-4o-mini" },
  ],
  marketing: [
    { text: "Напиши 5 вариантов заголовка для рекламы продукта: ", model: "gpt-4o-mini" },
    { text: "Составь контент-план на неделю для Telegram-канала про ", model: "gpt-4o-mini" },
    { text: "Напиши email-рассылку для клиентов. Тема: ", model: "gpt-4o-mini" },
    { text: "Напиши описание товара для маркетплейса. Товар: ", model: "gpt-4o-mini" },
    { text: "Придумай 10 идей для Reels/Shorts на тему ", model: "gpt-4o-mini" },
    { text: "Проанализируй целевую аудиторию для продукта: ", model: "gpt-4o-mini" },
    { text: "Напиши скрипт продаж для холодного звонка. Продукт: ", model: "gpt-4o-mini" },
    { text: "Составь УТП (уникальное торговое предложение) для ", model: "gpt-4o-mini" },
  ],
  code: [
    { text: "Напиши функцию на Python: ", model: "devstral" },
    { text: "Сделай code review этого кода и найди баги:\n\n", model: "devstral" },
    { text: "Перепиши этот код с async/await:\n\n", model: "devstral" },
    { text: "Напиши SQL-запрос: ", model: "gpt-4o-mini" },
    { text: "Напиши unit-тесты для этой функции:\n\n", model: "devstral" },
    { text: "Напиши REST API на FastAPI: ", model: "devstral" },
    { text: "Объясни этот алгоритм строка за строкой:\n\n", model: "gpt-4o-mini" },
    { text: "Напиши Dockerfile для Node.js приложения с multi-stage build", model: "devstral" },
  ],
  text: [
    { text: "Напиши статью на тему: ", model: "gpt-4o-mini" },
    { text: "Перепиши текст в более формальном стиле:\n\n", model: "gpt-4o-mini" },
    { text: "Сократи текст до 3 предложений сохранив смысл:\n\n", model: "gpt-4o-mini" },
    { text: "Напиши сценарий для YouTube-видео на 5 минут. Тема: ", model: "gpt-4o-mini" },
    { text: "Исправь грамматические ошибки в тексте:\n\n", model: "gpt-4o-mini" },
    { text: "Напиши резюме/CV для специалиста: ", model: "gpt-4o-mini" },
    { text: "Составь список плюсов и минусов: ", model: "gpt-4o-mini" },
    { text: "Напиши поздравление с днём рождения для ", model: "gpt-4o-mini" },
  ],
  images: [
    { text: "Фотореалистичный портрет: ", model: "nano-banana-pro" },
    { text: "Минималистичный логотип для компании: ", model: "nano-banana-pro" },
    { text: "Flat illustration для мобильного приложения: ", model: "nano-banana" },
    { text: "Обложка для Telegram-канала: ", model: "nano-banana-pro" },
    { text: "Мем в стиле: ", model: "nano-banana" },
    { text: "Концепт-арт: ", model: "nano-banana-pro" },
  ],
  analysis: [
    { text: "Проанализируй этот документ и выдели ключевые пункты:\n\n", model: "gpt-4o-mini" },
    { text: "Сравни плюсы и минусы: ", model: "gpt-4o-mini" },
    { text: "Составь SWOT-анализ для компании: ", model: "gpt-4o-mini" },
    { text: "Найди актуальные данные и проведи исследование рынка: ", model: "perplexity-sonar" },
    { text: "Проверь этот контракт на скрытые риски:\n\n", model: "gpt-4o-mini" },
    { text: "Посчитай unit-экономику для бизнеса: ", model: "gpt-4o-mini" },
  ],
  translate: [
    { text: "Переведи на английский, сохрани деловой тон:\n\n", model: "gpt-4o-mini" },
    { text: "Переведи на русский:\n\n", model: "gpt-4o-mini" },
    { text: "Переведи маркетинговый текст на английский. Адаптируй метафоры:\n\n", model: "gpt-4o-mini" },
    { text: "Переведи техническую документацию. Термины оставь на английском:\n\n", model: "gpt-4o-mini" },
    { text: "Переведи с китайского на русский:\n\n", model: "gpt-4o-mini" },
    { text: "Переведи субтитры с японского на русский:\n\n", model: "gpt-4o-mini" },
  ],
};

const WELCOME_CONFIG: Record<string, { icon: string; bg: string; title: string; subtitle: string }> = {
  all: { icon: "💬", bg: "bg-accent", title: "Чем могу помочь?", subtitle: "Выберите шаблон или напишите свой запрос" },
  free: { icon: "✨", bg: "bg-teal", title: "Бесплатные модели", subtitle: "8 моделей без ограничений — 15 запросов в день" },
  image: { icon: "🎨", bg: "bg-pink-500", title: "Генерация изображений", subtitle: "Опишите картинку — AI создаст её за секунды" },
  video: { icon: "🎬", bg: "bg-red-500", title: "Генерация видео", subtitle: "Опишите сцену — AI создаст видео из текста" },
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
          <img src="/mascots/stone-mascot-chat.png" alt="Stone AI" width="72" height="72" className="mx-auto mb-3" />
          <h1 className="text-xl sm:text-2xl font-extrabold text-text mb-1">{cfg.title}</h1>
          <p className="text-xs sm:text-sm text-text/40">{cfg.subtitle}</p>
        </div>

        {isFree ? (
          <>
            {/* Free models guide */}
            <div className="max-w-lg mx-auto text-left space-y-2">
              {[
                { id: "gpt-4o-mini", name: "GPT-4o mini", icon: "🟢", desc: "Универсальная модель от OpenAI. Тексты, переводы, код, ответы на вопросы.", best: "Лучшая для большинства задач" },
                { id: "gemini-2.0-flash", name: "Gemini Flash", icon: "⚡", desc: "Самая быстрая модель от Google. Ответ за доли секунды.", best: "Когда важна скорость" },
                { id: "claude-haiku-4.5", name: "Claude Haiku", icon: "🟣", desc: "Аккуратная модель от Anthropic. Вежливые, структурированные ответы.", best: "Деловые письма, анализ" },
                { id: "deepseek-v3", name: "DeepSeek V3", icon: "🔵", desc: "Мощная open-source модель. Отлично пишет код и решает задачи.", best: "Код и математика" },
                { id: "llama-4-maverick", name: "Llama 4", icon: "🦙", desc: "Креативная модель от Meta. Хороша для мозговых штурмов и идей.", best: "Креатив и брейншторм" },
                { id: "mistral-large-25", name: "Mistral Large", icon: "🌊", desc: "Европейская модель. Хорошо работает с русским и другими языками.", best: "Мультиязычные задачи" },
                { id: "nano-banana", name: "Nano Banana", icon: "🎨", desc: "Генерация картинок из текста. Единственная бесплатная модель для изображений.", best: "Картинки бесплатно" },
              ].map((m) => (
                <button key={m.id} onClick={() => onSuggestion("", m.id)}
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
                <p className="text-[10px] text-text/40">Безлимит от 390₽/мес</p>
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
