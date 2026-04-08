"use client";

import { useState, useRef, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

const STARTER_PROMPTS = [
  "Напиши пост для Telegram про AI",
  "Сравни React и Vue для стартапа",
  "Объясни квантовые вычисления просто",
];

export default function ChatWidget({ modelId, placeholder }: { modelId?: string; placeholder?: string }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = useCallback(async (text?: string) => {
    const prompt = text || input.trim();
    if (!prompt || streaming) return;

    const auth = JSON.parse(localStorage.getItem("stone_auth") || "{}");
    const isGuest = !auth?.token;

    // Guest limit — only for non-authenticated users
    if (isGuest) {
      const gc = parseInt(localStorage.getItem("stone_guest_count") || "0");
      if (gc >= 2) {
        setMessages((prev) => [...prev, { role: "user", content: prompt }, { role: "assistant", content: "REGISTER_CTA" }]);
        setInput("");
        return;
      }
    }

    const userMsg = { role: "user", content: prompt };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const url = isGuest ? `${API_URL}/api/chat/guest` : `${API_URL}/api/chat`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model_id: modelId || "gpt-4o-mini",
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        setMessages([...history, { role: "assistant", content: "Ошибка. Попробуйте ещё раз." }]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let aiText = "";

      setMessages([...history, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const data = JSON.parse(payload);
            if (data.content) {
              aiText += data.content;
              setMessages([...history, { role: "assistant", content: aiText }]);
            }
          } catch {}
        }
      }

      if (isGuest) {
        const currentGc = parseInt(localStorage.getItem("stone_guest_count") || "0") + 1;
        localStorage.setItem("stone_guest_count", String(currentGc));
        setGuestCount(currentGc);
      }
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setMessages([...history, { role: "assistant", content: "Ошибка соединения." }]);
    } finally {
      setStreaming(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
    }
  }, [input, messages, streaming, modelId]);

  return (
    <div className="bg-bg rounded-2xl border border-text/5 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-text/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
          <span className="text-xs font-bold text-text/50">Попробуйте AI прямо здесь</span>
        </div>
        <a href="/dashboard/chat" className="text-[10px] font-bold text-accent hover:underline">Полный чат &rarr;</a>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-[220px] overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-xs text-text/30 text-center">{placeholder || "Задайте вопрос AI — 2 бесплатных запроса"}</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {STARTER_PROMPTS.map((p) => (
                <button key={p} onClick={() => send(p)} className="text-[11px] bg-text/[0.04] hover:bg-accent/10 hover:text-accent text-text/40 px-3 py-1.5 rounded-lg transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
              m.role === "user"
                ? "bg-accent text-white rounded-br-sm"
                : "bg-text/[0.04] text-text/70 rounded-bl-sm"
            }`}>
              {m.role === "assistant" && m.content === "REGISTER_CTA" ? (
                <span>Бесплатные запросы закончились. <a href="/profile" className="text-accent font-bold hover:underline">Зарегистрируйтесь</a> — 15 запросов/день бесплатно.</span>
              ) : (
                <span className={streaming && i === messages.length - 1 && m.role === "assistant" ? "streaming-cursor" : ""}>{m.content}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-2.5 border-t border-text/[0.06]">
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Спросите что-нибудь..."
            className="flex-1 bg-text/[0.03] rounded-lg px-3 py-2 text-sm text-text placeholder:text-text/25 outline-none focus:ring-1 focus:ring-accent/30"
            disabled={streaming}
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="bg-accent text-white w-9 h-9 rounded-lg flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-30 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
