import type { Metadata } from "next";
import ToolPageHero from "@/components/ToolPageHero";
import ToolModels from "@/components/ToolModels";
import ToolExamples from "@/components/ToolExamples";
import ToolFaq from "@/components/ToolFaq";
import ToolCta from "@/components/ToolCta";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "ИИ поиск нейросетью — Perplexity в Telegram без VPN",
  description:
    "Поиск в интернете нейросетью: актуальные данные, источники. ИИ чат-бот Perplexity Sonar и Deep Research. Без VPN, в Telegram.",
  openGraph: {
    title: "AI Поиск — Perplexity в Telegram без VPN",
    description: "Perplexity в Telegram без VPN. Real-time данные, ссылки на источники, глубокие исследования.",
  },
};

const modelIds = [
  "perplexity-sonar-pro",
  "perplexity-sonar-deep",
  "perplexity-sonar",
];

const modelDescriptions: Record<string, string> = {
  "perplexity-sonar-pro": "Продвинутый поиск с глубоким анализом. Ищет в реальном времени, даёт источники. $26/1M.",
  "perplexity-sonar-deep": "Deep Research — автоматические исследования на 20+ страниц. Идеален для аналитики. $16.80/1M.",
  "perplexity-sonar": "Базовый AI-поиск. Быстрые ответы с актуальными данными и ссылками. $4/1M.",
};

const examples = [
  { prompt: "Какие AI-стартапы привлекли больше всего инвестиций в 2026 году? Дай топ-10 с суммами.", tag: "Исследования" },
  { prompt: "Курс биткоина сегодня и прогнозы аналитиков на ближайший месяц. Ссылки на источники.", tag: "Финансы" },
  { prompt: "Сравни характеристики iPhone 17 Pro и Samsung Galaxy S26 Ultra. Что вышло в 2026?", tag: "Техника" },
  { prompt: "Последние новости по регулированию AI в Евросоюзе. Что изменилось после AI Act?", tag: "Новости" },
  { prompt: "Проведи исследование рынка доставки еды в Москве: объём, игроки, тренды, перспективы.", tag: "Deep Research" },
  { prompt: "Какие фреймворки для бэкенда самые популярные в 2026 году? Статистика и тренды.", tag: "Технологии" },
];

const faqItems = [
  {
    q: "Откуда берутся данные?",
    a: "Perplexity ищет информацию в реальном времени по всему интернету: новостные сайты, блоги, научные публикации, форумы. Каждый ответ содержит ссылки на источники, чтобы вы могли проверить информацию.",
  },
  {
    q: "Чем отличается от обычного чата с AI?",
    a: "Обычные модели (GPT, Claude) знают только то, что было в обучающих данных. Perplexity ищет актуальную информацию в интернете прямо сейчас — курсы валют, новости, свежие статьи, результаты матчей.",
  },
  {
    q: "Что такое Deep Research?",
    a: "Sonar Deep Research — это режим автоматического исследования. AI формулирует подзапросы, ищет информацию из десятков источников и составляет подробный отчёт. Идеально для маркетинговых исследований, конкурентного анализа, обзоров рынка.",
  },
  {
    q: "Зачем Perplexity через Stone AI, если есть perplexity.ai?",
    a: "Stone AI даёт доступ к Perplexity без VPN, через привычный Telegram. Оплата в рублях через СБП, Stars или крипту. Плюс все остальные 47 моделей в одном месте.",
  },
];

const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
const bcJsonLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Главная", item: `${SITE_URL}/` }, { "@type": "ListItem", position: 2, name: "AI Поиск" }] };

export default function SearchPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcJsonLd) }} />
      <ToolPageHero
        badge="ИИ-поиск в реальном времени"
        title="Поиск в интернете"
        highlight="нейросетью с источниками"
        description="ИИ-бот ищет в интернете через Perplexity. Нейросеть даёт актуальные данные со ссылками на источники. Чат в Telegram без VPN."
      />
      <ToolModels
        title="Модели для поиска"
        subtitle="Три уровня: быстрый ответ, глубокий анализ, полное исследование"
        modelIds={modelIds}
        descriptions={modelDescriptions}
      />
      <ToolExamples
        subtitle="Задайте вопрос — получите актуальный ответ со ссылками"
        examples={examples}
      />
      <ToolFaq items={faqItems} />
      <ToolCta title="Попробуйте AI-поиск" subtitle="Актуальные данные из интернета. Ссылки на источники в каждом ответе." />
    </>
  );
}
