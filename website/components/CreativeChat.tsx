"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import AuthFormComponent, { type AuthState } from "@/components/AuthForm";
import { MODELS } from "@/lib/models";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

// ─── Mode config ───

type Mode = "photo" | "video" | "3d";

const MODES: { id: Mode; label: string; icon: string; color: string; bg: string }[] = [
  { id: "photo", label: "Фото", icon: "🎨", color: "text-pink-500", bg: "bg-pink-500" },
  { id: "video", label: "Видео", icon: "🎬", color: "text-red-500", bg: "bg-red-500" },
  { id: "3d", label: "3D", icon: "🧊", color: "text-cyan-500", bg: "bg-cyan-500" },
];

const MODE_MODELS: Record<Mode, { id: string; name: string }[]> = {
  photo: [
    { id: "nano-banana-pro", name: "Nano Banana Pro" },
    { id: "nano-banana", name: "Nano Banana" },
    { id: "gpt-5-image", name: "GPT-5 Image" },
    { id: "gpt-5-image-mini", name: "GPT-5 Image mini" },
    { id: "flux-schnell", name: "Flux Schnell" },
    { id: "stable-diffusion-xl", name: "Stable Diffusion XL" },
  ],
  video: [
    { id: "kling-v2", name: "Kling v2" },
    { id: "runway-gen3", name: "Runway Gen3" },
    { id: "pika-2", name: "Pika 2" },
    { id: "stable-video", name: "Stable Video" },
    { id: "luma-dream", name: "Luma Dream" },
  ],
  "3d": [
    { id: "tripo-v2.5", name: "Tripo v2.5" },
    { id: "triposr", name: "TripoSR" },
  ],
};

const MODE_PLACEHOLDERS: Record<Mode, string> = {
  photo: "Опишите изображение... (напр: фотореалистичный портрет девушки в закатном свете)",
  video: "Опишите видео... (напр: камера пролетает над горным озером на рассвете)",
  "3d": "Опишите 3D-модель или загрузите фото... (напр: низкополигональный замок)",
};

const MODE_TIPS: Record<Mode, string[]> = {
  photo: [
    "Фотореалистичный портрет девушки с рыжими волосами в осеннем парке",
    "Минималистичный логотип кофейни, flat design, белый фон",
    "Космическая станция на орбите Юпитера, кинематографичный свет",
    "Обложка для Telegram-канала про технологии, gradient, modern",
    "Милый кот в костюме астронавта, мультяшный стиль",
    "Интерьер скандинавского кафе, мягкий свет, фотореализм",
  ],
  video: [
    "Камера плавно пролетает над зелёным лесом на рассвете",
    "Девушка идёт по пляжу, волны, закат, кинематографично",
    "Таймлапс ночного города, огни, трафик, 4K",
    "Золотая рыбка плывёт в коралловом рифе, подводная съёмка",
  ],
  "3d": [
    "Средневековый замок, low-poly стиль",
    "Спортивная машина, фотореалистичная 3D модель",
    "Стилизованное дерево для мобильной игры",
  ],
};

// ─── Markdown (simplified) ───

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

// ─── Types ───

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string;
  imageResult?: string;
  videoUrl?: string;
  threedUrl?: string;
}

// ─── Component ───

export default function CreativeChat({ initialMode }: { initialMode?: Mode } = {}) {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<Mode>(initialMode || "photo");
  const [selectedModel, setSelectedModel] = useState(MODE_MODELS[initialMode || "photo"][0].id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState("");
  const [dragging, setDragging] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try { const s = localStorage.getItem("stone_auth"); if (s) setAuth(JSON.parse(s)); } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, generating]);

  useEffect(() => { return () => { if (pollRef.current) clearTimeout(pollRef.current); }; }, []);

  // Switch mode → reset model to first in that mode
  const switchMode = useCallback((m: Mode) => {
    setMode(m);
    setSelectedModel(MODE_MODELS[m][0].id);
    setMessages([]);
    setPendingImage(null);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) { alert("Только изображения"); return; }
    if (file.size > 10 * 1024 * 1024) { alert("Макс. 10MB"); return; }
    const reader = new FileReader();
    reader.onload = () => { setPendingImage(reader.result as string); setPendingFileName(file.name); };
    reader.readAsDataURL(file);
  }, []);

  // ─── Image generation ───
  const generateImage = useCallback(async () => {
    if (!auth || !input.trim() || generating) return;
    const prompt = input.trim();
    const userMsg: Message = { role: "user", content: prompt };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setGenerating(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ model_id: selectedModel, messages: [{ role: "user", content: prompt }] }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Ошибка" }));
        setMessages([...history, { role: "assistant", content: typeof err.detail === "string" ? err.detail : "Ошибка генерации" }]);
        setGenerating(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) { setGenerating(false); return; }
      const decoder = new TextDecoder();
      let content = "";
      setMessages([...history, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const data = JSON.parse(payload);
            if (data.billing || data.usage) continue;
            const c = data.content || data.choices?.[0]?.delta?.content;
            if (c) { content += c; setMessages([...history, { role: "assistant", content }]); }
          } catch {}
        }
      }

      // Extract image URL
      const imgMatch = content.match(/(https?:\/\/[^\s"'<>]+\.(?:png|jpg|jpeg|webp)(?:\?[^\s"'<>]*)?)/i)
        || content.match(/(data:image\/[a-z+]+;base64,[A-Za-z0-9+/=]+)/)
        || content.match(/!\[.*?\]\((https?:\/\/[^\s)]+)\)/)
        || content.match(/"url"\s*:\s*"(https?:\/\/[^"]+)"/);
      const imageResult = imgMatch ? (imgMatch[1] || imgMatch[0]) : undefined;

      setMessages([...history, { role: "assistant", content, imageResult }]);
    } catch {
      setMessages([...history, { role: "assistant", content: "Ошибка соединения" }]);
    } finally {
      setGenerating(false);
    }
  }, [auth, input, generating, messages, selectedModel]);

  // ─── Video generation ───
  const generateVideo = useCallback(async () => {
    if (!auth || !input.trim() || generating) return;
    const prompt = input.trim();
    const userMsg: Message = { role: "user", content: prompt };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setGenerating(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch(`${API_URL}/api/video/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ model_id: selectedModel, prompt }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Ошибка" }));
        setMessages([...history, { role: "assistant", content: typeof err.detail === "string" ? err.detail : "Ошибка генерации" }]);
        setGenerating(false);
        return;
      }

      const data = await res.json();
      const taskId = data.task_id;
      setMessages([...history, { role: "assistant", content: `Генерация видео... (~${data.estimated_seconds || 60}с)` }]);

      let attempts = 0;
      const poll = async () => {
        attempts++;
        try {
          const sr = await fetch(`${API_URL}/api/video/status/${taskId}`, { headers: { Authorization: `Bearer ${auth.token}` } });
          if (!sr.ok) throw new Error();
          const status = await sr.json();
          if (status.status === "completed" && status.video_url) {
            setMessages([...history, { role: "assistant", content: "Видео готово!", videoUrl: status.video_url }]);
            setGenerating(false); return;
          }
          if (status.status === "failed") {
            setMessages([...history, { role: "assistant", content: `Ошибка: ${status.error || "Не удалось"}` }]);
            setGenerating(false); return;
          }
          if (attempts < 60) pollRef.current = setTimeout(poll, 3000);
          else { setMessages([...history, { role: "assistant", content: "Таймаут" }]); setGenerating(false); }
        } catch { setMessages([...history, { role: "assistant", content: "Ошибка проверки" }]); setGenerating(false); }
      };
      pollRef.current = setTimeout(poll, 3000);
    } catch {
      setMessages([...history, { role: "assistant", content: "Ошибка соединения" }]);
      setGenerating(false);
    }
  }, [auth, input, generating, messages, selectedModel]);

  // ─── 3D generation ───
  const generate3D = useCallback(async () => {
    if (!auth || (!input.trim() && !pendingImage) || generating) return;
    const prompt = input.trim() || undefined;
    const imageUrl = pendingImage || undefined;
    const userMsg: Message = { role: "user", content: prompt || "[3D из изображения]", image: pendingImage || undefined };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setPendingImage(null);
    setPendingFileName("");
    setGenerating(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch(`${API_URL}/api/3d/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ model_id: selectedModel, prompt, image_url: imageUrl }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Ошибка" }));
        setMessages([...history, { role: "assistant", content: typeof err.detail === "string" ? err.detail : "Ошибка генерации" }]);
        setGenerating(false); return;
      }

      const data = await res.json();
      if (data.status === "completed" && data.model_url) {
        setMessages([...history, { role: "assistant", content: "3D модель готова!", threedUrl: data.model_url }]);
        setGenerating(false); return;
      }

      const taskId = data.task_id;
      setMessages([...history, { role: "assistant", content: `Генерация 3D... (~${data.estimated_seconds || 60}с)` }]);

      let attempts = 0;
      const poll = async () => {
        attempts++;
        try {
          const sr = await fetch(`${API_URL}/api/3d/status/${taskId}`, { headers: { Authorization: `Bearer ${auth.token}` } });
          if (!sr.ok) throw new Error();
          const status = await sr.json();
          if (status.status === "completed" && status.model_url) {
            setMessages([...history, { role: "assistant", content: "3D модель готова!", threedUrl: status.model_url }]);
            setGenerating(false); return;
          }
          if (status.status === "failed") {
            setMessages([...history, { role: "assistant", content: `Ошибка: ${status.error || "Не удалось"}` }]);
            setGenerating(false); return;
          }
          if (attempts < 60) pollRef.current = setTimeout(poll, 3000);
          else { setMessages([...history, { role: "assistant", content: "Таймаут" }]); setGenerating(false); }
        } catch { setMessages([...history, { role: "assistant", content: "Ошибка проверки" }]); setGenerating(false); }
      };
      pollRef.current = setTimeout(poll, 3000);
    } catch {
      setMessages([...history, { role: "assistant", content: "Ошибка соединения" }]);
      setGenerating(false);
    }
  }, [auth, input, generating, messages, selectedModel, pendingImage]);

  const send = useCallback(() => {
    if (mode === "photo") generateImage();
    else if (mode === "video") generateVideo();
    else generate3D();
  }, [mode, generateImage, generateVideo, generate3D]);

  const modeConfig = MODES.find(m => m.id === mode)!;

  if (!loaded) return null;
  if (!auth) return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto rounded-2xl ${modeConfig.bg} flex items-center justify-center shadow-lg mb-4`}>
            <span className="text-3xl">{modeConfig.icon}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-text mb-2">AI Студия</h1>
          <p className="text-text/50 text-sm">Войдите, чтобы начать генерацию</p>
        </div>
        <AuthFormComponent onAuth={setAuth} />
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-bg flex flex-col"
      onDragEnter={(e) => { e.preventDefault(); dragCounterRef.current++; setDragging(true); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
      onDragLeave={(e) => { e.preventDefault(); dragCounterRef.current--; if (dragCounterRef.current === 0) setDragging(false); }}
      onDrop={(e) => { e.preventDefault(); dragCounterRef.current = 0; setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFileSelect(f); }}
    >
      {/* Drag overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 bg-accent/5 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="border-2 border-dashed border-accent rounded-2xl px-8 py-6 bg-bg/95 shadow-lg">
            <p className="text-accent font-bold text-sm">Перетащите изображение сюда</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-text/[0.06] bg-bg sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-text/30 hover:text-text/60 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
            </a>
            <h1 className="text-sm font-bold text-text">AI Студия</h1>
          </div>
          <a href="/webchat" className="text-[11px] text-accent font-semibold hover:underline">Текстовый чат</a>
        </div>
      </header>

      {/* Mode switcher */}
      <div className="border-b border-text/[0.06] bg-bg">
        <div className="max-w-3xl mx-auto px-4 flex">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-all border-b-2 ${
                mode === m.id
                  ? `${m.color} border-current`
                  : "text-text/30 border-transparent hover:text-text/50"
              }`}
            >
              <span className="text-base">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Model selector */}
      <div className="border-b border-text/[0.04] bg-bg/50">
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] text-text/30 font-semibold shrink-0">Модель:</span>
          {MODE_MODELS[mode].map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors shrink-0 ${
                selectedModel === m.id
                  ? `${modeConfig.bg} text-white`
                  : "bg-text/[0.04] text-text/40 hover:text-text/60"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Messages / Welcome */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <div className={`w-20 h-20 mx-auto rounded-3xl ${modeConfig.bg} flex items-center justify-center shadow-xl mb-4`} style={{ boxShadow: `0 10px 25px -5px ${mode === "photo" ? "rgba(236,72,153,0.2)" : mode === "video" ? "rgba(239,68,68,0.2)" : "rgba(6,182,212,0.2)"}` }}>
                <span className="text-4xl">{modeConfig.icon}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-text mb-2">
                {mode === "photo" ? "Генерация изображений" : mode === "video" ? "Генерация видео" : "Генерация 3D моделей"}
              </h2>
              <p className="text-sm text-text/40 max-w-md mx-auto">
                {mode === "photo" ? "Опишите изображение — AI создаст его за секунды" : mode === "video" ? "Опишите сцену — AI создаст видео из текста" : "Опишите объект или загрузите фото — AI создаст 3D модель"}
              </p>
            </div>

            {/* 3D mode: upload area */}
            {mode === "3d" && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-cyan-300 rounded-2xl p-6 text-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50/30 transition-all mb-6"
              >
                <svg className="w-10 h-10 text-cyan-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-cyan-600 font-bold text-sm">Загрузите фото для 3D-конвертации</p>
                <p className="text-text/30 text-xs mt-1">или опишите объект текстом</p>
              </div>
            )}

            {/* Tips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODE_TIPS[mode].map((tip, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(tip); }}
                  className="p-3 rounded-xl border border-text/[0.06] bg-bg hover:border-current hover:shadow-sm transition-all text-left group"
                  style={{ borderColor: undefined }}
                >
                  <span className={`text-[12px] sm:text-[13px] text-text/60 group-hover:${modeConfig.color} transition-colors leading-snug line-clamp-2`}>{tip}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className="shrink-0 mt-0.5">
                  {msg.role === "user" ? (
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-xs font-bold text-white">U</span>
                    </div>
                  ) : (
                    <div className={`w-8 h-8 rounded-full ${modeConfig.bg} flex items-center justify-center`}>
                      <span className="text-sm">{modeConfig.icon}</span>
                    </div>
                  )}
                </div>
                <div className={`max-w-[85%] min-w-0 ${msg.role === "user" ? "text-right" : ""}`}>
                  <div className={`inline-block text-left rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                    msg.role === "user" ? "bg-accent text-white rounded-tr-md" : "bg-text/[0.06] text-text/85 rounded-tl-md"
                  }`}>
                    {/* User attached image */}
                    {msg.image && <img src={msg.image} alt="" className="max-w-[200px] rounded-lg mb-2" />}

                    {/* Generated image */}
                    {msg.imageResult && (
                      <div className="mb-2">
                        <img src={msg.imageResult} alt="AI-generated" className="max-w-full rounded-xl" style={{ maxHeight: 400 }} />
                        <a href={msg.imageResult} download={`stone-ai-${Date.now()}.png`}
                          className="flex items-center gap-1.5 text-[11px] text-accent font-semibold hover:underline mt-2">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" /></svg>
                          Скачать
                        </a>
                      </div>
                    )}

                    {/* Video result */}
                    {msg.videoUrl && (
                      <div className="mb-2">
                        <video src={msg.videoUrl} controls playsInline className="max-w-full rounded-xl" style={{ maxHeight: 360 }} />
                        <a href={msg.videoUrl} download={`stone-ai-video-${Date.now()}.mp4`}
                          className="flex items-center gap-1.5 text-[11px] text-accent font-semibold hover:underline mt-2">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" /></svg>
                          Скачать
                        </a>
                      </div>
                    )}

                    {/* 3D result */}
                    {msg.threedUrl && (
                      <div className="mb-2">
                        <div className="rounded-xl overflow-hidden border border-text/10 bg-text/[0.04]" style={{ width: "100%", height: 280 }}>
                          <div dangerouslySetInnerHTML={{ __html: `<model-viewer src="${msg.threedUrl}" auto-rotate camera-controls touch-action="pan-y" style="width:100%;height:280px" shadow-intensity="1"></model-viewer>` }} />
                        </div>
                        <a href={msg.threedUrl} download={`stone-ai-3d-${Date.now()}.glb`}
                          className="flex items-center gap-1.5 text-[11px] text-accent font-semibold hover:underline mt-2">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" /></svg>
                          Скачать GLB
                        </a>
                      </div>
                    )}

                    {/* Text content */}
                    {msg.content && !msg.imageResult && !msg.videoUrl && !msg.threedUrl && (
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    )}
                    {msg.content && (msg.imageResult || msg.videoUrl || msg.threedUrl) && (
                      <div className="text-[12px] text-text/50 mt-1">{msg.content}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Generating indicator */}
            {generating && (
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full ${modeConfig.bg} flex items-center justify-center shrink-0`}>
                  <span className="text-sm">{modeConfig.icon}</span>
                </div>
                <div className="bg-text/[0.06] rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 bg-text/20 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-text/20 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-text/20 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[11px] text-text/30">
                      {mode === "photo" ? "Рисую..." : mode === "video" ? "Генерирую видео..." : "Создаю 3D модель..."}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-text/[0.06] bg-bg px-4 py-2 shrink-0">
        <div className="max-w-3xl mx-auto">
          {pendingImage && (
            <div className="flex items-center gap-3 mb-2 px-3 py-2 bg-text/[0.03] rounded-xl border border-text/[0.06]">
              <img src={pendingImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <span className="text-xs text-text/60 truncate flex-1">{pendingFileName}</span>
              <button onClick={() => { setPendingImage(null); setPendingFileName(""); }} className="text-text/30 hover:text-red-400 p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); e.target.value = ""; }} />

          <div className="flex items-center gap-2 bg-bg border border-text/[0.08] rounded-xl focus-within:border-accent/30 focus-within:ring-2 focus-within:ring-accent/10 transition-all px-2 py-1">
            {mode === "3d" && (
              <button onClick={() => fileInputRef.current?.click()} disabled={generating}
                className="flex items-center justify-center w-10 h-10 text-text/25 hover:text-cyan-500 transition-colors disabled:opacity-30 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                </svg>
              </button>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px"; }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={MODE_PLACEHOLDERS[mode]}
              rows={1}
              className="flex-1 bg-transparent resize-none focus:outline-none min-w-0 leading-snug placeholder:text-text/20 text-text"
              style={{ fontSize: 16, padding: "10px 8px", maxHeight: 80, minHeight: 42 }}
            />

            <button
              onClick={send}
              disabled={generating || (!input.trim() && !pendingImage)}
              className={`w-10 h-10 rounded-lg text-white flex items-center justify-center transition-colors disabled:opacity-30 shrink-0 ${modeConfig.bg} hover:opacity-90`}
            >
              {generating ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M4 12a8 8 0 018-8" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
