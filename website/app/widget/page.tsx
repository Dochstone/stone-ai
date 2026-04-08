"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

interface Message { role: "user" | "assistant"; content: string }

function WidgetInner() {
  const params = useSearchParams();
  const botId = params.get("bot");
  const [botConfig, setBotConfig] = useState<{ name: string; avatar_emoji: string; model_id: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!botId) return;
    fetch(`${API_URL}/api/bots/widget/${botId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setBotConfig(d); });
  }, [botId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || streaming || !botConfig) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch(`${API_URL}/api/chat/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_id: botConfig.model_id,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          system_prompt: `Ты AI-ассистент "${botConfig.name}". Отвечай кратко и по делу.`,
        }),
      });

      if (!res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: "Извините, произошла ошибка. Попробуйте позже." }]);
        setStreaming(false);
        return;
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        setMessages(prev => [...prev, { role: "assistant", content: "" }]);

        const timeout = setTimeout(() => { reader.cancel(); }, 60000);

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            for (const line of chunk.split("\n")) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                try {
                  const data = JSON.parse(line.slice(6));
                  const delta = data.choices?.[0]?.delta?.content || "";
                  full += delta;
                  setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: full }]);
                } catch {}
              }
            }
          }
        } finally {
          clearTimeout(timeout);
        }

        if (!full) {
          setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: "Не удалось получить ответ. Попробуйте снова." }]);
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Ошибка соединения." }]);
    }
    setStreaming(false);
  };

  if (!botId) return <div className="p-4 text-center text-sm text-gray-400">Bot ID not specified</div>;
  if (!botConfig) return <div className="p-4 text-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="flex flex-col h-screen bg-white" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div className="shrink-0 border-b px-4 py-3 flex items-center gap-2.5 bg-gray-50">
        <span className="text-xl">{botConfig.avatar_emoji}</span>
        <div>
          <p className="text-sm font-semibold text-gray-900">{botConfig.name}</p>
          <p className="text-[10px] text-gray-400">Powered by Stone AI</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <span className="text-3xl block mb-2">{botConfig.avatar_emoji}</span>
            <p className="text-sm text-gray-500">Привет! Я {botConfig.name}. Чем могу помочь?</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              m.role === "user" ? "bg-blue-500 text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"
            }`}>
              {m.content || <span className="inline-flex gap-1"><span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.15s" }} /><span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} /></span>}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Введите сообщение..."
            className="flex-1 border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
          <button onClick={send} disabled={streaming || !input.trim()}
            className="bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-40 transition-colors shrink-0">
            →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WidgetPage() {
  return <Suspense fallback={<div className="p-4 text-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>}><WidgetInner /></Suspense>;
}
