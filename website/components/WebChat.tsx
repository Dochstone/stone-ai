"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MODELS, type AIModel } from "@/lib/models";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

// ─── Types ───

interface Message {
  role: "user" | "assistant";
  content: string;
  billing?: {
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    balance_usd: number;
    billing_mode: string;
  };
}

interface AuthState {
  token: string;
  email: string;
  balanceUsd: number;
}

// ─── Auth Form ───

function AuthForm({ onAuth }: { onAuth: (auth: AuthState) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Ошибка");
        return;
      }

      const auth: AuthState = {
        token: data.token,
        email: data.user.email,
        balanceUsd: data.user.balance_usd || 0,
      };
      localStorage.setItem("stone_auth", JSON.stringify(auth));
      onAuth(auth);
    } catch {
      setError("Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-extrabold text-text">Stone AI</a>
          <p className="mt-2 text-text/50 text-sm">50+ AI-моделей в одном чате</p>
        </div>

        <div className="bg-white rounded-2xl border border-text/5 p-8">
          <div className="flex gap-1 bg-bg rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === "login" ? "bg-white text-text shadow-sm" : "text-text/40"
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                mode === "register" ? "bg-white text-text shadow-sm" : "text-text/40"
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text/50 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text/50 mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                placeholder={mode === "register" ? "Минимум 8 символов" : ""}
              />
            </div>

            {error && <p className="text-red-500 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-white py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? "..." : mode === "login" ? "Войти" : "Зарегистрироваться"}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs text-text/30">
          Или используйте <a href="https://t.me/StoneAIBot" className="text-accent hover:underline">Telegram-бота</a>
        </p>
      </div>
    </div>
  );
}

// ─── Model Sidebar ───

const companyColors: Record<string, string> = {
  OpenAI: "bg-green-100 text-green-700",
  Anthropic: "bg-orange-100 text-orange-700",
  Google: "bg-blue-100 text-blue-700",
  Meta: "bg-sky-100 text-sky-700",
  Mistral: "bg-purple-100 text-purple-700",
  DeepSeek: "bg-cyan-100 text-cyan-700",
  xAI: "bg-slate-100 text-slate-700",
  Perplexity: "bg-indigo-100 text-indigo-700",
};

function formatPrice(m: AIModel) {
  if (m.tier === "free") return "FREE";
  if (m.priceUnit) return `$${m.pricePerMillion}${m.priceUnit}`;
  return `$${m.pricePerMillion}/1M`;
}

function ModelSidebar({
  selected,
  onSelect,
  open,
  onClose,
}: {
  selected: string;
  onSelect: (id: string) => void;
  open: boolean;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | "free" | "pro">("all");

  const filtered = MODELS.filter((m) => {
    if (tierFilter === "free" && m.tier !== "free") return false;
    if (tierFilter === "pro" && m.tier !== "pro") return false;
    if (filter && !m.name.toLowerCase().includes(filter.toLowerCase()) && !m.company.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-text/5 flex flex-col transition-transform lg:relative lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-text/5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-sm">Модели</h2>
          <button onClick={onClose} className="lg:hidden text-text/30 text-xl">&times;</button>
        </div>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Поиск..."
          className="w-full bg-bg border border-text/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent"
        />
        <div className="flex gap-1 mt-2">
          {(["all", "free", "pro"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={`px-3 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                tierFilter === t ? "bg-accent text-white" : "bg-bg text-text/40"
              }`}
            >
              {t === "all" ? "Все" : t === "free" ? "Free" : "Pro"}
            </button>
          ))}
        </div>
      </div>

      {/* Model list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((m) => (
          <button
            key={m.id}
            onClick={() => { onSelect(m.id); onClose(); }}
            className={`w-full text-left px-4 py-3 border-b border-text/[0.03] hover:bg-bg/50 transition-colors ${
              selected === m.id ? "bg-accent/5 border-l-2 border-l-accent" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className="font-semibold text-xs">{m.name}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                m.tier === "free" ? "bg-teal-light text-teal" : "bg-accent/10 text-accent"
              }`}>
                {formatPrice(m)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${companyColors[m.company] ?? "bg-gray-100 text-gray-600"}`}>
                {m.company}
              </span>
              {m.context && <span className="text-[9px] text-text/25">{m.context}</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Chat Area ───

function ChatArea({
  messages,
  streaming,
  input,
  setInput,
  onSend,
  selectedModel,
  onOpenSidebar,
  balanceUsd,
  onLogout,
  email,
}: {
  messages: Message[];
  streaming: boolean;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  selectedModel: string;
  onOpenSidebar: () => void;
  balanceUsd: number;
  onLogout: () => void;
  email: string;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const model = MODELS.find((m) => m.id === selectedModel);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top bar */}
      <div className="h-14 border-b border-text/5 bg-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onOpenSidebar} className="lg:hidden text-text/40">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div>
            <span className="font-bold text-sm">{model?.name || selectedModel}</span>
            <span className="text-[10px] text-text/30 ml-2">{model?.company}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-accent">${balanceUsd.toFixed(2)}</span>
          <div className="text-[10px] text-text/30 hidden sm:block">{email}</div>
          <button onClick={onLogout} className="text-[10px] text-text/30 hover:text-text">Выйти</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-20">
            <p className="text-2xl font-extrabold text-text/10 mb-2">Stone AI</p>
            <p className="text-sm text-text/30">Выберите модель и начните диалог</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === "user"
                ? "bg-accent text-white rounded-br-md"
                : "bg-white border border-text/5 text-text/80 rounded-bl-md"
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.billing && (
                <details className="mt-2 text-[10px] opacity-60">
                  <summary className="cursor-pointer">
                    {msg.billing.tokens_in + msg.billing.tokens_out} tok · ${msg.billing.cost_usd.toFixed(4)}
                  </summary>
                  <div className="mt-1 space-y-0.5">
                    <div>Input: {msg.billing.tokens_in} tok</div>
                    <div>Output: {msg.billing.tokens_out} tok</div>
                    <div>Стоимость: ${msg.billing.cost_usd.toFixed(6)}</div>
                    <div>Баланс: ${msg.billing.balance_usd.toFixed(4)}</div>
                    <div>Режим: {msg.billing.billing_mode}</div>
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
        {streaming && (
          <div className="flex justify-start">
            <div className="bg-white border border-text/5 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-text/5 bg-white p-4 shrink-0">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Написать сообщение..."
            rows={1}
            className="flex-1 bg-bg border border-text/10 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
          <button
            onClick={onSend}
            disabled={streaming || !input.trim()}
            className="bg-accent text-white px-5 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors disabled:opacity-40 shrink-0"
          >
            &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main WebChat ───

export default function WebChat() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o-mini");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load auth from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("stone_auth");
      if (saved) setAuth(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    localStorage.removeItem("stone_auth");
    setMessages([]);
    fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
  }, []);

  const sendMessage = useCallback(async () => {
    if (!auth || !input.trim() || streaming) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setStreaming(true);

    // Build messages for API (last 20 for context window)
    const apiMessages = history.slice(-20).map((m) => ({
      role: m.role,
      content: m.content,
    }));

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
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Ошибка сервера" }));
        const errMsg = typeof err.detail === "string" ? err.detail : err.detail?.error || "Ошибка";
        setMessages([...history, { role: "assistant", content: errMsg }]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let assistantContent = "";
      let billing: Message["billing"] | undefined;

      // Add empty assistant message
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

            // Billing chunk
            if (data.billing) {
              billing = data.billing;
              setAuth((prev) =>
                prev ? { ...prev, balanceUsd: data.billing.balance_usd } : prev
              );
              // Update localStorage
              try {
                const saved = localStorage.getItem("stone_auth");
                if (saved) {
                  const parsed = JSON.parse(saved);
                  parsed.balanceUsd = data.billing.balance_usd;
                  localStorage.setItem("stone_auth", JSON.stringify(parsed));
                }
              } catch {}
              continue;
            }

            // Content chunk
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages([
                ...history,
                { role: "assistant", content: assistantContent, billing },
              ]);
            }
          } catch {}
        }
      }

      // Final message with billing
      setMessages([
        ...history,
        { role: "assistant", content: assistantContent, billing },
      ]);
    } catch (e) {
      setMessages([...history, { role: "assistant", content: "Ошибка соединения" }]);
    } finally {
      setStreaming(false);
    }
  }, [auth, input, streaming, messages, selectedModel]);

  if (!loaded) return null;
  if (!auth) return <AuthForm onAuth={setAuth} />;

  return (
    <div className="h-screen flex bg-bg" style={{ paddingTop: 0 }}>
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <ModelSidebar
        selected={selectedModel}
        onSelect={setSelectedModel}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <ChatArea
        messages={messages}
        streaming={streaming}
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        selectedModel={selectedModel}
        onOpenSidebar={() => setSidebarOpen(true)}
        balanceUsd={auth.balanceUsd}
        onLogout={logout}
        email={auth.email}
      />
    </div>
  );
}
