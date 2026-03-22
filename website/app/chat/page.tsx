import type { Metadata } from "next";
import ToolPageHero from "@/components/ToolPageHero";
import ToolModels from "@/components/ToolModels";
import ToolExamples from "@/components/ToolExamples";
import ToolFaq from "@/components/ToolFaq";
import ToolCta from "@/components/ToolCta";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "ИИ чат-бот — 65 нейросетей в одном окне",
  description:
    "Чат с нейросетями GPT-5, Claude Opus, Gemini Pro, DeepSeek R1 прямо в Telegram. Оплата в рублях. 15 бесплатных запросов в день.",
  openGraph: {
    title: "AI Чат — 65 моделей в одном окне",
    description: "GPT-5, Claude Opus, Gemini Pro и другие AI-модели прямо в Telegram.",
  },
};

const modelIds = [
  "gpt-5.1",
  "claude-opus-4",
  "gemini-2.5-pro",
  "deepseek-r1",
  "grok-3",
  "gpt-4o-mini",
  "claude-haiku-4.5",
  "gemini-2.0-flash",
  "llama-4-maverick",
];

const modelDescriptions: Record<string, string> = {
  "gpt-5.1": "Топовая модель OpenAI. Лучшая для сложных задач и длинных текстов.",
  "claude-opus-4": "Самая мощная модель Anthropic. Глубокий анализ и творческие задачи.",
  "gemini-2.5-pro": "Флагман Google с контекстом 1M токенов. Идеален для больших документов.",
  "deepseek-r1": "Reasoning-модель с пошаговым рассуждением. Отлично для логики и математики.",
  "grok-3": "Флагман xAI. Прямой, неформальный стиль. Хорош для брейнсторма.",
  "gpt-4o-mini": "Быстрый и дешёвый. Отлично справляется с бытовыми задачами.",
  "claude-haiku-4.5": "Быстрый Claude для ежедневных задач. Хороший баланс цена/качество.",
  "gemini-2.0-flash": "Самая дешёвая модель Google. Мгновенные ответы, контекст 1M.",
  "llama-4-maverick": "Open-source модель от Meta. Быстрая и бесплатная.",
};

const examples = [
  { prompt: "Напиши пост для Telegram-канала про AI-тренды 2026 года. Тон: экспертный, но доступный.", tag: "Тексты" },
  { prompt: "Сравни плюсы и минусы React vs Vue для нового стартапа. Учти размер команды 3 человека.", tag: "Анализ" },
  { prompt: "Я готовлю презентацию для инвесторов. Помоги структурировать питч на 10 слайдов.", tag: "Бизнес" },
  { prompt: "Объясни квантовые вычисления простыми словами, как будто мне 15 лет.", tag: "Обучение" },
  { prompt: "Придумай 10 идей для мобильного приложения в нише фитнеса и питания.", tag: "Брейнсторм" },
  { prompt: "Проанализируй этот контракт и выдели ключевые риски для арендатора.", tag: "Документы" },
];

const faqItems = [
  {
    q: "Чем отличаются модели друг от друга?",
    a: "Каждая модель имеет свои сильные стороны. GPT-5.1 и Claude Opus — универсальные флагманы для сложных задач. DeepSeek R1 и o3 — специализированные reasoning-модели для логики. GPT-4o mini и Gemini Flash — быстрые и дешёвые для простых задач. Попробуйте несколько и выберите свою.",
  },
  {
    q: "Какая модель лучше для текстов?",
    a: "Для коротких текстов (посты, письма) хватит GPT-4o mini или Claude Haiku — они бесплатные. Для длинных статей и маркетинговых материалов лучше Claude Opus 4 или GPT-5.1. Для творческих задач попробуйте Grok 3.",
  },
  {
    q: "Сохраняется ли история чатов?",
    a: "История хранится локально в Telegram Mini App. Каждая модель имеет свой отдельный чат. Вы можете переключаться между моделями, сохраняя контекст каждого диалога.",
  },
  {
    q: "Сколько стоит один запрос?",
    a: "Зависит от модели и длины сообщений. Бесплатные модели (GPT-4o mini, Claude Haiku) — 15 запросов в день. Платные: GPT-4o mini через per-token от $0.004, Claude Opus от $0.20. После каждого запроса видно точную стоимость.",
  },
];

const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
const bcJsonLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Главная", item: `${SITE_URL}/` }, { "@type": "ListItem", position: 2, name: "AI Чат" }] };

export default function ChatPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcJsonLd) }} />
      <ToolPageHero
        badge="65+ нейросетей в одном окне"
        title="ИИ чат-бот с лучшими"
        highlight="нейросетями мира"
        description="Чат-бот с GPT-5, Claude Opus, Gemini Pro, DeepSeek R1 и ещё 62 нейросетями. Сравнивайте ответы ИИ, выбирайте лучшую модель для каждой задачи."
      />
      <ToolModels
        title="Модели для чата"
        subtitle="От бесплатных до самых мощных — выбирайте под задачу"
        modelIds={modelIds}
        descriptions={modelDescriptions}
      />
      <ToolExamples
        subtitle="Попробуйте эти запросы или задайте свой"
        examples={examples}
      />
      <ToolFaq items={faqItems} />
      <ToolCta title="Начните общаться с AI" subtitle="5 моделей бесплатно, 15 запросов в день. Бесплатный старт." />
    </>
  );
}
