/**
 * Shared OG image template. Rendered server-side by Next.js ImageResponse
 * into a 1200×630 PNG. Used by every route's opengraph-image.tsx.
 *
 * Note: ImageResponse uses Satori which supports a subset of CSS (flex,
 * colors, transforms). Avoid grid, filters, pseudo-elements, external
 * stylesheets.
 */

export interface OgTemplateProps {
  title: string;
  subtitle?: string;
  category?: string;
  accent?: string;
}

const BG = "#0a0a0a";
const ACCENT = "#D97757";
const TEXT = "#f5f5f5";
const TEXT_DIM = "rgba(245,245,245,0.55)";

export function OgTemplate({ title, subtitle, category, accent = ACCENT }: OgTemplateProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        background: `linear-gradient(135deg, ${BG} 0%, #1a1210 100%)`,
        color: TEXT,
        fontFamily: "sans-serif",
        position: "relative",
      }}
    >
      {/* Accent glow blob */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -120,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accent} 0%, rgba(217,119,87,0) 70%)`,
          opacity: 0.35,
          display: "flex",
        }}
      />

      {/* Header: Logo + category */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: 14,
              background: accent,
              color: "#fff",
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>Stone AI</span>
        </div>
        {category ? (
          <div
            style={{
              display: "flex",
              padding: "10px 20px",
              borderRadius: 999,
              border: `2px solid ${accent}`,
              color: accent,
              fontSize: 20,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {category}
          </div>
        ) : null}
      </div>

      {/* Main title block */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1000 }}>
        <div
          style={{
            fontSize: title.length > 60 ? 56 : 72,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 28, color: TEXT_DIM, lineHeight: 1.3, maxWidth: 900 }}>
            {subtitle}
          </div>
        ) : null}
      </div>

      {/* Footer: tagline + url */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 24,
          borderTop: "2px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 22, color: TEXT_DIM }}>65+ нейросетей · без VPN · от 590 ₽/мес</span>
        </div>
        <span style={{ fontSize: 22, color: accent, fontWeight: 700 }}>stoneai.ru</span>
      </div>
    </div>
  );
}

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";
