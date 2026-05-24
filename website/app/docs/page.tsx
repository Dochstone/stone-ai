import type { Metadata } from "next";
import { planPrice, planPriceFull } from "@/lib/pricing";
import CodeBlock from "@/components/CodeBlock";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "API Документация",
  description: "API документация Stone AI: авторизация, POST /api/chat, GET /api/models, биллинг, лимиты, коды ошибок.",
  alternates: { canonical: "/docs" },
  openGraph: {
    title: "API Документация",
    description: "API документация Stone AI: авторизация, POST /api/chat, GET /api/models, биллинг, лимиты, коды ошибок.",
  },
};

const BASE_URL = "https://stoneai.ru";

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Как начать использовать Stone AI API",
  description: "Пошаговая инструкция по подключению к API Stone AI: регистрация, получение токена и отправка первого запроса к AI-модели.",
  step: [
    { "@type": "HowToStep", position: 1, name: "Регистрация", text: "Отправьте POST-запрос на /api/auth/register с email и паролем. В ответе получите JWT-токен для авторизации." },
    { "@type": "HowToStep", position: 2, name: "Получите JWT токен", text: "Сохраните поле token из ответа. Используйте его в заголовке Authorization: Bearer <token> для всех последующих запросов." },
    { "@type": "HowToStep", position: 3, name: "Выберите модель", text: "Отправьте GET-запрос на /api/models чтобы получить список доступных AI-моделей с ценами и характеристиками." },
    { "@type": "HowToStep", position: 4, name: "Отправьте сообщение", text: "Отправьте POST-запрос на /api/chat с model_id и массивом messages. Ответ придёт через SSE (Server-Sent Events) в реальном времени." },
  ],
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 mb-14">
      <h2 className="text-xl font-extrabold mb-4 pb-2 border-b border-text/10">{title}</h2>
      {children}
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-text/65 leading-relaxed mb-3">{children}</p>;
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-text/5 my-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-bg">
            {headers.map((h) => (
              <th key={h} className="text-left py-2.5 px-4 font-semibold text-text/60">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-text/5">
              {row.map((cell, j) => (
                <td key={j} className={`py-2.5 px-4 ${j === 0 ? "font-mono text-accent text-xs" : "text-text/60"}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "getting-started", label: "Getting Started" },
  { id: "auth", label: "Авторизация" },
  { id: "chat", label: "POST /api/chat" },
  { id: "models", label: "GET /api/models" },
  { id: "upload", label: "POST /api/chat/upload" },
  { id: "billing", label: "Биллинг" },
  { id: "limits", label: "Лимиты" },
  { id: "errors", label: "Коды ошибок" },
];

export default function DocsPage() {
  return (
    <div className="pt-24 pb-20 min-h-screen">
      <Breadcrumbs items={[{ label: "Документация", href: "/docs" }]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-10">
          {/* Sidebar nav */}
          <aside className="hidden lg:block w-48 shrink-0">
            <div className="sticky top-24">
              <p className="text-[10px] text-text/30 font-semibold uppercase tracking-wider mb-3">API Docs</p>
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="block text-sm text-text/50 hover:text-accent py-1 transition-colors">
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0 max-w-3xl">
            <div className="mb-10">
              <div className="inline-block bg-accent/10 text-accent px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
                API v1
              </div>
              <h1 className="text-3xl font-extrabold mb-3">API Документация</h1>
              <P>REST API для доступа к 65+ нейросетям. SSE-стриминг, подписка, JWT авторизация.</P>
            </div>

            {/* Getting Started */}
            <Section id="getting-started" title="Getting Started">
              <P>Base URL для всех запросов:</P>
              <CodeBlock code={BASE_URL} lang="url" />
              <P>Все запросы используют JSON. Ответы чата — Server-Sent Events (SSE). Авторизация через JWT токен в заголовке <code className="bg-bg px-1.5 py-0.5 rounded text-xs font-mono">Authorization: Bearer &lt;token&gt;</code>.</P>
              <P>Быстрый старт:</P>
              <ol className="list-decimal pl-5 text-sm text-text/65 space-y-1 mb-4">
                <li>Зарегистрируйтесь: <code className="bg-bg px-1 rounded text-xs font-mono">POST /api/auth/register</code></li>
                <li>Получите JWT токен из ответа</li>
                <li>Отправьте сообщение: <code className="bg-bg px-1 rounded text-xs font-mono">POST /api/chat</code></li>
              </ol>
            </Section>

            {/* Auth */}
            <Section id="auth" title="Авторизация">
              <P>Регистрация нового пользователя:</P>
              <CodeBlock lang="curl" code={`curl -X POST ${BASE_URL}/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "mypassword"}'`} />
              <P>Ответ содержит JWT токен:</P>
              <CodeBlock lang="json" code={`{
  "status": "ok",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 42,
    "email": "user@example.com",
    "balance_usd": 0.0
  }
}`} />
              <P>Логин:</P>
              <CodeBlock lang="curl" code={`curl -X POST ${BASE_URL}/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "mypassword"}'`} />
              <P>Также поддерживается OAuth: <code className="bg-bg px-1 rounded text-xs font-mono">POST /api/auth/google</code> и <code className="bg-bg px-1 rounded text-xs font-mono">POST /api/auth/yandex</code>.</P>
            </Section>

            {/* Chat */}
            <Section id="chat" title="POST /api/chat">
              <P>Стриминг ответа от AI-модели через SSE.</P>
              <Table
                headers={["Параметр", "Тип", "Описание"]}
                rows={[
                  ["model_id", "string", "ID модели (см. /api/models). По умолчанию: gpt-4o-mini"],
                  ["messages", "array", "Массив сообщений [{role, content}]"],
                  ["system_prompt", "string?", "Системный промпт (только для платных пользователей)"],
                ]}
              />
              <P>Пример с curl:</P>
              <CodeBlock lang="curl" code={`curl -N -X POST ${BASE_URL}/api/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -d '{
    "model_id": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "Привет! Что такое AI?"}
    ]
  }'`} />
              <P>Пример на Python:</P>
              <CodeBlock lang="python" code={`import httpx

token = "YOUR_JWT_TOKEN"
url = "${BASE_URL}/api/chat"

with httpx.stream("POST", url,
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    json={
        "model_id": "claude-haiku-4.5",
        "messages": [{"role": "user", "content": "Напиши хайку про AI"}]
    }
) as response:
    for line in response.iter_lines():
        if line.startswith("data: ") and line != "data: [DONE]":
            print(line[6:])`} />
              <P>SSE-ответ содержит чанки контента, затем usage и billing:</P>
              <CodeBlock lang="json" code={`data: {"choices": [{"delta": {"content": "Привет"}}]}
data: {"choices": [{"delta": {"content": "! AI — это..."}}]}
data: {"usage": {"tokens_in": 15, "tokens_out": 82}}
data: {"billing": {"tokens_in": 15, "tokens_out": 82, "plan": "max", "requests_left": 1842}}
data: [DONE]`} />
            </Section>

            {/* Models */}
            <Section id="models" title="GET /api/models">
              <P>Список всех доступных моделей с метаданными и ценами.</P>
              <CodeBlock lang="curl" code={`curl ${BASE_URL}/api/models
# Фильтры:
curl "${BASE_URL}/api/models?tier=lite"        # только бесплатные
curl "${BASE_URL}/api/models?company=OpenAI"   # по провайдеру
curl "${BASE_URL}/api/models?category=image"   # по категории`} />
              <P>Ответ:</P>
              <CodeBlock lang="json" code={`{
  "models": [
    {
      "id": "gpt-4o-mini",
      "name": "GPT-4o mini",
      "company": "OpenAI",
      "tier": "lite",
      "category": "chat",
      "price_weighted": 2.50,
      "price_input": 0.90,
      "price_output": 3.60,
      "context_length": "128K"
    },
    ...
  ]
}`} />
              <Table
                headers={["Фильтр", "Значения", "Описание"]}
                rows={[
                  ["tier", "lite | premium", "lite = бесплатные (5 моделей), premium = платные"],
                  ["company", "OpenAI, Anthropic, Google...", "15 провайдеров"],
                  ["category", "chat | image | reason | search | code", "Тип модели"],
                ]}
              />
            </Section>

            {/* Upload */}
            <Section id="upload" title="POST /api/chat/upload">
              <P>Загрузка файлов (изображения, PDF) для использования в чате.</P>
              <CodeBlock lang="curl" code={`curl -X POST ${BASE_URL}/api/chat/upload \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -F "file=@document.pdf"`} />
              <P>Ответ:</P>
              <CodeBlock lang="json" code={`{
  "file_id": "a1b2c3d4",
  "file_name": "document.pdf",
  "file_type": "pdf",
  "mime_type": "application/pdf",
  "size": 245000,
  "content": "Извлечённый текст из PDF..."
}`} />
              <P>Для изображений <code className="bg-bg px-1 rounded text-xs font-mono">content</code> — base64 data URL. Для PDF — извлечённый текст. Максимум 10MB.</P>
            </Section>

            {/* Billing */}
            <Section id="billing" title="Биллинг">
              <P>Stone AI: <strong>Pay-per-Use</strong> (баланс кабинета для инструментов, без подписки) или подписки <strong>Start</strong> ({planPriceFull("mini")}), <strong>Pro</strong> ({planPriceFull("max")}), <strong>Elite</strong> ({planPriceFull("max-pro")}). Лимиты запросов зависят от тарифа. Баланс кабинета можно перенести в подписку.</P>
              <P>API доступен на тарифе Elite. Дорогие модели тратят больше единиц лимита (см. ниже).</P>
              <Table
                headers={["Модель", "Категория", "Вес запроса"]}
                rows={[
                  ["GPT-4o mini, Gemini Flash, DeepSeek V3", "Fast (Free)", "×1"],
                  ["Mistral Large", "Fast", "×3"],
                  ["GPT-5.1, Claude Sonnet 4.5, Grok 3", "Premium", "×2"],
                  ["Claude Opus 4.5", "Opus (Pro+)", "×5"],
                  ["Nano Banana Pro", "Image", "×5"],
                  ["GPT-5 Image", "Image", "×3"],
                  ["Прочие", "Любая", "×1"],
                ]}
              />
              <P>Видео считается отдельной системой <strong>видео-поинтов</strong>: дешёвое видео = 1 поинт, премиум (1080P / 10 сек) = 2-4 поинта.</P>
            </Section>

            {/* Limits */}
            <Section id="limits" title="Лимиты">
              <Table
                headers={["Тариф", "Fast/день", "Premium/нед", "Opus/нед", "Картинки", "Видео-поинты/мес"]}
                rows={[
                  ["Pay-per-Use", "10", "2/день", "—", "2 пробных", "2 пробных (lifetime)"],
                  [`Start (${planPrice("mini")})`, "20", "5/день", "—", "60/мес", "13 + триалы"],
                  [`Pro (${planPrice("max")})`, "50", "28", "7", "35/нед", "33"],
                  [`Elite (${planPrice("max-pro")})`, "150", "84", "14", "70/нед", "80"],
                ]}
              />
              <P>Лимиты учитывают вес моделей. Один Claude Opus = 5 единиц premium. Один nano-banana-pro = 5 картинок.</P>
              <Table
                headers={["Параметр", "Значение"]}
                rows={[
                  ["MAX_TOKENS_LITE", "4096 (макс. output для бесплатных)"],
                  ["MAX_TOKENS_PAID", "8192 (макс. output для платных)"],
                  ["Pro file upload", "10MB"],
                  ["Rate limit", "Лимитируется тарифом подписки"],
                ]}
              />
            </Section>

            {/* Errors */}
            <Section id="errors" title="Коды ошибок">
              <Table
                headers={["Код", "Описание", "Решение"]}
                rows={[
                  ["401", "Unauthorized — невалидный или отсутствующий токен", "Проверьте Authorization header"],
                  ["402", "Payment Required — недостаточно прав для premium модели", "Выберите подходящий тариф на /pricing"],
                  ["429", "Too Many Requests — лимит запросов исчерпан", "Подождите до завтра или выберите более высокий тариф"],
                  ["400", "Bad Request — неверные параметры", "Проверьте model_id и messages"],
                  ["503", "Service Unavailable — сервис оплаты временно недоступен", "Попробуйте позже"],
                ]}
              />
              <P>Ошибки возвращаются в формате:</P>
              <CodeBlock lang="json" code={`{
  "detail": {
    "error": "Лимит запросов исчерпан. Выберите более высокий тариф.",
    "plan": "free",
    "tier": "premium",
    "used_today": 15,
    "limit": 15,
    "upgrade_url": "/pricing"
  }
}`} />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
