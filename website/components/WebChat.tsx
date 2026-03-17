"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MODELS, type AIModel } from "@/lib/models";
import AuthFormComponent, { type AuthState } from "@/components/AuthForm";
import Onboarding from "@/components/Onboarding";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

const IMAGE_MODEL_IDS = new Set([
  "nano-banana-pro", "nano-banana", "gpt-5-image", "gpt-5-image-mini",
  "flux-schnell", "stable-diffusion-xl",
]);

function extractImageUrl(text: string): string | null {
  // Check for base64 data URL
  const b64Match = text.match(/(data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+)/);
  if (b64Match) return b64Match[1];
  // Check for markdown image
  const mdMatch = text.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/);
  if (mdMatch) return mdMatch[1];
  // Check for raw image URL
  const urlMatch = text.match(/(https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s"'<>]*)?)/i);
  if (urlMatch) return urlMatch[1];
  // OpenRouter may return URL in JSON-like format
  const jsonUrlMatch = text.match(/"url"\s*:\s*"(https?:\/\/[^"]+)"/);
  if (jsonUrlMatch) return jsonUrlMatch[1];
  return null;
}

function downloadImage(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

function MessageContent({ content, role, selectedModel }: { content: string; role: string; selectedModel: string }) {
  if (role !== "assistant" || !content) {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  const imageUrl = extractImageUrl(content);
  const isImageModel = IMAGE_MODEL_IDS.has(selectedModel);

  if (imageUrl && isImageModel) {
    // Strip image URL/markdown from text to show remaining caption
    const caption = content
      .replace(/(data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+)/, "")
      .replace(/!\[.*?\]\(https?:\/\/[^\s)]+\)/, "")
      .replace(/(https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s"'<>]*)?)/, "")
      .replace(/"url"\s*:\s*"https?:\/\/[^"]+"/g, "")
      .trim();

    return (
      <div>
        <img
          src={imageUrl}
          alt="Generated image"
          className="max-w-full rounded-xl mb-2"
          style={{ maxHeight: 400 }}
        />
        {caption && <div className="whitespace-pre-wrap text-sm mb-2">{caption}</div>}
        <button
          onClick={() => downloadImage(imageUrl, `stone-ai-${Date.now()}.png`)}
          className="flex items-center gap-1.5 text-[11px] text-accent font-semibold hover:underline"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
          </svg>
          Скачать
        </button>
      </div>
    );
  }

  // For image models, also check if the whole response looks like a URL
  if (isImageModel && content.match(/^https?:\/\/\S+$/)) {
    return (
      <div>
        <img src={content.trim()} alt="Generated image" className="max-w-full rounded-xl mb-2" style={{ maxHeight: 400 }} />
        <button
          onClick={() => downloadImage(content.trim(), `stone-ai-${Date.now()}.png`)}
          className="flex items-center gap-1.5 text-[11px] text-accent font-semibold hover:underline"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
          </svg>
          Скачать
        </button>
      </div>
    );
  }

  return <div className="whitespace-pre-wrap">{content}</div>;
}

// ─── Types ───

interface FileAttachment {
  file_id: string;
  file_name: string;
  file_type: "image" | "pdf";
  mime_type: string;
  size: number;
  content: string; // base64 data URL for images, text for PDF
}

interface Message {
  role: "user" | "assistant";
  content: string;
  file?: FileAttachment;
  billing?: {
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    balance_usd: number;
    billing_mode: string;
  };
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
  onToggle,
}: {
  selected: string;
  onSelect: (id: string) => void;
  open: boolean;
  onToggle: () => void;
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
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/25 z-30 lg:hidden" onClick={onToggle} />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 w-[280px] bg-white border-r border-text/5 flex flex-col transition-transform duration-200 lg:relative ${
          open ? "translate-x-0" : "-translate-x-full lg:-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="p-3 border-b border-text/5 shrink-0">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="font-bold text-xs text-text/50 uppercase tracking-wide">Модели</h2>
            <button onClick={onToggle} className="text-text/30 hover:text-text/60 p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M11 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Поиск..."
            className="w-full bg-bg border border-text/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent"
          />
          <div className="flex gap-1 mt-2">
            {(["all", "free", "pro"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
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
              onClick={() => { onSelect(m.id); if (window.innerWidth < 1024) onToggle(); }}
              className={`w-full text-left px-3 py-2.5 border-b border-text/[0.03] transition-colors ${
                selected === m.id
                  ? "bg-accent/8 border-l-[3px] border-l-accent"
                  : "hover:bg-bg/50 border-l-[3px] border-l-transparent"
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className={`font-semibold text-xs ${selected === m.id ? "text-accent" : "text-text"}`}>
                  {m.name}
                </span>
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
                {m.context && <span className="text-[9px] text-text/20">{m.context}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
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
  sidebarOpen,
  onToggleSidebar,
  balanceUsd,
  onLogout,
  email,
  pendingFile,
  onFileSelect,
  onFileClear,
  uploading,
}: {
  messages: Message[];
  streaming: boolean;
  input: string;
  setInput: (v: string) => void;
  onSend: () => void;
  selectedModel: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  balanceUsd: number;
  onLogout: () => void;
  email: string;
  pendingFile: FileAttachment | null;
  onFileSelect: (f: File) => void;
  onFileClear: () => void;
  uploading: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    <div className="flex-1 flex flex-col min-w-0 h-screen">
      {/* Top nav bar */}
      <div className="h-12 border-b border-text/5 bg-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          {/* Sidebar toggle — always visible */}
          <button onClick={onToggleSidebar} className="text-text/40 hover:text-text/70 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {sidebarOpen
                ? <path strokeLinecap="round" d="M11 19l-7-7 7-7" />
                : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
          <a href="/" className="font-extrabold text-sm text-text/70">Stone AI</a>
        </div>
        <div className="flex items-center gap-4">
          <a href="/topup" className="text-xs font-semibold text-accent hover:underline">${balanceUsd.toFixed(2)}</a>
          <span className="text-[10px] text-text/25 hidden sm:block">{email}</span>
          <button onClick={onLogout} className="text-[10px] text-text/30 hover:text-text">Выйти</button>
        </div>
      </div>

      {/* Model info bar */}
      <div className="px-4 py-2.5 bg-bg/50 border-b border-text/[0.03] shrink-0 flex items-center gap-3">
        <span className="font-bold text-sm">{model?.name || selectedModel}</span>
        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${companyColors[model?.company ?? ""] ?? "bg-gray-100 text-gray-600"}`}>
          {model?.company}
        </span>
        <span className={`text-[10px] font-bold ${model?.tier === "free" ? "text-teal" : "text-accent"}`}>
          {model ? formatPrice(model) : ""}
        </span>
        {model?.context && <span className="text-[10px] text-text/25">{model.context}</span>}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl mb-4 opacity-10">AI</div>
              <p className="text-lg font-extrabold text-text/10 mb-1">Stone AI</p>
              <p className="text-sm text-text/25">Выберите модель и начните диалог</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-accent text-white rounded-br-md"
                    : "bg-white border border-text/5 text-text/80 rounded-bl-md"
                }`}>
                  {msg.file && (
                    <div className="mb-2">
                      {msg.file.file_type === "image" ? (
                        <img src={msg.file.content} alt={msg.file.file_name} className="max-w-[240px] rounded-lg" />
                      ) : (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${msg.role === "user" ? "bg-white/20" : "bg-bg"}`}>
                          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          <span className="truncate">{msg.file.file_name}</span>
                          <span className="shrink-0 opacity-60">{(msg.file.size / 1024).toFixed(0)}KB</span>
                        </div>
                      )}
                    </div>
                  )}
                  <MessageContent content={msg.content} role={msg.role} selectedModel={selectedModel} />
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
        )}
      </div>

      {/* Input — pinned bottom, full width */}
      <div className="border-t border-text/5 bg-white px-3 py-2.5 shrink-0">
        {/* Pending file preview */}
        {pendingFile && (
          <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-bg rounded-lg">
            {pendingFile.file_type === "image" ? (
              <img src={pendingFile.content} alt="" className="w-10 h-10 rounded object-cover" />
            ) : (
              <div className="w-10 h-10 bg-accent/10 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
            )}
            <span className="text-xs text-text/60 truncate flex-1">{pendingFile.file_name}</span>
            <button onClick={onFileClear} className="text-text/30 hover:text-text/60 shrink-0 p-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        {uploading && (
          <div className="text-xs text-accent mb-2 px-2 animate-pulse">Загрузка файла...</div>
        )}
        <div className="flex gap-2 items-end">
          {/* Clip button */}
          <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) onFileSelect(e.target.files[0]); e.target.value = ""; }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || streaming}
            className="w-10 h-10 rounded-xl bg-bg border border-text/10 flex items-center justify-center text-text/40 hover:text-accent hover:border-accent/30 transition-colors disabled:opacity-30 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={pendingFile ? "Добавьте вопрос к файлу..." : "Написать сообщение..."}
            rows={1}
            className="flex-1 bg-bg border border-text/10 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent min-w-0"
          />
          <button
            onClick={onSend}
            disabled={streaming || (!input.trim() && !pendingFile)}
            className="bg-accent text-white w-10 h-10 rounded-xl hover:bg-accent/90 transition-colors disabled:opacity-40 shrink-0 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingFile, setPendingFile] = useState<FileAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Load auth from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("stone_auth");
      if (saved) setAuth(JSON.parse(saved));
    } catch {}
    setLoaded(true);
    // Collapse sidebar on mobile
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
    // Show onboarding if first time
    if (!localStorage.getItem("onboarding_done")) {
      setShowOnboarding(true);
    }
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    localStorage.removeItem("stone_auth");
    setMessages([]);
    fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

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

  const sendMessage = useCallback(async () => {
    if (!auth || (!input.trim() && !pendingFile) || streaming) return;

    const currentFile = pendingFile;
    const userMsg: Message = { role: "user", content: input.trim() || (currentFile ? `[Файл: ${currentFile.file_name}]` : ""), file: currentFile || undefined };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setPendingFile(null);
    setStreaming(true);

    // Build API messages — inject file content for multimodal
    const apiMessages = history.slice(-20).map((m) => {
      if (m.file) {
        if (m.file.file_type === "image") {
          // OpenRouter multimodal format
          return {
            role: m.role,
            content: [
              ...(m.content ? [{ type: "text", text: m.content }] : []),
              { type: "image_url", image_url: { url: m.file.content } },
            ],
          };
        } else {
          // PDF — inject extracted text as context
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
              setAuth((prev) =>
                prev ? { ...prev, balanceUsd: data.billing.balance_usd } : prev
              );
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

      setMessages([
        ...history,
        { role: "assistant", content: assistantContent, billing },
      ]);
    } catch (e) {
      setMessages([...history, { role: "assistant", content: "Ошибка соединения" }]);
    } finally {
      setStreaming(false);
    }
  }, [auth, input, streaming, messages, selectedModel, pendingFile]);

  if (!loaded) return null;
  if (!auth) return <AuthFormComponent onAuth={setAuth} />;

  return (
    <div className="h-screen flex bg-bg overflow-hidden">
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}

      {/* Help button to replay onboarding */}
      <button
        onClick={() => setShowOnboarding(true)}
        className="fixed bottom-20 right-4 z-50 w-8 h-8 bg-white border border-text/10 rounded-full flex items-center justify-center text-text/30 hover:text-accent hover:border-accent/30 transition-colors shadow-sm text-sm font-bold"
        title="Справка"
      >
        ?
      </button>

      <ModelSidebar
        selected={selectedModel}
        onSelect={setSelectedModel}
        open={sidebarOpen}
        onToggle={toggleSidebar}
      />

      <ChatArea
        messages={messages}
        streaming={streaming}
        input={input}
        setInput={setInput}
        onSend={sendMessage}
        selectedModel={selectedModel}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        balanceUsd={auth.balanceUsd}
        onLogout={logout}
        email={auth.email}
        pendingFile={pendingFile}
        onFileSelect={handleFileSelect}
        onFileClear={() => setPendingFile(null)}
        uploading={uploading}
      />
    </div>
  );
}
