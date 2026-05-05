"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import AuthFormComponent, { type AuthState } from "@/components/AuthForm";
import { Eye, Bandage, Smile, Hand, Ear, type LucideIcon } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stoneai.ru";
const HEALTH_API_URL = `${API_URL}/api/health/analyze`;

// Markdown renderer (simplified)
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, '<h3 style="font-size:1rem;font-weight:600;margin:0.5rem 0 0.3rem">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:1.1rem;font-weight:700;margin:0.75rem 0 0.4rem">$1</h2>')
    .replace(/^[*-] (.+)$/gm, '<li style="margin:0.15rem 0;list-style:disc;margin-left:1.25rem">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li style="margin:0.15rem 0;list-style:decimal;margin-left:1.25rem">$1</li>')
    .replace(/\n/g, "<br/>");
}

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string; // base64 data URL
}

type HealthScenario =
  | "general"
  | "skin"
  | "eyes"
  | "mouth"
  | "teeth"
  | "throat"
  | "ears"
  | "lor"
  | "dentistry"
  | "surgery"
  | "nails"
  | "hair"
  | "wounds"
  | "moles";
type HealthModel = "claude-opus-4.5" | "gpt-5.5" | "gemini-3.1-pro-preview";
type HealthResponseMode = "short" | "balanced" | "detailed" | "doctor" | "surgeon" | "lor" | "dentistry";
type CompareResult = {
  left: { modelId: HealthModel; title: string; content: string };
  right: { modelId: HealthModel; title: string; content: string };
};

const SCENARIOS: { id: HealthScenario; title: string; description: string }[] = [
  { id: "general", title: "Общий", description: "Общие симптомы и жалобы" },
  { id: "skin", title: "Кожа", description: "Сыпь, покраснение, воспаление" },
  { id: "eyes", title: "Глаза", description: "Покраснение, боль, отёк, зрение" },
  { id: "mouth", title: "Рот", description: "Язык, дёсны, губы, горло" },
  { id: "teeth", title: "Зубы", description: "Кариес, боль, дёсны, отёк" },
  { id: "throat", title: "Горло", description: "Налёт, боль, миндалины, отёк" },
  { id: "ears", title: "Уши", description: "Боль, выделения, отёк, покраснение" },
  { id: "lor", title: "ЛОР", description: "Горло, нос, уши, слух, голос, дыхание" },
  { id: "dentistry", title: "Стоматология", description: "Зубы, дёсны, налёт, боль, воспаление" },
  { id: "surgery", title: "Хирургия", description: "Швы, раны, отёк, выделения, заживление" },
  { id: "nails", title: "Ногти", description: "Цвет, форма, ломкость, воспаление" },
  { id: "hair", title: "Волосы", description: "Выпадение, ломкость, зуд, кожа головы" },
  { id: "wounds", title: "Раны", description: "Порезы, ссадины, ожоги, заживление" },
  { id: "moles", title: "Родинки", description: "Пятна, асимметрия, изменения" },
];

const MODELS: { id: HealthModel; title: string; description: string }[] = [
  { id: "gpt-5.5", title: "GPT-5.5", description: "Флагман OpenAI для сложных задач" },
  { id: "claude-opus-4.5", title: "Claude Opus 4.5", description: "Максимум качества и аккуратности" },
  { id: "gemini-3.1-pro-preview", title: "Gemini 3.1 Pro", description: "Сильная мультимодальная модель Google" },
];

const RESPONSE_MODES: { id: HealthResponseMode; title: string; description: string }[] = [
  { id: "short", title: "Кратко", description: "Максимум сжатия, только суть" },
  { id: "balanced", title: "Стандарт", description: "Нормальный баланс краткости и деталей" },
  { id: "detailed", title: "Подробно", description: "Больше объяснений и контекста" },
  { id: "doctor", title: "Для врача", description: "Клиническая сводка: признаки, дифференциал, красные флаги" },
  { id: "surgeon", title: "Для хирурга", description: "Раны, швы, осложнения, срочность, ревизия" },
  { id: "lor", title: "Для ЛОР", description: "Горло, нос, уши, слух, голос, срочность" },
  { id: "dentistry", title: "Для стоматолога", description: "Зубы, дёсны, слизистая, абсцесс, боль" },
];

const QUICK_PROMPTS: { Icon: LucideIcon; color: string; text: string; description: string; scenario: HealthScenario }[] = [
  { Icon: Eye,     color: "#EF4444", text: "Покраснение и раздражение глаза",   description: "Анализ фото глаза", scenario: "eyes" },
  { Icon: Bandage, color: "#F97316", text: "Высыпания или покраснения на коже", description: "Анализ кожных проявлений", scenario: "skin" },
  { Icon: Smile,   color: "#06B6D4", text: "Проблемы с полостью рта",           description: "Осмотр ротовой полости", scenario: "mouth" },
  { Icon: Smile,   color: "#14B8A6", text: "Боль или налёт в горле",             description: "Анализ горла и миндалин", scenario: "throat" },
  { Icon: Ear,     color: "#0EA5E9", text: "Заложенность или боль в ушах",      description: "ЛОР-оценка ушей и слуха", scenario: "lor" },
  { Icon: Smile,   color: "#A855F7", text: "Зубы, дёсны или боль при накусывании", description: "Стоматологический осмотр", scenario: "dentistry" },
  { Icon: Bandage, color: "#10B981", text: "Швы, раны или послеоперационный отёк", description: "Хирургический осмотр", scenario: "surgery" },
  { Icon: Hand,    color: "#EAB308", text: "Изменение цвета или формы ногтей",  description: "Анализ состояния ногтей", scenario: "nails" },
  { Icon: Bandage, color: "#22C55E", text: "Порезы, раны или ожоги",            description: "Оценка заживления и рисков", scenario: "wounds" },
];

const HEALTH_PREFS_KEY = "stone_health_prefs";

type HealthPrefs = {
  scenario?: HealthScenario;
  modelId?: HealthModel;
  compareMode?: boolean;
  compareModelId?: HealthModel;
  responseMode?: HealthResponseMode;
};

export default function HealthChat() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [scenario, setScenario] = useState<HealthScenario>("general");
  const [modelId, setModelId] = useState<HealthModel>("gpt-5.5");
  const [compareMode, setCompareMode] = useState(false);
  const [compareModelId, setCompareModelId] = useState<HealthModel>("claude-opus-4.5");
  const [responseMode, setResponseMode] = useState<HealthResponseMode>("balanced");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<CompareResult | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const autoScrollRef = useRef(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("stone_auth");
      if (saved) setAuth(JSON.parse(saved));
      const prefsRaw = localStorage.getItem(HEALTH_PREFS_KEY);
      if (prefsRaw) {
        const prefs = JSON.parse(prefsRaw) as HealthPrefs;
        if (prefs.scenario && SCENARIOS.some((item) => item.id === prefs.scenario)) setScenario(prefs.scenario);
        if (prefs.modelId && MODELS.some((item) => item.id === prefs.modelId)) setModelId(prefs.modelId);
        if (typeof prefs.compareMode === "boolean") setCompareMode(prefs.compareMode);
        if (prefs.compareModelId && MODELS.some((item) => item.id === prefs.compareModelId)) setCompareModelId(prefs.compareModelId);
        if (prefs.responseMode && RESPONSE_MODES.some((item) => item.id === prefs.responseMode)) setResponseMode(prefs.responseMode);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      const prefs: HealthPrefs = {
        scenario,
        modelId,
        compareMode,
        compareModelId,
        responseMode,
      };
      localStorage.setItem(HEALTH_PREFS_KEY, JSON.stringify(prefs));
    } catch {}
  }, [compareMode, compareModelId, loaded, modelId, responseMode, scenario]);

  useEffect(() => {
    if (autoScrollRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streaming]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Загрузите изображение (JPEG, PNG, WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Файл слишком большой (макс. 10MB)");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        setPendingImage(reader.result as string);
        setPendingFileName(file.name);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  }, []);

  const getModelTitle = (id: HealthModel) => MODELS.find((item) => item.id === id)?.title ?? id;

  const sendMessage = useCallback(async (promptOverride?: string) => {
    if (!auth) return;
    const text = promptOverride || input.trim();
    if (!text && !pendingImage) return;
    if (streaming || comparisonLoading) return;

    autoScrollRef.current = true;

    const userMsg: Message = {
      role: "user",
      content: text || "Проанализируй это фото",
      image: pendingImage || undefined,
    };

    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setPendingImage(null);
    setPendingFileName("");
    setComparisonResult(null);

    const apiMessages = history.slice(-10).map((m) => {
      if (m.image) {
        return {
          role: m.role,
          content: [
            ...(m.content ? [{ type: "text", text: m.content }] : []),
            { type: "image_url", image_url: { url: m.image } },
          ],
        };
      }
      return { role: m.role, content: m.content };
    });

    const requestAnswer = async (targetModel: HealthModel) => {
      const res = await fetch(HEALTH_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          scenario,
          model_id: targetModel,
          response_mode: responseMode,
          messages: apiMessages,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Ошибка сервера" }));
        const errMsg = typeof err.detail === "string" ? err.detail : "Ошибка";
        throw new Error(errMsg);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("Пустой ответ сервера");
      }

      const decoder = new TextDecoder();
      let assistantContent = "";

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
            if (data.error) {
              throw new Error(data.error);
            }
            const c = data.content || data.choices?.[0]?.delta?.content;
            if (c) {
              assistantContent += c;
            }
          } catch {
            // Ignore malformed SSE chunks.
          }
        }
      }

      return assistantContent;
    };

    if (compareMode) {
      const primaryModel = modelId;
      const secondaryModel = compareModelId === modelId ? (modelId === "gpt-5.5" ? "claude-opus-4.5" : "gpt-5.5") : compareModelId;
      setComparisonLoading(true);
      setStreaming(false);
      try {
        const [primaryContent, secondaryContent] = await Promise.all([
          requestAnswer(primaryModel),
          requestAnswer(secondaryModel),
        ]);

        setComparisonResult({
          left: {
            modelId: primaryModel,
            title: getModelTitle(primaryModel),
            content: primaryContent || "Ответ не получен.",
          },
          right: {
            modelId: secondaryModel,
            title: getModelTitle(secondaryModel),
            content: secondaryContent || "Ответ не получен.",
          },
        });
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Ошибка сравнения моделей";
        setMessages([...history, { role: "assistant", content: errMsg }]);
      } finally {
        setComparisonLoading(false);
      }
      return;
    }

    setStreaming(true);
    try {
      const res = await fetch(HEALTH_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          scenario,
          model_id: modelId,
          response_mode: responseMode,
          messages: apiMessages,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Ошибка сервера" }));
        const errMsg = typeof err.detail === "string" ? err.detail : "Ошибка";
        setMessages([...history, { role: "assistant", content: errMsg }]);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages([...history, { role: "assistant", content: "" }]);

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
            if (data.error) {
              assistantContent = data.error;
              break;
            }
            const c = data.content || data.choices?.[0]?.delta?.content;
            if (c) {
              assistantContent += c;
              setMessages([...history, { role: "assistant", content: assistantContent }]);
            }
          } catch {}
        }
      }

      setMessages([...history, { role: "assistant", content: assistantContent }]);
    } catch {
      setMessages([...history, { role: "assistant", content: "Ошибка соединения" }]);
    } finally {
      setStreaming(false);
    }
  }, [auth, comparisonLoading, compareMode, compareModelId, input, messages, modelId, pendingImage, responseMode, scenario, streaming]);

  const handleChatScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    autoScrollRef.current = distanceFromBottom < 120;
  }, []);

  if (!loaded) return null;
  if (!auth) {
    return (
      <div className="min-h-screen bg-bg px-4 pt-24 sm:pt-28 pb-8">
        <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
          <div className="rounded-3xl border border-text/[0.06] bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 p-6 sm:p-8 text-white overflow-hidden relative">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-12 w-56 h-56 rounded-full bg-black/10 blur-3xl" />
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shadow-lg mb-5">
                <span className="text-3xl">🏥</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">AI Консультант</h1>
              <p className="text-white/80 text-sm sm:text-base max-w-xl leading-relaxed">
                Загрузите фото симптома или опишите жалобу. AI поможет структурировать наблюдения, назвать возможные причины и подсказать, к какому врачу обратиться.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  "Фото кожи, глаз, полости рта и ногтей",
                  "Подсказка по профильному специалисту",
                  "Понятное объяснение медицинских терминов",
                  "Быстрый старт после входа в аккаунт",
                ].map((item) => (
                  <div key={item} className="rounded-2xl bg-white/10 border border-white/10 px-4 py-3 text-sm text-white/90">
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-amber-50/10 border border-amber-200/20 px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="text-lg leading-none">⚠</span>
                  <div>
                    <p className="font-semibold text-sm">Не заменяет врача</p>
                    <p className="text-xs sm:text-sm text-white/75 leading-relaxed mt-1">
                      Сервис даёт только общую информацию. При сильной боли, проблемах с дыханием, кровотечении,
                      внезапном ухудшении состояния или высокой температуре нужна срочная медицинская помощь.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md lg:max-w-none lg:ml-auto">
            <div className="text-center mb-5">
              <p className="text-text/60 text-sm">Войдите, чтобы начать консультацию и загрузить фото</p>
            </div>
            <AuthFormComponent onAuth={setAuth} subtitle="Войдите, чтобы начать AI-консультацию" />
          </div>
        </div>
      </div>
    );
  }

  const hasMessages = messages.length > 0;

  return (
    <div
      className="min-h-screen bg-bg flex flex-col pt-24 sm:pt-28"
      onDragEnter={(e) => { e.preventDefault(); dragCounterRef.current++; setDragging(true); }}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
      onDragLeave={(e) => { e.preventDefault(); dragCounterRef.current--; if (dragCounterRef.current === 0) setDragging(false); }}
      onDrop={(e) => { e.preventDefault(); dragCounterRef.current = 0; setDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleFileSelect(file); }}
    >
      {/* Drag overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 bg-emerald-500/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="border-2 border-dashed border-emerald-500 rounded-2xl px-8 py-6 bg-bg/95 shadow-lg">
            <p className="text-emerald-600 font-bold text-sm">Перетащите фото сюда</p>
          </div>
        </div>
      )}

      {/* Messages / Welcome */}
      <div ref={scrollContainerRef} onScroll={handleChatScroll} className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          /* Welcome screen */
          <div className="max-w-3xl mx-auto px-4 py-10 sm:py-12">
            <div className="text-center mb-10">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-4">
                <span className="text-4xl">🔬</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-text mb-2">Загрузите фото для анализа</h2>
              <p className="text-sm sm:text-base text-text/40 max-w-xl mx-auto leading-relaxed">
                Выберите сценарий, загрузите фото и добавьте короткое описание. Модуль описывает наблюдения, даёт вероятные причины и подсказывает, когда нужен врач.
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm font-semibold text-text/70">Формат ответа</p>
                <p className="text-xs text-text/35">Пользователь сам выбирает глубину</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
                {RESPONSE_MODES.map((item) => {
                  const active = responseMode === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setResponseMode(item.id)}
                      className={`text-left rounded-2xl border px-4 py-3 transition-all ${
                        active
                          ? "border-amber-500/30 bg-amber-500/10 shadow-sm"
                          : "border-text/[0.06] bg-bg hover:border-amber-300 hover:bg-amber-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-sm font-semibold ${active ? "text-amber-700" : "text-text/80"}`}>{item.title}</span>
                        {active && <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Выбрано</span>}
                      </div>
                      <p className="text-[11px] leading-tight text-text/45">{item.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm font-semibold text-text/70">Модель ответа</p>
                <p className="text-xs text-text/35">Можно переключать под задачу</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-5">
                {MODELS.map((item) => {
                  const active = modelId === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setModelId(item.id)}
                      className={`text-left rounded-2xl border px-4 py-3 transition-all ${
                        active
                          ? "border-accent/30 bg-accent/10 shadow-sm"
                          : "border-text/[0.06] bg-bg hover:border-accent/20 hover:bg-accent/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-sm font-semibold ${active ? "text-accent" : "text-text/80"}`}>{item.title}</span>
                        {active && <span className="text-[10px] font-bold uppercase tracking-wider text-accent">Выбрано</span>}
                      </div>
                      <p className="text-[11px] leading-tight text-text/45">{item.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <button
                  onClick={() => setCompareMode((v) => !v)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    compareMode
                      ? "bg-emerald-500 text-white"
                      : "bg-text/[0.04] text-text/55 hover:bg-text/[0.07]"
                  }`}
                >
                  Сравнить модели
                </button>
                <p className="text-xs text-text/35">Покажет ответы двух моделей рядом</p>
              </div>

              {compareMode && (
                <div className="mb-5">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <p className="text-sm font-semibold text-text/70">Вторая модель</p>
                    <p className="text-xs text-text/35">Для сравнения с основной</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {MODELS.map((item) => {
                      const active = compareModelId === item.id;
                      const blocked = item.id === modelId;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCompareModelId(item.id)}
                          disabled={blocked}
                          className={`text-left rounded-2xl border px-4 py-3 transition-all ${
                            active
                              ? "border-amber-500/30 bg-amber-500/10 shadow-sm"
                              : blocked
                                ? "border-text/[0.04] bg-text/[0.03] text-text/25 cursor-not-allowed"
                                : "border-text/[0.06] bg-bg hover:border-amber-300 hover:bg-amber-50/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className={`text-sm font-semibold ${active ? "text-amber-700" : "text-text/80"}`}>{item.title}</span>
                            {active && <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Выбрано</span>}
                          </div>
                          <p className="text-[11px] leading-tight text-text/45">{item.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm font-semibold text-text/70">Сценарий анализа</p>
                <p className="text-xs text-text/35">Можно переключать перед каждым запросом</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SCENARIOS.map((item) => {
                  const active = scenario === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setScenario(item.id)}
                      className={`text-left rounded-2xl border px-4 py-3 transition-all ${
                        active
                          ? "border-emerald-500/30 bg-emerald-500/10 shadow-sm"
                          : "border-text/[0.06] bg-bg hover:border-emerald-300 hover:bg-emerald-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`text-sm font-semibold ${active ? "text-emerald-700" : "text-text/80"}`}>{item.title}</span>
                        {active && <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Выбрано</span>}
                      </div>
                      <p className="text-[11px] leading-tight text-text/45">{item.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-3xl p-8 sm:p-10 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all mb-8"
            >
              <svg className="w-12 h-12 text-emerald-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-1">Нажмите для загрузки фото</p>
              <p className="text-text/30 text-xs">или перетащите файл сюда</p>
              <p className="text-text/20 text-[10px] mt-2">JPEG, PNG, WebP до 10MB</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mb-6">
              <div className="rounded-3xl border border-emerald-200/60 bg-emerald-50/60 dark:bg-emerald-900/15 dark:border-emerald-800/30 p-5">
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3">Можно анализировать</p>
                <div className="space-y-2">
                  {[
                    "кожу, сыпь, покраснение, раздражение",
                    "глаза и веки",
                    "рот, язык, дёсны, горло",
                    "ногти и кожу вокруг них",
                    "родинки и пигментные пятна",
                  ].map((item) => (
                    <div key={item} className="text-[13px] leading-relaxed text-text/65">• {item}</div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-amber-200/60 bg-amber-50/70 dark:bg-amber-900/15 dark:border-amber-800/30 p-5">
                <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-3">Границы модуля</p>
                <div className="space-y-2">
                  {[
                    "не ставит окончательный диагноз по одному фото",
                    "не назначает лекарства, дозировки и схемы лечения",
                    "не заменяет очный осмотр, анализы и клиническое решение врача",
                    "не подтверждает безопасность состояния, если есть тревожные симптомы",
                  ].map((item) => (
                    <div key={item} className="text-[13px] leading-relaxed text-text/65">• {item}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_PROMPTS.map((p) => {
                const { Icon } = p;
                return (
                  <button
                    key={p.text}
                    onClick={() => {
                      setScenario(p.scenario);
                      setInput(p.text);
                      fileInputRef.current?.click();
                    }}
                    style={{ ["--pad-c" as string]: p.color }}
                    className="flex items-start gap-3 p-4 rounded-2xl border border-text/[0.06] bg-bg hover:border-emerald-300 hover:shadow-sm transition-all text-left group"
                  >
                    <span className="glass-pad flex items-center justify-center w-10 h-10 rounded-xl shrink-0">
                      <Icon className="block" size={20} strokeWidth={2.4} />
                    </span>
                    <div>
                      <span className="text-[13px] font-semibold text-text/70 group-hover:text-emerald-600 transition-colors block">{p.text}</span>
                      <span className="text-[11px] text-text/30">{p.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Chat messages */
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
            {compareMode && (
              <div className="rounded-3xl border border-emerald-500/15 bg-emerald-50/60 dark:bg-emerald-900/10 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Сравнение моделей</p>
                    <p className="text-xs text-text/45 mt-1">Ниже показываются ответы двух моделей рядом. Это удобно, если нужен второй взгляд на фото или клиническое описание.</p>
                  </div>
                  {comparisonLoading && (
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Анализируем...</span>
                  )}
                </div>

                {comparisonResult ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {([comparisonResult.left, comparisonResult.right] as const).map((item) => (
                      <div key={item.modelId} className="rounded-2xl border border-text/[0.06] bg-bg p-4">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div>
                            <p className="text-sm font-semibold text-text/80">{item.title}</p>
                            <p className="text-[11px] text-text/35">{item.modelId}</p>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Ответ</span>
                        </div>
                        <div className="md-content text-[14px] leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: renderMarkdown(item.content) }} />
                      </div>
                    ))}
                  </div>
                ) : comparisonLoading ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {["Claude Opus 4.5", "GPT-5.5"].map((label) => (
                      <div key={label} className="rounded-2xl border border-text/[0.06] bg-bg p-4 animate-pulse">
                        <div className="h-4 w-32 bg-text/[0.08] rounded mb-4" />
                        <div className="space-y-2">
                          <div className="h-3 bg-text/[0.06] rounded w-5/6" />
                          <div className="h-3 bg-text/[0.06] rounded w-full" />
                          <div className="h-3 bg-text/[0.06] rounded w-4/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className="shrink-0 mt-0.5">
                  {msg.role === "user" ? (
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                      <span className="text-xs font-bold text-white">U</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <span className="text-sm">🏥</span>
                    </div>
                  )}
                </div>
                <div className={`max-w-[80%] min-w-0 ${msg.role === "user" ? "text-right" : ""}`}>
                  <div className={`inline-block text-left rounded-2xl px-4 py-3 text-[14px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-accent text-white rounded-tr-md"
                      : "bg-text/[0.06] text-text/85 rounded-tl-md"
                  }`}>
                    {msg.image && (
                      <img src={msg.image} alt="Загруженное фото" className="max-w-[240px] rounded-lg mb-2" />
                    )}
                    {msg.role === "assistant" ? (
                      <div className="md-content break-words" dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                    ) : (
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    )}
                  </div>
                  {/* Copy button for AI messages */}
                  {msg.role === "assistant" && msg.content && !streaming && (
                    <button
                      onClick={() => navigator.clipboard.writeText(msg.content)}
                      className="text-[10px] text-text/30 hover:text-emerald-600 mt-1 px-2 py-1 rounded-lg hover:bg-emerald-500/5 transition-colors"
                    >
                      Копировать
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming dots */}
            {streaming && (!messages.length || !messages[messages.length - 1]?.content) && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                  <span className="text-sm">🏥</span>
                </div>
                <div className="bg-text/[0.06] rounded-2xl rounded-tl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-emerald-400/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-emerald-400/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-emerald-400/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-text/[0.06] bg-bg px-4 py-2 shrink-0">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text/35">Формат</span>
            {RESPONSE_MODES.map((item) => {
              const active = responseMode === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setResponseMode(item.id)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    active
                      ? "bg-amber-500 text-white"
                      : "bg-text/[0.04] text-text/55 hover:bg-text/[0.07]"
                  }`}
                >
                  {item.title}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text/35">Модель</span>
            {MODELS.map((item) => {
              const active = modelId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setModelId(item.id)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    active
                      ? "bg-accent text-white"
                      : "bg-text/[0.04] text-text/55 hover:bg-text/[0.07]"
                  }`}
                >
                  {item.title}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <button
              onClick={() => setCompareMode((v) => !v)}
              className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                compareMode
                  ? "bg-emerald-500 text-white"
                  : "bg-text/[0.04] text-text/55 hover:bg-text/[0.07]"
              }`}
            >
              Сравнить модели
            </button>
            <p className="text-[11px] text-text/35">Два ответа рядом, без переключения вручную</p>
          </div>

          {compareMode && (
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text/35">Вторая модель</span>
              {MODELS.map((item) => {
                const active = compareModelId === item.id;
                const blocked = item.id === modelId;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCompareModelId(item.id)}
                    disabled={blocked}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      active
                        ? "bg-amber-500 text-white"
                        : blocked
                          ? "bg-text/[0.03] text-text/25 cursor-not-allowed"
                          : "bg-text/[0.04] text-text/55 hover:bg-text/[0.07]"
                    }`}
                  >
                    {item.title}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-text/35">Сценарий</span>
            {SCENARIOS.map((item) => {
              const active = scenario === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setScenario(item.id)}
                  className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    active
                      ? "bg-emerald-500 text-white"
                      : "bg-text/[0.04] text-text/55 hover:bg-text/[0.07]"
                  }`}
                >
                  {item.title}
                </button>
              );
            })}
          </div>

          {/* Pending image preview */}
          {pendingImage && (
            <div className="flex items-center gap-3 mb-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-800/30">
              <img src={pendingImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 truncate">{pendingFileName}</p>
                <p className="text-[10px] text-emerald-600/60">Готово к анализу</p>
              </div>
              <button onClick={() => { setPendingImage(null); setPendingFileName(""); }} className="text-text/30 hover:text-red-400 p-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}

          {uploading && (
            <div className="text-xs text-emerald-600 mb-2 px-1 animate-pulse">Загрузка...</div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); e.target.value = ""; }}
          />

          <div className="flex items-center gap-2 bg-bg border border-text/[0.08] rounded-xl focus-within:border-emerald-400/40 focus-within:ring-2 focus-within:ring-emerald-400/10 transition-all px-2 py-1">
            {/* Photo button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || streaming || comparisonLoading}
              className="flex items-center justify-center w-10 h-10 text-text/25 hover:text-emerald-600 transition-colors disabled:opacity-30 shrink-0"
              title="Загрузить фото"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </button>

            {/* Input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px"; }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={pendingImage ? "Опишите симптомы..." : "Опишите симптомы или загрузите фото..."}
              rows={1}
              className="flex-1 bg-transparent resize-none focus:outline-none min-w-0 leading-snug placeholder:text-text/20 text-text"
              style={{ fontSize: 16, padding: "10px 8px", maxHeight: 80, minHeight: 42 }}
            />

            {/* Send */}
            {(input.trim() || pendingImage) ? (
              <button
                onClick={() => sendMessage()}
                disabled={streaming || comparisonLoading}
                className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-30 shrink-0"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500/20 transition-colors shrink-0"
                title="Загрузить фото"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
