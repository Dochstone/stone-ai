import type { Metadata } from "next";
import ToolPageHero from "@/components/ToolPageHero";
import ToolModels from "@/components/ToolModels";
import ToolExamples from "@/components/ToolExamples";
import ToolFaq from "@/components/ToolFaq";
import ToolCta from "@/components/ToolCta";

export const metadata: Metadata = {
  title: "AI Код-ассистент — Claude, GPT, DeepSeek для разработки",
  description:
    "AI-помощник для программистов: отладка, рефакторинг, генерация кода. Claude Opus, GPT-4.1, Devstral, DeepSeek R1. Без VPN, в Telegram.",
  openGraph: {
    title: "AI Код-ассистент — Claude, GPT, DeepSeek",
    description: "AI-помощник для разработчиков: Claude Opus, GPT-4.1, Devstral, o3. В Telegram без VPN.",
  },
};

const modelIds = [
  "claude-opus-4",
  "claude-sonnet-4",
  "gpt-4.1",
  "devstral",
  "deepseek-r1",
  "o3",
  "gpt-4o-mini",
  "gemini-2.5-pro",
];

const modelDescriptions: Record<string, string> = {
  "claude-opus-4": "Лучший для сложного рефакторинга и архитектурных решений. 200K контекст.",
  "claude-sonnet-4": "Отличный баланс цена/качество для ежедневного кодинга. Быстрый и точный.",
  "gpt-4.1": "Сильная модель для кода с 1M контекстом. Хорош для работы с большими кодовыми базами.",
  "devstral": "Специализированная модель для кода от Mistral. Дёшево — $2.10/1M.",
  "deepseek-r1": "Reasoning-модель. Идеальна для алгоритмических задач и дебага сложных багов.",
  "o3": "OpenAI reasoning-модель. Пошаговая отладка и анализ сложной логики.",
  "gpt-4o-mini": "Бесплатный вариант для простых задач: сниппеты, SQL, regex, быстрые фиксы.",
  "gemini-2.5-pro": "1M контекст — загружайте целые проекты. Хорош для code review.",
};

const examples = [
  { prompt: "У меня React-компонент рендерится бесконечно. Вот код: [...]. Найди причину и исправь.", tag: "Дебаг" },
  { prompt: "Перепиши этот Python-скрипт с синхронного на async/await. Сохрани всю логику.", tag: "Рефакторинг" },
  { prompt: "Напиши SQL-запрос: найти пользователей, которые сделали более 5 заказов за последний месяц, сгруппировать по городу.", tag: "SQL" },
  { prompt: "Напиши unit-тесты на Jest для этой функции обработки платежей. Покрой edge cases.", tag: "Тесты" },
  { prompt: "Объясни этот алгоритм Дейкстры строка за строкой. В чём сложность O(V + E log V)?", tag: "Обучение" },
  { prompt: "Сгенерируй REST API на FastAPI: CRUD для пользователей с JWT-авторизацией и Pydantic-схемами.", tag: "Генерация" },
  { prompt: "Напиши Dockerfile для Node.js приложения с multi-stage build, оптимизируй размер образа.", tag: "DevOps" },
  { prompt: "Проведи code review этого PR. Что можно улучшить? Есть ли проблемы с безопасностью?", tag: "Code review" },
  { prompt: "Напиши regex для валидации российских номеров телефонов: +7, 8, с пробелами и без.", tag: "Regex" },
];

const faqItems = [
  {
    q: "Какие языки программирования поддерживаются?",
    a: "Все популярные: Python, JavaScript/TypeScript, Java, C/C++, Go, Rust, PHP, Ruby, Swift, Kotlin, SQL и десятки других. AI-модели обучены на огромных кодовых базах и знают синтаксис, библиотеки и best practices.",
  },
  {
    q: "Можно ли загрузить файл с кодом?",
    a: "Да, можно отправить файл в чат. Для больших проектов используйте модели с контекстом 1M (GPT-4.1, Gemini 2.5 Pro) — они могут анализировать тысячи строк кода одновременно.",
  },
  {
    q: "Какая модель лучше для кода?",
    a: "Claude Opus 4 и Claude Sonnet 4 считаются лучшими для программирования. Devstral — бюджетная альтернатива ($2.10/1M). Для алгоритмических задач — DeepSeek R1 или o3 (reasoning-модели).",
  },
  {
    q: "Безопасно ли отправлять проприетарный код?",
    a: "Код передаётся провайдерам AI по зашифрованному каналу. Большинство провайдеров (OpenAI, Anthropic, Google) не используют данные API-запросов для обучения моделей. Stone AI не хранит содержимое запросов.",
  },
];

export default function CodePage() {
  return (
    <>
      <ToolPageHero
        badge="Для разработчиков"
        title="AI-ассистент"
        highlight="для программистов"
        description="Дебаг, рефакторинг, генерация кода, code review, SQL, DevOps. Claude Opus, GPT-4.1, Devstral и другие — прямо в Telegram."
      />
      <ToolModels
        title="Модели для разработки"
        subtitle="От бесплатного GPT-4o mini до мощнейшего Claude Opus"
        modelIds={modelIds}
        descriptions={modelDescriptions}
      />
      <ToolExamples
        subtitle="Отправьте код — получите решение, ревью или объяснение"
        examples={examples}
      />
      <ToolFaq items={faqItems} />
      <ToolCta title="Ускорьте свою разработку" subtitle="Claude Opus для сложных задач, Devstral за $2.10/1M для ежедневного кодинга." />
    </>
  );
}
