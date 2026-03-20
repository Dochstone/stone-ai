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
  "kling-v2", "runway-gen3", "pika-2", "stable-video", "luma-dream",
]);

const THREED_MODEL_IDS = new Set(["tripo-v2.5", "triposr"]);

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

function MessageContent({ content, role, selectedModel }: { content: string; role: string; selectedModel: string }) {
  if (role !== "assistant" || !content) {
    return <div className="whitespace-pre-wrap break-words">{content}</div>;
  }

  const imageUrl = extractImageUrl(content);
  const isImageModel = IMAGE_MODEL_IDS.has(selectedModel);

  // Image model returned an image (base64, URL, markdown image)
  if (imageUrl && isImageModel) {
    const caption = stripImageFromText(content);
    return <ImageWithDownload url={imageUrl} caption={caption || undefined} />;
  }

  // Image model returned a plain URL
  if (isImageModel && content.match(/^https?:\/\/\S+$/)) {
    return <ImageWithDownload url={content.trim()} />;
  }

  // Any model returned content with an embedded image (detect universally)
  if (imageUrl && !isImageModel) {
    const caption = stripImageFromText(content);
    return (
      <div>
        <div className="md-content break-words" dangerouslySetInnerHTML={{ __html: renderMarkdown(caption || content) }} />
        <ImageWithDownload url={imageUrl} />
      </div>
    );
  }

  // Image model returned text only (no image found) — render as markdown
  return <div className="md-content break-words" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />;
}

// ─── Welcome Screen ───

const SUGGESTION_CARDS = [
  { icon: "💻", title: "Напиши код на Python", subtitle: "Алгоритмы, скрипты, API" },
  { icon: "📄", title: "Проанализируй документ", subtitle: "PDF, текст, данные" },
  { icon: "🎨", title: "Сгенерируй картинку", subtitle: "DALL-E, Flux, SDXL" },
  { icon: "💡", title: "Объясни простыми словами", subtitle: "Любая тема понятно" },
];

function WelcomeScreen({ onSuggestion }: { onSuggestion: (text: string) => void }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-xl w-full">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-lg shadow-accent/20 mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-text mb-2">Чем могу помочь?</h1>
          <p className="text-sm text-text/40">50+ AI-моделей в одном месте. Выберите модель и начните диалог.</p>
        </div>

        <div className="grid grid-cols-2 max-w-md mx-auto" style={{ gap: 12 }}>
          {SUGGESTION_CARDS.map((card) => (
            <button
              key={card.title}
              onClick={() => onSuggestion(card.title)}
              className="text-left p-4 rounded-2xl border border-text/[0.06] bg-white hover:border-accent/30 hover:shadow-md hover:shadow-accent/5 transition-all duration-200 group h-full"
            >
              <span className="text-xl mb-2 block">{card.icon}</span>
              <span className="text-[13px] font-semibold text-text group-hover:text-accent transition-colors block leading-tight">{card.title}</span>
              <span className="text-[11px] text-text/30 mt-1 block">{card.subtitle}</span>
            </button>
          ))}
        </div>
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
      className="absolute bottom-4 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white border border-text/10 shadow-lg flex items-center justify-center text-text/40 hover:text-text/70 transition-colors z-10"
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
}: {
  open: boolean;
  onToggle: () => void;
  sessions: ChatSessionItem[];
  activeSessionId: number | null;
  onLoadSession: (id: number) => void;
  onNewChat: () => void;
  onDeleteSession: (id: number) => void;
}) {

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
        className={`webchat-sidebar fixed inset-y-0 left-0 z-40 bg-[#F5F4F0] flex flex-col lg:relative lg:shrink-0 ${open ? "open" : "closed"}`}
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
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/60 text-text/30 hover:text-text/60 transition-colors shrink-0"
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

        {/* Chat sessions list */}
        <div className="flex-1 overflow-y-auto px-2">
          {sessions.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <div className="text-3xl mb-2 opacity-20">💬</div>
              <p className="text-[11px] text-text/20">Здесь появятся ваши чаты</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    activeSessionId === s.id
                      ? "bg-white shadow-sm"
                      : "hover:bg-white/50"
                  }`}
                  onClick={() => { onLoadSession(s.id); if (window.innerWidth < 1024) onToggle(); }}
                >
                  <div className="flex-1 min-w-0">
                    <span className={`text-[13px] font-medium truncate block ${
                      activeSessionId === s.id ? "text-text" : "text-text/70"
                    }`}>
                      {s.title}
                    </span>
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

export default function WebChat({ initialModel, initialCategory }: { initialModel?: string; initialCategory?: string } = {}) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedModel, setSelectedModel] = useState(initialModel && MODELS.some(m => m.id === initialModel) ? initialModel : "gpt-4o-mini");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingFile, setPendingFile] = useState<FileAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [modelSearch, setModelSearch] = useState("");
  const [modelCatFilter, setModelCatFilter] = useState<string>(initialCategory || "all");

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
    if (!auth || !input.trim() || videoGenerating) return;

    const prompt = input.trim();
    const userMsg: Message = { role: "user", content: prompt };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setVideoGenerating(true);
    resetTextarea();

    try {
      // Submit
      const res = await fetch(`${API_URL}/api/video/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ model_id: selectedModel, prompt }),
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
  }, [auth, input, videoGenerating, messages, selectedModel, resetTextarea]);

  // Stop generation
  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    setStreaming(false);
  }, []);

  const sendMessage = useCallback(async () => {
    // Redirect to video/3D generation
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
        body: JSON.stringify({ model_id: selectedModel, messages: apiMessages }),
        signal: abort.signal,
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
  }, [auth, input, streaming, messages, selectedModel, pendingFile, saveToSession, resetTextarea, isVideoModel, sendVideoMessage, is3DModel, send3DMessage]);

  // Auto-send after suggestion card click
  const pendingSend = useRef(false);
  const handleSuggestionClick = useCallback((text: string) => {
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

  const aiColor = companyColors[model?.company ?? ""] || "#D97757";
  const aiLetter = companyIcons[model?.company ?? ""] || "AI";
  const lastMsg = messages[messages.length - 1];
  const showStreamingDots = streaming && (!lastMsg || lastMsg.role !== "assistant" || !lastMsg.content);

  return (
    <div className="h-dvh flex bg-bg overflow-hidden" style={{ height: "100dvh" }}>
      {/* Inline styles for markdown */}
      <style>{`
        .md-content { line-height: 1.7; }
        .md-content h1, .md-content .md-h1 { font-size: 1.25rem; font-weight: 800; margin: 1rem 0 0.5rem; color: #1A1916; }
        .md-content h2, .md-content .md-h2 { font-size: 1.1rem; font-weight: 700; margin: 0.75rem 0 0.4rem; color: #1A1916; }
        .md-content h3, .md-content .md-h3 { font-size: 1rem; font-weight: 600; margin: 0.5rem 0 0.3rem; color: #1A1916; }
        .md-content strong { font-weight: 700; }
        .md-content em { font-style: italic; }
        .md-content del { text-decoration: line-through; opacity: 0.6; }
        .md-content .md-ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
        .md-content .md-li { margin: 0.15rem 0; display: list-item; }
        .md-content .md-oli { list-style: decimal; }
        .md-content .md-link { color: #D97757; text-decoration: underline; text-underline-offset: 2px; }
        .md-content .md-link:hover { opacity: 0.8; }
        .md-content .inline-code {
          background: rgba(26,25,22,0.06); padding: 0.15em 0.4em; border-radius: 0.375rem;
          font-family: 'SF Mono', 'Fira Code', monospace; font-size: 0.85em; color: #D97757;
        }
        .code-block-wrapper { margin: 0.75rem 0; border-radius: 0.75rem; overflow: hidden; border: 1px solid rgba(26,25,22,0.06); max-width: 100%; }
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
        .md-content { overflow-wrap: break-word; word-break: break-word; }
        .md-content pre { max-width: 100%; }
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
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top bar */}
        <div className="h-14 border-b border-text/[0.06] bg-white/80 backdrop-blur-sm flex items-center justify-between px-3 sm:px-4 shrink-0">
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
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-transparent font-bold text-[13px] sm:text-sm text-text appearance-none cursor-pointer focus:outline-none min-w-0 max-w-[120px] sm:max-w-[200px] truncate pr-4"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%231A191650' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 0 center" }}
              >
                {(() => {
                  const catMap: Record<string, string[]> = {
                    all: [],
                    chat: ["chat", "search", "reason", "code"],
                    image: ["image"],
                    video: ["video"],
                    "3d": ["3d"],
                  };
                  const allowedCats = catMap[modelCatFilter] || [];
                  const filtered = modelCatFilter === "all"
                    ? MODELS
                    : MODELS.filter(m => allowedCats.includes(m.category));
                  const sorted = [...filtered].sort((a, b) => {
                    if (a.tier === "free" && b.tier !== "free") return -1;
                    if (a.tier !== "free" && b.tier === "free") return 1;
                    return a.pricePerMillion - b.pricePerMillion;
                  });
                  return sorted.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.tier === "free" ? "★ " : ""}{m.name} — {m.company} ({formatPrice(m)})
                    </option>
                  ));
                })()}
              </select>
              <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                model?.tier === "free" ? "bg-teal-light text-teal" : "bg-accent/10 text-accent"
              }`}>
                {model ? formatPrice(model) : ""}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <a href="/topup" className="text-[11px] sm:text-xs font-bold text-accent hover:underline whitespace-nowrap">
              ${auth.balanceUsd.toFixed(2)}
            </a>
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

        {/* Category tabs */}
        <div className="flex items-center gap-1 px-3 sm:px-4 py-1.5 border-b border-text/[0.04] bg-white/50 shrink-0 overflow-x-auto">
          {[
            { id: "all", icon: "✨", label: "Все" },
            { id: "chat", icon: "💬", label: "Текст" },
            { id: "image", icon: "🖼", label: "Картинки" },
            { id: "video", icon: "🎬", label: "Видео" },
            { id: "3d", icon: "🧊", label: "3D" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setModelCatFilter(t.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
                modelCatFilter === t.id ? "bg-accent/10 text-accent" : "text-text/30 hover:text-text/50"
              }`}
            >
              <span className="text-xs">{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Messages area or Welcome screen */}
        {messages.length === 0 ? (
          <WelcomeScreen onSuggestion={handleSuggestionClick} />
        ) : (
          <div className="flex-1 overflow-y-auto relative" ref={messagesContainerRef}>
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-6 space-y-5">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 sm:gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {/* Avatar */}
                  <div className="shrink-0 mt-0.5">
                    {msg.role === "user" ? (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent flex items-center justify-center">
                        <span className="text-[11px] sm:text-[12px] font-bold text-white">U</span>
                      </div>
                    ) : (
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: aiColor }}
                      >
                        <span className="text-[10px] sm:text-[11px] font-bold text-white">{aiLetter}</span>
                      </div>
                    )}
                  </div>

                  {/* Message bubble */}
                  <div className={`max-w-[85%] sm:max-w-[75%] min-w-0 overflow-hidden ${msg.role === "user" ? "text-right" : ""}`}>
                    <div className={`inline-block text-left rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-[13px] sm:text-[14px] leading-relaxed overflow-hidden ${
                      msg.role === "user"
                        ? "bg-accent text-white rounded-tr-md"
                        : "bg-[#F0EFEB] text-text/85 rounded-tl-md"
                    }`}>
                      {msg.file && (
                        <div className="mb-2">
                          {msg.file.file_type === "image" ? (
                            <img src={msg.file.content} alt={msg.file.file_name} className="max-w-[240px] rounded-lg" />
                          ) : (
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${msg.role === "user" ? "bg-white/20" : "bg-white/60"}`}>
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
                            playsInline
                            className="max-w-full rounded-xl"
                            style={{ maxHeight: 360 }}
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
                            {msg.video.cost_usd && (
                              <span className="text-[10px] text-text/30">${msg.video.cost_usd.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 3D viewer */}
                      {msg.threed && (
                        <div className="mb-2">
                          <div className="rounded-xl overflow-hidden border border-text/10 bg-[#f0f0f0]" style={{ width: "100%", height: 280 }}>
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
                            {msg.threed.cost_usd && (
                              <span className="text-[10px] text-text/30">${msg.threed.cost_usd.toFixed(2)}</span>
                            )}
                          </div>
                        </div>
                      )}

                      <MessageContent content={msg.content} role={msg.role} selectedModel={selectedModel} />

                      {msg.billing && (
                        <details className={`mt-2 text-[10px] ${msg.role === "user" ? "opacity-70" : "opacity-50"}`}>
                          <summary className="cursor-pointer">
                            {msg.billing.tokens_in + msg.billing.tokens_out} tok · ${msg.billing.cost_usd.toFixed(4)}
                          </summary>
                          <div className="mt-1 space-y-0.5">
                            <div>Input: {msg.billing.tokens_in} tok</div>
                            <div>Output: {msg.billing.tokens_out} tok</div>
                            <div>Стоимость: ${msg.billing.cost_usd.toFixed(6)}</div>
                            <div>Баланс: ${msg.billing.balance_usd.toFixed(4)}</div>
                          </div>
                        </details>
                      )}
                      {/* TTS button for assistant messages */}
                      {msg.role === "assistant" && msg.content && !msg.video && !msg.threed && (
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_URL}/api/audio/tts`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth!.token}` },
                                body: JSON.stringify({ text: msg.content.slice(0, 4096), voice: "alloy" }),
                              });
                              if (!res.ok) return;
                              const data = await res.json();
                              if (data.audio_b64) {
                                const audio = new Audio(`data:audio/mpeg;base64,${data.audio_b64}`);
                                audio.play();
                              }
                            } catch {}
                          }}
                          className="mt-1.5 text-text/20 hover:text-accent transition-colors"
                          title="Озвучить"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                          </svg>
                        </button>
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
                  <div className="bg-[#F0EFEB] rounded-2xl rounded-tl-md px-4 py-3">
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

        {/* Input area — pinned bottom */}
        <div className="border-t border-text/[0.06] bg-white px-3 sm:px-4 py-1.5 sm:py-2 shrink-0 chat-input-safe">
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

            <div className="flex items-center bg-bg border border-text/[0.08] rounded-xl focus-within:border-accent/30 focus-within:ring-2 focus-within:ring-accent/10 transition-all min-w-0" style={{ padding: "4px 8px", gap: 6 }}>
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

              {/* Mic button — STT */}
              <button
                onClick={async () => {
                  // If already recording — stop
                  if ((window as any).__stoneRecorder?.state === "recording") {
                    (window as any).__stoneRecorder.stop();
                    return;
                  }
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    // Pick supported mimeType
                    const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm"
                      : MediaRecorder.isTypeSupported("audio/mp4") ? "audio/mp4" : "";
                    const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
                    (window as any).__stoneRecorder = recorder;
                    const chunks: Blob[] = [];
                    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
                    recorder.onstop = async () => {
                      (window as any).__stoneRecorder = null;
                      stream.getTracks().forEach(t => t.stop());
                      if (!chunks.length) return;
                      const blob = new Blob(chunks, { type: mime || "audio/webm" });
                      const form = new FormData();
                      form.append("file", blob, "voice.webm");
                      try {
                        const res = await fetch(`${API_URL}/api/audio/stt`, {
                          method: "POST",
                          headers: { Authorization: `Bearer ${auth!.token}` },
                          body: form,
                        });
                        if (res.ok) {
                          const data = await res.json();
                          if (data.text) setInput((prev) => prev + data.text);
                        }
                      } catch {}
                    };
                    recorder.start();
                    setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 30000);
                  } catch (err: any) {
                    if (err?.name === "NotAllowedError") {
                      alert("Доступ к микрофону запрещён. Разрешите в настройках браузера.");
                    } else if (err?.name === "NotFoundError") {
                      alert("Микрофон не найден.");
                    } else {
                      alert("Ошибка записи: " + (err?.message || "неизвестная"));
                    }
                  }
                }}
                className={`flex items-center justify-center transition-colors shrink-0 ${(typeof window !== "undefined" && (window as any).__stoneRecorder?.state === "recording") ? "text-accent" : "text-text/25 hover:text-accent"}`}
                style={{ width: 38, height: 38 }}
                title="Голосовой ввод (нажмите ещё раз чтобы остановить)"
              >
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKey}
                placeholder={pendingFile ? "Добавьте вопрос к файлу..." : isVideoModel ? `Опишите видео... (~$${formatPrice(model!).replace('/vid','')})` : is3DModel ? `Опишите 3D-модель или загрузите фото... (~$${formatPrice(model!).replace('/model','')})` : "Написать сообщение... (Shift+Enter — новая строка)"}
                rows={1}
                className="flex-1 bg-transparent resize-none focus:outline-none min-w-0 leading-snug placeholder:text-text/20"
                style={{ fontSize: 14, padding: "10px 16px", maxHeight: 80, minHeight: 42 }}
              />

              {/* Send or Stop button */}
              {streaming ? (
                <button
                  onClick={stopGeneration}
                  className="rounded-lg bg-text/70 text-white flex items-center justify-center hover:bg-text/90 transition-colors shrink-0"
                  title="Остановить генерацию"
                  style={{ width: 38, height: 38 }}
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={sendMessage}
                  disabled={videoGenerating || threedGenerating || (!input.trim() && !pendingFile)}
                  className="rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-30 shrink-0"
                  style={{ width: 38, height: 38 }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
