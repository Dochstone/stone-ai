/**
 * Shared OG image template. Rendered server-side by Next.js ImageResponse
 * into a 1200×630 PNG.
 */

export interface OgTemplateProps {
  title: string;
  subtitle?: string;
  category?: string;
  accent?: string;
}

const BG = "#0a0a0a";
const ACCENT = "#D97757";
const PURPLE = "#7C3AED";
const TEXT = "#f5f5f5";
const TEXT_DIM = "rgba(245,245,245,0.55)";

const PROVIDER_LOGOS = [
  "google",
  "mistral",
  "sora2",
  "kling",
  "qwen",
  "suno",
];

export function OgTemplate({ title, subtitle, category, accent = ACCENT }: OgTemplateProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 72px",
        background: `linear-gradient(135deg, ${BG} 0%, #1a1210 100%)`,
        color: TEXT,
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Accent glow — top right */}
      <div
        style={{
          position: "absolute",
          top: -180,
          right: -180,
          width: 560,
          height: 560,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent} 0%, rgba(217,119,87,0) 70%)`,
          opacity: 0.5,
          display: "flex",
        }}
      />
      {/* Purple glow — bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: -180,
          left: -180,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${PURPLE} 0%, rgba(124,58,237,0) 70%)`,
          opacity: 0.3,
          display: "flex",
        }}
      />

      {/* Header: Stylized logo + brand */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 112,
              height: 112,
              borderRadius: 28,
              background: `linear-gradient(135deg, ${accent} 0%, #B45309 60%, ${PURPLE} 140%)`,
              color: "#fff",
              fontSize: 72,
              fontWeight: 900,
              letterSpacing: "-0.06em",
              boxShadow: `0 24px 80px rgba(217,119,87,0.6)`,
            }}
          >
            S
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 56, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>
              Stone AI
            </span>
            <span style={{ fontSize: 22, color: TEXT_DIM, fontWeight: 600, letterSpacing: "0.02em" }}>
              stoneai.ru
            </span>
          </div>
        </div>
        {category ? (
          <div
            style={{
              display: "flex",
              padding: "12px 24px",
              borderRadius: 999,
              border: `2px solid ${accent}`,
              color: accent,
              fontSize: 20,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            {category}
          </div>
        ) : null}
      </div>

      {/* Main title block */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 960 }}>
        <div
          style={{
            fontSize: title.length > 50 ? 64 : 96,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 30, color: TEXT_DIM, lineHeight: 1.3, maxWidth: 920 }}>
            {subtitle}
          </div>
        ) : null}
      </div>

      {/* Footer: model icons + URL */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 24,
          borderTop: "2px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {PROVIDER_LOGOS.map((name) => (
            <img
              key={name}
              src={`https://stoneai.ru/logos-png/${name}.png`}
              width="56"
              height="56"
              style={{ borderRadius: 12 }}
            />
          ))}
          <span style={{ fontSize: 22, color: TEXT_DIM, fontWeight: 700, marginLeft: 6 }}>
            и ещё 60+
          </span>
        </div>
        <span style={{ fontSize: 26, color: accent, fontWeight: 800 }}>65+ моделей</span>
      </div>
    </div>
  );
}

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";
