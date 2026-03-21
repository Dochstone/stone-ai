import type { Metadata } from "next";
import CodeBlock from "@/components/CodeBlock";

export const metadata: Metadata = {
  title: "API Документация",
  description: "API документация Stone AI: авторизация, POST /api/chat, GET /api/models, биллинг, лимиты, коды ошибок.",
};

const BASE_URL = "https://stone-ai-production.up.railway.app";

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
              <P>REST API для доступа к 50+ AI-моделям. SSE-стриминг, per-token биллинг, JWT авторизация.</P>
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
data: {"billing": {"tokens_in": 15, "tokens_out": 82, "cost_usd": 0.0003, "balance_usd": 9.99, "billing_mode": "per_token"}}
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
              <P>Stone AI использует per-token биллинг. Стоимость зависит от модели и количества токенов.</P>
              <P>Формула: <code className="bg-bg px-1.5 py-0.5 rounded text-xs font-mono">cost = (tokens_in × price_input + tokens_out × price_output) / 1,000,000</code></P>
              <Table
                headers={["Модель", "Input $/1M", "Output $/1M", "Средневзвешенная"]}
                rows={[
                  ["gpt-4o-mini", "$0.90", "$3.60", "$2.50 (FREE)"],
                  ["claude-haiku-4.5", "$3.20", "$16.00", "$11.00 (FREE)"],
                  ["gpt-5.1", "$4.90", "$39.20", "$26.00"],
                  ["claude-opus-4", "$37.50", "$187.50", "$130.00"],
                  ["gemini-2.5-pro", "$5.00", "$40.00", "$26.00"],
                  ["flux-schnell", "—", "—", "$0.012/img"],
                ]}
              />
              <P>5 моделей бесплатно (15 запросов/день). Остальные — per-token с баланса в USD.</P>
              <P>Списание происходит ПОСЛЕ получения ответа, по реально использованным токенам.</P>
            </Section>

            {/* Limits */}
            <Section id="limits" title="Лимиты">
              <Table
                headers={["Тариф", "Lite модели", "Premium модели"]}
                rows={[
                  ["Free", "15/день", "По балансу (per-token)"],
                  ["Per-token", "Безлимит (с баланса)", "Безлимит (с баланса)"],
                ]}
              />
              <Table
                headers={["Параметр", "Значение"]}
                rows={[
                  ["MAX_TOKENS_LITE", "4096 (макс. output для бесплатных)"],
                  ["MAX_TOKENS_PAID", "8192 (макс. output для платных)"],
                  ["Max file upload", "10MB"],
                  ["Rate limit", "Нет жёсткого rate limit, лимитируется балансом"],
                ]}
              />
            </Section>

            {/* Errors */}
            <Section id="errors" title="Коды ошибок">
              <Table
                headers={["Код", "Описание", "Решение"]}
                rows={[
                  ["401", "Unauthorized — невалидный или отсутствующий токен", "Проверьте Authorization header"],
                  ["402", "Payment Required — недостаточно средств для premium модели", "Пополните баланс на /topup"],
                  ["429", "Too Many Requests — лимит бесплатных запросов исчерпан", "Подождите до завтра или пополните баланс"],
                  ["400", "Bad Request — неверные параметры", "Проверьте model_id и messages"],
                  ["503", "Service Unavailable — сервис оплаты временно недоступен", "Попробуйте позже"],
                ]}
              />
              <P>Ошибки возвращаются в формате:</P>
              <CodeBlock lang="json" code={`{
  "detail": {
    "error": "Недостаточно средств. Баланс $0.01, примерная стоимость $0.26",
    "plan": "free",
    "tier": "premium",
    "used_today": 0,
    "limit": 0,
    "need_balance": true
  }
}`} />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
