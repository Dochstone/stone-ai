import Image from "next/image";

type Variant = "idle" | "loading" | "success" | "error" | "chat" | "image" | "video" | "bot" | "campaign" | "game";

// PNG variants (AI-generated Pixar style)
const PNG_VARIANTS = new Set(["idle", "loading", "success", "error", "chat"]);

interface StoneProps {
  variant?: Variant;
  size?: number;
  className?: string;
  alt?: string;
}

export default function Stone({ variant = "idle", size = 64, className = "", alt }: StoneProps) {
  const ext = PNG_VARIANTS.has(variant) ? "png" : "svg";
  const src = PNG_VARIANTS.has(variant) ? `/mascots/stone-mascot-${variant}.${ext}` : `/mascots/stone-${variant}.${ext}`;
  return (
    <Image
      src={src}
      alt={alt || `Stone AI — ${variant}`}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      priority={variant === "idle"}
    />
  );
}

/** Quick presets for common use cases */
export function StoneEmpty({ text, variant = "idle" }: { text: string; variant?: Variant }) {
  return (
    <div className="text-center py-12">
      <Stone variant={variant} size={80} className="mx-auto mb-4 opacity-60" />
      <p className="text-sm text-text/30">{text}</p>
    </div>
  );
}

export function StoneLoading({ text = "Загрузка..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <Stone variant="loading" size={56} />
      <p className="text-xs text-text/40 animate-pulse">{text}</p>
    </div>
  );
}
