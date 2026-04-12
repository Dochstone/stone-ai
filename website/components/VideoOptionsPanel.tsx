"use client";

import { useMemo } from "react";
import type { VideoGenerationOptions, VideoMode, VideoModelMeta, VideoVariant } from "@/lib/models";

const TIER_MAX_POINTS: Record<string, number> = {
  free: 1,
  mini: 1,
  max: 4,
  "max-pro": 6,
};

function formatModeLabel(mode: string) {
  return mode === "i2v" ? "Image to Video" : "Text to Video";
}

function formatQualityLabel(quality: string) {
  return quality === "fast" ? "Fast" : "Standard";
}

function formatResolutionLabel(resolution: string) {
  return resolution.toUpperCase();
}

function formatDurationLabel(duration: number) {
  return `${duration}s`;
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

function getOptionHint(
  variants: VideoVariant[],
  key: keyof VideoGenerationOptions,
  value: string | number,
  selected: VideoGenerationOptions
) {
  const matches = variants.filter((variant) => {
    if (variant[key] !== value) return false;
    if (key !== "mode" && variant.mode !== selected.mode) return false;
    if (key !== "duration" && variant.duration !== selected.duration) return false;
    if (key !== "resolution" && variant.resolution !== selected.resolution) return false;
    if (key !== "quality" && variant.quality !== selected.quality) return false;
    return true;
  });
  const best = matches.sort((a, b) => a.points - b.points || a.cost_usd - b.cost_usd)[0];
  return best ? `${best.points} pt` : null;
}

function isVariantUnlocked(variant: VideoVariant, tier: string, canUseStandardTrial: boolean, canUsePremiumTrial: boolean) {
  const maxPoints = TIER_MAX_POINTS[tier] ?? TIER_MAX_POINTS.free;
  if (variant.points <= maxPoints) return true;
  if (tier === "mini" && variant.points <= 2 && canUseStandardTrial) return true;
  if (tier === "mini" && variant.points <= 4 && canUsePremiumTrial) return true;
  return false;
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
      ? "Доступно со Start trial или выше"
      : currentVariant.points <= 4
        ? "Доступно с Max trial/планом"
        : "Доступно только на Elite"
    : null;

  return (
    <div className="mb-2.5 rounded-2xl border border-text/[0.08] bg-text/[0.02] p-3">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-[11px] font-bold text-text/70">Video setup</div>
          <div className="text-[10px] text-text/35 mt-0.5">{model.name} · {model.provider}</div>
        </div>
        <div className="text-right">
          <div className="text-[11px] font-semibold text-accent">
            {pointsLeft}/{pointsTotal || pointsLeft} pt left
          </div>
        </div>
      </div>

      {!forcedMode && (
        <OptionGroup
          label="Mode"
          values={availableModes}
          selectedValue={effectiveOptions.mode}
          onSelect={(value) => selectOption({ mode: value as VideoGenerationOptions["mode"] })}
          renderLabel={(value) => formatModeLabel(String(value))}
          renderHint={(value) => getOptionHint(model.variants, "mode", value, effectiveOptions)}
          isDisabled={(value) => isOptionDisabled("mode", value)}
        />
      )}

      <OptionGroup
        label="Duration"
        values={durations}
        selectedValue={effectiveOptions.duration}
        onSelect={(value) => selectOption({ duration: Number(value) })}
        renderLabel={(value) => formatDurationLabel(Number(value))}
        renderHint={(value) => getOptionHint(model.variants, "duration", Number(value), effectiveOptions)}
        isDisabled={(value) => isOptionDisabled("duration", value)}
      />

      <OptionGroup
        label="Resolution"
        values={resolutions}
        selectedValue={effectiveOptions.resolution}
        onSelect={(value) => selectOption({ resolution: String(value) })}
        renderLabel={(value) => formatResolutionLabel(String(value))}
        renderHint={(value) => getOptionHint(model.variants, "resolution", value, effectiveOptions)}
        isDisabled={(value) => isOptionDisabled("resolution", value)}
      />

      <OptionGroup
        label="Quality"
        values={qualities}
        selectedValue={effectiveOptions.quality}
        onSelect={(value) => selectOption({ quality: String(value) })}
        renderLabel={(value) => formatQualityLabel(String(value))}
        renderHint={(value) => getOptionHint(model.variants, "quality", value, effectiveOptions)}
        isDisabled={(value) => isOptionDisabled("quality", value)}
      />

      {effectiveOptions.mode === "i2v" && model.supports_image && (
        <div className="mt-3 rounded-xl border border-text/[0.06] bg-bg/80 p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-text/70">Source image</div>
              <div className="text-[10px] text-text/35 mt-0.5">
                {pendingImageName || "Upload a frame or reference image"}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onPickImage}
                className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-[11px] font-semibold hover:bg-accent/15 transition-colors"
              >
                {pendingImageUrl ? "Replace" : "Upload"}
              </button>
              {pendingImageUrl && onClearImage && (
                <button
                  type="button"
                  onClick={onClearImage}
                  className="px-3 py-1.5 rounded-lg bg-text/[0.05] text-text/50 text-[11px] font-semibold hover:bg-text/[0.08] transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {pendingImageUrl && (
            <div className="mt-3 flex items-center gap-3">
              <img src={pendingImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-text/[0.08]" />
              <div className="text-[10px] text-text/45">Mode `i2v` will use this image as the first frame.</div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 rounded-xl border border-accent/10 bg-accent/5 px-3 py-2.5">
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className="font-semibold text-text/70">Current cost</span>
          <span className="font-bold text-accent">
            {currentVariant ? `${currentVariant.points} pt` : "Unavailable"}
          </span>
        </div>
        {lockedReason && (
          <div className="text-[10px] text-amber-600 mt-1">{lockedReason}</div>
        )}
        {!lockedReason && currentVariant?.points === 2 && trialStandardAvailable && effectiveTier === "mini" && (
          <div className="text-[10px] text-emerald-600 mt-1">🎁 Standard trial is available for this variant</div>
        )}
        {!lockedReason && currentVariant?.points >= 3 && trialPremiumAvailable && effectiveTier === "mini" && (
          <div className="text-[10px] text-emerald-600 mt-1">🎁 Premium trial is available for this variant</div>
        )}
      </div>
    </div>
  );
}

interface OptionGroupProps {
  label: string;
  values: Array<string | number>;
  selectedValue: string | number;
  onSelect: (value: string | number) => void;
  renderLabel: (value: string | number) => string;
  renderHint?: (value: string | number) => string | null;
  isDisabled?: (value: string | number) => boolean;
}

function OptionGroup({ label, values, selectedValue, onSelect, renderLabel, renderHint, isDisabled }: OptionGroupProps) {
  if (!values.length) return null;
  return (
    <div className="mt-2 first:mt-0">
      <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-text/35 mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const active = value === selectedValue;
          const disabled = isDisabled ? isDisabled(value) : false;
          return (
            <button
              key={String(value)}
              type="button"
              onClick={() => onSelect(value)}
              disabled={disabled}
              className={`px-3 py-2 rounded-xl border text-[11px] transition-colors ${
                active
                  ? "border-accent bg-accent text-white"
                  : disabled
                    ? "border-text/[0.06] bg-text/[0.03] text-text/25 cursor-not-allowed"
                    : "border-text/[0.08] bg-bg text-text/60 hover:border-accent/30 hover:text-accent"
              }`}
            >
              <span className="font-semibold">{renderLabel(value)}</span>
              {renderHint && (
                <span className={`ml-1 ${active ? "text-white/75" : "text-text/35"}`}>{renderHint(value)}</span>
              )}
              {disabled && <span className="ml-1 text-text/25">lock</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
