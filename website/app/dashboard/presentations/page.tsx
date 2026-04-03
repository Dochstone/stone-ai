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
  image_url?: string;
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

const IMAGE_MODELS = [
  { id: "gpt-image-1", name: "GPT Image (рекомендуется)" },
  { id: "nano-banana", name: "Nano Banana (Gemini)" },
  { id: "nano-banana-pro", name: "Nano Banana Pro" },
  { id: "kolors-v3", name: "KOLORS V3 (Kling)" },
  { id: "flux-schnell", name: "Flux Schnell" },
];

const DETAIL_LEVELS = [
  { id: "short", label: "Кратко" },
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
  const touchStartRef = useRef<{ x: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [imageGen, setImageGen] = useState<{ slideIdx: number; model: string } | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageModel, setImageModel] = useState("gpt-image-1");
  const [editMode, setEditMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const a = getAuth();
    setAuth(a);
    if (a) fetchHistory(a.token);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (slides.length === 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreen) setFullscreen(false);
      if (e.key === "ArrowLeft") setCurrentSlide((p) => Math.max(0, p - 1));
      if (e.key === "ArrowRight") setCurrentSlide((p) => Math.min(slides.length - 1, p + 1));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slides.length, fullscreen]);

  // Scroll strip thumbnail into view (horizontal only, doesn't move page)
  useEffect(() => {
    if (stripRef.current) {
      const child = stripRef.current.children[currentSlide] as HTMLElement | undefined;
      if (child) {
        const container = stripRef.current;
        const childLeft = child.offsetLeft;
        const childWidth = child.offsetWidth;
        const containerWidth = container.offsetWidth;
        const scrollLeft = childLeft - containerWidth / 2 + childWidth / 2;
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }
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
        const items = (data.generations || data.items || []).map((g: any) => ({
          id: g.id,
          topic: g.prompt || g.topic || "",
          slides_count: g.metadata_?.slides_count || 0,
          style: g.metadata_?.style || "modern",
          created_at: g.created_at || "",
          slides: typeof g.result_text === "string" ? JSON.parse(g.result_text || "[]") : (g.slides || []),
        }));
        setHistory(items);
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
          model_id: modelId,
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
      // Scroll to preview after generation
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    }
    setLoading(false);
  };

  const exportPDF = async () => {
    if (!auth || !generationId) return;
    try {
      const res = await fetch(`${API_URL}/api/presentations/export/html`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ generation_id: generationId }),
      });
      const html = await res.text();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 500);
      }
    } catch {
      setError("Не удалось экспортировать");
    }
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(slides, null, 2));
  };

  const generateSlideImage = async (slideIdx: number) => {
    if (!auth) return;
    setImageLoading(true);
    setError("");
    const slide = slides[slideIdx];
    const prompt = `Create a professional presentation illustration for a slide titled "${slide.title}". ${slide.bullets.slice(0, 2).join(". ")}. Clean, modern style, no text on image.`;
    try {
      const res = await fetch(`${API_URL}/api/chat/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model_id: imageModel }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.image_url) {
          const updated = [...slides];
          updated[slideIdx] = { ...updated[slideIdx], image_url: data.image_url };
          setSlides(updated);
        } else {
          setError("Модель не вернула картинку. Попробуйте другую модель (GPT Image или Flux).");
        }
      } else {
        const err = await res.json().catch(() => ({}));
        const msg = typeof err.detail === "string" ? err.detail : typeof err.detail === "object" ? err.detail?.message : "Ошибка генерации";
        setError(msg || "Ошибка генерации картинки");
      }
    } catch {
      setError("Ошибка соединения");
    }
    setImageLoading(false);
    setImageGen(null);
  };

  const removeSlideImage = (slideIdx: number) => {
    const updated = [...slides];
    updated[slideIdx] = { ...updated[slideIdx], image_url: undefined };
    setSlides(updated);
  };

  const uploadSlideImage = (slideIdx: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) { setError("Файл слишком большой (макс 10MB)"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const updated = [...slides];
        updated[slideIdx] = { ...updated[slideIdx], image_url: dataUrl };
        setSlides(updated);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateSlideField = (idx: number, field: string, value: any) => {
    const updated = [...slides];
    updated[idx] = { ...updated[idx], [field]: value };
    setSlides(updated);
  };

  const updateBullet = (slideIdx: number, bulletIdx: number, value: string) => {
    const updated = [...slides];
    const bullets = [...updated[slideIdx].bullets];
    bullets[bulletIdx] = value;
    updated[slideIdx] = { ...updated[slideIdx], bullets };
    setSlides(updated);
  };

  const addBullet = (slideIdx: number) => {
    const updated = [...slides];
    updated[slideIdx] = { ...updated[slideIdx], bullets: [...updated[slideIdx].bullets, ""] };
    setSlides(updated);
  };

  const removeBullet = (slideIdx: number, bulletIdx: number) => {
    const updated = [...slides];
    const bullets = updated[slideIdx].bullets.filter((_, i) => i !== bulletIdx);
    updated[slideIdx] = { ...updated[slideIdx], bullets };
    setSlides(updated);
  };

  const duplicateSlide = (idx: number) => {
    const updated = [...slides];
    updated.splice(idx + 1, 0, { ...slides[idx] });
    setSlides(updated);
    setCurrentSlide(idx + 1);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length <= 1) return;
    const updated = slides.filter((_, i) => i !== idx);
    setSlides(updated);
    setCurrentSlide(Math.min(currentSlide, updated.length - 1));
  };

  const moveSlide = (idx: number, direction: -1 | 1) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= slides.length) return;
    const updated = [...slides];
    [updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]];
    setSlides(updated);
    setCurrentSlide(newIdx);
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

  return (
    <div className="pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-8 animate-fadeIn">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-text">AI-Презентации</h1>
          <p className="text-sm text-text/50 mt-1">Создавайте профессиональные презентации с помощью ИИ</p>
        </div>

        {!getAuth() && (
          <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-text/60">Войдите, чтобы использовать все функции</p>
            <a href="/webchat" className="bg-accent text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors shrink-0">Войти</a>
          </div>
        )}

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
          <div ref={previewRef} className="bg-white rounded-2xl border border-text/5 p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text">Предпросмотр</h2>
              <span className="text-sm text-text/40">
                Слайд {currentSlide + 1} из {slides.length}
              </span>
            </div>

            {/* Main slide with swipe */}
            <div
              onTouchStart={(e) => { touchStartRef.current = { x: e.touches[0].clientX }; }}
              onTouchEnd={(e) => {
                if (!touchStartRef.current) return;
                const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
                if (dx < -40) setCurrentSlide((p) => Math.min(slides.length - 1, p + 1));
                if (dx > 40) setCurrentSlide((p) => Math.max(0, p - 1));
                touchStartRef.current = null;
              }}
              style={{ touchAction: "pan-y" }}
            >
              <SlidePreview
                slide={slides[currentSlide]}
                style={style}
                slideNumber={currentSlide + 1}
                totalSlides={slides.length}
              />
            </div>

            {/* Speaker notes */}
            {slides[currentSlide]?.notes && (
              <div>
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="text-xs text-text/40 hover:text-text/60 transition-colors"
                >
                  {showNotes ? "Скрыть заметки" : "Заметки спикера"}
                </button>
                {showNotes && (
                  <p className="mt-2 text-sm text-text/50 bg-text/[0.03] rounded-xl p-4 leading-relaxed">
                    {slides[currentSlide].notes}
                  </p>
                )}
              </div>
            )}

            {/* Slide image controls */}
            <div className="flex flex-wrap items-center gap-3">
              {slides[currentSlide]?.image_url ? (
                <>
                  <div className="flex items-center gap-2 text-xs text-teal font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Картинка добавлена
                  </div>
                  <button onClick={() => removeSlideImage(currentSlide)} className="text-xs text-red-400 hover:text-red-500 transition-colors">
                    Удалить
                  </button>
                  <button onClick={() => setImageGen({ slideIdx: currentSlide, model: imageModel })} className="text-xs text-text/40 hover:text-accent transition-colors">
                    Заменить
                  </button>
                </>
              ) : imageGen?.slideIdx === currentSlide ? (
                <div className="flex items-center gap-2 w-full">
                  <select
                    value={imageModel}
                    onChange={(e) => setImageModel(e.target.value)}
                    className="bg-bg border border-text/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                  >
                    {IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <button
                    onClick={() => generateSlideImage(currentSlide)}
                    disabled={imageLoading}
                    className="bg-accent text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-accent/90 disabled:opacity-50 transition-colors"
                  >
                    {imageLoading ? "Генерация..." : "Создать"}
                  </button>
                  <button onClick={() => setImageGen(null)} className="text-xs text-text/30 hover:text-text/50">
                    Отмена
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setImageGen({ slideIdx: currentSlide, model: imageModel })}
                    className="flex items-center gap-1.5 text-xs text-accent font-medium hover:text-accent/80 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    Сгенерировать AI
                  </button>
                  <span className="text-text/15">|</span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-text/40 hover:text-text/60 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    Загрузить файл
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadSlideImage(currentSlide, file);
                      e.target.value = "";
                    }}
                  />
                </div>
              )}
            </div>

            {/* Edit / Manage slide */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  editMode ? "bg-accent text-white" : "text-text/40 hover:text-accent border border-text/10"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
                {editMode ? "Готово" : "Редактировать"}
              </button>
              <button onClick={() => duplicateSlide(currentSlide)} className="text-xs text-text/40 hover:text-accent transition-colors px-2 py-1.5" title="Дублировать">
                Дублировать
              </button>
              {slides.length > 1 && (
                <button onClick={() => deleteSlide(currentSlide)} className="text-xs text-red-400 hover:text-red-500 transition-colors px-2 py-1.5" title="Удалить слайд">
                  Удалить
                </button>
              )}
              <div className="flex items-center gap-1 ml-auto">
                <button onClick={() => moveSlide(currentSlide, -1)} disabled={currentSlide === 0} className="text-xs text-text/30 hover:text-text/60 disabled:opacity-30 px-1.5 py-1" title="Переместить выше">
                  ↑
                </button>
                <button onClick={() => moveSlide(currentSlide, 1)} disabled={currentSlide === slides.length - 1} className="text-xs text-text/30 hover:text-text/60 disabled:opacity-30 px-1.5 py-1" title="Переместить ниже">
                  ↓
                </button>
              </div>
            </div>

            {editMode && (
              <div className="bg-text/[0.02] border border-text/5 rounded-xl p-4 space-y-3">
                <div>
                  <label className="text-[10px] font-semibold text-text/40 uppercase mb-1 block">Заголовок</label>
                  <input
                    value={slides[currentSlide]?.title || ""}
                    onChange={(e) => updateSlideField(currentSlide, "title", e.target.value)}
                    className="w-full bg-bg border border-text/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-semibold text-text/40 uppercase">Пункты</label>
                    <button onClick={() => addBullet(currentSlide)} className="text-[10px] text-accent font-bold">+ Добавить</button>
                  </div>
                  {slides[currentSlide]?.bullets.map((b: string, bi: number) => (
                    <div key={bi} className="flex gap-2 mb-1.5">
                      <input
                        value={b}
                        onChange={(e) => updateBullet(currentSlide, bi, e.target.value)}
                        className="flex-1 bg-bg border border-text/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent/50"
                      />
                      <button onClick={() => removeBullet(currentSlide, bi)} className="text-red-400 text-xs px-1 hover:text-red-500">×</button>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-text/40 uppercase mb-1 block">Заметки спикера</label>
                  <textarea
                    value={slides[currentSlide]?.notes || ""}
                    onChange={(e) => updateSlideField(currentSlide, "notes", e.target.value)}
                    rows={2}
                    className="w-full bg-bg border border-text/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent/50 resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-text/40 uppercase mb-1 block">Layout</label>
                  <select
                    value={slides[currentSlide]?.layout || "content"}
                    onChange={(e) => updateSlideField(currentSlide, "layout", e.target.value)}
                    className="bg-bg border border-text/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  >
                    <option value="title">Title</option>
                    <option value="content">Content</option>
                    <option value="section-header">Section Header</option>
                    <option value="quote">Quote</option>
                    <option value="two-column">Two Column</option>
                  </select>
                </div>
              </div>
            )}

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
                onClick={() => setFullscreen(true)}
                className="border border-text/10 text-text/60 font-medium px-5 py-2.5 rounded-xl hover:bg-text/[0.04] transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                Полный экран
              </button>
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

        {fullscreen && slides.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center"
            onTouchStart={(e) => { touchStartRef.current = { x: e.touches[0].clientX }; }}
            onTouchEnd={(e) => {
              if (!touchStartRef.current) return;
              const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
              if (dx < -40) setCurrentSlide((p) => Math.min(slides.length - 1, p + 1));
              if (dx > 40) setCurrentSlide((p) => Math.max(0, p - 1));
              touchStartRef.current = null;
            }}
          >
            <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 z-10 text-white/50 hover:text-white p-2" title="Выйти">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-full max-w-5xl px-4">
              <SlidePreview slide={slides[currentSlide]} style={style} slideNumber={currentSlide + 1} totalSlides={slides.length} />
            </div>
            <div className="flex items-center gap-4 mt-6">
              <button onClick={() => setCurrentSlide((p) => Math.max(0, p - 1))} disabled={currentSlide === 0} className="text-white/50 hover:text-white disabled:opacity-20 text-2xl px-3">&#9664;</button>
              <span className="text-white/40 text-sm">{currentSlide + 1} / {slides.length}</span>
              <button onClick={() => setCurrentSlide((p) => Math.min(slides.length - 1, p + 1))} disabled={currentSlide === slides.length - 1} className="text-white/50 hover:text-white disabled:opacity-20 text-2xl px-3">&#9654;</button>
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
    modern: "#6c63ff",
    minimal: "#000000",
    corporate: "#2980b9",
    creative: "#ff6b6b",
    bold: "#ffcc00",
    dark: "#89b4fa",
  };
  return (
    <span
      className="w-3 h-3 rounded-full shrink-0 mt-0.5"
      style={{ backgroundColor: colors[style] || "#999" }}
    />
  );
}
