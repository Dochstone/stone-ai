"use client";

/**
 * iOS-style rounded-square icon for AI model providers.
 * Single source of truth for provider colors, logos, and fallback letters.
 */

export interface ProviderStyle {
  gradient: string;      // CSS gradient for background
  color: string;         // Primary hex color
  letter: string;        // Fallback letter
  logo?: string;         // SVG logo path (if available)
  icon?: string;         // App-icon image (full image, no overlay needed)
  darkBg?: boolean;      // True if background is dark (white logo/letter)
}

export const PROVIDER_STYLES: Record<string, ProviderStyle> = {
  OpenAI:     { gradient: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)",       color: "#10a37f", letter: "G",  logo: "/logos/openai.svg",    icon: "/logos/openai-icon.jpg",    darkBg: true },
  Anthropic:  { gradient: "linear-gradient(135deg, #D4845A 0%, #C4623D 100%)",       color: "#d97706", letter: "C",  logo: "/logos/anthropic.svg", icon: "/logos/anthropic-icon.jpg", darkBg: true },
  Google:     { gradient: "linear-gradient(135deg, #4285f4 0%, #3367d6 100%)",       color: "#4285f4", letter: "G",  logo: "/logos/google.svg",    icon: "/logos/google-icon.jpg",    darkBg: true },
  Meta:       { gradient: "linear-gradient(135deg, #0668E1 0%, #0553b8 100%)",       color: "#0668E1", letter: "M",  logo: "/logos/meta.svg",      darkBg: true },
  Mistral:    { gradient: "linear-gradient(135deg, #1a1a1a 0%, #333333 100%)",       color: "#1a1a1a", letter: "M",  logo: "/logos/mistral.svg",   darkBg: true },
  DeepSeek:   { gradient: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",       color: "#06b6d4", letter: "D",  logo: "/logos/deepseek.svg",  icon: "/logos/deepseek-icon.png", darkBg: true },
  xAI:        { gradient: "linear-gradient(135deg, #1a1a1a 0%, #374151 100%)",       color: "#64748b", letter: "X",  logo: "/logos/xai.svg",       icon: "/logos/grok-icon.png",     darkBg: true },
  Perplexity: { gradient: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",       color: "#6366f1", letter: "P",  logo: "/logos/perplexity.svg",darkBg: true },
  Alibaba:    { gradient: "linear-gradient(135deg, #ff6a00 0%, #ee5a24 100%)",       color: "#ff6a00", letter: "Q",  logo: "/logos/alibaba.svg",   icon: "/logos/qwen-icon.png",    darkBg: true },
  MiniMax:    { gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",       color: "#ec4899", letter: "M",  logo: "/logos/minimax.svg",   darkBg: true },
  Cohere:     { gradient: "linear-gradient(135deg, #22c55e 0%, #39d353 100%)",       color: "#39d353", letter: "C",  logo: "/logos/cohere.svg",    icon: "/logos/cohere-icon.png",  darkBg: true },
  Microsoft:  { gradient: "linear-gradient(135deg, #00a4ef 0%, #0078d4 100%)",       color: "#00a4ef", letter: "M",                                darkBg: true },
  NVIDIA:     { gradient: "linear-gradient(135deg, #76b900 0%, #5a8f00 100%)",       color: "#76b900", letter: "N",  logo: "/logos/nvidia.svg",    darkBg: true },
  Zhipu:      { gradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",       color: "#0ea5e9", letter: "Z",                                darkBg: true },
  Gryphe:     { gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",       color: "#8b5cf6", letter: "G",                                darkBg: true },
  BFL:        { gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",       color: "#f59e0b", letter: "F",                                darkBg: true },
  Stability:  { gradient: "linear-gradient(135deg, #a855f7 0%, #9333ea 100%)",       color: "#a855f7", letter: "S",                                darkBg: true },
  Moonshot:   { gradient: "linear-gradient(135deg, #0e7490 0%, #06b6d4 100%)",       color: "#06b6d4", letter: "K",                                darkBg: true },
  Luma:       { gradient: "linear-gradient(135deg, #9333EA 0%, #7e22ce 100%)",       color: "#9333EA", letter: "L",                                darkBg: true },
  Tripo3D:    { gradient: "linear-gradient(135deg, #14B8A6 0%, #0d9488 100%)",       color: "#14B8A6", letter: "T",                                darkBg: true },
  Tencent:    { gradient: "linear-gradient(135deg, #1E6FFF 0%, #1d4ed8 100%)",       color: "#1E6FFF", letter: "T",                                darkBg: true },
  PixVerse:   { gradient: "linear-gradient(135deg, #A855F7 0%, #9333ea 100%)",       color: "#A855F7", letter: "P",                                darkBg: true },
  Pika:       { gradient: "linear-gradient(135deg, #F97316 0%, #ea580c 100%)",       color: "#F97316", letter: "P",                                darkBg: true },
  Lightricks: { gradient: "linear-gradient(135deg, #3B82F6 0%, #2563eb 100%)",       color: "#3B82F6", letter: "L",                                darkBg: true },
  Kuaishou:   { gradient: "linear-gradient(135deg, #ff4f00 0%, #e53e00 100%)",       color: "#ff4f00", letter: "K",  logo: "/logos/kuaishou.svg",  icon: "/logos/kling-icon.png", darkBg: true },
};

const DEFAULT_STYLE: ProviderStyle = {
  gradient: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
  color: "#6b7280",
  letter: "?",
  darkBg: true,
};

export function getProviderStyle(company: string): ProviderStyle {
  return PROVIDER_STYLES[company] || DEFAULT_STYLE;
}

export function getProviderColor(company: string): string {
  return (PROVIDER_STYLES[company] || DEFAULT_STYLE).color;
}

interface ProviderIconProps {
  company: string;
  size?: number;       // px, default 32
  className?: string;
  radius?: number;     // border-radius in px, default ~22% of size (iOS style)
  showLogo?: boolean;  // show SVG logo inside (default true)
}

export default function ProviderIcon({
  company,
  size = 32,
  className = "",
  radius,
  showLogo = true,
}: ProviderIconProps) {
  const style = getProviderStyle(company);
  const r = radius ?? Math.round(size * 0.22);
  const logoSize = Math.round(size * 0.55);
  const fontSize = Math.round(size * 0.38);

  // If provider has an app-icon image, render it directly
  if (style.icon) {
    return (
      <img
        src={style.icon}
        alt={company}
        width={size}
        height={size}
        className={`shrink-0 shadow-sm block ${className}`}
        style={{ borderRadius: r, objectFit: "cover" }}
        loading="lazy"
      />
    );
  }

  return (
    <div
      className={`shrink-0 flex items-center justify-center shadow-sm ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: style.gradient,
      }}
    >
      {showLogo && style.logo ? (
        <img
          src={style.logo}
          alt={company}
          width={logoSize}
          height={logoSize}
          className="block"
          style={{ filter: style.darkBg ? "brightness(0) invert(1)" : undefined }}
          loading="lazy"
        />
      ) : (
        <span
          className="font-extrabold select-none"
          style={{
            fontSize,
            lineHeight: 1,
            color: style.darkBg ? "#fff" : "#1a1a1a",
          }}
        >
          {style.letter}
        </span>
      )}
    </div>
  );
}

/**
 * Tailwind badge classes for provider (used in text badges where icon isn't suitable)
 */
export function getProviderBadgeClasses(company: string): string {
  const map: Record<string, string> = {
    OpenAI:     "bg-emerald-500/10 text-emerald-600",
    Anthropic:  "bg-orange-500/10 text-orange-600",
    Google:     "bg-blue-500/10 text-blue-600",
    Meta:       "bg-sky-500/10 text-sky-600",
    Mistral:    "bg-purple-500/10 text-purple-600",
    DeepSeek:   "bg-cyan-500/10 text-cyan-600",
    xAI:        "bg-slate-500/10 text-slate-600",
    Perplexity: "bg-indigo-500/10 text-indigo-600",
    BFL:        "bg-amber-500/10 text-amber-600",
    Stability:  "bg-purple-500/10 text-purple-600",
    Alibaba:    "bg-orange-500/10 text-orange-600",
    MiniMax:    "bg-pink-500/10 text-pink-600",
    Zhipu:      "bg-sky-500/10 text-sky-600",
    Moonshot:   "bg-cyan-500/10 text-cyan-600",
    Cohere:     "bg-emerald-500/10 text-emerald-600",
    Microsoft:  "bg-blue-500/10 text-blue-600",
    NVIDIA:     "bg-lime-500/10 text-lime-600",
    Gryphe:     "bg-violet-500/10 text-violet-600",
    Kuaishou:   "bg-red-500/10 text-red-600",
    Pika:       "bg-orange-500/10 text-orange-600",
    Luma:       "bg-purple-500/10 text-purple-600",
    Tripo3D:    "bg-teal-500/10 text-teal-600",
    Tencent:    "bg-blue-500/10 text-blue-600",
    PixVerse:   "bg-purple-500/10 text-purple-600",
    Lightricks: "bg-blue-500/10 text-blue-600",
  };
  return map[company] || "bg-gray-500/10 text-gray-600";
}
