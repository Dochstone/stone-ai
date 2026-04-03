"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import SlidePreview from "@/components/presentations/SlidePreview";
import StylePicker from "@/components/presentations/StylePicker";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

interface SlideData {
  title: string;
  bullets: string[];
  notes: string;
  layout: string;
}

interface HistoryItem {
  id: string;
  topic: string;
  slides_count: number;
  style: string;
  created_at: string;
  slides: SlideData[];
}

const MODELS = [
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini" },
  { id: "gpt-4.1", name: "GPT-4.1" },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4" },
  { id: "deepseek-v3", name: "DeepSeek V3" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
];

const DETAIL_LEVELS = [
  { id: "brief", label: "Кратко" },
  { id: "medium", label: "Средне" },
  { id: "detailed", label: "Подробно" },
];

function getAuth() {
  try {
    const s = localStorage.getItem("stone_auth");
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export default function PresentationsPage() {
  const [auth, setAuth] = useState<{ token: string; email: string } | null>(null);

  // Form
  const [topic, setTopic] = useState("");
  const [slidesCount, setSlidesCount] = useState(10);
  const [style, setStyle] = useState("modern");
  const [audience, setAudience] = useState("");
  const [detailLevel, setDetailLevel] = useState("medium");
  const [modelId, setModelId] = useState("gpt-4.1-mini");
  const [language, setLanguage] = useState("ru");

  // Result
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const a = getAuth();
    setAuth(a);
    if (a) fetchHistory(a.token);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (slides.length === 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setCurrentSlide((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight") setCurrentSlide((p) => Math.min(slides.length - 1, p + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slides.length]);

  // Scroll strip to current slide
  useEffect(() => {
    if (stripRef.current) {
      const child = stripRef.current.children[currentSlide] as HTMLElement | undefined;
      child?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [currentSlide]);

  const fetchHistory = async (token: string) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/generations/?type=presentation&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.generations || data.items || []);
      }
    } catch {
      /* ignore */
    }
    setHistoryLoading(false);
  };

  const generate = async () => {
    if (!auth) return;
    setLoading(true);
    setError("");
    setSlides([]);
    setCurrentSlide(0);
    setGenerationId(null);

    try {
      const res = await fetch(`${API_URL}/api/presentations/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          slides_count: slidesCount,
          style,
          audience: audience || undefined,
          detail_level: detailLevel,
          model: modelId,
          language,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || errData.error || `Ошибка ${res.status}`);
      }

      const data = await res.json();
      setSlides(data.slides || []);
      setGenerationId(data.generation_id || data.id || null);
      fetchHistory(auth.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    }
    setLoading(false);
  };

  const exportPDF = async () => {
    if (!auth || !generationId) return;
    try {
      const res = await fetch(`${API_URL}/api/presentations/export/pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ generation_id: generationId }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "presentation.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Не удалось экспортировать PDF");
    }
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(slides, null, 2));
  };

  const reset = () => {
    setSlides([]);
    setGenerationId(null);
    setCurrentSlide(0);
  };

  const openHistoryItem = (item: HistoryItem) => {
    setSlides(item.slides || []);
    setGenerationId(item.id);
    setCurrentSlide(0);
    setStyle(item.style || "modern");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Auth gate
  if (auth === null && typeof window !== "undefined") {
    const checked = getAuth();
    if (!checked) {
      return (
        <div className="pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
            <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fadeIn">
              <div className="bg-white rounded-2xl border border-text/5 p-10 text-center max-w-md">
                <svg className="w-12 h-12 mx-auto mb-4 text-text/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <h2 className="text-xl font-bold text-text mb-2">Войдите в аккаунт</h2>
                <p className="text-sm text-text/50 mb-6">Для создания презентаций необходима авторизация</p>
                <Link
                  href="/webchat"
                  className="inline-block bg-accent text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Войти
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8 animate-fadeIn">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text">AI-Презентации</h1>
          <p className="text-sm text-text/50 mt-1">Создавайте профессиональные презентации с помощью ИИ</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-text/5 p-6 sm:p-8 space-y-6">
          {/* Topic */}
          <div>
            <label className="block text-sm font-semibold text-text mb-2">Тема презентации *</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Маркетинговая стратегия 2026"
              className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text placeholder:text-text/30 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>

          {/* Slides count */}
          <div>
            <label className="block text-sm font-semibold text-text mb-2">
              Количество слайдов: <span className="text-accent font-bold">{slidesCount}</span>
            </label>
            <input
              type="range"
              min={3}
              max={30}
              value={slidesCount}
              onChange={(e) => setSlidesCount(Number(e.target.value))}
              className="w-full accent-[#C4623D]"
            />
            <div className="flex justify-between text-[11px] text-text/30 mt-1">
              <span>3</span>
              <span>30</span>
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-semibold text-text mb-3">Стиль оформления</label>
            <StylePicker selected={style} onSelect={setStyle} />
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-semibold text-text mb-2">Аудитория <span className="text-text/30 font-normal">(опционально)</span></label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="Инвесторы, коллеги, студенты..."
              className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text placeholder:text-text/30 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>

          {/* Detail level */}
          <div>
            <label className="block text-sm font-semibold text-text mb-3">Уровень детализации</label>
            <div className="flex gap-3">
              {DETAIL_LEVELS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDetailLevel(d.id)}
                  className={`
                    flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all
                    ${detailLevel === d.id
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-text/10 text-text/50 hover:border-text/20"
                    }
                  `}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model + Language row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Модель</label>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all"
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text mb-2">Язык</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-text/10 bg-bg text-text focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-all"
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={loading || !topic.trim()}
            className="w-full sm:w-auto bg-accent text-white font-semibold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Генерация...
              </span>
            ) : (
              "Сгенерировать (15\u20BD)"
            )}
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="bg-white rounded-2xl border border-text/5 p-8 animate-fadeIn">
            <div className="aspect-video rounded-xl bg-text/[0.03] animate-pulse flex items-center justify-center">
              <div className="text-center">
                <svg className="w-10 h-10 mx-auto mb-3 text-text/10 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm text-text/30 font-medium">AI создаёт презентацию...</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {slides.length > 0 && !loading && (
          <div className="bg-white rounded-2xl border border-text/5 p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text">Предпросмотр</h2>
              <span className="text-sm text-text/40">
                Слайд {currentSlide + 1} из {slides.length}
              </span>
            </div>

            {/* Main slide */}
            <SlidePreview
              slide={slides[currentSlide]}
              style={style}
              slideNumber={currentSlide + 1}
              totalSlides={slides.length}
            />

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))}
                disabled={currentSlide === 0}
                className="w-10 h-10 rounded-xl border border-text/10 flex items-center justify-center text-text/50 hover:bg-text/[0.04] disabled:opacity-30 transition-all"
              >
                &#9664;
              </button>
              <div className="flex items-center gap-1.5">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`
                      w-2 h-2 rounded-full transition-all
                      ${i === currentSlide ? "bg-accent w-6" : "bg-text/15 hover:bg-text/30"}
                    `}
                  />
                ))}
              </div>
              <button
                onClick={() => setCurrentSlide((p) => Math.min(slides.length - 1, p + 1))}
                disabled={currentSlide === slides.length - 1}
                className="w-10 h-10 rounded-xl border border-text/10 flex items-center justify-center text-text/50 hover:bg-text/[0.04] disabled:opacity-30 transition-all"
              >
                &#9654;
              </button>
            </div>

            {/* Miniature strip */}
            <div
              ref={stripRef}
              className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin"
              onTouchStart={() => {}}
            >
              {slides.map((slide, i) => (
                <div
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`shrink-0 transition-all ${i === currentSlide ? "ring-2 ring-accent rounded-lg" : ""}`}
                >
                  <SlidePreview
                    slide={slide}
                    style={style}
                    slideNumber={i + 1}
                    totalSlides={slides.length}
                    compact
                  />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportPDF}
                className="bg-accent text-white font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Скачать PDF
              </button>
              <button
                onClick={reset}
                className="border border-text/10 text-text/60 font-medium px-5 py-2.5 rounded-xl hover:bg-text/[0.04] transition-colors"
              >
                Заново
              </button>
              <button
                onClick={copyJSON}
                className="border border-text/10 text-text/60 font-medium px-5 py-2.5 rounded-xl hover:bg-text/[0.04] transition-colors"
              >
                Копировать JSON
              </button>
            </div>
          </div>
        )}

        {/* History */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text">История презентаций</h2>
          {historyLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-text/5 p-5 animate-pulse">
                  <div className="h-4 bg-text/[0.06] rounded w-3/4 mb-3" />
                  <div className="h-3 bg-text/[0.04] rounded w-1/2 mb-2" />
                  <div className="h-3 bg-text/[0.04] rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-text/5 p-8 text-center">
              <p className="text-sm text-text/30">Презентации ещё не создавались</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-text/5 p-5 hover:border-text/10 transition-colors"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <StyleDot style={item.style} />
                    <h3 className="text-sm font-semibold text-text line-clamp-2 flex-1">
                      {item.topic}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-text/40 mb-4">
                    <span>{item.slides_count || item.slides?.length || 0} слайдов</span>
                    <span>{new Date(item.created_at).toLocaleDateString("ru-RU")}</span>
                  </div>
                  <button
                    onClick={() => openHistoryItem(item)}
                    className="text-sm font-semibold text-accent hover:underline"
                  >
                    Открыть
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StyleDot({ style }: { style: string }) {
  const colors: Record<string, string> = {
    modern: "#4361ee",
    minimal: "#666666",
    corporate: "#2980b9",
    creative: "#e94560",
    bold: "#ffd93d",
    dark: "#6c8cff",
  };
  return (
    <span
      className="w-3 h-3 rounded-full shrink-0 mt-0.5"
      style={{ backgroundColor: colors[style] || "#999" }}
    />
  );
}
