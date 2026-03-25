import type { Metadata } from "next";
import ToolPageHero from "@/components/ToolPageHero";
import ToolModels from "@/components/ToolModels";
import ToolExamples from "@/components/ToolExamples";
import ToolFaq from "@/components/ToolFaq";
import ToolCta from "@/components/ToolCta";
import { SITE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Анализ документов нейросетью — ИИ для PDF и фото",
  description:
    "Загрузите PDF или фото — нейросеть ответит на любой вопрос. ИИ чат-бот с Claude Opus, Gemini Pro. В Telegram.",
  openGraph: {
    title: "Анализ документов AI — PDF, фото, контракты",
    description: "Загрузите документ — AI проанализирует и ответит на вопросы. До 1M токенов контекста.",
  },
};

const modelIds = [
  "gemini-2.5-pro",
  "claude-opus-4",
  "gpt-4.1",
  "gpt-5.4",
  "gemini-2.0-flash",
  "claude-haiku-4.5",
];

const modelDescriptions: Record<string, string> = {
  "gemini-2.5-pro": "Контекст 1M токенов — загружайте целые книги. Лучший для объёмных документов.",
  "claude-opus-4": "200K контекст, глубокий анализ. Лучший для юридических документов и контрактов.",
  "gpt-4.1": "1M контекст от OpenAI. Точный анализ, структурированные выводы.",
  "gpt-5.4": "1M контекст, новейшая модель. Высокая точность анализа таблиц и графиков.",
  "gemini-2.0-flash": "Бесплатная модель с контекстом 1M. Быстрый анализ больших документов.",
  "claude-haiku-4.5": "Бесплатный анализ документов до 200K. Быстрый и точный.",
};

const examples = [
  { prompt: "Проанализируй этот договор аренды. Какие пункты невыгодны для арендатора? Выдели скрытые штрафы.", tag: "Контракты" },
  { prompt: "Сделай краткое содержание этой научной статьи в 10 пунктов. Выдели метод, результаты и выводы.", tag: "Наука" },
  { prompt: "Вот фото чека на английском. Переведи все позиции на русский и посчитай сумму в рублях по курсу.", tag: "Фото" },
  { prompt: "Извлеки все даты, суммы и имена из этого контракта. Представь в виде таблицы.", tag: "Извлечение данных" },
  { prompt: "Я загружаю финансовый отчёт компании. Какие тренды видны? Есть ли тревожные сигналы?", tag: "Финансы" },
  { prompt: "Сравни эти два документа и покажи ключевые отличия. Что добавлено, что удалено?", tag: "Сравнение" },
];

const faqItems = [
  {
    q: "Какие файлы можно загружать?",
    a: "PDF-документы, фотографии (JPG, PNG), скриншоты. Просто отправьте файл в чат и задайте вопрос по нему. AI распознает текст и таблицы автоматически.",
  },
  {
    q: "Какой максимальный размер документа?",
    a: "Зависит от модели. Gemini 2.5 Pro и GPT-4.1 поддерживают до 1 миллиона токенов — это примерно 750 000 слов или книга в 1500 страниц. Claude Opus — до 200K (около 150 000 слов).",
  },
  {
    q: "Безопасно ли загружать конфиденциальные документы?",
    a: "Документы передаются напрямую провайдерам AI (Google, Anthropic, OpenAI) по зашифрованному каналу. Stone AI не хранит содержимое файлов на своих серверах.",
  },
  {
    q: "Можно ли анализировать фото документов?",
    a: "Да! Модели с vision (GPT-5, Claude, Gemini) распознают текст с фотографий, скриншотов и сканов. Просто отправьте фото в чат.",
  },
];

const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
const bcJsonLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Главная", item: `${SITE_URL}/` }, { "@type": "ListItem", position: 2, name: "Документы" }] };

export default function DocumentsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(bcJsonLd) }} />
      <ToolPageHero breadcrumb="Анализ документов"
        badge="Нейросеть для документов"
        title="Анализ документов"
        highlight="нейросетью онлайн"
        description="Загрузите PDF, фото или текст — ИИ ответит на любой вопрос. Чат-бот анализирует контракты, отчёты, научные статьи."
      />
      <ToolModels
        title="Модели для анализа документов"
        subtitle="Выбирайте по размеру контекста и глубине анализа"
        modelIds={modelIds}
        descriptions={modelDescriptions}
      />
      <ToolExamples
        subtitle="Загрузите документ и задайте любой из этих вопросов"
        examples={examples}
      />
      <ToolFaq items={faqItems} />
      <ToolCta title="Загрузите первый документ" subtitle="Gemini 2.0 Flash анализирует бесплатно. До 1M токенов контекста." />
    </>
  );
}
