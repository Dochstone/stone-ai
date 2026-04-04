"use client";

import { useState, useEffect } from "react";
import { ImageUploader } from "@/components/photo-session/ImageUploader";
import { BeforeAfterSlider } from "@/components/photo-session/BeforeAfterSlider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://stone-ai-production.up.railway.app";

type Tab = "background" | "model" | "marketplace";

interface Preset {
  id: string;
  emoji: string;
  name: string;
  prompt: string;
}

interface MarketplaceOption {
  id: string;
  name: string;
  width: number;
  height: number;
  icon: string;
}

const TABS: { id: Tab; label: string; price: number }[] = [
  { id: "background", label: "Смена фона", price: 15 },
  { id: "model", label: "На модели", price: 40 },
  { id: "marketplace", label: "Маркетплейс", price: 20 },
];

const MODELS = [
  { id: "gpt-image-1", label: "GPT Image (рекомендуется)" },
  { id: "nano-banana", label: "Nano Banana" },
  { id: "nano-banana-pro", label: "Nano Banana Pro" },
  { id: "flux-schnell", label: "Flux Schnell" },
];

const SCENES = ["Студия", "Улица", "Кафе", "Офис", "На природе"];
const POSES = ["Стоя", "Сидя", "В движении", "Крупный план"];
const BG_STYLES = ["Белый", "Градиент", "Lifestyle"];

const MARKETPLACES: MarketplaceOption[] = [
  { id: "ozon", name: "OZON", width: 1000, height: 1000, icon: "🟦" },
  { id: "wildberries", name: "Wildberries", width: 900, height: 1200, icon: "🟪" },
  { id: "avito", name: "Avito", width: 1280, height: 960, icon: "🟩" },
  { id: "universal", name: "Универсальный", width: 1200, height: 1200, icon: "⬜" },
];

function getAuth() {
  try {
    const s = localStorage.getItem("stone_auth");
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export default function PhotoSessionPage() {
  const [tab, setTab] = useState<Tab>("background");

  // Shared state
  const [imageBase64, setImageBase64] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [selectedModel, setSelectedModel] = useState("gpt-image-1");
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Background tab
  const [bgPrompt, setBgPrompt] = useState("");
  const [presets, setPresets] = useState<Preset[]>([]);

  // Model tab
  const [modelDescription, setModelDescription] = useState("");
  const [scene, setScene] = useState("Студия");
  const [pose, setPose] = useState("Стоя");

  // Marketplace tab
  const [marketplace, setMarketplace] = useState("ozon");
  const [productName, setProductName] = useState("");
  const [bgStyle, setBgStyle] = useState("Белый");

  useEffect(() => {
    fetch(`${API_URL}/api/photo-session/presets/backgrounds`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPresets(data);
        else if (data.presets) setPresets(data.presets);
      })
      .catch(() => {});
  }, []);

  const clearImage = () => {
    setImageBase64("");
    setImagePreview("");
    setResultUrl(null);
    setError(null);
  };

  const handleUpload = (base64: string, preview: string) => {
    setImageBase64(base64);
    setImagePreview(preview);
    setResultUrl(null);
    setError(null);
  };

  const handleTabChange = (t: Tab) => {
    setTab(t);
    setResultUrl(null);
    setError(null);
  };

  const generate = async () => {
    const auth = getAuth();
    if (!auth?.token || !imageBase64) return;
    setGenerating(true);
    setError(null);
    setResultUrl(null);

    let endpoint = "";
    let body: Record<string, unknown> = {};

    if (tab === "background") {
      endpoint = "/api/photo-session/background";
      body = {
        image_base64: imageBase64,
        background_prompt: bgPrompt || "clean professional background",
        style: null,
        model_id: selectedModel,
      };
    } else if (tab === "model") {
      endpoint = "/api/photo-session/on-model";
      body = {
        product_image_base64: imageBase64,
        model_description: modelDescription || "professional model",
        scene: scene,
        pose: pose,
        model_id: selectedModel,
      };
    } else {
      endpoint = "/api/photo-session/marketplace-card";
      body = {
        image_base64: imageBase64,
        platform: marketplace,
        product_name: productName || "Product",
        background_color: bgStyle.toLowerCase(),
        model_id: selectedModel,
      };
    }

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = typeof errData.detail === "string" ? errData.detail
          : typeof errData.detail === "object" ? errData.detail?.message
          : errData.error || "Ошибка генерации";
        throw new Error(msg);
      }

      const data = await res.json();
      setResultUrl(data.image_url || data.result_url || null);
      if (!data.image_url && !data.result_url) {
        setError("Модель не вернула изображение. Попробуйте другую модель.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setGenerating(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `photo-session-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  const currentPrice = TABS.find((t) => t.id === tab)?.price || 0;
  const canGenerate = imageBase64 && !generating;

  return (
    <div className="pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-text">AI Фотосессия</h1>
          <p className="text-sm text-text/40 mt-1">
            Профессиональные фото товаров за секунды
          </p>
        </div>

        {!getAuth() && (
          <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 mb-6 flex items-center justify-between">
            <p className="text-sm text-text/60">Войдите, чтобы использовать все функции</p>
            <a href="/dashboard/chat" className="bg-accent text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-accent/90 transition-colors shrink-0">Войти</a>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id
                  ? "bg-accent text-white"
                  : "bg-text/[0.04] text-text/50 hover:text-text/70"
              }`}
            >
              {t.label} ({t.price}₽)
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: settings */}
          <div className="space-y-5 animate-fadeIn" key={tab}>
            {/* Image upload */}
            <div className="bg-white rounded-2xl border border-text/5 p-5">
              <h3 className="text-sm font-bold text-text mb-3">
                {tab === "model" ? "Фото товара (одежда / аксессуары)" : "Фото товара"}
              </h3>
              <ImageUploader
                onUpload={handleUpload}
                preview={imagePreview}
                onClear={clearImage}
              />
            </div>

            {/* Tab-specific controls */}
            {tab === "background" && (
              <div className="bg-white rounded-2xl border border-text/5 p-5 space-y-4">
                <div>
                  <label className="text-sm font-bold text-text block mb-2">
                    Описание фона
                  </label>
                  <input
                    type="text"
                    value={bgPrompt}
                    onChange={(e) => setBgPrompt(e.target.value)}
                    placeholder="Минималистичный белый фон с мягкими тенями"
                    className="w-full px-4 py-2.5 rounded-xl border border-text/10 bg-text/[0.02] text-sm text-text placeholder:text-text/30 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                {/* Presets */}
                {presets.length > 0 && (
                  <div>
                    <label className="text-sm font-bold text-text block mb-2">
                      Готовые фоны
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {presets.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setBgPrompt(p.prompt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            bgPrompt === p.prompt
                              ? "bg-accent/10 text-accent border border-accent/20"
                              : "bg-text/[0.04] text-text/50 hover:text-text/70 border border-transparent"
                          }`}
                        >
                          {p.emoji} {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Model selector */}
                <ModelSelector value={selectedModel} onChange={setSelectedModel} />
              </div>
            )}

            {tab === "model" && (
              <div className="bg-white rounded-2xl border border-text/5 p-5 space-y-4">
                <div>
                  <label className="text-sm font-bold text-text block mb-2">
                    Описание модели
                  </label>
                  <input
                    type="text"
                    value={modelDescription}
                    onChange={(e) => setModelDescription(e.target.value)}
                    placeholder="Женщина, 25 лет, тёмные волосы"
                    className="w-full px-4 py-2.5 rounded-xl border border-text/10 bg-text/[0.02] text-sm text-text placeholder:text-text/30 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-text block mb-2">Сцена</label>
                  <div className="flex flex-wrap gap-2">
                    {SCENES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setScene(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          scene === s
                            ? "bg-accent/10 text-accent border border-accent/20"
                            : "bg-text/[0.04] text-text/50 hover:text-text/70 border border-transparent"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-text block mb-2">Поза</label>
                  <div className="flex flex-wrap gap-2">
                    {POSES.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPose(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          pose === p
                            ? "bg-accent/10 text-accent border border-accent/20"
                            : "bg-text/[0.04] text-text/50 hover:text-text/70 border border-transparent"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <ModelSelector value={selectedModel} onChange={setSelectedModel} />
              </div>
            )}

            {tab === "marketplace" && (
              <div className="bg-white rounded-2xl border border-text/5 p-5 space-y-4">
                {/* Marketplace cards */}
                <div>
                  <label className="text-sm font-bold text-text block mb-2">
                    Маркетплейс
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {MARKETPLACES.map((mp) => (
                      <button
                        key={mp.id}
                        onClick={() => setMarketplace(mp.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          marketplace === mp.id
                            ? "border-accent ring-2 ring-accent/20 bg-accent/5"
                            : "border-text/10 bg-text/[0.02] hover:border-text/20"
                        }`}
                      >
                        <span className="text-2xl block mb-1">{mp.icon}</span>
                        <span className="text-sm font-bold text-text block">{mp.name}</span>
                        <span className="text-[10px] text-text/40">
                          {mp.width}x{mp.height}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-text block mb-2">
                    Название товара
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Кожаная сумка ручной работы"
                    className="w-full px-4 py-2.5 rounded-xl border border-text/10 bg-text/[0.02] text-sm text-text placeholder:text-text/30 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-text block mb-2">Фон</label>
                  <div className="flex flex-wrap gap-2">
                    {BG_STYLES.map((b) => (
                      <button
                        key={b}
                        onClick={() => setBgStyle(b)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          bgStyle === b
                            ? "bg-accent/10 text-accent border border-accent/20"
                            : "bg-text/[0.04] text-text/50 hover:text-text/70 border border-transparent"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                <ModelSelector value={selectedModel} onChange={setSelectedModel} />
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={generate}
              disabled={!canGenerate}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                canGenerate
                  ? "bg-accent text-white hover:bg-accent/90 active:scale-[0.98]"
                  : "bg-text/10 text-text/30 cursor-not-allowed"
              }`}
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Генерация...
                </span>
              ) : (
                `Сгенерировать (${currentPrice}₽)`
              )}
            </button>

            {error && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                <p className="text-sm text-red-500 font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Right column: result */}
          <div className="space-y-5">
            {generating && (
              <div className="bg-white rounded-2xl border border-text/5 p-5 animate-fadeIn">
                <div className="aspect-square bg-text/[0.03] rounded-xl flex flex-col items-center justify-center gap-4">
                  <svg className="w-10 h-10 animate-spin text-accent/40" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <p className="text-sm text-text/30 font-medium">Создаём фото...</p>
                </div>
              </div>
            )}

            {resultUrl && !generating && (
              <div className="bg-white rounded-2xl border border-text/5 p-5 space-y-4 animate-fadeIn">
                <h3 className="text-sm font-bold text-text">Результат</h3>

                {/* Full-size result */}
                <div className="rounded-xl overflow-hidden border border-text/5">
                  <img
                    src={resultUrl}
                    alt="Result"
                    className="w-full object-contain max-h-[500px]"
                  />
                </div>

                {/* Before/After slider */}
                {imagePreview && (
                  <div>
                    <h4 className="text-xs font-bold text-text/50 mb-2">Сравнение</h4>
                    <BeforeAfterSlider before={imagePreview} after={resultUrl} />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={downloadResult}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-accent text-white hover:bg-accent/90 transition-colors"
                  >
                    Скачать
                  </button>
                  <button
                    onClick={generate}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-text/5 text-text/60 hover:bg-text/10 transition-colors"
                  >
                    Ещё вариант
                  </button>
                  <a
                    href="/dashboard/gallery"
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-text/5 text-text/60 hover:bg-text/10 transition-colors"
                  >
                    В галерею
                  </a>
                </div>
              </div>
            )}

            {!resultUrl && !generating && (
              <div className="bg-white rounded-2xl border border-text/5 p-5">
                <div className="aspect-square bg-text/[0.02] rounded-xl flex flex-col items-center justify-center gap-3">
                  <svg className="w-12 h-12 text-text/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                  <p className="text-sm text-text/25 font-medium text-center">
                    Загрузите фото и нажмите<br />"Сгенерировать"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-bold text-text block mb-2">Модель</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-text/10 bg-text/[0.02] text-sm text-text focus:outline-none focus:border-accent transition-colors appearance-none cursor-pointer"
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}
