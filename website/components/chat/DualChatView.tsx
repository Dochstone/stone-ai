"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { MODELS } from "@/lib/models";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";

// Models grouped for dual view
const DUAL_MODELS = MODELS.filter(m => m.category === "chat" || m.category === "reason" || m.category === "code").map(m => ({
  id: m.id, name: m.name, co: m.company, tier: m.tier,
}));

interface Message { role: "user" | "assistant"; content: string }

function mdToHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/^### (.+)$/gm, "<h4 class='font-bold text-text mt-2 mb-1'>$1</h4>")
    .replace(/^## (.+)$/gm, "<h3 class='font-bold text-text text-base mt-3 mb-1'>$1</h3>")
    .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc'>$1</li>")
    .replace(/^(\d+)\. (.+)$/gm, "<li class='ml-4 list-decimal'>$1. $2</li>")
    .replace(/\n/g, "<br/>");
}

export default function DualChatView({ token, onClose }: { token: string; onClose: () => void }) {
  const [model1, setModel1] = useState("gpt-4o-mini");
  const [model2, setModel2] = useState("claude-haiku-4.5");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [resp1, setResp1] = useState("");
  const [resp2, setResp2] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [preferred, setPreferred] = useState<1 | 2 | null>(null);
  const [mobileTab, setMobileTab] = useState<1 | 2>(1);
  const [time1, setTime1] = useState(0);
  const [time2, setTime2] = useState(0);
  const [copied, setCopied] = useState<1 | 2 | null>(null);
  const abortRef1 = useRef<AbortController | null>(null);
  const abortRef2 = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [resp1, resp2]);

  const streamModel = useCallback(async (
    modelId: string, msgs: Message[],
    setResp: (fn: (prev: string) => string) => void,
    setTime: (t: number) => void,
    abortRef: React.MutableRefObject<AbortController | null>,
  ) => {
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setResp(() => "");
    const start = Date.now();

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ model_id: modelId, messages: msgs.map(m => ({ role: m.role, content: m.content })) }),
        signal: ctrl.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.detail?.message || err?.detail || "Ошибка";
        setResp(() => typeof msg === "string" ? msg : "Модель недоступна");
        setTime(Date.now() - start);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        for (const line of text.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") continue;
          try {
            const data = JSON.parse(payload);
            if (data.billing || data.usage) continue;
            if (data.error) { setResp(() => "Ошибка генерации"); continue; }
            const c = data.content || data.choices?.[0]?.delta?.content;
            if (c) setResp(prev => prev + c);
          } catch {}
        }
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") setResp(() => "Ошибка соединения");
    }
    setTime(Date.now() - start);
  }, [token]);

  const send = useCallback(async () => {
    if (!input.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setResp1(""); setResp2("");
    setTime1(0); setTime2(0);
    setStreaming(true);
    setPreferred(null);
    setCopied(null);

    await Promise.allSettled([
      streamModel(model1, history, setResp1, setTime1, abortRef1),
      streamModel(model2, history, setResp2, setTime2, abortRef2),
    ]);
    setStreaming(false);
  }, [input, streaming, messages, model1, model2, streamModel]);

  const stop = () => { abortRef1.current?.abort(); abortRef2.current?.abort(); setStreaming(false); };
  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };

  const copyResponse = (text: string, side: 1 | 2) => {
    navigator.clipboard.writeText(text);
    setCopied(side);
    setTimeout(() => setCopied(null), 1500);
  };

  const model1Name = DUAL_MODELS.find(m => m.id === model1)?.name || model1;
  const model2Name = DUAL_MODELS.find(m => m.id === model2)?.name || model2;

  const ResponsePanel = ({ content, modelName, side, isPreferred, time }: {
    content: string; modelName: string; side: 1 | 2; isPreferred: boolean; time: number;
  }) => (
    <div className={`flex-1 min-w-0 flex flex-col border rounded-xl overflow-hidden transition-all ${
      isPreferred ? "border-accent ring-2 ring-accent/20" : "border-text/10"
    }`}>
      <div className="flex items-center justify-between px-3 py-2 bg-text/[0.03] border-b border-text/5">
        <select
          value={side === 1 ? model1 : model2}
          onChange={e => side === 1 ? setModel1(e.target.value) : setModel2(e.target.value)}
          disabled={streaming}
          className="bg-transparent text-xs font-bold text-text focus:outline-none disabled:opacity-50 max-w-[140px]"
        >
          {DUAL_MODELS.map(m => (
            <option key={m.id} value={m.id}>
              {m.name} {m.tier === "free" ? "" : "· PRO"}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          {time > 0 && !streaming && (
            <span className="text-[9px] text-text/20">{(time / 1000).toFixed(1)}с</span>
          )}
          {content && !streaming && (
            <>
              <button onClick={() => copyResponse(content, side)}
                className="text-[10px] font-medium px-2 py-1 rounded-md text-text/30 hover:text-text/60 hover:bg-text/5 transition-all">
                {copied === side ? "✓" : "Копировать"}
              </button>
              <button onClick={() => setPreferred(side)}
                className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all ${
                  isPreferred ? "bg-accent text-white" : "bg-text/5 text-text/40 hover:text-accent hover:bg-accent/10"
                }`}>
                {isPreferred ? "👑 Лучший" : "Этот лучше"}
              </button>
            </>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 text-sm text-text/80 leading-relaxed min-h-[120px] max-h-[50vh]">
        {content ? (
          <div dangerouslySetInnerHTML={{ __html: mdToHtml(content) }} />
        ) : streaming ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-accent/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-[11px] text-text/25 animate-pulse">{modelName} думает...</span>
          </div>
        ) : (
          <span className="text-text/15">Ответ появится здесь</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-text/5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-accent font-bold text-sm">x2 AI</span>
          <span className="text-text/30 text-xs hidden sm:inline">Сравнение моделей</span>
        </div>
        <button onClick={onClose} className="text-xs font-semibold text-text/40 hover:text-text/70 px-3 py-1.5 rounded-lg hover:bg-text/5 transition-all">
          Обычный чат
        </button>
      </div>

      {/* User messages history */}
      {messages.length > 0 && (
        <div className="px-4 pt-3 space-y-2 max-h-[25vh] overflow-y-auto shrink-0">
          {messages.map((m, i) => (
            <div key={i} className={`text-sm px-3 py-2 rounded-xl max-w-[85%] ${
              m.role === "user" ? "ml-auto bg-accent/10 text-text" : "bg-text/5 text-text/70"
            }`}>{m.content}</div>
          ))}
        </div>
      )}

      {/* Response panels */}
      <div className="flex-1 min-h-0 px-4 py-3">
        {/* Mobile tabs */}
        <div className="flex gap-2 mb-2 sm:hidden">
          <button onClick={() => setMobileTab(1)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mobileTab === 1 ? "bg-accent/10 text-accent" : "text-text/40"}`}>
            {model1Name} {time1 > 0 && !streaming ? `· ${(time1/1000).toFixed(1)}с` : ""}
          </button>
          <button onClick={() => setMobileTab(2)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mobileTab === 2 ? "bg-accent/10 text-accent" : "text-text/40"}`}>
            {model2Name} {time2 > 0 && !streaming ? `· ${(time2/1000).toFixed(1)}с` : ""}
          </button>
        </div>

        {/* Desktop: side by side */}
        <div className="hidden sm:flex gap-3 h-full">
          <ResponsePanel content={resp1} modelName={model1Name} side={1} isPreferred={preferred === 1} time={time1} />
          <ResponsePanel content={resp2} modelName={model2Name} side={2} isPreferred={preferred === 2} time={time2} />
        </div>

        {/* Mobile: tabs */}
        <div className="sm:hidden h-full">
          {mobileTab === 1
            ? <ResponsePanel content={resp1} modelName={model1Name} side={1} isPreferred={preferred === 1} time={time1} />
            : <ResponsePanel content={resp2} modelName={model2Name} side={2} isPreferred={preferred === 2} time={time2} />
          }
        </div>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-text/5 shrink-0">
        <div className="flex items-end gap-2 bg-text/[0.03] border border-text/10 rounded-xl px-3">
          <textarea
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Напишите вопрос для обеих моделей..."
            rows={1}
            className="flex-1 bg-transparent resize-none focus:outline-none min-w-0 leading-snug placeholder:text-text/20 py-3"
            style={{ fontSize: 15, maxHeight: 80 }}
          />
          {streaming ? (
            <button onClick={stop} className="shrink-0 w-9 h-9 mb-1 rounded-lg bg-text/70 text-white flex items-center justify-center hover:bg-text/90 transition-colors">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            </button>
          ) : (
            <button onClick={send} disabled={!input.trim()} className="shrink-0 w-9 h-9 mb-1 rounded-lg bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-colors disabled:opacity-30">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
