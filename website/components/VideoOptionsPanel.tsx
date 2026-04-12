"use client";

import { useMemo } from "react";
import type { VideoGenerationOptions, VideoMode, VideoModelMeta, VideoVariant } from "@/lib/models";

const TIER_MAX_POINTS: Record<string, number> = {
  free: 1,
  mini: 1,
  max: 4,
  "max-pro": 6,
};

const TIER_NAMES: Record<string, string> = {
  free: "Free",
  mini: "Start",
  max: "Pro",
  "max-pro": "Elite",
};

function formatModeLabel(mode: string) {
  return mode === "i2v" ? "Из картинки" : "Из текста";
}

function formatModeIcon(mode: string) {
  return mode === "i2v" ? "🖼️" : "✍️";
}

function formatQualityLabel(quality: string) {
  if (quality === "fast") return "Быстрое";
  if (quality === "xt") return "XT";
  return "Обычное";
}

function formatResolutionLabel(resolution: string) {
  return resolution.toUpperCase();
}

function formatDurationLabel(duration: number) {
  return `${duration} сек`;
}

function scoreVariant(variant: VideoVariant, target: VideoGenerationOptions) {
  let score = 0;
  if (variant.mode === target.mode) score += 8;
  if (variant.duration === target.duration) score += 4;
  if (variant.resolution === target.resolution) score += 2;
  if (variant.quality === target.quality) score += 1;
  return score;
}

function findBestVariant(model: VideoModelMeta, target: VideoGenerationOptions) {
  const ranked = [...model.variants].sort((a, b) => scoreVariant(b, target) - scoreVariant(a, target));
  return ranked[0] || null;
}

function findCurrentVariant(model: VideoModelMeta, selected: VideoGenerationOptions) {
  return model.variants.find((variant) =>
    variant.duration === selected.duration &&
    variant.resolution === selected.resolution &&
    variant.mode === selected.mode &&
    variant.quality === selected.quality
  ) || findBestVariant(model, selected);
}

function getOptionPoints(
  variants: VideoVariant[],
  key: keyof VideoGenerationOptions,
  value: string | number,
  selected: VideoGenerationOptions
): number | null {
  const matches = variants.filter((variant) => {
    if (variant[key] !== value) return false;
    if (key !== "mode" && variant.mode !== selected.mode) return false;
    if (key !== "duration" && variant.duration !== selected.duration) return false;
    if (key !== "resolution" && variant.resolution !== selected.resolution) return false;
    if (key !== "quality" && variant.quality !== selected.quality) return false;
    return true;
  });
  const best = matches.sort((a, b) => a.points - b.points || a.cost_usd - b.cost_usd)[0];
  return best ? best.points : null;
}

function isVariantUnlocked(variant: VideoVariant, tier: string, canUseStandardTrial: boolean, canUsePremiumTrial: boolean) {
  const maxPoints = TIER_MAX_POINTS[tier] ?? TIER_MAX_POINTS.free;
  if (variant.points <= maxPoints) return true;
  if (tier === "mini" && variant.points <= 2 && canUseStandardTrial) return true;
  if (tier === "mini" && variant.points <= 4 && canUsePremiumTrial) return true;
  return false;
}

function pointsLabel(points: number) {
  if (points === 1) return "поинт";
  if (points >= 2 && points <= 4) return "поинта";
  return "поинтов";
}

interface VideoOptionsPanelProps {
  model: VideoModelMeta;
  selectedOptions: VideoGenerationOptions;
  onChange: (next: VideoGenerationOptions) => void;
  userTier?: string;
  pointsLeft?: number;
  pointsTotal?: number;
  trialStandardAvailable?: boolean;
  trialPremiumAvailable?: boolean;
  onPickImage?: () => void;
  onClearImage?: () => void;
  pendingImageUrl?: string | null;
  pendingImageName?: string | null;
}

export default function VideoOptionsPanel({
  model,
  selectedOptions,
  onChange,
  userTier = "free",
  pointsLeft = 0,
  pointsTotal = 0,
  trialStandardAvailable = false,
  trialPremiumAvailable = false,
  onPickImage,
  onClearImage,
  pendingImageUrl,
  pendingImageName,
}: VideoOptionsPanelProps) {
  const forcedMode: VideoMode | null = !model.supports_text ? "i2v" : !model.supports_image ? "t2v" : null;
  const effectiveOptions: VideoGenerationOptions = forcedMode ? { ...selectedOptions, mode: forcedMode } : selectedOptions;
  const currentVariant = findCurrentVariant(model, effectiveOptions);
  const effectiveTier = userTier || "free";

  const availableModes = useMemo<VideoMode[]>(() => {
    if (forcedMode) return [forcedMode];
    return Array.from(new Set(model.variants.map((variant) => variant.mode)));
  }, [forcedMode, model.variants]);

  const durations = useMemo(
    () => Array.from(new Set(model.variants.filter((variant) => variant.mode === effectiveOptions.mode).map((variant) => variant.duration))).sort((a, b) => a - b),
    [effectiveOptions.mode, model.variants]
  );

  const resolutions = useMemo(
    () => Array.from(new Set(model.variants.filter((variant) => variant.mode === effectiveOptions.mode).map((variant) => variant.resolution))).sort(),
    [effectiveOptions.mode, model.variants]
  );

  const qualities = useMemo(
    () => Array.from(new Set(model.variants.filter((variant) => variant.mode === effectiveOptions.mode).map((variant) => variant.quality))),
    [effectiveOptions.mode, model.variants]
  );

  const selectOption = (patch: Partial<VideoGenerationOptions>) => {
    const candidate: VideoGenerationOptions = {
      ...effectiveOptions,
      ...patch,
      ...(forcedMode ? { mode: forcedMode } : {}),
    };
    const best = findBestVariant(model, candidate);
    if (!best) return;
    onChange({
      duration: best.duration,
      resolution: best.resolution,
      mode: best.mode,
      quality: best.quality,
    });
  };

  const getOptionVariant = (key: keyof VideoGenerationOptions, value: string | number) => {
    const candidate: VideoGenerationOptions = {
      ...effectiveOptions,
      [key]: value,
      ...(forcedMode ? { mode: forcedMode } : {}),
    };
    return findBestVariant(model, candidate);
  };

  const isOptionDisabled = (key: keyof VideoGenerationOptions, value: string | number) => {
    const variant = getOptionVariant(key, value);
    if (!variant) return true;
    return !isVariantUnlocked(variant, effectiveTier, trialStandardAvailable, trialPremiumAvailable);
  };

  const lockedReason = currentVariant && !isVariantUnlocked(currentVariant, effectiveTier, trialStandardAvailable, trialPremiumAvailable)
    ? currentVariant.points <= 2
      ? "Доступно с тарифа Start (пробное) или Pro"
      : currentVariant.points <= 4
        ? "Доступно с тарифа Pro"
        : "Доступно только на тарифе Elite"
    : null;

  const totalForBar = pointsTotal || pointsLeft || 1;
  const usedPoints = Math.max(0, totalForBar - pointsLeft);
  const progressPercent = Math.min(100, Math.round((usedPoints / totalForBar) * 100));

  const enoughPoints = currentVariant ? pointsLeft >= currentVariant.points : true;

  return (
    <div className="mb-2.5 rounded-2xl border border-text/[0.08] bg-gradient-to-br from-text/[0.02] to-text/[0.04] p-4 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-text/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center text-base">🎬</div>
          <div>
            <div className="text-[12px] font-bold text-text/85">Параметры видео</div>
            <div className="text-[10px] text-text/40 mt-0.5">{model.name}</div>
          </div>
        </div>
        <div className="text-right min-w-[110px]">
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-[10px]">🪙</span>
            <span className="text-[12px] font-bold text-accent">
              {pointsLeft}<span className="text-text/35 font-normal"> / {pointsTotal || pointsLeft}</span>
            </span>
          </div>
          <div className="mt-1 h-1 w-full bg-text/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-accent/60 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-[9px] text-text/35 mt-1">тариф {TIER_NAMES[effectiveTier] || effectiveTier}</div>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {!forcedMode && (
          <OptionGroup
            label="Режим"
            icon="🎯"
            values={availableModes}
            selectedValue={effectiveOptions.mode}
            onSelect={(value) => selectOption({ mode: value as VideoGenerationOptions["mode"] })}
            renderLabel={(value) => `${formatModeIcon(String(value))} ${formatModeLabel(String(value))}`}
            renderPoints={(value) => getOptionPoints(model.variants, "mode", value, effectiveOptions)}
            isDisabled={(value) => isOptionDisabled("mode", value)}
          />
        )}

        {durations.length > 1 && (
          <OptionGroup
            label="Длительность"
            icon="⏱"
            values={durations}
            selectedValue={effectiveOptions.duration}
            onSelect={(value) => selectOption({ duration: Number(value) })}
            renderLabel={(value) => formatDurationLabel(Number(value))}
            renderPoints={(value) => getOptionPoints(model.variants, "duration", Number(value), effectiveOptions)}
            isDisabled={(value) => isOptionDisabled("duration", value)}
          />
        )}

        {resolutions.length > 1 && (
          <OptionGroup
            label="Разрешение"
            icon="📐"
            values={resolutions}
            selectedValue={effectiveOptions.resolution}
            onSelect={(value) => selectOption({ resolution: String(value) })}
            renderLabel={(value) => formatResolutionLabel(String(value))}
            renderPoints={(value) => getOptionPoints(model.variants, "resolution", value, effectiveOptions)}
            isDisabled={(value) => isOptionDisabled("resolution", value)}
          />
        )}

        {qualities.length > 1 && (
          <OptionGroup
            label="Качество"
            icon="⚡"
            values={qualities}
            selectedValue={effectiveOptions.quality}
            onSelect={(value) => selectOption({ quality: String(value) })}
            renderLabel={(value) => formatQualityLabel(String(value))}
            renderPoints={(value) => getOptionPoints(model.variants, "quality", value, effectiveOptions)}
            isDisabled={(value) => isOptionDisabled("quality", value)}
          />
        )}
      </div>

      {/* Image upload */}
      {effectiveOptions.mode === "i2v" && model.supports_image && (
        <div className="mt-4 rounded-xl border border-text/[0.08] bg-bg/60 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                {pendingImageUrl ? (
                  <img src={pendingImageUrl} alt="" className="w-full h-full rounded-lg object-cover" />
                ) : (
                  <span className="text-base">🖼️</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-text/75">Исходное изображение</div>
                <div className="text-[10px] text-text/40 mt-0.5 truncate">
                  {pendingImageName || (pendingImageUrl ? "Изображение загружено" : "Загрузите кадр или референс")}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={onPickImage}
                className="px-3 py-1.5 rounded-lg bg-accent text-white text-[11px] font-semibold hover:bg-accent/85 transition-colors"
              >
                {pendingImageUrl ? "Заменить" : "Загрузить"}
              </button>
              {pendingImageUrl && onClearImage && (
                <button
                  type="button"
                  onClick={onClearImage}
                  className="w-7 h-7 rounded-lg bg-text/[0.06] text-text/50 hover:bg-text/[0.1] hover:text-text/80 transition-colors flex items-center justify-center"
                  title="Удалить"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cost summary */}
      <div className={`mt-4 rounded-xl px-3.5 py-3 ${
        lockedReason
          ? "border border-amber-500/20 bg-amber-500/[0.06]"
          : !enoughPoints
            ? "border border-rose-500/20 bg-rose-500/[0.06]"
            : "border border-accent/15 bg-accent/[0.06]"
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">{lockedReason ? "🔒" : !enoughPoints ? "⚠️" : "✨"}</span>
            <span className="text-[11px] font-semibold text-text/70">
              {lockedReason ? "Заблокировано" : !enoughPoints ? "Не хватает поинтов" : "Стоимость"}
            </span>
          </div>
          <span className={`text-[13px] font-bold ${
            lockedReason ? "text-amber-600" : !enoughPoints ? "text-rose-600" : "text-accent"
          }`}>
            {currentVariant ? `${currentVariant.points} ${pointsLabel(currentVariant.points)}` : "Недоступно"}
          </span>
        </div>
        {lockedReason && (
          <div className="text-[10px] text-amber-700/90 mt-1.5 ml-7">{lockedReason}</div>
        )}
        {!lockedReason && !enoughPoints && currentVariant && (
          <div className="text-[10px] text-rose-700/90 mt-1.5 ml-7">
            Осталось {pointsLeft} {pointsLabel(pointsLeft)}, нужно {currentVariant.points}
          </div>
        )}
        {!lockedReason && enoughPoints && currentVariant?.points === 2 && trialStandardAvailable && effectiveTier === "mini" && (
          <div className="text-[10px] text-emerald-600 mt-1.5 ml-7">🎁 Доступно бесплатно как пробное Standard</div>
        )}
        {!lockedReason && enoughPoints && currentVariant && currentVariant.points >= 3 && currentVariant.points <= 4 && trialPremiumAvailable && effectiveTier === "mini" && (
          <div className="text-[10px] text-emerald-600 mt-1.5 ml-7">🎁 Доступно бесплатно как пробное Premium</div>
        )}
      </div>
    </div>
  );
}

interface OptionGroupProps {
  label: string;
  icon?: string;
  values: Array<string | number>;
  selectedValue: string | number;
  onSelect: (value: string | number) => void;
  renderLabel: (value: string | number) => string;
  renderPoints?: (value: string | number) => number | null;
  isDisabled?: (value: string | number) => boolean;
}

function OptionGroup({ label, icon, values, selectedValue, onSelect, renderLabel, renderPoints, isDisabled }: OptionGroupProps) {
  if (!values.length) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon && <span className="text-[11px]">{icon}</span>}
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-text/40">{label}</div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((value) => {
          const active = value === selectedValue;
          const disabled = isDisabled ? isDisabled(value) : false;
          const points = renderPoints ? renderPoints(value) : null;
          return (
            <button
              key={String(value)}
              type="button"
              onClick={() => onSelect(value)}
              disabled={disabled}
              className={`relative px-3 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                active
                  ? "border-accent bg-accent text-white shadow-sm shadow-accent/20"
                  : disabled
                    ? "border-text/[0.06] bg-text/[0.02] text-text/25 cursor-not-allowed"
                    : "border-text/[0.1] bg-bg/40 text-text/65 hover:border-accent/40 hover:bg-accent/[0.04] hover:text-accent"
              }`}
            >
              <span>{renderLabel(value)}</span>
              {points !== null && (
                <span className={`ml-1.5 text-[10px] ${
                  active ? "text-white/70" : disabled ? "text-text/25" : "text-text/35"
                }`}>
                  · {points}пт
                </span>
              )}
              {disabled && (
                <span className="ml-1 text-[9px]">🔒</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
