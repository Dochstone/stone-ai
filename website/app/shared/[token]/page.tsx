"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

interface SharedMessage {
  role: string;
  content: string;
  created_at: string | null;
}

interface SharedChat {
  title: string;
  model_id: string;
  messages: SharedMessage[];
}

export default function SharedChatPage() {
  const params = useParams();
  const token = params.token as string;
  const [chat, setChat] = useState<SharedChat | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/chats/shared/${token}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => { setChat(data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="animate-pulse text-text/30">Загрузка...</div>
    </div>
  );

  if (error || !chat) return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="text-center">
        <div className="text-4xl mb-4">🔗</div>
        <h1 className="text-xl font-bold text-text mb-2">Чат не найден</h1>
        <p className="text-text/50 text-sm mb-6">Ссылка недействительна или чат был удалён</p>
        <a href="/dashboard/chat" className="bg-accent text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-accent/90 transition-colors">
          Открыть Stone AI
        </a>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="border-b border-text/[0.06] bg-bg/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold text-text">{chat.title}</h1>
            <p className="text-[10px] text-text/30">{chat.model_id} · {chat.messages.length} сообщений</p>
          </div>
          <a href="/dashboard/chat" className="bg-accent text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors">
            Попробовать Stone AI
          </a>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {chat.messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-1">
                <span className="text-xs">🤖</span>
              </div>
            )}
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
              m.role === "user"
                ? "bg-accent text-white rounded-br-md"
                : "bg-text/[0.04] text-text/80 rounded-bl-md"
            }`}>
              <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA Footer */}
      <div className="border-t border-text/[0.06] bg-bg/80 backdrop-blur sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-text">Хотите так же?</p>
            <p className="text-[10px] text-text/40">65+ нейросетей · 10 запросов бесплатно</p>
          </div>
          <a href="/dashboard/chat" className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-accent/90 transition-colors shadow-lg shadow-accent/20">
            Начать бесплатно
          </a>
        </div>
      </div>
    </div>
  );
}
