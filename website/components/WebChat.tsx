"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MODELS, type AIModel } from "@/lib/models";
import AuthFormComponent, { type AuthState } from "@/components/AuthForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

const IMAGE_MODEL_IDS = new Set([
  "nano-banana-pro", "nano-banana", "gpt-5-image", "gpt-5-image-mini",
  "flux-schnell", "stable-diffusion-xl",
]);

const VIDEO_MODEL_IDS = new Set([
  "kling-v3", "sora-2", "veo-3", "kling-v2", "runway-gen3", "pika-2", "minimax", "pixverse-v5", "luma-dream", "stable-video", "wan-2", "hunyuan", "ltx-video",
]);

const THREED_MODEL_IDS = new Set(["tripo-v2.5", "triposr"]);

// Model access tiers for lock icons
const FREE_MODEL_IDS = new Set([
  "gpt-4o-mini", "gemini-2.0-flash", "deepseek-v3",
  "llama-4-maverick", "mistral-small", "qwen-turbo", "nano-banana",
]);
const MINI_MODEL_IDS = new Set([
  "gpt-4o-mini", "gemini-2.0-flash", "deepseek-v3",
  "llama-4-maverick", "mistral-small", "qwen-turbo", "nano-banana",
  "claude-haiku-4.5", "claude-sonnet-4", "gpt-4.1-mini", "gpt-5.1",
  "gemini-2.5-flash", "grok-3-mini", "deepseek-r1", "deepseek-v3.2",
  "nano-banana-pro", "gpt-5-image-mini", "gpt-5-image",
]);

function getModelLockInfo(modelId: string, balance: number, plan?: string): { locked: boolean; tier: string; price: string } | null {
  if (balance > 0) return null;
  if (plan === "max-pro" || plan === "max") return null; // full access
  if (plan === "mini" && MINI_MODEL_IDS.has(modelId)) return null;
  if (FREE_MODEL_IDS.has(modelId)) return null;
  // Video/3D/audio — access checked on backend, don't lock on frontend
  if (VIDEO_MODEL_IDS.has(modelId) || THREED_MODEL_IDS.has(modelId) || IMAGE_MODEL_IDS.has(modelId)) return null;
  if (MINI_MODEL_IDS.has(modelId)) return { locked: true, tier: "Mini", price: "390₽/мес" };
  return { locked: true, tier: "Max", price: "890₽/мес" };
}

// ─── Helpers ───

function extractImageUrl(text: string): string | null {
  const b64Match = text.match(/(data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+)/);
  if (b64Match) return b64Match[1];
  const mdMatch = text.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
  if (mdMatch) return mdMatch[1];
  const urlMatch = text.match(/(https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s"'<>]*)?)/i);
  if (urlMatch) return urlMatch[1];
  const jsonUrlMatch = text.match(/"url"\s*:\s*"(https?:\/\/[^"]+)"/);
  if (jsonUrlMatch) return jsonUrlMatch[1];
  // OpenAI DALL-E URLs (oaidalleapi blob storage, no file extension)
  const oaiMatch = text.match(/(https?:\/\/oaidalleapi[^\s"'<>]+)/i);
  if (oaiMatch) return oaiMatch[1];
  // fal.media URLs
  const falMatch = text.match(/(https?:\/\/[^\s"'<>]*fal\.media[^\s"'<>]+)/i);
  if (falMatch) return falMatch[1];
  // If content is just a URL on its own line
  const pureUrl = text.trim();
  if (pureUrl.match(/^https?:\/\/\S+$/) && (pureUrl.includes("image") || pureUrl.includes("dalle") || pureUrl.includes("fal.media"))) return pureUrl;
  return null;
}

function downloadImage(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

function formatPrice(m: AIModel) {
  if (m.tier === "free") return "FREE";
  if (m.priceUnit) return `$${m.pricePerMillion}${m.priceUnit}`;
  return `$${m.pricePerMillion}/1M`;
}

// ─── Markdown Renderer ───

function renderMarkdown(text: string): string {
  let html = text
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      const escaped = code.replace(/</g, "&lt;").replace(/>/g, "&gt;").trimEnd();
      return `<div class="code-block-wrapper"><div class="code-block-header"><span class="code-lang">${lang || "code"}</span><button class="code-copy-btn" onclick="(function(btn){var code=btn.closest('.code-block-wrapper').querySelector('code').textContent;navigator.clipboard.writeText(code);btn.textContent='Скопировано!';setTimeout(function(){btn.textContent='Копировать'},2000)})(this)">Копировать</button></div><pre class="code-block"><code>${escaped}</code></pre></div>`;
    })
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    .replace(/^### (.+)$/gm, '<h3 class="md-h3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="md-h2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="md-h1">$1</h1>')
    .replace(/^[*-] (.+)$/gm, '<li class="md-li">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="md-li md-oli">$1</li>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="md-link">$1</a>')
    .replace(/\n/g, "<br/>");

  html = html.replace(/((?:<li class="md-li">.*?<\/li><br\/>?)+)/g, (match) => {
    const cleaned = match.replace(/<br\/?>/g, "");
    return `<ul class="md-ul">${cleaned}</ul>`;
  });

  return html;
}

// ─── Types ───

interface FileAttachment {
  file_id: string;
  file_name: string;
  file_type: "image" | "pdf";
  mime_type: string;
  size: number;
  content: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  file?: FileAttachment;
  video?: { url: string; cost_usd?: number };
  threed?: { url: string; cost_usd?: number };
  billing?: {
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    balance_usd: number;
    billing_mode: string;
  };
}

interface ChatSessionItem {
  id: number;
  model_id: string;
  title: string;
  updated_at: string | null;
}

// ─── Company icon for AI avatar ───

const companyIcons: Record<string, string> = {
  OpenAI: "G", Anthropic: "A", Google: "G", Meta: "M", Mistral: "M",
  DeepSeek: "D", xAI: "X", Perplexity: "P", Alibaba: "Q", MiniMax: "M",
  Zhipu: "Z", Cohere: "C", Microsoft: "M", NVIDIA: "N", Gryphe: "G",
  BFL: "F", Stability: "S", Moonshot: "K",
};

const companyColors: Record<string, string> = {
  OpenAI: "#10a37f", Anthropic: "#d97706", Google: "#4285f4", Meta: "#0668E1",
  Mistral: "#7c3aed", DeepSeek: "#06b6d4", xAI: "#64748b", Perplexity: "#6366f1",
  Alibaba: "#ff6a00", MiniMax: "#ec4899", Zhipu: "#0ea5e9", Cohere: "#39d353",
  Microsoft: "#00a4ef", NVIDIA: "#76b900", Gryphe: "#8b5cf6", BFL: "#f59e0b",
  Stability: "#a855f7", Moonshot: "#06b6d4",
};

// ─── Message Content ───

function ImageWithDownload({ url, caption }: { url: string; caption?: string }) {
  return (
    <div>
      <img
        src={url}
        alt="Generated image"
        className="max-w-full rounded-xl mb-2"
        style={{ maxHeight: 400 }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
      {caption && <div className="whitespace-pre-wrap text-sm mb-2">{caption}</div>}
      <button
        onClick={() => downloadImage(url, `stone-ai-${Date.now()}.png`)}
        className="flex items-center gap-1.5 text-[11px] text-accent font-semibold hover:underline mt-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
        </svg>
        Скачать
      </button>
    </div>
  );
}

function stripImageFromText(content: string): string {
  return content
    .replace(/(data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+)/, "")
    .replace(/!\[.*?\]\(https?:\/\/[^\s)]+\)/g, "")
    .replace(/(https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s"'<>]*)?)/gi, "")
    .replace(/"url"\s*:\s*"https?:\/\/[^"]+"/g, "")
    .trim();
}

function ThinkingBlock({ content }: { content: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-[11px] text-text/30 hover:text-text/50 transition-colors py-1"
      >
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span className="font-semibold">Ход мыслей</span>
        <span className="text-text/15">({content.length} симв.)</span>
      </button>
      {open && (
        <div className="mt-1 pl-3 border-l-2 border-text/10 text-[12px] text-text/40 leading-relaxed max-h-[300px] overflow-y-auto">
          <div className="whitespace-pre-wrap">{content}</div>
        </div>
      )}
    </div>
  );
}

function MessageContent({ content, role, selectedModel }: { content: string; role: string; selectedModel: string }) {
  if (role !== "assistant" || !content) {
    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  }

  // Extract <think>...</think> block
  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  const thinkContent = thinkMatch ? thinkMatch[1].trim() : null;
  const displayContent = thinkMatch ? content.replace(/<think>[\s\S]*?<\/think>/, "").trim() : content;
  // Detect still-thinking (open <think> without close)
  const isStillThinking = !thinkMatch && content.includes("<think>") && !content.includes("</think>");
  const partialThink = isStillThinking ? content.replace("<think>", "").trim() : null;

  const imageUrl = extractImageUrl(displayContent);
  const isImageModel = IMAGE_MODEL_IDS.has(selectedModel);

  return (
    <div>
      {/* Still thinking indicator */}
      {isStillThinking && (
        <div className="flex items-center gap-2 mb-2 text-[11px] text-text/30">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="font-semibold">Размышляет...</span>
        </div>
      )}

      {/* Completed thinking block */}
      {thinkContent && <ThinkingBlock content={thinkContent} />}

      {/* Main content */}
      {imageUrl ? (
        <>
          <ImageWithDownload url={imageUrl} caption={stripImageFromText(displayContent) || undefined} />
        </>
      ) : displayContent.match(/^https?:\/\/\S+$/) ? (
        <ImageWithDownload url={displayContent.trim()} />
      ) : displayContent ? (
        <div className="md-content break-words" dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent) }} />
      ) : null}
    </div>
  );
}

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

// ─── Welcome Screen ───

const WELCOME_CONFIG: Record<string, { icon: string; bg: string; title: string; subtitle: string }> = {
  all: { icon: "💬", bg: "bg-accent", title: "Чем могу помочь?", subtitle: "Выберите шаблон или напишите свой запрос" },
  free: { icon: "✨", bg: "bg-teal", title: "Бесплатные модели", subtitle: "7 моделей без ограничений — 15 запросов в день" },
  image: { icon: "🎨", bg: "bg-pink-500", title: "Генерация изображений", subtitle: "Опишите картинку — AI создаст её за секунды" },
  video: { icon: "🎬", bg: "bg-red-500", title: "Генерация видео", subtitle: "Опишите сцену — AI создаст видео из текста" },
  "3d": { icon: "🧊", bg: "bg-cyan-500", title: "Генерация 3D", subtitle: "Опишите объект или загрузите фото" },
  health: { icon: "🏥", bg: "bg-emerald-500", title: "AI Консультант", subtitle: "Загрузите фото или опишите симптомы" },
};

function WelcomeScreen({ onSuggestion, activeTab }: { onSuggestion: (text: string, modelId: string) => void; activeTab: string }) {
  const [promptCat, setPromptCat] = useState("popular");
  const cfg = WELCOME_CONFIG[activeTab] || WELCOME_CONFIG.all;
  const isChat = activeTab === "all" || activeTab === "chat" || activeTab === "free";

  return (
    <div className="flex-1 flex items-start justify-center px-4 overflow-y-auto">
      <div className="text-center max-w-2xl w-full py-6 sm:py-8">
        <div className="mb-6">
          <div className={`w-14 h-14 mx-auto rounded-2xl ${cfg.bg} flex items-center justify-center shadow-lg mb-3`}>
            <span className="text-3xl">{cfg.icon}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-text mb-1">{cfg.title}</h1>
          <p className="text-xs sm:text-sm text-text/40">{cfg.subtitle}</p>
        </div>

        {isChat ? (
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
              { text: "Камера пролетает над зелёным лесом на рассвете", model: "kling-v3" },
              { text: "Девушка идёт по пляжу, закат, кинематографично", model: "sora-2" },
              { text: "Таймлапс ночного города, огни, 4K", model: "veo-3" },
              { text: "Золотая рыбка в коралловом рифе", model: "kling-v3" },
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
      </div>
    </div>
  );
}

// ─── Templates Picker (reusable in welcome + inline) ───

function TemplatesPicker({ onSelect }: { onSelect: (text: string, modelId: string) => void }) {
  const [cat, setCat] = useState("popular");
  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-2 mb-2">
        {PROMPT_CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
              cat === c.id ? "bg-accent text-white" : "bg-bg text-text/40 hover:text-text/60"
            }`}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {(PROMPT_TEMPLATES[cat] || []).map((tmpl, i) => (
          <button key={i} onClick={() => onSelect(tmpl.text, tmpl.model)}
            className="p-2.5 rounded-lg border border-text/[0.06] bg-bg hover:border-accent/30 transition-all text-left">
            <span className="text-[11px] sm:text-[12px] text-text/60 hover:text-accent leading-snug line-clamp-2">{tmpl.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Scroll to Bottom Button ───

function ScrollToBottom({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShow(distFromBottom > 200);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  if (!show) return null;

  return (
    <button
      onClick={() => containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: "smooth" })}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-bg border border-text/10 shadow-lg flex items-center justify-center text-text/40 hover:text-text/70 transition-colors z-10"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </button>
  );
}

// ─── Sidebar ───

function Sidebar({
  open,
  onToggle,
  sessions,
  activeSessionId,
  onLoadSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
}: {
  open: boolean;
  onToggle: () => void;
  sessions: ChatSessionItem[];
  activeSessionId: number | null;
  onLoadSession: (id: number) => void;
  onNewChat: () => void;
  onDeleteSession: (id: number) => void;
  onRenameSession: (id: number, title: string) => void;
}) {
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  return (
    <>
      {/* Backdrop — mobile only */}
      <div
        className={`fixed inset-0 z-30 lg:hidden transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ backgroundColor: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
        onClick={onToggle}
      />

      {/* Sidebar panel */}
      <div
        className={`webchat-sidebar fixed inset-y-0 left-0 z-40 bg-bg flex flex-col lg:relative lg:shrink-0 ${open ? "open" : "closed"}`}
      >
        {/* Top: New Chat + Collapse */}
        <div className="p-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onNewChat(); if (window.innerWidth < 1024) onToggle(); }}
              className="flex-1 flex items-center gap-2 bg-accent hover:bg-accent/90 rounded-xl px-3.5 py-2 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-[13px] font-semibold text-white">Новый чат</span>
            </button>
            <button
              onClick={onToggle}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-text/[0.06] text-text/30 hover:text-text/60 transition-colors shrink-0"
              aria-label="Закрыть sidebar"
            >
              {/* Chevron on desktop, X on mobile */}
              <svg className="w-4 h-4 hidden lg:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M11 19l-7-7 7-7" />
              </svg>
              <svg className="w-4 h-4 lg:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        {sessions.length > 3 && (
          <div className="px-3 pb-2 shrink-0">
            <input
              type="text"
              placeholder="Поиск чатов..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="w-full bg-bg border border-text/10 rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
          </div>
        )}

        {/* Chat sessions list */}
        <div className="flex-1 overflow-y-auto px-2">
          {sessions.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <div className="text-3xl mb-2 opacity-20">💬</div>
              <p className="text-[11px] text-text/20">Здесь появятся ваши чаты</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {sessions.filter(s => !sidebarSearch || s.title?.toLowerCase().includes(sidebarSearch.toLowerCase())).map((s) => (
                <div
                  key={s.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    activeSessionId === s.id
                      ? "bg-accent/10 shadow-sm"
                      : "hover:bg-text/[0.04]"
                  }`}
                  onClick={() => { if (editingId !== s.id) { onLoadSession(s.id); if (window.innerWidth < 1024) onToggle(); } }}
                  onDoubleClick={(e) => { e.stopPropagation(); setEditingId(s.id); setEditTitle(s.title || ""); }}
                >
                  <div className="flex-1 min-w-0">
                    {editingId === s.id ? (
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => { if (editTitle.trim() && editTitle !== s.title) onRenameSession(s.id, editTitle.trim()); setEditingId(null); }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { if (editTitle.trim() && editTitle !== s.title) onRenameSession(s.id, editTitle.trim()); setEditingId(null); }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-[13px] font-medium text-text bg-bg border-2 border-accent/30 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent/30"
                      />
                    ) : (
                      <span className={`text-[13px] font-medium truncate block ${
                        activeSessionId === s.id ? "text-text" : "text-text/70"
                      }`}>
                        {s.title}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-text/25">{MODELS.find(m => m.id === s.model_id)?.name || s.model_id}</span>
                      {s.updated_at && (
                        <span className="text-[10px] text-text/15">{new Date(s.updated_at).toLocaleDateString("ru-RU")}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
                    className="text-text/10 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </>
  );
}

// ─── Main WebChat ───

// ── Voice Button — browser Web Speech API (free, instant) ──
function VoiceButton({ text, token }: { text: string; token: string }) {
  const [state, setState] = useState<"idle" | "playing" | "paused">("idle");

  const play = () => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text.slice(0, 3000));
    utter.lang = "ru-RU";
    utter.rate = 1.0;
    // Pick best Russian voice
    const voices = window.speechSynthesis.getVoices();
    const ruVoice = voices.find(v => v.lang === "ru-RU") || voices.find(v => v.lang.startsWith("ru"));
    if (ruVoice) utter.voice = ruVoice;
    utter.onend = () => setState("idle");
    utter.onerror = () => setState("idle");
    window.speechSynthesis.speak(utter);
    setState("playing");
  };

  const pause = () => { window.speechSynthesis.pause(); setState("paused"); };
  const resume = () => { window.speechSynthesis.resume(); setState("playing"); };
  const stop = () => { window.speechSynthesis.cancel(); setState("idle"); };

  return (
    <div className="flex items-center gap-1 mt-1.5">
      {state === "idle" && (
        <button onClick={play} className="flex items-center gap-1 text-text/20 hover:text-accent transition-colors" title="Озвучить">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
          <span className="text-[10px]">Озвучить</span>
        </button>
      )}
      {state === "playing" && (
        <>
          <button onClick={pause} className="flex items-center gap-1 text-accent" title="Пауза">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
            <span className="text-[10px]">Пауза</span>
          </button>
          <button onClick={stop} className="text-text/30 hover:text-red-400 transition-colors" title="Стоп">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          </button>
          <div className="flex items-end gap-[2px] h-3 ml-1">
            {[2,4,6,3,5,7,4,3,5,6].map((h,i) => (
              <div key={i} className="w-[2px] bg-accent/50 rounded-full" style={{ height: `${h * 1.5}px`, animation: `waveRec 0.4s ${i*0.04}s ease-in-out infinite alternate` }} />
            ))}
          </div>
        </>
      )}
      {state === "paused" && (
        <>
          <button onClick={resume} className="flex items-center gap-1 text-accent/60 hover:text-accent transition-colors" title="Продолжить">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></svg>
            <span className="text-[10px]">Продолжить</span>
          </button>
          <button onClick={stop} className="text-text/30 hover:text-red-400 transition-colors" title="Стоп">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
          </button>
        </>
      )}
    </div>
  );
}

export default function WebChat({ initialModel, initialCategory }: { initialModel?: string; initialCategory?: string } = {}) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedModel, setSelectedModel] = useState(initialModel && MODELS.some(m => m.id === initialModel) ? initialModel : "gpt-4o-mini");
  const [lockModal, setLockModal] = useState<{ model: string; tier: string; price: string } | null>(null);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [limits, setLimits] = useState<{ plan?: string; text?: { used: number; limit: number }; image?: { used: number; limit: number }; streak?: { days: number } } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingFile, setPendingFile] = useState<FileAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [modelCatFilter, setModelCatFilter] = useState<string>(initialCategory || "all");

  const [dragging, setDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const [upsellModal, setUpsellModal] = useState<{ type: "limit" | "locked"; model?: string; tier?: string } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [threedGenerating, setThreedGenerating] = useState(false);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollTimerRef.current) clearTimeout(pollTimerRef.current); };
  }, []);

  const model = useMemo(() => MODELS.find((m) => m.id === selectedModel), [selectedModel]);
  const isVideoModel = VIDEO_MODEL_IDS.has(selectedModel);
  const is3DModel = THREED_MODEL_IDS.has(selectedModel);

  // Load auth from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("stone_auth");
      if (saved) setAuth(JSON.parse(saved));
    } catch {}
    setLoaded(true);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  // Fetch usage limits
  useEffect(() => {
    if (!auth?.token) return;
    fetch(`${API_URL}/api/user/limits`, { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setLimits(data); })
      .catch(() => {});
  }, [auth?.token, messages.length]); // refetch after each message

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // Mobile keyboard: keep input visible
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const onResize = () => {
      const diff = window.innerHeight - vv.height;
      document.documentElement.style.setProperty("--kb-height", `${diff}px`);
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  // Load model-viewer script for 3D (once)
  useEffect(() => {
    if (document.querySelector('script[src*="model-viewer"]')) return;
    const s = document.createElement("script");
    s.type = "module";
    s.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
    document.head.appendChild(s);
  }, []);

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 80) + "px";
  }, []);

  const resetTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    localStorage.removeItem("stone_auth");
    setMessages([]);
    fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((prev) => !prev), []);

  // Fetch chat sessions
  const fetchSessions = useCallback(async () => {
    if (!auth) return;
    try {
      const res = await fetch(`${API_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {}
  }, [auth]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const loadSession = useCallback(async (sessionId: number) => {
    if (!auth) return;
    try {
      const res = await fetch(`${API_URL}/api/chats/${sessionId}/messages`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSessionId(sessionId);
        setSelectedModel(data.session.model_id);
        setMessages(data.messages.map((m: any) => ({
          role: m.role,
          content: m.content,
          billing: m.cost_usd > 0 ? {
            tokens_in: m.tokens_in, tokens_out: m.tokens_out,
            cost_usd: m.cost_usd, balance_usd: 0, billing_mode: "per_token",
          } : undefined,
        })));
      }
    } catch {}
  }, [auth]);

  const newChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") { e.preventDefault(); newChat(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "/") { e.preventDefault(); textareaRef.current?.focus(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "S") { e.preventDefault(); toggleSidebar(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [newChat, toggleSidebar]);

  const deleteSession = useCallback(async (sessionId: number) => {
    if (!auth) return;
    try {
      await fetch(`${API_URL}/api/chats/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) newChat();
    } catch {}
  }, [auth, activeSessionId, newChat]);

  const renameSession = useCallback(async (sessionId: number, title: string) => {
    if (!auth) return;
    try {
      await fetch(`${API_URL}/api/chats/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ title }),
      });
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
    } catch {}
  }, [auth]);

  const saveToSession = useCallback(async (userContent: string, assistantContent: string, billing: any) => {
    if (!auth) return;
    try {
      let sessionId = activeSessionId;
      if (!sessionId) {
        const res = await fetch(`${API_URL}/api/chats`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
          body: JSON.stringify({ model_id: selectedModel }),
        });
        if (res.ok) {
          const data = await res.json();
          sessionId = data.id;
          setActiveSessionId(sessionId);
        }
      }
      if (!sessionId) return;
      await fetch(`${API_URL}/api/chats/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ session_id: sessionId, role: "user", content: userContent }),
      });
      await fetch(`${API_URL}/api/chats/${sessionId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({
          session_id: sessionId, role: "assistant", content: assistantContent,
          tokens_in: billing?.tokens_in || 0, tokens_out: billing?.tokens_out || 0,
          cost_usd: billing?.cost_usd || 0,
        }),
      });
      fetchSessions();
    } catch {}
  }, [auth, activeSessionId, selectedModel, fetchSessions]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!auth) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_URL}/api/chat/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed" }));
        alert(err.detail || "Ошибка загрузки");
        return;
      }
      const data: FileAttachment = await res.json();
      setPendingFile(data);
    } catch {
      alert("Ошибка загрузки файла");
    } finally {
      setUploading(false);
    }
  }, [auth]);


  // 3D generation
  const send3DMessage = useCallback(async () => {
    if (!auth || (!input.trim() && !pendingFile) || threedGenerating) return;

    const prompt = input.trim() || undefined;
    const imageUrl = pendingFile?.file_type === "image" ? pendingFile.content : undefined;
    const userMsg: Message = { role: "user", content: prompt || `[3D из изображения: ${pendingFile?.file_name}]`, file: pendingFile || undefined };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setPendingFile(null);
    setThreedGenerating(true);
    resetTextarea();

    try {
      const res = await fetch(`${API_URL}/api/3d/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ model_id: selectedModel, prompt, image_url: imageUrl }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Ошибка" }));
        setMessages([...history, { role: "assistant", content: typeof err.detail === "string" ? err.detail : "Ошибка генерации 3D" }]);
        setThreedGenerating(false);
        return;
      }

      const data = await res.json();
      const taskId = data.task_id;

      // Update balance
      if (data.balance_usd !== undefined) {
        setAuth((prev) => prev ? { ...prev, balanceUsd: data.balance_usd } : prev);
        try { const s = localStorage.getItem("stone_auth"); if (s) { const p = JSON.parse(s); p.balanceUsd = data.balance_usd; localStorage.setItem("stone_auth", JSON.stringify(p)); } } catch {}
      }

      // Instant result (TripoSR)
      if (data.status === "completed" && data.model_url) {
        setMessages([...history, { role: "assistant", content: "3D модель готова!", threed: { url: data.model_url, cost_usd: data.cost_usd } }]);
        setThreedGenerating(false);
        return;
      }

      setMessages([...history, { role: "assistant", content: `Генерация 3D модели... (~${data.estimated_seconds || 60}с)\n${data.model} · $${data.cost_usd?.toFixed(2) || "0.00"}` }]);

      // Poll
      let attempts = 0;
      const poll = async () => {
        attempts++;
        try {
          const statusRes = await fetch(`${API_URL}/api/3d/status/${taskId}`, { headers: { Authorization: `Bearer ${auth.token}` } });
          if (!statusRes.ok) throw new Error("fail");
          const status = await statusRes.json();

          if (status.status === "completed" && status.model_url) {
            setMessages([...history, { role: "assistant", content: "3D модель готова!", threed: { url: status.model_url, cost_usd: data.cost_usd } }]);
            setThreedGenerating(false);
            return;
          }
          if (status.status === "failed") {
            setMessages([...history, { role: "assistant", content: `Ошибка: ${status.error || "Генерация не удалась"}` }]);
            setThreedGenerating(false);
            return;
          }
          if (attempts < 60) pollTimerRef.current = setTimeout(poll, 3000);
          else { setMessages([...history, { role: "assistant", content: "Таймаут генерации." }]); setThreedGenerating(false); }
        } catch { setMessages([...history, { role: "assistant", content: "Ошибка проверки статуса" }]); setThreedGenerating(false); }
      };
      pollTimerRef.current = setTimeout(poll, 3000);

    } catch {
      setMessages([...history, { role: "assistant", content: "Ошибка соединения" }]);
      setThreedGenerating(false);
    }
  }, [auth, input, threedGenerating, messages, selectedModel, pendingFile, resetTextarea]);

  // Video generation
  const sendVideoMessage = useCallback(async () => {
    if (!auth || (!input.trim() && !pendingFile) || videoGenerating) return;

    const prompt = input.trim();
    const imageUrl = pendingFile?.file_type === "image" ? pendingFile.content : undefined;
    const userMsg: Message = { role: "user", content: prompt || "[Видео из изображения]", file: pendingFile || undefined };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setPendingFile(null);
    setVideoGenerating(true);
    resetTextarea();

    try {
      // Submit
      const res = await fetch(`${API_URL}/api/video/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ model_id: selectedModel, prompt: prompt || "Animate this image", source_image_url: imageUrl }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Ошибка" }));
        setMessages([...history, { role: "assistant", content: typeof err.detail === "string" ? err.detail : "Ошибка генерации видео" }]);
        setVideoGenerating(false);
        return;
      }

      const data = await res.json();
      const taskId = data.task_id;

      // Update balance
      if (data.balance_usd !== undefined) {
        setAuth((prev) => prev ? { ...prev, balanceUsd: data.balance_usd } : prev);
        try {
          const saved = localStorage.getItem("stone_auth");
          if (saved) { const p = JSON.parse(saved); p.balanceUsd = data.balance_usd; localStorage.setItem("stone_auth", JSON.stringify(p)); }
        } catch {}
      }

      // Show processing message
      setMessages([...history, { role: "assistant", content: `Генерация видео... (~${data.estimated_seconds || 60}с)\n${data.model} · $${data.cost_usd?.toFixed(2) || "0.00"}` }]);

      // Poll for status
      let attempts = 0;
      const maxAttempts = 60; // 3s * 60 = 3 minutes max
      const poll = async () => {
        attempts++;
        try {
          const statusRes = await fetch(`${API_URL}/api/video/status/${taskId}`, {
            headers: { Authorization: `Bearer ${auth.token}` },
          });
          if (!statusRes.ok) throw new Error("Status check failed");
          const status = await statusRes.json();

          if (status.status === "completed" && status.video_url) {
            setMessages([...history, { role: "assistant", content: `Видео готово!`, video: { url: status.video_url, cost_usd: data.cost_usd } }]);
            setVideoGenerating(false);
            return;
          }
          if (status.status === "failed") {
            setMessages([...history, { role: "assistant", content: `Ошибка: ${status.error || "Генерация не удалась"}` }]);
            setVideoGenerating(false);
            return;
          }
          // Still processing
          if (attempts < maxAttempts) {
            pollTimerRef.current = setTimeout(poll, 3000);
          } else {
            setMessages([...history, { role: "assistant", content: "Таймаут генерации. Попробуйте снова." }]);
            setVideoGenerating(false);
          }
        } catch {
          setMessages([...history, { role: "assistant", content: "Ошибка проверки статуса" }]);
          setVideoGenerating(false);
        }
      };
      pollTimerRef.current = setTimeout(poll, 3000);

    } catch {
      setMessages([...history, { role: "assistant", content: "Ошибка соединения" }]);
      setVideoGenerating(false);
    }
  }, [auth, input, videoGenerating, messages, selectedModel, pendingFile, resetTextarea]);

  // Stop generation
  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  // Image generation via dedicated endpoint
  const sendImageMessage = useCallback(async () => {
    if (!auth || !input.trim() || streaming) return;
    const prompt = input.trim();
    const userMsg: Message = { role: "user", content: prompt };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setStreaming(true);
    resetTextarea();

    try {
      const res = await fetch(`${API_URL}/api/chat/image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ prompt, model_id: selectedModel }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Ошибка" }));
        const errMsg = typeof err.detail === "string" ? err.detail : "Ошибка генерации";
        setMessages([...history, { role: "assistant", content: errMsg }]);
        setStreaming(false);
        return;
      }

      const data = await res.json();
      if (data.image_url) {
        setMessages([...history, { role: "assistant", content: data.image_url }]);
        saveToSession(prompt, data.image_url, undefined);
      } else {
        setMessages([...history, { role: "assistant", content: "Не удалось сгенерировать изображение" }]);
      }
    } catch {
      setMessages([...history, { role: "assistant", content: "Ошибка соединения" }]);
    } finally {
      setStreaming(false);
    }
  }, [auth, input, streaming, messages, selectedModel, saveToSession, resetTextarea]);

  const isImageModel = IMAGE_MODEL_IDS.has(selectedModel);

  const sendMessage = useCallback(async () => {
    // Redirect to image/video/3D generation
    if (isImageModel) { sendImageMessage(); return; }
    if (isVideoModel) { sendVideoMessage(); return; }
    if (is3DModel) { send3DMessage(); return; }
    if (!auth || (!input.trim() && !pendingFile) || streaming) return;

    const currentFile = pendingFile;
    const userMsg: Message = { role: "user", content: input.trim() || (currentFile ? `[Файл: ${currentFile.file_name}]` : ""), file: currentFile || undefined };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setPendingFile(null);
    setStreaming(true);
    resetTextarea();

    const abort = new AbortController();
    abortRef.current = abort;

    const apiMessages = history.slice(-20).map((m) => {
      if (m.file) {
        if (m.file.file_type === "image") {
          return {
            role: m.role,
            content: [
              ...(m.content ? [{ type: "text", text: m.content }] : []),
              { type: "image_url", image_url: { url: m.file.content } },
            ],
          };
        } else {
          const fileContext = `[Содержимое файла "${m.file.file_name}"]\n${m.file.content}\n[Конец файла]\n\n${m.content || "Проанализируй этот документ."}`;
          return { role: m.role, content: fileContext };
        }
      }
      return { role: m.role, content: m.content };
    });

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          model_id: selectedModel,
          messages: apiMessages,
          ...(modelCatFilter === "health" ? { system_prompt: "Ты — AI-ассистент по общим вопросам здоровья. Ты НЕ врач и НЕ ставишь диагнозы. Анализируй фото и описания симптомов, предлагай возможные причины (2-3 варианта), рекомендуй к какому специалисту обратиться. Заверши: \"Для точного диагноза обратитесь к врачу.\" Отвечай на русском." } : {}),
        }),
        signal: abort.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Ошибка сервера" }));
        const detail = err.detail;
        // Upsell trigger on limit/lock
        if (res.status === 429 || (res.status === 403 && detail?.error === "model_locked")) {
          setMessages(prev => prev.slice(0, -1)); // remove the user message we just added
          if (detail?.error === "model_locked") {
            setUpsellModal({ type: "locked", model: model?.name, tier: detail?.required_tier || "mini" });
          } else {
            setUpsellModal({ type: "limit" });
          }
          setStreaming(false);
          return;
        }
        const errMsg = typeof detail === "string" ? detail : detail?.error || detail?.message || "Ошибка";
        setMessages([...history, { role: "assistant", content: errMsg }]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let assistantContent = "";
      let billing: Message["billing"] | undefined;

      setMessages([...history, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;

          try {
            const data = JSON.parse(payload);

            if (data.billing) {
              billing = data.billing;
              setAuth((prev) => prev ? { ...prev, balanceUsd: data.billing.balance_usd } : prev);
              try {
                const saved = localStorage.getItem("stone_auth");
                if (saved) {
                  const p = JSON.parse(saved);
                  p.balanceUsd = data.billing.balance_usd;
                  localStorage.setItem("stone_auth", JSON.stringify(p));
                }
              } catch {}
              continue;
            }

            if (data.usage) continue;

            if (data.error) {
              assistantContent = data.error;
              setMessages([...history, { role: "assistant", content: assistantContent }]);
              continue;
            }

            const content = data.content || data.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages([...history, { role: "assistant", content: assistantContent, billing }]);
            }
          } catch {}
        }
      }

      setMessages([...history, { role: "assistant", content: assistantContent, billing }]);

      const userText = history[history.length - 1]?.content || "";
      if (assistantContent) saveToSession(userText, assistantContent, billing);
    } catch (e: any) {
      if (e?.name === "AbortError") {
        // Stopped by user — keep what we have
      } else {
        setMessages([...history, { role: "assistant", content: "Ошибка соединения" }]);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }, [auth, input, streaming, messages, selectedModel, pendingFile, saveToSession, resetTextarea, isImageModel, sendImageMessage, isVideoModel, sendVideoMessage, is3DModel, send3DMessage, modelCatFilter]);

  // Auto-send after suggestion card click — switches model first
  const pendingSend = useRef(false);
  const handleSuggestionClick = useCallback((text: string, modelId: string) => {
    setSelectedModel(modelId);
    setInput(text);
    pendingSend.current = true;
  }, []);

  useEffect(() => {
    if (pendingSend.current && input.trim()) {
      pendingSend.current = false;
      sendMessage();
    }
  }, [input, sendMessage]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  if (!loaded) return null;
  if (!auth) return <AuthFormComponent onAuth={setAuth} />;

  const aiColor = companyColors[model?.company ?? ""] || "#C4623D";
  const aiLetter = companyIcons[model?.company ?? ""] || "AI";
  const lastMsg = messages[messages.length - 1];
  const showStreamingDots = streaming && (!lastMsg || lastMsg.role !== "assistant" || !lastMsg.content);

  return (
    <div
      className="h-dvh flex bg-bg overflow-hidden relative"
      style={{ height: "100dvh" }}
      onDragEnter={(e) => { e.preventDefault(); dragCounterRef.current++; setDragging(true); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
      onDragLeave={(e) => { e.preventDefault(); dragCounterRef.current--; if (dragCounterRef.current === 0) setDragging(false); }}
      onDrop={(e) => {
        e.preventDefault();
        dragCounterRef.current = 0;
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
      }}
    >
      {/* Drag & drop overlay */}
      {dragging && (
        <div className="absolute inset-0 z-[60] bg-accent/5 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="border-2 border-dashed border-accent rounded-2xl px-8 py-6 bg-bg/95 shadow-lg">
            <div className="text-center">
              <svg className="w-10 h-10 text-accent mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <p className="text-accent font-bold text-sm">Перетащите файл сюда</p>
              <p className="text-text/30 text-xs mt-1">Изображения и PDF до 10MB</p>
            </div>
          </div>
        </div>
      )}

      {/* Inline styles for markdown */}
      <style>{`
        .md-content { line-height: 1.7; }
        .md-content h1, .md-content .md-h1 { font-size: 1.25rem; font-weight: 800; margin: 1rem 0 0.5rem; color: var(--text); }
        .md-content h2, .md-content .md-h2 { font-size: 1.1rem; font-weight: 700; margin: 0.75rem 0 0.4rem; color: var(--text); }
        .md-content h3, .md-content .md-h3 { font-size: 1rem; font-weight: 600; margin: 0.5rem 0 0.3rem; color: var(--text); }
        .md-content strong { font-weight: 700; }
        .md-content em { font-style: italic; }
        .md-content del { text-decoration: line-through; opacity: 0.6; }
        .md-content .md-ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
        .md-content .md-li { margin: 0.15rem 0; display: list-item; }
        .md-content .md-oli { list-style: decimal; }
        .md-content .md-link { color: #C4623D; text-decoration: underline; text-underline-offset: 2px; }
        .md-content .md-link:hover { opacity: 0.8; }
        .md-content .inline-code {
          background: rgba(128,128,128,0.1); padding: 0.15em 0.4em; border-radius: 0.375rem;
          font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.85em; color: var(--accent);
        }
        .code-block-wrapper { margin: 0.75rem 0; border-radius: 0.75rem; overflow: hidden; border: 1px solid rgba(26,25,22,0.06); max-width: calc(100vw - 100px); }
        .code-block-header {
          display: flex; align-items: center; justify-content: space-between;
          background: #1C1C1E; padding: 0.5rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .code-lang { font-size: 0.65rem; color: rgba(255,255,255,0.3); font-family: monospace; }
        .code-copy-btn {
          font-size: 0.65rem; color: rgba(255,255,255,0.3); background: none; border: none;
          cursor: pointer; font-family: inherit; padding: 0;
        }
        .code-copy-btn:hover { color: rgba(255,255,255,0.6); }
        .code-block {
          background: #1C1C1E; padding: 1rem; overflow-x: auto; margin: 0;
          font-size: 0.8rem; line-height: 1.6; -webkit-overflow-scrolling: touch;
        }
        .code-block code { color: rgba(255,255,255,0.85); font-family: 'SF Mono', 'Fira Code', monospace; white-space: pre; }
        .md-content { overflow-wrap: break-word; word-break: break-word; max-width: 100%; }
        .md-content pre { max-width: 100%; overflow-x: auto; }
        .md-content a, .md-content .md-link { word-break: break-all; }
        .md-content img { max-width: 100%; height: auto; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .streaming-cursor::after {
          content: '▊';
          display: inline;
          color: #C4623D;
          animation: blink 0.8s step-end infinite;
          margin-left: 1px;
          font-size: 0.85em;
        }
        @supports(padding-bottom: env(safe-area-inset-bottom)) {
          .chat-input-safe { padding-bottom: calc(0.625rem + env(safe-area-inset-bottom)); }
        }

        /* Sidebar: mobile = slide overlay, desktop = width transition */
        .webchat-sidebar {
          width: 280px;
          transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .webchat-sidebar.open { transform: translateX(0); }
        .webchat-sidebar.closed { transform: translateX(-100%); }

        @media (min-width: 1024px) {
          .webchat-sidebar {
            position: relative !important;
            transform: none !important;
            transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
          }
          .webchat-sidebar.open { width: 280px; }
          .webchat-sidebar.closed { width: 0; overflow: hidden; }
        }
      `}</style>

      <Sidebar
        open={sidebarOpen}
        onToggle={toggleSidebar}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onLoadSession={loadSession}
        onNewChat={newChat}
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Top bar */}
        <div className="h-14 border-b border-text/[0.06] bg-bg/80 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Sidebar toggle */}
            <button onClick={toggleSidebar} className="text-text/30 hover:text-text/60 transition-colors shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {sidebarOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                }
              </svg>
            </button>

            {/* Model dropdown with filters */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                style={{ backgroundColor: aiColor }}
              >
                {aiLetter}
              </div>
              <button
                onClick={() => setModelPickerOpen(!modelPickerOpen)}
                className="flex items-center gap-1 bg-transparent font-bold text-[13px] sm:text-sm text-text cursor-pointer focus:outline-none min-w-0 max-w-[140px] sm:max-w-[220px] truncate"
              >
                {model?.name || "Модель"}
                <svg className="w-3 h-3 text-text/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" d="M6 9l6 6 6-6" />
                </svg>
              </button>
              <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                FREE_MODEL_IDS.has(selectedModel) ? "bg-teal-light text-teal" : MINI_MODEL_IDS.has(selectedModel) ? "bg-blue-100 text-blue-700" : "bg-accent/10 text-accent"
              }`}>
                {model?.context || ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {limits && limits.text && limits.text.limit > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-text/40" title={`${limits.text.used}/${limits.text.limit} запросов`}>
                <div className="w-16 h-1.5 bg-text/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{
                    width: `${Math.min(100, (limits.text.used / limits.text.limit) * 100)}%`,
                    backgroundColor: limits.text.used >= limits.text.limit * 0.8 ? "#ef4444" : "#C4623D",
                  }} />
                </div>
                <span>{limits.text.limit - limits.text.used}</span>
              </div>
            )}
            {limits?.streak && limits.streak.days >= 2 && (
              <span className="hidden sm:inline text-[10px] text-amber-500" title={`${limits.streak.days} дней подряд`}>
                🔥{limits.streak.days}
              </span>
            )}
            {(() => {
              const p = limits?.plan || "free";
              const bg = p === "max-pro" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white" : p === "max" ? "bg-accent text-white" : p === "mini" ? "bg-teal text-white" : "bg-text/10 text-text/40";
              const label = p === "max-pro" ? "Max Pro" : p === "max" ? "Max" : p === "mini" ? "Mini" : "Free";
              return (
                <a href="/pricing" className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap hover:opacity-80 transition-opacity ${bg}`}>
                  {label}
                </a>
              );
            })()}
            <a href="/" className="text-text/25 hover:text-accent transition-colors" title="На главную">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </a>
            <a href="/profile" className="text-text/25 hover:text-accent transition-colors" title="Личный кабинет">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Model Picker Panel */}
        {modelPickerOpen && (
          <div className="absolute top-14 left-0 right-0 z-[45] bg-bg border-b border-text/10 shadow-lg max-h-[50vh] sm:max-h-[60vh] flex flex-col">
            <div className="p-3 border-b border-text/5 shrink-0">
              <input type="text" value={modelSearch} onChange={(e) => setModelSearch(e.target.value)}
                placeholder="Поиск модели..." autoFocus
                className="w-full bg-bg border border-text/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent/30" />
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {(() => {
                const catMap: Record<string, string[]> = { all: [], free: [], chat: ["chat", "search", "reason", "code"], image: ["image"], video: ["video"], "3d": ["3d"], health: ["chat"] };
                const cats = catMap[modelCatFilter] || [];
                let list = modelCatFilter === "all" ? MODELS : modelCatFilter === "free" ? MODELS.filter(m => FREE_MODEL_IDS.has(m.id)) : MODELS.filter(m => cats.includes(m.category));
                if (modelSearch) list = list.filter(m => m.name.toLowerCase().includes(modelSearch.toLowerCase()) || m.company.toLowerCase().includes(modelSearch.toLowerCase()));
                const bal = auth?.balanceUsd || 0;
                return [...list].sort((a, b) => {
                  const aL = getModelLockInfo(a.id, bal, limits?.plan) !== null, bL = getModelLockInfo(b.id, bal, limits?.plan) !== null;
                  if (!aL && bL) return -1; if (aL && !bL) return 1;
                  return a.pricePerMillion - b.pricePerMillion;
                }).map(m => {
                  const lock = getModelLockInfo(m.id, bal, limits?.plan);
                  return (
                    <button key={m.id} onClick={() => {
                      if (lock) { setLockModal({ model: m.name, tier: lock.tier, price: lock.price }); setModelPickerOpen(false); return; }
                      if (selectedModel !== m.id) { setActiveSessionId(null); setMessages([]); }
                      setSelectedModel(m.id); setModelPickerOpen(false); setModelSearch("");
                    }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${
                      selectedModel === m.id ? "bg-accent/5 border border-accent/20" : "hover:bg-bg"
                    } ${lock ? "opacity-50" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold truncate block">{lock ? "🔒 " : ""}{m.name}</span>
                        <span className="text-[10px] text-text/30">{m.company} · {m.context}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        lock ? "bg-text/5 text-text/30"
                        : FREE_MODEL_IDS.has(m.id) ? "bg-teal-light text-teal"
                        : MINI_MODEL_IDS.has(m.id) ? "bg-blue-100 text-blue-600"
                        : "bg-accent/10 text-accent"
                      }`}>
                        {lock ? lock.tier : FREE_MODEL_IDS.has(m.id) ? "Free" : MINI_MODEL_IDS.has(m.id) ? "Mini" : "Max"}
                      </span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}
        {modelPickerOpen && <div className="fixed inset-0 z-[44]" onClick={() => { setModelPickerOpen(false); setModelSearch(""); }} />}

        {/* Category tabs */}
        <div className="flex px-3 sm:px-4 border-b border-text/[0.04] bg-bg/50 shrink-0">
          {[
            { id: "all", icon: "💬", label: "Все" },
            { id: "free", icon: "✨", label: "Free" },
            { id: "image", icon: "🎨", label: "Фото" },
            { id: "video", icon: "🎬", label: "Видео" },
            { id: "3d", icon: "🧊", label: "3D" },
            { id: "health", icon: "🏥", label: "Врач" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                if (modelCatFilter !== t.id) {
                  setModelCatFilter(t.id);
                  setActiveSessionId(null);
                  setMessages([]);
                  if (t.id === "health" || t.id === "free") setSelectedModel("gpt-4o-mini");
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1 px-1 sm:px-2.5 py-1.5 text-[10px] sm:text-[11px] font-semibold whitespace-nowrap transition-colors border-b-2 ${
                modelCatFilter === t.id ? "text-accent border-accent" : "text-text/30 border-transparent hover:text-text/50"
              }`}
            >
              <span className="text-xs">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Quick model chips */}
        <div className="border-b border-text/[0.04] bg-bg/50 shrink-0">
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto">
            {(modelCatFilter === "all" ? [
              { id: "gpt-4o-mini", name: "GPT-4o mini" },
              { id: "claude-sonnet-4", name: "Claude Sonnet" },
              { id: "gemini-2.5-pro", name: "Gemini Pro" },
              { id: "gpt-5.4", name: "GPT-5.4" },
              { id: "deepseek-r1", name: "DeepSeek R1" },
            ] : modelCatFilter === "free" ? [
              { id: "gpt-4o-mini", name: "GPT-4o mini" },
              { id: "gemini-2.0-flash", name: "Gemini Flash" },
              { id: "claude-haiku-4.5", name: "Claude Haiku" },
              { id: "llama-4-maverick", name: "Llama 4" },
              { id: "mistral-large-25", name: "Mistral Large" },
              { id: "deepseek-v3", name: "DeepSeek V3" },
              { id: "nano-banana", name: "Nano Banana" },
            ] : modelCatFilter === "image" ? [
                { id: "nano-banana-pro", name: "Nano Banana Pro" },
                { id: "nano-banana", name: "Nano Banana" },
                { id: "gpt-5-image", name: "GPT-5 Image" },
                { id: "gpt-5-image-mini", name: "GPT-5 Image mini" },
                { id: "flux-schnell", name: "Flux Schnell" },
              ] : modelCatFilter === "video" ? [
                { id: "kling-v3", name: "Kling 3.0 Pro" },
                { id: "sora-2", name: "Sora 2" },
                { id: "veo-3", name: "Veo 3.1" },
                { id: "runway-gen3", name: "Runway Gen3" },
                { id: "kling-v2", name: "Kling v2" },
                { id: "pika-2", name: "Pika 2" },
                { id: "minimax", name: "MiniMax" },
              ] : modelCatFilter === "3d" ? [
                { id: "tripo-v2.5", name: "Tripo v2.5" },
                { id: "triposr", name: "TripoSR" },
              ] : modelCatFilter === "health" ? [
                { id: "gpt-4o-mini", name: "GPT-4o mini" },
                { id: "gemini-2.0-flash", name: "Gemini Flash" },
              ] : []).map((m) => (
                <button
                  key={m.id}
                  onClick={() => { if (selectedModel !== m.id) { setSelectedModel(m.id); setActiveSessionId(null); setMessages([]); } }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    selectedModel === m.id
                      ? "bg-accent text-white"
                      : "bg-text/[0.04] text-text/35 hover:text-text/60"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

        {/* Health disclaimer */}
        {modelCatFilter === "health" && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200/50 dark:border-amber-800/30 shrink-0">
            <div className="max-w-3xl mx-auto px-4 py-1.5 flex items-center gap-2">
              <span className="text-amber-500 text-xs shrink-0">&#9888;</span>
              <p className="text-[10px] text-amber-700 dark:text-amber-400">AI даёт общую информацию, не диагноз. Не заменяет врача.</p>
            </div>
          </div>
        )}

        {/* Messages area or Welcome screen */}
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestion={handleSuggestionClick} activeTab={modelCatFilter} />
        ) : (
          <div className="flex-1 overflow-y-auto relative" ref={messagesContainerRef}>
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 space-y-5">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 sm:gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {/* Avatar */}
                  <div className="shrink-0 mt-0.5">
                    {msg.role === "user" ? (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent ring-2 ring-accent/20 flex items-center justify-center">
                        <span className="text-[11px] sm:text-[12px] font-bold text-white">U</span>
                      </div>
                    ) : (
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 ring-white/10 flex items-center justify-center"
                        style={{ backgroundColor: aiColor }}
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Message bubble */}
                  <div className={`max-w-[85%] sm:max-w-[75%] min-w-0 ${msg.role === "user" ? "text-right" : ""}`}>
                    <div className={`${msg.role === "user" ? "inline-block" : "block"} text-left rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-[14px] leading-relaxed break-words overflow-x-auto ${
                      msg.role === "user"
                        ? "bg-accent text-white rounded-tr-md"
                        : "bg-text/[0.06] text-text/85 rounded-tl-md"
                    }`}>
                      {msg.file && (
                        <div className="mb-2">
                          {msg.file.file_type === "image" ? (
                            <img src={msg.file.content} alt={msg.file.file_name} className="max-w-[240px] rounded-lg" />
                          ) : (
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${msg.role === "user" ? "bg-white/20" : "bg-text/[0.04]"}`}>
                              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="truncate">{msg.file.file_name}</span>
                              <span className="shrink-0 opacity-60">{(msg.file.size / 1024).toFixed(0)}KB</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Video player */}
                      {msg.video && (
                        <div className="mb-2">
                          <video
                            src={msg.video.url}
                            controls
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="auto"
                            className="max-w-full rounded-xl bg-black"
                            style={{ maxHeight: 360, minHeight: 200 }}
                            onError={(e) => { (e.target as HTMLVideoElement).poster = ""; }}
                          />
                          <div className="flex items-center gap-3 mt-2">
                            <a
                              href={msg.video.url}
                              download={`stone-ai-video-${Date.now()}.mp4`}
                              className="flex items-center gap-1.5 text-[11px] text-accent font-semibold hover:underline"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                              </svg>
                              Скачать
                            </a>
                            {/* cost hidden — subscription model */}
                          </div>
                        </div>
                      )}

                      {/* 3D viewer */}
                      {msg.threed && (
                        <div className="mb-2">
                          <div className="rounded-xl overflow-hidden border border-text/10 bg-text/[0.04]" style={{ width: "100%", height: 280 }}>
                            {/* @google/model-viewer loaded via script tag */}
                            <div dangerouslySetInnerHTML={{ __html: `<model-viewer src="${msg.threed.url}" auto-rotate camera-controls touch-action="pan-y" style="width:100%;height:280px;background:#f0f0f0;" shadow-intensity="1"></model-viewer>` }} />
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <a
                              href={msg.threed.url}
                              download={`stone-ai-3d-${Date.now()}.glb`}
                              className="flex items-center gap-1.5 text-[11px] text-accent font-semibold hover:underline"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                              </svg>
                              Скачать GLB
                            </a>
                            {/* cost hidden — subscription model */}
                          </div>
                        </div>
                      )}

                      <div className={streaming && i === messages.length - 1 && msg.role === "assistant" && msg.content ? "streaming-cursor" : ""}>
                        <MessageContent content={msg.content} role={msg.role} selectedModel={selectedModel} />
                      </div>

                      {/* Action buttons for AI messages */}
                      {msg.role === "assistant" && msg.content && (
                        <div className="flex items-center gap-1 mt-2">
                          {/* Copy */}
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(msg.content);
                              const btn = document.getElementById(`copy-${i}`);
                              if (btn) { btn.textContent = "✓"; setTimeout(() => { btn.textContent = "Копировать"; }, 1500); }
                            }}
                            id={`copy-${i}`}
                            className="text-[10px] text-text/30 hover:text-accent px-2 py-1 rounded-lg hover:bg-accent/5 transition-colors"
                          >
                            Копировать
                          </button>
                          {/* Regenerate — only on last AI message */}
                          {i === messages.length - 1 && !streaming && (
                            <button
                              onClick={() => {
                                // Find last user message and resend
                                const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
                                if (lastUserMsg) {
                                  setMessages(prev => prev.slice(0, -1)); // remove last AI response
                                  setInput(lastUserMsg.content);
                                  setTimeout(() => {
                                    const btn = document.querySelector("[data-send-btn]") as HTMLButtonElement;
                                    if (btn) btn.click();
                                  }, 100);
                                }
                              }}
                              className="text-[10px] text-text/30 hover:text-accent px-2 py-1 rounded-lg hover:bg-accent/5 transition-colors"
                            >
                              Повторить
                            </button>
                          )}
                          {/* Voice */}
                          {!msg.video && !msg.threed && (
                            <VoiceButton text={msg.content} token={auth!.token} />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Streaming dots — only when no content yet */}
              {showStreamingDots && (
                <div className="flex gap-2.5 sm:gap-3">
                  <div className="shrink-0 mt-0.5">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: aiColor }}>
                      <span className="text-[10px] sm:text-[11px] font-bold text-white">{aiLetter}</span>
                    </div>
                  </div>
                  <div className="bg-text/[0.06] rounded-2xl rounded-tl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-text/20 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-text/20 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-text/20 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Scroll to bottom */}
            <ScrollToBottom containerRef={messagesContainerRef} />
          </div>
        )}

        {/* Templates panel */}
        {showTemplates && (
          <div className="border-t border-text/[0.06] bg-bg px-3 sm:px-4 py-3 shrink-0 max-h-[30vh] sm:max-h-[40vh] overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-text/50">Шаблоны промптов</span>
                <button onClick={() => setShowTemplates(false)} className="text-text/30 hover:text-text/60 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <TemplatesPicker onSelect={(text: string, modelId: string) => {
                setInput(text);
                const lock = getModelLockInfo(modelId, auth?.balanceUsd || 0, limits?.plan);
                if (!lock) setSelectedModel(modelId);
                setShowTemplates(false);
              }} />
            </div>
          </div>
        )}

        {/* Input area — pinned bottom */}
        <div className="border-t border-text/[0.06] bg-bg px-3 sm:px-4 py-1.5 sm:py-2 shrink-0 chat-input-safe">
          <div className="max-w-3xl mx-auto">
            {pendingFile && (
              <div className="flex items-center gap-2 mb-2.5 px-3 py-2 bg-bg rounded-xl">
                {pendingFile.file_type === "image" ? (
                  <img src={pendingFile.content} alt="" className="w-10 h-10 rounded-lg object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                )}
                <span className="text-xs text-text/60 truncate flex-1">{pendingFile.file_name}</span>
                <button onClick={() => setPendingFile(null)} className="text-text/25 hover:text-text/50 shrink-0 p-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {uploading && (
              <div className="text-xs text-accent mb-2 px-1 animate-pulse">Загрузка файла...</div>
            )}

            {/* Recording animation */}
            {recording && (
              <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-red-50 border border-red-200 rounded-xl">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <div className="flex items-end gap-[2px] h-4 flex-1">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className="flex-1 bg-red-400/40 rounded-full" style={{ height: `${Math.random() * 100}%`, animation: `waveRec 0.5s ${i * 0.02}s ease-in-out infinite alternate` }} />
                  ))}
                </div>
                <span className="text-[11px] text-red-500 font-medium shrink-0">Говорите...</span>
              </div>
            )}
            <style>{`@keyframes waveRec { from { transform: scaleY(0.3); } to { transform: scaleY(1); } }`}</style>

            <div className="flex items-center bg-bg border border-text/[0.08] rounded-xl focus-within:border-accent/30 focus-within:ring-2 focus-within:ring-accent/10 transition-all min-w-0" style={{ padding: "4px 8px", gap: 6 }}>
              {/* Templates button */}
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="flex items-center justify-center text-text/25 hover:text-accent transition-colors shrink-0"
                style={{ width: 38, height: 38 }}
                title="Шаблоны промптов"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
              </button>

              {/* File attach */}
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); e.target.value = ""; }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || streaming}
                className="flex items-center justify-center text-text/25 hover:text-accent transition-colors disabled:opacity-30 shrink-0"
                style={{ width: 38, height: 38 }}
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKey}
                placeholder={pendingFile ? "Добавьте вопрос к файлу..." : modelCatFilter === "health" ? "Опишите симптомы или загрузите фото..." : isVideoModel ? "Опишите видео..." : is3DModel ? "Опишите 3D-модель или загрузите фото..." : "Написать сообщение..."}
                rows={1}
                className="flex-1 bg-transparent resize-none focus:outline-none min-w-0 leading-snug placeholder:text-text/20"
                style={{ fontSize: 16, padding: "10px 16px", maxHeight: 80, minHeight: 42 }}
              />

              {/* Send / Stop / Mic button */}
              {streaming ? (
                <button onClick={stopGeneration} className="rounded-lg bg-text/70 text-white flex items-center justify-center hover:bg-text/90 transition-colors shrink-0" title="Остановить" style={{ width: 38, height: 38 }}>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                </button>
              ) : recording ? (
                /* Recording — pulsing red mic, click to stop */
                <button
                  onClick={() => {
                    const sr = (window as any).__stoneSR;
                    if (sr) { sr.stop(); }
                    const rec = (window as any).__stoneRecorder;
                    if (rec?.state === "recording") rec.stop();
                    setRecording(false);
                  }}
                  className="rounded-lg bg-red-500 text-white flex items-center justify-center shrink-0 animate-pulse"
                  title="Остановить запись"
                  style={{ width: 38, height: 38 }}
                >
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </button>
              ) : (input.trim() || pendingFile) ? (
                <button data-send-btn onClick={sendMessage} disabled={videoGenerating || threedGenerating} className="rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-30 shrink-0" style={{ width: 38, height: 38 }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>
                </button>
              ) : (
                /* Idle — mic button */
                <button
                  onClick={() => {
                    // Try Web Speech API first (realtime transcription)
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    if (SpeechRecognition) {
                      const sr = new SpeechRecognition();
                      sr.lang = "ru-RU";
                      sr.continuous = true;
                      sr.interimResults = true;
                      sr.onresult = (e: any) => {
                        let full = "";
                        for (let i = 0; i < e.results.length; i++) {
                          full += e.results[i][0].transcript;
                          if (e.results[i].isFinal) full += " ";
                        }
                        setInput(full.trim());
                      };
                      sr.onerror = () => { setRecording(false); };
                      sr.onend = () => { setRecording(false); };
                      (window as any).__stoneSR = sr;
                      sr.start();
                      setRecording(true);
                      // Auto-stop after 60s
                      setTimeout(() => { if (sr) try { sr.stop(); } catch {} }, 60000);
                      return;
                    }

                    // Fallback: MediaRecorder + Whisper API
                    (async () => {
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
                        const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
                        (window as any).__stoneRecorder = recorder;
                        const chunks: Blob[] = [];
                        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
                        recorder.onstop = async () => {
                          (window as any).__stoneRecorder = null;
                          setRecording(false);
                          stream.getTracks().forEach(t => t.stop());
                          if (!chunks.length) return;
                          const blob = new Blob(chunks, { type: mime || "audio/webm" });
                          const form = new FormData();
                          form.append("file", blob, "voice.webm");
                          try {
                            const res = await fetch(`${API_URL}/api/audio/stt`, { method: "POST", headers: { Authorization: `Bearer ${auth!.token}` }, body: form });
                            if (res.ok) { const data = await res.json(); if (data.text) setInput(prev => prev + data.text); }
                          } catch {}
                        };
                        recorder.start();
                        setRecording(true);
                        setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 30000);
                      } catch (err: any) {
                        if (err?.name === "NotAllowedError") alert("Доступ к микрофону запрещён.");
                        else if (err?.name === "NotFoundError") alert("Микрофон не найден.");
                        else alert("Ошибка: " + (err?.message || ""));
                      }
                    })();
                  }}
                  className="rounded-lg bg-text/10 text-text/40 hover:text-accent hover:bg-accent/10 flex items-center justify-center transition-colors shrink-0"
                  style={{ width: 38, height: 38 }}
                  title="Голосовой ввод"
                >
                  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lock Modal */}
      {lockModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setLockModal(null)}>
          <div className="bg-bg rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-extrabold text-lg mb-2">{lockModal.model}</h3>
              <p className="text-text/50 text-sm mb-6">
                Доступен на тарифе <span className="font-bold text-accent">{lockModal.tier}</span> ({lockModal.price})
              </p>
              <div className="flex gap-3">
                <button onClick={() => setLockModal(null)}
                  className="flex-1 border-2 border-text/15 text-text py-2.5 rounded-xl font-bold text-sm hover:border-text/30 transition-colors">
                  Закрыть
                </button>
                <a href="/pricing"
                  className="flex-1 bg-accent text-white py-2.5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors text-center">
                  Смотреть тарифы
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upsell Modal — triggers on 429 (limit) or 403 (model_locked) */}
      {upsellModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center" onClick={() => setUpsellModal(null)}>
          <div className="bg-bg rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-br from-accent to-accent/80 px-6 pt-8 pb-6 text-white text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="text-3xl">{upsellModal.type === "limit" ? "⚡" : "🔓"}</span>
              </div>
              <h3 className="text-xl font-extrabold mb-1">
                {upsellModal.type === "limit" ? "Запросы на сегодня закончились" : `${upsellModal.model} заблокирована`}
              </h3>
              <p className="text-white/70 text-sm">
                {upsellModal.type === "limit"
                  ? "Вы использовали 15 бесплатных запросов"
                  : `Доступна на тарифе ${upsellModal.tier === "max" ? "Max" : "Mini"}`}
              </p>
            </div>

            {/* Benefits */}
            <div className="px-6 py-5">
              <p className="text-[11px] text-text/40 font-semibold uppercase tracking-wider mb-3">Что вы получите</p>
              <div className="space-y-2.5">
                {[
                  { icon: "🧠", text: "GPT-5.4, Claude Opus, Gemini Pro — топовые модели" },
                  { icon: "🎨", text: "Генерация картинок — Flux, Stable Diffusion, GPT-5 Image" },
                  { icon: "🎬", text: "Генерация видео — Kling, Runway, Pika" },
                  { icon: "⚡", text: "Без задержек — мгновенные ответы" },
                ].map((b, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-lg shrink-0">{b.icon}</span>
                    <span className="text-[13px] text-text/70 leading-snug">{b.text}</span>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-2 mt-5">
                <a href="/pricing" className="block p-3 rounded-xl border-2 border-accent/20 hover:border-accent transition-colors text-center">
                  <p className="text-[10px] text-text/40 font-semibold">MINI</p>
                  <p className="text-lg font-extrabold text-text">390<span className="text-sm font-bold text-text/40">₽</span></p>
                  <p className="text-[10px] text-text/30">в месяц</p>
                </a>
                <a href="/pricing" className="block p-3 rounded-xl border-2 border-accent bg-accent/5 hover:bg-accent/10 transition-colors text-center relative">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent text-white text-[8px] font-bold px-2 py-0.5 rounded-full">ХИТ</div>
                  <p className="text-[10px] text-text/40 font-semibold">MAX</p>
                  <p className="text-lg font-extrabold text-text">890<span className="text-sm font-bold text-text/40">₽</span></p>
                  <p className="text-[10px] text-text/30">в месяц</p>
                </a>
              </div>

              <a href="/pricing" className="block w-full mt-4 bg-accent text-white py-3.5 rounded-xl font-bold text-center text-sm hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
                Выбрать тариф
              </a>
              <button onClick={() => setUpsellModal(null)} className="block w-full mt-2 text-text/30 text-xs text-center py-2 hover:text-text/50 transition-colors">
                Продолжить бесплатно завтра
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
